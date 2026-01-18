import { socketService } from './socket';

export type CallType = 'voice' | 'video';

export interface CallOffer {
  callId: string;
  callerId: string;
  callerName: string;
  callType: CallType;
  offer: RTCSessionDescriptionInit;
}

export interface CallAnswer {
  callId: string;
  answer: RTCSessionDescriptionInit;
}

export interface IceCandidate {
  callId: string;
  candidate: RTCIceCandidateInit;
}

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private currentCallId: string | null = null;
  private pendingIceCandidates: RTCIceCandidateInit[] = []; // Queue for early ICE candidates

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
          alert('Camera không khả dụng. Chuyển sang cuộc gọi thoại.');
          return this.localStream;
        } catch (audioError: any) {
          console.error('❌ Audio fallback also failed:', audioError.name);
          throw new Error('Không thể truy cập microphone. Camera đang được sử dụng bởi ứng dụng khác và microphone cũng không khả dụng.');
        }
      }
      
      // Handle permission denied
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Bạn cần cấp quyền truy cập camera và microphone để thực hiện cuộc gọi. Vui lòng kiểm tra cài đặt trình duyệt.');
      }
      
      // Handle device not found
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('Không tìm thấy camera hoặc microphone. Vui lòng kiểm tra kết nối thiết bị của bạn.');
      }
      
      throw new Error(`Không thể khởi tạo cuộc gọi: ${error.message || 'Lỗi không xác định'}`);
    }
  }

  async createOffer(
    callType: CallType,
    recipientId: string,
    callerId: string,
    callerName: string
  ): Promise<CallOffer> {
    console.log('📞 Creating call offer to:', recipientId);
    
    // Initialize peer connection
    this.peerConnection = new RTCPeerConnection(this.configuration);
    this.setupPeerConnectionListeners();

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    // Create offer
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.currentCallId = callId;

    const callOffer: CallOffer = {
      callId,
      callerId, // The actual caller's ID
      callerName,
      callType,
      offer: offer,
    };

    // Send offer via socket - Backend expects SocketEventDTO format
    socketService.send('/app/webrtc/offer', {
      type: 'CALL_OFFER',
      userId: recipientId, // Target user to receive the offer
      data: callOffer,
      timestamp: new Date().toISOString(),
    });
    console.log('📤 Sent call offer to:', recipientId);

    return callOffer;
  }

  async handleOffer(offer: CallOffer): Promise<void> {
    console.log('📥 Received call offer:', offer);
    
    this.currentCallId = offer.callId;
    this.peerConnection = new RTCPeerConnection(this.configuration);
    this.setupPeerConnectionListeners();

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer.offer));
    
    // Process any queued ICE candidates now that remote description is set
    await this.processQueuedIceCandidates();
  }

  async createAnswer(callerId: string): Promise<CallAnswer> {
    console.log('🔍 createAnswer called with:', {
      callerId,
      hasPeerConnection: !!this.peerConnection,
      currentCallId: this.currentCallId,
      peerConnectionState: this.peerConnection?.connectionState,
      peerConnectionSignalingState: this.peerConnection?.signalingState
    });
    
    if (!this.peerConnection || !this.currentCallId) {
      console.error('❌ createAnswer failed:', {
        peerConnection: !!this.peerConnection,
        currentCallId: this.currentCallId
      });
      throw new Error('No active call to answer');
    }

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    const callAnswer: CallAnswer = {
      callId: this.currentCallId,
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
    console.log('📥 Received call answer:', answer);
    console.log('🔍 handleAnswer state:', {
      hasPeerConnection: !!this.peerConnection,
      currentCallId: this.currentCallId,
      peerConnectionState: this.peerConnection?.connectionState,
      signalingState: this.peerConnection?.signalingState
    });
    
    if (!this.peerConnection) {
      console.error('❌ handleAnswer: No peer connection!');
      throw new Error('No peer connection');
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer.answer));
    
    // Process any queued ICE candidates now that remote description is set
    await this.processQueuedIceCandidates();
  }

  async addIceCandidate(candidate: IceCandidate): Promise<void> {
    if (!this.peerConnection) {
      // Silently ignore ICE candidates if no peer connection (call may have ended)
      return;
    }

    // If remote description is not set yet, queue the candidate
    if (!this.peerConnection.remoteDescription) {
      console.log('📦 Queueing ICE candidate (remote description not set yet)');
      this.pendingIceCandidates.push(candidate.candidate);
      return;
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate.candidate));
      console.log('✅ Added ICE candidate');
    } catch (error) {
      console.error('❌ Failed to add ICE candidate:', error);
    }
  }

  private async processQueuedIceCandidates(): Promise<void> {
    if (this.pendingIceCandidates.length === 0) return;
    
    console.log(`📦 Processing ${this.pendingIceCandidates.length} queued ICE candidates`);
    
    for (const candidate of this.pendingIceCandidates) {
      try {
        await this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('✅ Added queued ICE candidate');
      } catch (error) {
        console.error('❌ Failed to add queued ICE candidate:', error);
      }
    }
    
    this.pendingIceCandidates = [];
  }

  private remotePeerId: string | null = null;

  setRemotePeer(peerId: string) {
    this.remotePeerId = peerId;
  }

  private setupPeerConnectionListeners() {
    if (!this.peerConnection) return;

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.currentCallId && this.remotePeerId) {
        const iceCandidate: IceCandidate = {
          callId: this.currentCallId,
          candidate: event.candidate.toJSON(),
        };
        socketService.send('/app/webrtc/ice-candidate', {
          type: 'ICE_CANDIDATE',
          userId: this.remotePeerId, // Send to the other peer
          data: iceCandidate,
          timestamp: new Date().toISOString(),
        });
        console.log('📤 Sent ICE candidate to:', this.remotePeerId);
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('🎬 Received remote track:', event.track.kind);
      
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
        console.log('📺 Created new remote stream:', this.remoteStream.id);
      }
      
      this.remoteStream.addTrack(event.track);
      console.log('📺 Remote stream now has:', {
        audioTracks: this.remoteStream.getAudioTracks().length,
        videoTracks: this.remoteStream.getVideoTracks().length,
        active: this.remoteStream.active
      });
    };

    // Handle connection state
    this.peerConnection.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', this.peerConnection?.connectionState);
      
      if (this.peerConnection?.connectionState === 'failed') {
        console.error('❌ Connection failed! Ending call...');
        this.endCall();
      }
      
      if (this.peerConnection?.connectionState === 'disconnected') {
        console.warn('⚠️ Connection disconnected');
      }
    };
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  endCall() {
    console.log('📴 Ending call');
    
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.currentCallId = null;
    this.remotePeerId = null;
    this.pendingIceCandidates = []; // Clear queued ICE candidates
  }

  getCurrentCallId(): string | null {
    return this.currentCallId;
  }
}

export const webrtcService = new WebRTCService();
