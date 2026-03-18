import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { webrtcService, type CallType } from '../services/webrtc';
import { socketService } from '../services/socket';
import { authApi } from '../apis/auth';
import CallWindow from '../components/CallWindow';

interface CallState {
  isActive: boolean;
  isCalling: boolean;
  isIncoming: boolean;
  offerProcessed: boolean; // Track if handleOffer completed successfully
  callType: CallType | null;
  remoteName: string;
  remoteId: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

interface CallContextType {
  callState: CallState;
  startCall: (userId: string, userName: string, callType: CallType, conversationId?: string, isGroup?: boolean) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    isCalling: false,
    isIncoming: false,
    offerProcessed: false,
    callType: null,
    remoteName: '',
    remoteId: '',
    localStream: null,
    remoteStream: null,
  });

  // Subscribe to incoming WebRTC events
  useEffect(() => {
    const currentUser = authApi.getCurrentUser();
    if (!currentUser) return;

    console.log('📞 CallProvider: Setting up WebRTC event listeners for user:', currentUser.username || currentUser.id);

    // Handle incoming call offer
    const unsubOffer = socketService.on('CALL_OFFER', async (event) => {
      console.log('📞🎯 CallProvider: CALL_OFFER EVENT RECEIVED!', event);
      const { callerId, callerName, callType } = event.data;
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
          localStream,
          remoteStream: null,
        });

        // Handle the offer
        webrtcService.setRemotePeer(callerId);
        await webrtcService.handleOffer(event.data);
        
        // Mark offer as processed
        setCallState(prev => ({ ...prev, offerProcessed: true }));
        
        console.log('✅ CallProvider: Ready to accept/reject incoming call');
      } catch (error: any) {
        console.error('❌ CallProvider: Failed to handle incoming call:', error);
        alert(error.message || 'Không thể nhận cuộc gọi.');
      }
    });

    // Handle call answer
    const unsubAnswer = socketService.on('CALL_ANSWER', async (event) => {
      console.log('✅ CallProvider: Call answered by remote peer');
      await webrtcService.handleAnswer(event.data);
      
      setCallState(prev => ({
        ...prev,
        isCalling: false,
      }));
    });

    // Handle ICE candidate
    const unsubIce = socketService.on('ICE_CANDIDATE', async (event) => {
      console.log('🧊 CallProvider: Received ICE candidate');
      await webrtcService.addIceCandidate(event.data);
    });

    // Handle call end/reject
    const unsubEnd = socketService.on('CALL_END', () => {
      console.log('📴 CallProvider: Call ended by remote peer');
      endCall();
    });

    const unsubReject = socketService.on('CALL_REJECT', () => {
      console.log('❌ CallProvider: Call rejected by remote peer');
      alert('Cuộc gọi bị từ chối');
      endCall();
    });

    return () => {
      console.log('📞 CallProvider: Cleaning up event listeners');
      unsubOffer();
      unsubAnswer();
      unsubIce();
      unsubEnd();
      unsubReject();
    };
  }, []);

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
        throw new Error('Bạn cần đăng nhập để gọi điện');
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
      
      setCallState({
        isActive: true,
        isCalling: true,
        isIncoming: false,
        offerProcessed: false,
        callType,
        remoteName: userName,
        remoteId: userId,
        localStream,
        remoteStream: null,
      });

      // Create and send offer
      // For group calls: conversationId is passed, for direct calls: userId is the recipient
      webrtcService.setRemotePeer(userId);
      await webrtcService.createOffer(
        callType,
        userId,
        currentUser.id,
        currentUser.fullName || currentUser.username,
        conversationId,
        isGroup || false
      );
      console.log('✅ CallProvider: Call offer sent', isGroup ? '(GROUP CALL - will broadcast to all participants)' : '(DIRECT CALL)');
    } catch (error: any) {
      console.error('❌ CallProvider: Failed to start call:', error);
      alert(error.message || 'Không thể bắt đầu cuộc gọi. Vui lòng thử lại.');
      endCall();
    }
  }, []);

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
      console.log('✅ CallProvider: Call answer sent');
    } catch (error: any) {
      console.error('❌ CallProvider: Failed to accept call:', error);
      alert(error.message || 'Không thể chấp nhận cuộc gọi.');
      endCall();
    }
  }, [callState.remoteId, callState.offerProcessed]);

  const rejectCall = useCallback(() => {
    console.log('❌ CallProvider: Rejecting call');
    
    socketService.send('/app/webrtc/reject', {
      type: 'CALL_REJECT',
      userId: callState.remoteId,
      data: {},
      timestamp: new Date().toISOString(),
    });

    endCall();
  }, [callState.remoteId]);

  const endCall = useCallback(() => {
    console.log('📴 CallProvider: Ending call');
    console.log('📴 CallProvider: Call state before ending:', {
      isActive: callState.isActive,
      isIncoming: callState.isIncoming,
      isCalling: callState.isCalling,
      remoteId: callState.remoteId
    });
    console.trace('📴 CallProvider: endCall called from:');
    
    if (callState.remoteId) {
      socketService.send('/app/webrtc/end', {
        type: 'CALL_END',
        userId: callState.remoteId,
        data: {},
        timestamp: new Date().toISOString(),
      });
    }

    webrtcService.endCall();
    setCallState({
      isActive: false,
      isCalling: false,
      isIncoming: false,
      offerProcessed: false,
      callType: null,
      remoteName: '',
      remoteId: '',
      localStream: null,
      remoteStream: null,
    });
  }, [callState.remoteId]);

  // Update remote stream when available
  useEffect(() => {
    if (!callState.isActive) return;

    const interval = setInterval(() => {
      const remoteStream = webrtcService.getRemoteStream();
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
        }));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [callState.isActive, callState.remoteStream]);

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
