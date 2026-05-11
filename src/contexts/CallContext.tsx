import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { socketService } from '../services/socket';
import { authApi } from '../apis/auth';
import { callSounds } from '../services/callSounds';
import CallWindow from '../components/CallWindow';
import { notify } from '../services/notify';

export type CallPhase = 'idle' | 'outgoing_ringing' | 'incoming_ringing' | 'connected';
export type CallType = 'voice' | 'video';

interface CallState {
  phase: CallPhase;
  callType: CallType | null;
  remoteName: string;
  remoteId: string;
  conversationId?: string;
  isGroup: boolean;
  roomId: string | null;
  callerId: string | null;
}

interface CallContextType {
  callState: CallState;
  startCall: (userId: string, userName: string, callType: CallType, conversationId?: string, isGroup?: boolean) => Promise<void>;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
}

const initialCallState: CallState = {
  phase: 'idle',
  callType: null,
  remoteName: '',
  remoteId: '',
  conversationId: undefined,
  isGroup: false,
  roomId: null,
  callerId: null,
};

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
  const [callState, setCallState] = useState<CallState>(initialCallState);

  const cleanup = useCallback(() => {
    callSounds.stopAll();
    setCallState(initialCallState);
  }, []);

  // Handle incoming socket events
  useEffect(() => {
    const currentUser = authApi.getCurrentUser();
    if (!currentUser) return;

    const unsubOffer = socketService.on('CALL_OFFER', (event) => {
      const { callerId, callerName, callType, roomId, conversationId, isGroup } = event.data;
      if (callerId === currentUser.id) return;

      setCallState(prev => {
        if (prev.phase !== 'idle') return prev; // Ignore if busy
        callSounds.playIncomingRingtone();
        return {
          phase: 'incoming_ringing',
          callType,
          remoteName: callerName || 'Unknown',
          remoteId: callerId,
          conversationId,
          isGroup: !!isGroup,
          roomId,
          callerId
        };
      });
    });

    const unsubAnswer = socketService.on('CALL_ANSWER', (event) => {
      setCallState(prev => {
        if (prev.roomId === event.data.roomId && prev.phase === 'outgoing_ringing') {
          callSounds.stopAll();
          return { ...prev, phase: 'connected' };
        }
        return prev;
      });
    });

    const unsubReject = socketService.on('CALL_REJECT', (event) => {
      setCallState(prev => {
        if (prev.roomId === event.data.roomId) {
          notify.info(`${prev.remoteName} đã từ chối cuộc gọi`);
          cleanup();
        }
        return prev;
      });
    });

    const unsubEnd = socketService.on('CALL_END', (event) => {
      setCallState(prev => {
        if (prev.roomId === event.data.roomId) {
          notify.info(`Cuộc gọi đã kết thúc`);
          cleanup();
        }
        return prev;
      });
    });
    
    // Auto timeout for ringing (if user ignores it)
    let ringTimeout: number | undefined;
    if (callState.phase === 'incoming_ringing' || callState.phase === 'outgoing_ringing') {
        ringTimeout = window.setTimeout(() => {
            cleanup();
        }, 30000); // 30s timeout
    }

    return () => {
      unsubOffer();
      unsubAnswer();
      unsubReject();
      unsubEnd();
      if (ringTimeout) clearTimeout(ringTimeout);
    };
  }, [cleanup, callState.phase]);

  // Handle postMessage from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'webrtc-call-ended') {
        cleanup();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [cleanup]);

  const startCall = async (userId: string, userName: string, callType: CallType, conversationId?: string, isGroup?: boolean) => {
    const currentUser = authApi.getCurrentUser();
    if (!currentUser) return;

    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setCallState({
      phase: 'outgoing_ringing',
      callType,
      remoteName: userName,
      remoteId: userId,
      conversationId,
      isGroup: !!isGroup,
      roomId,
      callerId: currentUser.id
    });

    callSounds.playOutgoingTone();

    const offerData = {
      callerId: currentUser.id,
      callerName: currentUser.displayName || currentUser.username || 'Unknown',
      callType,
      roomId,
      conversationId,
      isGroup: !!isGroup
    };

    console.log('📞 Bắt đầu gọi: ', offerData);

    if (isGroup && conversationId) {
       socketService.send('/app/webrtc/offer', {
          type: 'CALL_OFFER',
          userId: userId, // ignored by backend for group calls, but required by DTO
          data: offerData
       });
    } else {
       socketService.send('/app/webrtc/offer', {
          type: 'CALL_OFFER',
          userId: userId,
          data: offerData
       });
    }
  };

  const acceptCall = () => {
    const currentUser = authApi.getCurrentUser();
    callSounds.stopAll();
    
    // Notify caller that we accepted so they switch to connected phase
    if (callState.callerId && currentUser) {
      console.log('✅ Chấp nhận cuộc gọi, gửi CALL_ANSWER tới: ', callState.callerId);
      socketService.send('/app/webrtc/answer', {
        type: 'CALL_ANSWER',
        userId: callState.callerId,
        data: { roomId: callState.roomId, type: 'accept' }
      });
    }

    setCallState(prev => ({ ...prev, phase: 'connected' }));
  };

  const rejectCall = () => {
    const currentUser = authApi.getCurrentUser();
    if (callState.roomId && currentUser && callState.callerId) {
      console.log('❌ Từ chối cuộc gọi, gửi CALL_REJECT tới: ', callState.callerId);
      socketService.send('/app/webrtc/reject', {
        type: 'CALL_REJECT',
        userId: callState.callerId,
        data: { roomId: callState.roomId, rejectorId: currentUser.id }
      });
    }
    cleanup();
  };

  const endCall = () => {
    const currentUser = authApi.getCurrentUser();
    if (callState.roomId && currentUser && callState.phase !== 'connected') {
       console.log('📴 Hủy cuộc gọi đang đổ chuông, gửi CALL_END');
       // If ringing, send CALL_END
       socketService.send('/app/webrtc/end', {
          type: 'CALL_END',
          userId: callState.remoteId,
          data: { roomId: callState.roomId, isGroup: callState.isGroup, conversationId: callState.conversationId }
       });
    } else if (callState.phase === 'connected') {
       // Send postMessage to iframe to hang up
       const iframe = document.getElementById('webrtc-iframe') as HTMLIFrameElement;
       if (iframe?.contentWindow) {
         iframe.contentWindow.postMessage({ type: 'webrtc-host-command', action: 'hangUp' }, '*');
       }
    }
    cleanup();
  };

  return (
    <CallContext.Provider value={{ callState, startCall, acceptCall, rejectCall, endCall }}>
      {children}
      {callState.phase !== 'idle' && (
        <CallWindow
          phase={callState.phase}
          callerName={callState.remoteName}
          callType={callState.callType!}
          isGroup={callState.isGroup}
          roomId={callState.roomId}
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
  if (!context) throw new Error('useCall must be used within CallProvider');
  return context;
}
