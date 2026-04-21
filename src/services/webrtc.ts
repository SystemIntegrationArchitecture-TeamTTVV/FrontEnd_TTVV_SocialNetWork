import { socketService } from './socket';
import i18n from '../i18n';
import { authApi } from '../apis/auth';
import { notify } from './notify';

export type CallType = 'voice' | 'video';

export interface CallOffer {
  callId: string;
  callerId: string;
  callerName: string;
  callType: CallType;
  offer: RTCSessionDescriptionInit;
  conversationId?: string; // For group calls
  isGroup?: boolean; // Flag to indicate group call
}

export interface CallAnswer {
  callId: string;
  senderId?: string;
  answer: RTCSessionDescriptionInit;
}

export interface IceCandidate {
  callId: string;
  senderId?: string;
  candidate: RTCIceCandidateInit;
}

type LegacyIceCandidatePayload = {
  callId?: string;
  iceCandidate?: RTCIceCandidateInit;
  candidate?: RTCIceCandidateInit;
};

class WebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map();
  private currentCallIdByPeer: Map<string, string> = new Map();
  private peerByCallId: Map<string, string> = new Map();
  private pendingIceCandidatesByPeer: Map<string, RTCIceCandidateInit[]> = new Map();

  private configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  async initCall(callType: CallType): Promise<MediaStream> {
    console.log('🎥 Initializing call with type:', callType);
    
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: callType === 'video' ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      } : false,
    };

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Got local stream:', this.localStream);
      return this.localStream;
    } catch (error: any) {
      console.warn('⚠️ Failed to get media stream:', error.name);
      
      // If video call failed due to camera issues, try audio only
      if (callType === 'video' && (
        error.name === 'NotReadableError' || 
        error.name === 'OverconstrainedError' ||
        error.name === 'AbortError'
      )) {
        console.warn('⚠️ Camera not available, trying audio only...');
        
        try {
          const audioOnlyConstraints: MediaStreamConstraints = {
            audio: true,
            video: false,
          };
          this.localStream = await navigator.mediaDevices.getUserMedia(audioOnlyConstraints);
          console.log('✅ Got audio-only stream as fallback');
          notify.info(i18n.t('calls.cameraUnavailable'));
          return this.localStream;
        } catch (audioError: any) {
          console.error('❌ Audio fallback also failed:', audioError.name);
          throw new Error(i18n.t('calls.micInaccessible'));
        }
      }
      
      // Handle permission denied
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error(i18n.t('calls.permissionDenied'));
      }
      
      // Handle device not found
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error(i18n.t('calls.deviceNotFound'));
      }
      
      throw new Error(
        i18n.t('calls.initFailed', {
          detail: error.message || i18n.t('calls.unknownError'),
        }),
      );
    }
  }

  async createOffer(
    callType: CallType,
    recipientId: string,
    callerId: string,
    callerName: string,
    conversationId?: string,
    isGroup?: boolean
  ): Promise<CallOffer> {
    console.log('📞 Creating call offer to:', recipientId, isGroup ? '(GROUP CALL)' : '(DIRECT CALL)');
    const peerConnection = this.createPeerConnectionFor(recipientId);

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.currentCallIdByPeer.set(recipientId, callId);
    this.peerByCallId.set(callId, recipientId);

    const callOffer: CallOffer = {
      callId,
      callerId, // The actual caller's ID
      callerName,
      callType,
      offer: offer,
      conversationId: conversationId, // For group calls
      isGroup: isGroup, // Flag to indicate group call
    };

    // Send offer via socket - Backend expects SocketEventDTO format
    socketService.send('/app/webrtc/offer', {
      type: 'CALL_OFFER',
      userId: recipientId, // Target user/conversation to receive the offer
      data: callOffer,
      timestamp: new Date().toISOString(),
    });
    console.log('📤 Sent call offer to:', recipientId, isGroup ? '(GROUP - will broadcast to all participants)' : '');

    return callOffer;
  }

  async handleOffer(offer: CallOffer): Promise<void> {
    console.log('📥 Received call offer:', offer);
    const callerId = offer.callerId;
    const peerConnection = this.createPeerConnectionFor(callerId);
    this.currentCallIdByPeer.set(callerId, offer.callId);
    this.peerByCallId.set(offer.callId, callerId);

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer.offer));
    
    // Process any queued ICE candidates now that remote description is set
    await this.processQueuedIceCandidates(callerId);
  }

  async createAnswer(callerId: string): Promise<CallAnswer> {
    const peerConnection = this.peerConnections.get(callerId);
    const callId = this.currentCallIdByPeer.get(callerId);
    console.log('🔍 createAnswer called with:', {
      callerId,
      hasPeerConnection: !!peerConnection,
      callId,
      peerConnectionState: peerConnection?.connectionState,
      peerConnectionSignalingState: peerConnection?.signalingState
    });
    
    if (!peerConnection || !callId) {
      console.error('❌ createAnswer failed:', {
        peerConnection: !!peerConnection,
        callId
      });
      throw new Error('No active call to answer');
    }

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    const callAnswer: CallAnswer = {
      callId,
      senderId: authApi.getCurrentUser()?.id,
      answer: answer,
    };

    // Send answer via socket - Backend expects SocketEventDTO format
    socketService.send('/app/webrtc/answer', {
      type: 'CALL_ANSWER',
      userId: callerId, // Target user to receive the answer (original caller)
      data: callAnswer,
      timestamp: new Date().toISOString(),
    });
    console.log('📤 Sent call answer to:', callerId);

    return callAnswer;
  }

  async handleAnswer(answer: CallAnswer): Promise<void> {
    const senderId = answer.senderId || (answer.callId ? this.peerByCallId.get(answer.callId) : undefined);
    if (!senderId) {
      console.warn('⚠️ handleAnswer: missing senderId, skipping answer', answer);
      return;
    }
    const peerConnection = this.peerConnections.get(senderId);
    console.log('📥 Received call answer:', answer);
    console.log('🔍 handleAnswer state:', {
      senderId,
      hasPeerConnection: !!peerConnection,
      callId: this.currentCallIdByPeer.get(senderId),
      peerConnectionState: peerConnection?.connectionState,
      signalingState: peerConnection?.signalingState
    });
    
    if (!peerConnection) {
      console.error('❌ handleAnswer: No peer connection!');
      throw new Error('No peer connection');
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer.answer));
    
    // Process any queued ICE candidates now that remote description is set
    await this.processQueuedIceCandidates(senderId);
  }

  async addIceCandidate(candidate: IceCandidate | LegacyIceCandidatePayload): Promise<void> {
    const senderId = ('senderId' in candidate ? candidate.senderId : undefined)
      || (candidate.callId ? this.peerByCallId.get(candidate.callId) : undefined);
    if (!senderId) {
      console.warn('⚠️ addIceCandidate: missing senderId, skipping');
      return;
    }
    const peerConnection = this.peerConnections.get(senderId);
    if (!peerConnection) {
      // Silently ignore ICE candidates if no peer connection (call may have ended)
      return;
    }

    const parsedCandidate: RTCIceCandidateInit | null = (() => {
      if ('candidate' in candidate && candidate.candidate) return candidate.candidate;
      if ('iceCandidate' in candidate && candidate.iceCandidate) return candidate.iceCandidate;
      return null;
    })();

    if (!parsedCandidate) {
      console.warn('⚠️ addIceCandidate: Unsupported ICE payload shape', candidate);
      return;
    }

    // If remote description is not set yet, queue the candidate
    if (!peerConnection.remoteDescription) {
      console.log('📦 Queueing ICE candidate (remote description not set yet)');
      const queue = this.pendingIceCandidatesByPeer.get(senderId) || [];
      queue.push(parsedCandidate);
      this.pendingIceCandidatesByPeer.set(senderId, queue);
      return;
    }

    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(parsedCandidate));
      console.log('✅ Added ICE candidate');
    } catch (error) {
      console.error('❌ Failed to add ICE candidate:', error);
    }
  }

  private async processQueuedIceCandidates(peerId: string): Promise<void> {
    const peerConnection = this.peerConnections.get(peerId);
    const queue = this.pendingIceCandidatesByPeer.get(peerId) || [];
    if (!peerConnection || queue.length === 0) return;
    
    console.log(`📦 Processing ${queue.length} queued ICE candidates for peer ${peerId}`);
    
    for (const candidate of queue) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('✅ Added queued ICE candidate');
      } catch (error) {
        console.error('❌ Failed to add queued ICE candidate:', error);
      }
    }
    
    this.pendingIceCandidatesByPeer.delete(peerId);
  }

  setRemotePeer(peerId: string) {
    // No-op for backward compatibility with existing callers.
    // Multi-peer mode routes by explicit peerId per connection.
    void peerId;
  }

  private createPeerConnectionFor(peerId: string): RTCPeerConnection {
    const existing = this.peerConnections.get(peerId);
    if (existing) {
      existing.close();
    }
    const pc = new RTCPeerConnection(this.configuration);
    this.peerConnections.set(peerId, pc);
    this.setupPeerConnectionListeners(peerId, pc);
    return pc;
  }

  private setupPeerConnectionListeners(peerId: string, peerConnection: RTCPeerConnection) {

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      const callId = this.currentCallIdByPeer.get(peerId);
      if (event.candidate && callId) {
        const iceCandidate: IceCandidate = {
          callId,
          senderId: authApi.getCurrentUser()?.id,
          candidate: event.candidate.toJSON(),
        };
        socketService.send('/app/webrtc/ice-candidate', {
          type: 'ICE_CANDIDATE',
          userId: peerId,
          data: iceCandidate,
          timestamp: new Date().toISOString(),
        });

        // Send also using CALL_ICE_CANDIDATE event name to support older/other clients.
        socketService.send('/app/webrtc/ice-candidate', {
          type: 'CALL_ICE_CANDIDATE',
          userId: peerId,
          data: {
            callId,
            senderId: authApi.getCurrentUser()?.id,
            iceCandidate: event.candidate.toJSON(),
            candidate: event.candidate.toJSON(),
          } as LegacyIceCandidatePayload,
          timestamp: new Date().toISOString(),
        });

        console.log('📤 Sent ICE candidate to (both types):', peerId);
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('🎬 Received remote track:', event.track.kind);
      
      if (!this.remoteStreams.has(peerId)) {
        this.remoteStreams.set(peerId, new MediaStream());
      }
      const stream = this.remoteStreams.get(peerId)!;
      stream.addTrack(event.track);
      console.log('📺 Remote stream now has:', {
        peerId,
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length,
        active: stream.active
      });
    };

    // Handle connection state
    peerConnection.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', peerId, peerConnection.connectionState);
      
      if (peerConnection.connectionState === 'failed') {
        this.closePeer(peerId);
      }
      
      if (peerConnection.connectionState === 'disconnected') {
        console.warn('⚠️ Connection disconnected for peer', peerId);
      }
    };
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    const first = this.remoteStreams.values().next().value as MediaStream | undefined;
    return first || null;
  }

  getRemoteStreams(): Map<string, MediaStream> {
    return new Map(this.remoteStreams);
  }

  getPeerConnection(): RTCPeerConnection | null {
    const first = this.peerConnections.values().next().value as RTCPeerConnection | undefined;
    return first || null;
  }

  private closePeer(peerId: string) {
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(peerId);
    }
    const remoteStream = this.remoteStreams.get(peerId);
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStreams.delete(peerId);
    }
    const callId = this.currentCallIdByPeer.get(peerId);
    this.currentCallIdByPeer.delete(peerId);
    if (callId) {
      this.peerByCallId.delete(callId);
    }
    this.pendingIceCandidatesByPeer.delete(peerId);
  }

  endCall() {
    console.log('📴 Ending call');
    
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.remoteStreams.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    this.remoteStreams.clear();

    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();
    this.currentCallIdByPeer.clear();
    this.peerByCallId.clear();
    this.pendingIceCandidatesByPeer.clear();
  }

  getCurrentCallId(): string | null {
    const first = this.currentCallIdByPeer.values().next().value as string | undefined;
    return first || null;
  }
}

export const webrtcService = new WebRTCService();
