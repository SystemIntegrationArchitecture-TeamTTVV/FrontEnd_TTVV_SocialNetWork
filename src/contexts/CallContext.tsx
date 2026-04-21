import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { webrtcService, type CallType } from '../services/webrtc';
import { socketService } from '../services/socket';
import { authApi } from '../apis/auth';
import { conversationsApi } from '../apis/conversations';
import CallWindow from '../components/CallWindow';
import i18n from '../i18n';
import { useRef } from 'react';
import { notify } from '../services/notify';

interface CallState {
  isActive: boolean;
  isCalling: boolean;
  isIncoming: boolean;
  offerProcessed: boolean; // Track if handleOffer completed successfully
  callType: CallType | null;
  remoteName: string;
  remoteId: string;
  conversationId?: string;
  isGroup: boolean;
  participantIds: string[];
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  remoteStreams: Array<{ peerId: string; stream: MediaStream }>;
}

interface CallContextType {
  callState: CallState;
  startCall: (userId: string, userName: string, callType: CallType, conversationId?: string, isGroup?: boolean) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);
const PEER_RING_TIMEOUT_MS = 30000;
const PEER_MAX_RETRY = 1;

export function CallProvider({ children }: { children: ReactNode }) {
  const peerTimeoutsRef = useRef<Map<string, number>>(new Map());
  const peerRetryRef = useRef<Map<string, number>>(new Map());
  const pendingPeersRef = useRef<Set<string>>(new Set());
  const callIdToPeerRef = useRef<Map<string, string>>(new Map());

  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    isCalling: false,
    isIncoming: false,
    offerProcessed: false,
    callType: null,
    remoteName: '',
    remoteId: '',
    conversationId: undefined,
    isGroup: false,
    participantIds: [],
    localStream: null,
    remoteStream: null,
    remoteStreams: [],
  });

  const clearPeerTimer = useCallback((peerId: string) => {
    const timeoutId = peerTimeoutsRef.current.get(peerId);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      peerTimeoutsRef.current.delete(peerId);
    }
  }, []);

  const resetPeerTracking = useCallback(() => {
    peerTimeoutsRef.current.forEach(timeoutId => window.clearTimeout(timeoutId));
    peerTimeoutsRef.current.clear();
    peerRetryRef.current.clear();
    pendingPeersRef.current.clear();
    callIdToPeerRef.current.clear();
  }, []);

  const schedulePeerTimeout = useCallback((
    peerId: string,
    sendOffer: () => Promise<void>,
    onPeerFailed: () => void
  ) => {
    clearPeerTimer(peerId);
    const timeoutId = window.setTimeout(async () => {
      if (!pendingPeersRef.current.has(peerId)) return;
      const retries = peerRetryRef.current.get(peerId) || 0;
      if (retries < PEER_MAX_RETRY) {
        peerRetryRef.current.set(peerId, retries + 1);
        try {
          await sendOffer();
          schedulePeerTimeout(peerId, sendOffer, onPeerFailed);
          return;
        } catch {
          // Fall through to failure handling below.
        }
      }
      pendingPeersRef.current.delete(peerId);
      clearPeerTimer(peerId);
      onPeerFailed();
    }, PEER_RING_TIMEOUT_MS);
    peerTimeoutsRef.current.set(peerId, timeoutId);
  }, [clearPeerTimer]);

  // Subscribe to incoming WebRTC events
  useEffect(() => {
    const currentUser = authApi.getCurrentUser();
    if (!currentUser) return;

    console.log('📞 CallProvider: Setting up WebRTC event listeners for user:', currentUser.username || currentUser.id);

    // Handle incoming call offer
    const unsubOffer = socketService.on('CALL_OFFER', async (event) => {
      console.log('📞🎯 CallProvider: CALL_OFFER EVENT RECEIVED!', event);
      const { callerId, callerName, callType } = event.data;
      const conversationId = event.data?.conversationId as string | undefined;
      const isGroup = !!event.data?.isGroup;
      console.log('📞 CallProvider: Incoming call from:', callerName, 'callerId:', callerId);

      // End any existing call first
      if (callState.isActive) {
        console.log('⚠️ CallProvider: Ending existing call before accepting new one');
        webrtcService.endCall();
      }

      // Initialize local stream first
      try {
        const localStream = await webrtcService.initCall(callType);
        
        setCallState({
          isActive: true,
          isCalling: false,
          isIncoming: true,
          offerProcessed: false, // Not processed yet
          callType,
          remoteName: callerName,
          remoteId: callerId,
          conversationId,
          isGroup,
          participantIds: isGroup ? [callerId] : [callerId],
          localStream,
          remoteStream: null,
          remoteStreams: [],
        });

        // Handle the offer
        webrtcService.setRemotePeer(callerId);
        await webrtcService.handleOffer(event.data);
        
        // Mark offer as processed
        setCallState(prev => ({ ...prev, offerProcessed: true }));
        
        console.log('✅ CallProvider: Ready to accept/reject incoming call');
      } catch (error: any) {
        console.error('❌ CallProvider: Failed to handle incoming call:', error);
        notify.error(error.message || i18n.t('calls.cannotReceive'));
      }
    });

    // Handle call answer
    const unsubAnswer = socketService.on('CALL_ANSWER', async (event) => {
      console.log('✅ CallProvider: Call answered by remote peer');
      const senderId = event.data?.senderId as string | undefined;
      const callId = event.data?.callId as string | undefined;
      const answerPeerId = senderId || (callId ? callIdToPeerRef.current.get(callId) : undefined);
      if (!answerPeerId) {
        console.warn('⚠️ CALL_ANSWER missing senderId');
        return;
      }
      await webrtcService.handleAnswer(event.data);
      pendingPeersRef.current.delete(answerPeerId);
      clearPeerTimer(answerPeerId);
      
      setCallState(prev => ({
        ...prev,
        isCalling: false,
        participantIds: prev.participantIds.includes(answerPeerId)
          ? prev.participantIds
          : [...prev.participantIds, answerPeerId],
      }));
    });

    // Handle ICE candidate
    const unsubIce = socketService.on('ICE_CANDIDATE', async (event) => {
      console.log('🧊 CallProvider: Received ICE candidate');
      await webrtcService.addIceCandidate(event.data);
    });

    const unsubMembersAdded = socketService.on('MEMBERS_ADDED', async (event) => {
      if (!callState.isActive || !callState.isGroup) return;
      const payload = event.data as { conversationId?: string; participantIds?: string[] };
      if (!payload?.conversationId || payload.conversationId !== callState.conversationId) return;

      const currentUser = authApi.getCurrentUser();
      if (!currentUser?.id) return;
      const newParticipantIds = (payload.participantIds || []).filter(id => id && id !== currentUser.id);
      if (newParticipantIds.length === 0) return;

      for (const participantId of newParticipantIds) {
        await webrtcService.createOffer(
          callState.callType || 'voice',
          participantId,
          currentUser.id,
          currentUser.fullName || currentUser.username,
          callState.conversationId,
          false
        );
      }
    });

    // Handle call end/reject
    const unsubEnd = socketService.on('CALL_END', () => {
      const senderId = authApi.getCurrentUser()?.id;
      if (callState.isGroup && senderId) {
        pendingPeersRef.current.delete(senderId);
        clearPeerTimer(senderId);
      }
      console.log('📴 CallProvider: Call ended by remote peer');
      endCall();
    });

    const unsubReject = socketService.on('CALL_REJECT', () => {
      const senderId = authApi.getCurrentUser()?.id;
      if (callState.isGroup && senderId) {
        pendingPeersRef.current.delete(senderId);
        clearPeerTimer(senderId);
      }
      console.log('❌ CallProvider: Call rejected by remote peer');
      notify.error(i18n.t('calls.rejected'));
      endCall();
    });

    return () => {
      console.log('📞 CallProvider: Cleaning up event listeners');
      unsubOffer();
      unsubAnswer();
      unsubIce();
      unsubMembersAdded();
      unsubEnd();
      unsubReject();
    };
  }, [callState.isActive, callState.isGroup, callState.callType, callState.conversationId]);

  const startCall = useCallback(async (
    userId: string,
    userName: string,
    callType: CallType,
    conversationId?: string,
    isGroup?: boolean
  ) => {
    try {
      console.log('📞 CallProvider: Starting call to:', userName, 'userId:', userId, isGroup ? '(GROUP CALL)' : '(DIRECT CALL)');
      
      // End any existing call first
      if (callState.isActive) {
        console.log('⚠️ CallProvider: Ending existing call before starting new one');
        webrtcService.endCall();
      }
      
      const currentUser = authApi.getCurrentUser();
      if (!currentUser) {
        throw new Error(i18n.t('calls.needLogin'));
      }
      
      console.log('👤 Current user info:', {
        id: currentUser.id,
        username: currentUser.username,
        fullName: currentUser.fullName
      });
      console.log('🎯 Recipient info:', {
        userId: userId,
        userName: userName,
        conversationId: conversationId,
        isGroup: isGroup
      });

      const localStream = await webrtcService.initCall(callType);
      let participantIds: string[] = [];
      const targetIds: string[] = [];
      if (isGroup && conversationId) {
        const conversation = await conversationsApi.getConversationById(conversationId);
        participantIds = (conversation.participantIds || []).filter(id => id !== currentUser.id);
        targetIds.push(...participantIds);
      } else {
        targetIds.push(userId);
        participantIds = [userId];
      }
      
      setCallState({
        isActive: true,
        isCalling: true,
        isIncoming: false,
        offerProcessed: false,
        callType,
        remoteName: userName,
        remoteId: userId,
        conversationId,
        isGroup: !!isGroup,
        participantIds,
        localStream,
        remoteStream: null,
        remoteStreams: [],
      });

      for (const targetId of targetIds) {
        const sendOffer = async () => {
          const offer = await webrtcService.createOffer(
            callType,
            targetId,
            currentUser.id,
            currentUser.fullName || currentUser.username,
            conversationId,
            false
          );
          if (offer.callId) {
            callIdToPeerRef.current.set(offer.callId, targetId);
          }
          pendingPeersRef.current.add(targetId);
        };
        await sendOffer();
        schedulePeerTimeout(
          targetId,
          sendOffer,
          () => {
            setCallState(prev => {
              const remaining = prev.participantIds.filter(id => id !== targetId);
              if (!prev.isGroup) {
                return prev;
              }
              return { ...prev, participantIds: remaining };
            });
            if (!isGroup) {
              endCall();
            }
          }
        );
      }
      console.log('✅ CallProvider: Call offer sent', isGroup ? '(GROUP CALL - will broadcast to all participants)' : '(DIRECT CALL)');
    } catch (error: any) {
      console.error('❌ CallProvider: Failed to start call:', error);
      notify.error(error.message || i18n.t('calls.cannotStart'));
      endCall();
    }
  }, [callState.isActive]);

  const acceptCall = useCallback(async () => {
    try {
      console.log('✅ CallProvider: Accepting call...');
      console.log('📊 CallProvider: offerProcessed status:', callState.offerProcessed);
      
      // Wait for offer to be fully processed with retry logic
      if (!callState.offerProcessed) {
        console.warn('⚠️ CallProvider: Offer not yet processed, waiting up to 5 seconds...');
        
        // Wait up to 5 seconds for offer to be processed
        let retries = 0;
        const maxRetries = 50; // 50 * 100ms = 5 seconds
        
        while (!callState.offerProcessed && retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
          
          // Re-check by looking at current state via webrtcService
          if (webrtcService.getPeerConnection()) {
            console.log('✅ CallProvider: Peer connection exists, proceeding...');
            break;
          }
        }
        
        if (retries >= maxRetries) {
          throw new Error('Timeout waiting for offer to be processed');
        }
      }
      
      setCallState(prev => ({
        ...prev,
        isIncoming: false,
        isActive: true,
      }));

      // Create and send answer
      await webrtcService.createAnswer(callState.remoteId);
      pendingPeersRef.current.delete(callState.remoteId);
      clearPeerTimer(callState.remoteId);
      if (callState.isGroup && callState.conversationId) {
        const currentUser = authApi.getCurrentUser();
        if (currentUser?.id) {
          const conversation = await conversationsApi.getConversationById(callState.conversationId);
          const peers = (conversation.participantIds || []).filter(id => id !== currentUser.id && id !== callState.remoteId);
          for (const peerId of peers) {
            const sendOffer = async () => {
              const offer = await webrtcService.createOffer(
                callState.callType || 'voice',
                peerId,
                currentUser.id,
                currentUser.fullName || currentUser.username,
                callState.conversationId,
                false
              );
              if (offer.callId) {
                callIdToPeerRef.current.set(offer.callId, peerId);
              }
              pendingPeersRef.current.add(peerId);
            };
            await sendOffer();
            schedulePeerTimeout(
              peerId,
              sendOffer,
              () => {
                setCallState(prev => ({
                  ...prev,
                  participantIds: prev.participantIds.filter(id => id !== peerId),
                }));
              }
            );
          }
        }
      }
      console.log('✅ CallProvider: Call answer sent');
    } catch (error: any) {
      console.error('❌ CallProvider: Failed to accept call:', error);
      notify.error(error.message || i18n.t('calls.cannotAccept'));
      endCall();
    }
  }, [callState.remoteId, callState.offerProcessed, callState.isGroup, callState.conversationId, callState.callType]);

  const endCall = useCallback(() => {
    console.log('📴 CallProvider: Ending call');
    console.log('📴 CallProvider: Call state before ending:', {
      isActive: callState.isActive,
      isIncoming: callState.isIncoming,
      isCalling: callState.isCalling,
      remoteId: callState.remoteId
    });
    console.trace('📴 CallProvider: endCall called from:');
    
    const recipients = callState.isGroup ? callState.participantIds : [callState.remoteId];
    recipients.filter(Boolean).forEach((recipientId) => {
      socketService.send('/app/webrtc/end', {
        type: 'CALL_END',
        userId: recipientId,
        data: { senderId: authApi.getCurrentUser()?.id },
        timestamp: new Date().toISOString(),
      });
    });

    webrtcService.endCall();
    setCallState({
      isActive: false,
      isCalling: false,
      isIncoming: false,
      offerProcessed: false,
      callType: null,
      remoteName: '',
      remoteId: '',
      conversationId: undefined,
      isGroup: false,
      participantIds: [],
      localStream: null,
      remoteStream: null,
      remoteStreams: [],
    });
    resetPeerTracking();
  }, [callState.remoteId, callState.isGroup, callState.participantIds, resetPeerTracking]);

  const rejectCall = useCallback(() => {
    console.log('❌ CallProvider: Rejecting call');
    
    const recipients = callState.isGroup ? callState.participantIds : [callState.remoteId];
    recipients.filter(Boolean).forEach((recipientId) => {
      socketService.send('/app/webrtc/reject', {
        type: 'CALL_REJECT',
        userId: recipientId,
        data: { senderId: authApi.getCurrentUser()?.id },
        timestamp: new Date().toISOString(),
      });
    });

    endCall();
  }, [callState.remoteId, callState.isGroup, callState.participantIds, endCall]);

  // Update remote stream when available
  useEffect(() => {
    if (!callState.isActive) return;

    const interval = setInterval(() => {
      const remoteStream = webrtcService.getRemoteStream();
      const remoteStreams = Array.from(webrtcService.getRemoteStreams().entries()).map(([peerId, stream]) => ({
        peerId,
        stream,
      }));
      if (remoteStream && remoteStream !== callState.remoteStream) {
        console.log('🎬 CallProvider: Updating remote stream:', {
          streamId: remoteStream.id,
          audioTracks: remoteStream.getAudioTracks().length,
          videoTracks: remoteStream.getVideoTracks().length,
          active: remoteStream.active
        });
        setCallState(prev => ({
          ...prev,
          remoteStream,
          remoteStreams,
        }));
      } else if (remoteStreams.length !== callState.remoteStreams.length) {
        setCallState(prev => ({
          ...prev,
          remoteStreams,
        }));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [callState.isActive, callState.remoteStream, callState.remoteStreams.length]);

  return (
    <CallContext.Provider value={{ callState, startCall, acceptCall, rejectCall, endCall }}>
      {children}
      
      {/* Global Call Window */}
      {callState.isActive && (
        <CallWindow
          isIncoming={callState.isIncoming}
          callerName={callState.remoteName}
          callType={callState.callType!}
          localStream={callState.localStream}
          remoteStream={callState.remoteStream}
          remoteStreams={callState.remoteStreams}
          isGroup={callState.isGroup}
          onAccept={acceptCall}
          onReject={rejectCall}
          onEnd={endCall}
        />
      )}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
