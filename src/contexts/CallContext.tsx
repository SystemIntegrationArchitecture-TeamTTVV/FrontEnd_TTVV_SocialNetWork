import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { webrtcService, type CallType } from '../services/webrtc';
import { socketService } from '../services/socket';
import { authApi } from '../apis/auth';
import { conversationsApi } from '../apis/conversations';
import { callsApi } from '../apis/calls';
import { callSounds } from '../services/callSounds';
import CallWindow from '../components/CallWindow';
import i18n from '../i18n';
import { useRef } from 'react';
import { notify } from '../services/notify';

interface CallState {
  isActive: boolean;
  isCalling: boolean;
  isIncoming: boolean;
  offerProcessed: boolean;
  callType: CallType | null;
  remoteName: string;
  remoteId: string;
  conversationId?: string;
  isGroup: boolean;
  participantIds: string[];
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  remoteStreams: Array<{ peerId: string; stream: MediaStream }>;
  // ── Smart call fields ──
  serverCallId: string | null;
  callCategory: 'DIRECT' | 'GROUP';
  hostId: string | null;
  activeParticipantIds: string[];
  callToasts: Array<{ id: string; text: string; type: 'join' | 'leave' | 'host' }>;
}

interface CallContextType {
  callState: CallState;
  startCall: (userId: string, userName: string, callType: CallType, conversationId?: string, isGroup?: boolean) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  leaveCall: (transferToUserId?: string) => void;
  endCallForAll: () => void;
  transferHost: (newHostId: string) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);
const PEER_RING_TIMEOUT_MS = 30000;
const PEER_MAX_RETRY = 1;
const DISCONNECT_TIMEOUT_MS = 10000;
const RING_TIMEOUT_MS = 15000; // Auto-reject/end after 15s of ringing

const initialCallState: CallState = {
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
  serverCallId: null,
  callCategory: 'DIRECT',
  hostId: null,
  activeParticipantIds: [],
  callToasts: [],
};

export function CallProvider({ children }: { children: ReactNode }) {
  const peerTimeoutsRef = useRef<Map<string, number>>(new Map());
  const peerRetryRef = useRef<Map<string, number>>(new Map());
  const pendingPeersRef = useRef<Set<string>>(new Set());
  const callIdToPeerRef = useRef<Map<string, string>>(new Map());
  const activeCallLogIdRef = useRef<string | null>(null);
  const callStateRef = useRef<CallState | null>(null);
  const disconnectTimersRef = useRef<Map<string, number>>(new Map());
  const ringTimeoutRef = useRef<number | null>(null);

  const [callState, setCallState] = useState<CallState>(initialCallState);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // ── Toast helper ──
  const addToast = useCallback((text: string, type: 'join' | 'leave' | 'host') => {
    const id = `toast_${Date.now()}`;
    setCallState(prev => ({
      ...prev,
      callToasts: [...prev.callToasts.slice(-4), { id, text, type }],
    }));
    setTimeout(() => {
      setCallState(prev => ({
        ...prev,
        callToasts: prev.callToasts.filter(t => t.id !== id),
      }));
    }, 3500);
  }, []);

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
    disconnectTimersRef.current.forEach(t => window.clearTimeout(t));
    disconnectTimersRef.current.clear();
    activeCallLogIdRef.current = null;
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
        } catch { /* fall through */ }
      }
      pendingPeersRef.current.delete(peerId);
      clearPeerTimer(peerId);
      onPeerFailed();
    }, PEER_RING_TIMEOUT_MS);
    peerTimeoutsRef.current.set(peerId, timeoutId);
  }, [clearPeerTimer]);

  // ── Ring timeout helpers ──
  const clearRingTimeout = useCallback(() => {
    if (ringTimeoutRef.current) {
      window.clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
  }, []);

  // ── Core cleanup ──
  const cleanupCall = useCallback(() => {
    callSounds.stopAll();
    clearRingTimeout();
    webrtcService.endCall();
    webrtcService.onPeerStateChange(null);
    setCallState(initialCallState);
    resetPeerTracking();
  }, [resetPeerTracking, clearRingTimeout]);

  // ═══════════ Socket event handlers ═══════════

  useEffect(() => {
    const currentUser = authApi.getCurrentUser();
    if (!currentUser) return;

    // Handle incoming call offer
    const unsubOffer = socketService.on('CALL_OFFER', async (event) => {
      const { callerId, callerName, callType } = event.data;
      const conversationId = event.data?.conversationId as string | undefined;
      const isGroup = !!event.data?.isGroup;

      if (callStateRef.current?.isActive) {
        webrtcService.endCall();
      }

      try {
        const localStream = await webrtcService.initCall(callType);
        setCallState({
          ...initialCallState,
          isActive: true,
          isCalling: false,
          isIncoming: true,
          callType,
          remoteName: callerName,
          remoteId: callerId,
          conversationId,
          isGroup,
          callCategory: isGroup ? 'GROUP' : 'DIRECT',
          participantIds: [callerId],
          activeParticipantIds: [callerId],
          localStream,
        });

        // Play incoming ringtone (different from outgoing tone)
        callSounds.playIncomingRingtone();

        // Auto-reject after 15s if not answered
        clearRingTimeout();
        ringTimeoutRef.current = window.setTimeout(() => {
          const cs = callStateRef.current;
          if (cs?.isIncoming && cs?.isActive) {
            console.log('⏰ Ring timeout: auto-rejecting incoming call');
            callSounds.stopAll();
            // For group: only close UI for this user, NOT end call for others
            // For direct: reject = end for both
            const recipients = cs.isGroup ? cs.participantIds : [cs.remoteId];
            recipients.filter(Boolean).forEach(recipientId => {
              socketService.send('/app/webrtc/reject', {
                type: 'CALL_REJECT', userId: recipientId,
                data: { senderId: currentUser.id },
                timestamp: new Date().toISOString(),
              });
            });
            webrtcService.endCall();
            webrtcService.onPeerStateChange(null);
            setCallState(initialCallState);
            resetPeerTracking();
          }
        }, RING_TIMEOUT_MS);

        webrtcService.setRemotePeer(callerId);
        await webrtcService.handleOffer(event.data);
        setCallState(prev => ({ ...prev, offerProcessed: true }));
      } catch (error: any) {
        console.error('❌ Failed to handle incoming call:', error);
        callSounds.stopAll();
        notify.error(error.message || i18n.t('calls.cannotReceive'));
      }
    });

    // Handle call answer
    const unsubAnswer = socketService.on('CALL_ANSWER', async (event) => {
      const senderId = event.data?.senderId as string | undefined;
      const callId = event.data?.callId as string | undefined;
      const answerPeerId = senderId || (callId ? callIdToPeerRef.current.get(callId) : undefined);
      if (!answerPeerId) return;

      await webrtcService.handleAnswer(event.data);
      pendingPeersRef.current.delete(answerPeerId);
      clearPeerTimer(answerPeerId);

      // Someone answered → stop outgoing tone
      callSounds.stopOutgoingTone();
      clearRingTimeout();

      setCallState(prev => ({
        ...prev,
        isCalling: false,
        participantIds: prev.participantIds.includes(answerPeerId)
          ? prev.participantIds
          : [...prev.participantIds, answerPeerId],
        activeParticipantIds: prev.activeParticipantIds.includes(answerPeerId)
          ? prev.activeParticipantIds
          : [...prev.activeParticipantIds, answerPeerId],
      }));
    });

    // Handle ICE candidate
    const unsubIce = socketService.on('ICE_CANDIDATE', async (event) => {
      await webrtcService.addIceCandidate(event.data);
    });

    // Handle group member added
    const unsubMembersAdded = socketService.on('MEMBERS_ADDED', async (event) => {
      const currentCall = callStateRef.current;
      if (!currentCall?.isActive || !currentCall.isGroup) return;
      const payload = event.data as { conversationId?: string; participantIds?: string[] };
      if (!payload?.conversationId || payload.conversationId !== currentCall.conversationId) return;

      const cUser = authApi.getCurrentUser();
      if (!cUser?.id) return;
      const newIds = (payload.participantIds || []).filter(id => id && id !== cUser.id);

      for (const participantId of newIds) {
        await webrtcService.createOffer(
          currentCall.callType || 'voice', participantId,
          cUser.id, cUser.fullName || cUser.username,
          currentCall.conversationId, false
        );
      }
    });

    // ── Smart call events ──

    const unsubUserJoined = socketService.on('CALL_USER_JOINED', (event) => {
      const { userId, activeParticipantIds } = event.data as {
        userId: string; activeParticipantIds: string[];
      };
      if (userId === currentUser.id) return;
      setCallState(prev => ({
        ...prev,
        activeParticipantIds: activeParticipantIds || prev.activeParticipantIds,
        participantIds: prev.participantIds.includes(userId)
          ? prev.participantIds : [...prev.participantIds, userId],
      }));
      addToast(`${userId.slice(0, 8)} đã tham gia`, 'join');
    });

    const unsubUserLeft = socketService.on('CALL_USER_LEFT', (event) => {
      const { userId, activeParticipantIds } = event.data as {
        userId: string; activeParticipantIds: string[];
      };
      if (userId === currentUser.id) return;

      // Close WebRTC peer for leaving user
      webrtcService.closePeerForUser(userId);

      setCallState(prev => {
        // DIRECT call: if other user leaves → end call
        if (prev.callCategory === 'DIRECT') {
          setTimeout(() => cleanupCall(), 100);
          return { ...prev, isActive: false };
        }
        // GROUP call: just remove user
        return {
          ...prev,
          activeParticipantIds: activeParticipantIds || prev.activeParticipantIds.filter(id => id !== userId),
          participantIds: prev.participantIds.filter(id => id !== userId),
        };
      });
      addToast(`${userId.slice(0, 8)} đã rời`, 'leave');
    });

    const unsubHostTransferred = socketService.on('CALL_HOST_TRANSFERRED', (event) => {
      const { newHostId } = event.data as { newHostId: string; previousHostId: string };
      setCallState(prev => ({ ...prev, hostId: newHostId }));
      if (newHostId === currentUser.id) {
        addToast('Bạn đã được chỉ định làm Host', 'host');
      }
    });

    // Handle call end
    const unsubEnd = socketService.on('CALL_END', () => {
      cleanupCall();
    });

    const unsubReject = socketService.on('CALL_REJECT', () => {
      const senderId = authApi.getCurrentUser()?.id;
      if (callStateRef.current?.isGroup && senderId) {
        pendingPeersRef.current.delete(senderId);
        clearPeerTimer(senderId);
      }
      notify.error(i18n.t('calls.rejected'));
      const activeCallId = activeCallLogIdRef.current;
      if (activeCallId && senderId) {
        callsApi.missed(activeCallId, { userId: senderId }).catch(() => {});
        activeCallLogIdRef.current = null;
      }
      cleanupCall();
    });

    return () => {
      unsubOffer(); unsubAnswer(); unsubIce(); unsubMembersAdded();
      unsubUserJoined(); unsubUserLeft(); unsubHostTransferred();
      unsubEnd(); unsubReject();
    };
  }, [clearPeerTimer, cleanupCall, addToast]);

  // ── Disconnect detection via WebRTC ──
  useEffect(() => {
    webrtcService.onPeerStateChange((peerId, state) => {
      if (state === 'disconnected') {
        const timer = window.setTimeout(() => {
          const cs = callStateRef.current;
          if (!cs?.isActive) return;
          webrtcService.closePeerForUser(peerId);
          if (cs.callCategory === 'DIRECT') {
            cleanupCall();
          } else {
            setCallState(prev => ({
              ...prev,
              activeParticipantIds: prev.activeParticipantIds.filter(id => id !== peerId),
              participantIds: prev.participantIds.filter(id => id !== peerId),
            }));
            addToast(`${peerId.slice(0, 8)} mất kết nối`, 'leave');
          }
        }, DISCONNECT_TIMEOUT_MS);
        disconnectTimersRef.current.set(peerId, timer);
      } else if (state === 'connected') {
        const timer = disconnectTimersRef.current.get(peerId);
        if (timer) {
          window.clearTimeout(timer);
          disconnectTimersRef.current.delete(peerId);
        }
      }
    });

    return () => { webrtcService.onPeerStateChange(null); };
  }, [cleanupCall, addToast]);

  // ═══════════ Actions ═══════════

  const startCall = useCallback(async (
    userId: string, userName: string, callType: CallType,
    conversationId?: string, isGroup?: boolean
  ) => {
    try {
      if (callState.isActive) webrtcService.endCall();

      const currentUser = authApi.getCurrentUser();
      if (!currentUser) throw new Error(i18n.t('calls.needLogin'));

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
        ...initialCallState,
        isActive: true,
        isCalling: true,
        callType,
        remoteName: userName,
        remoteId: userId,
        conversationId,
        isGroup: !!isGroup,
        callCategory: isGroup ? 'GROUP' : 'DIRECT',
        hostId: currentUser.id,
        participantIds,
        activeParticipantIds: [currentUser.id],
        localStream,
      });

      // Play outgoing tone (caller side, different from incoming ringtone)
      callSounds.playOutgoingTone();

      // Auto-end if no one answers within 15s (direct call only)
      clearRingTimeout();
      if (!isGroup) {
        ringTimeoutRef.current = window.setTimeout(() => {
          const cs = callStateRef.current;
          if (cs?.isCalling && cs?.isActive) {
            console.log('⏰ Ring timeout: no answer for direct call');
            callSounds.stopAll();
            const activeCallId = activeCallLogIdRef.current;
            const uid = authApi.getCurrentUser()?.id;
            if (activeCallId && uid) {
              callsApi.missed(activeCallId, { userId: uid }).catch(() => {});
              activeCallLogIdRef.current = null;
            }
            // End call via existing endCall path
            const recipients = [cs.remoteId].filter(Boolean);
            recipients.forEach(recipientId => {
              socketService.send('/app/webrtc/end', {
                type: 'CALL_END', userId: recipientId,
                data: { senderId: uid },
                timestamp: new Date().toISOString(),
              });
            });
            webrtcService.endCall();
            webrtcService.onPeerStateChange(null);
            setCallState(initialCallState);
            resetPeerTracking();
          }
        }, RING_TIMEOUT_MS);
      }

      for (const targetId of targetIds) {
        const sendOffer = async () => {
          const offer = await webrtcService.createOffer(
            callType, targetId, currentUser.id,
            currentUser.fullName || currentUser.username,
            conversationId, false
          );
          if (offer.callId) callIdToPeerRef.current.set(offer.callId, targetId);
          pendingPeersRef.current.add(targetId);
        };
        await sendOffer();
        schedulePeerTimeout(targetId, sendOffer, () => {
          setCallState(prev => {
            if (!prev.isGroup) return prev;
            return { ...prev, participantIds: prev.participantIds.filter(id => id !== targetId) };
          });
          if (!isGroup) {
            const activeCallId = activeCallLogIdRef.current;
            const currentUserId = authApi.getCurrentUser()?.id;
            if (activeCallId && currentUserId) {
              callsApi.missed(activeCallId, { userId: currentUserId }).catch(() => {});
              activeCallLogIdRef.current = null;
            }
            cleanupCall();
          }
        });
      }

      // Record call on server
      if (conversationId && targetIds.length > 0) {
        try {
          const callRecord = await callsApi.initiate({
            conversationId, callerId: currentUser.id,
            calleeIds: targetIds,
            type: callType === 'video' ? 'VIDEO' : 'VOICE',
          });
          activeCallLogIdRef.current = callRecord.id;
          setCallState(prev => ({
            ...prev,
            serverCallId: callRecord.id,
            hostId: callRecord.hostId || currentUser.id,
            callCategory: callRecord.callType || (isGroup ? 'GROUP' : 'DIRECT'),
          }));
        } catch (error) {
          console.warn('⚠️ Failed to record call initiation', error);
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to start call:', error);
      notify.error(error.message || i18n.t('calls.cannotStart'));
      cleanupCall();
    }
  }, [callState.isActive, cleanupCall, schedulePeerTimeout]);

  const acceptCall = useCallback(async () => {
    try {
      if (!callState.offerProcessed) {
        let retries = 0;
        while (!callState.offerProcessed && retries < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
          if (webrtcService.getPeerConnection()) break;
        }
        if (retries >= 50) throw new Error('Timeout waiting for offer');
      }

      // Stop ringtone on accept
      callSounds.stopAll();
      clearRingTimeout();

      setCallState(prev => ({ ...prev, isIncoming: false, isActive: true }));
      await webrtcService.createAnswer(callState.remoteId);
      pendingPeersRef.current.delete(callState.remoteId);
      clearPeerTimer(callState.remoteId);

      const currentUser = authApi.getCurrentUser();
      const activeCallId = activeCallLogIdRef.current;
      if (activeCallId && currentUser?.id) {
        try { await callsApi.join(activeCallId, { userId: currentUser.id }); } catch {}
      }

      if (callState.isGroup && callState.conversationId && currentUser?.id) {
        const conversation = await conversationsApi.getConversationById(callState.conversationId);
        const peers = (conversation.participantIds || []).filter(
          id => id !== currentUser.id && id !== callState.remoteId
        );
        for (const peerId of peers) {
          const sendOffer = async () => {
            const offer = await webrtcService.createOffer(
              callState.callType || 'voice', peerId,
              currentUser.id, currentUser.fullName || currentUser.username,
              callState.conversationId, false
            );
            if (offer.callId) callIdToPeerRef.current.set(offer.callId, peerId);
            pendingPeersRef.current.add(peerId);
          };
          await sendOffer();
          schedulePeerTimeout(peerId, sendOffer, () => {
            setCallState(prev => ({
              ...prev,
              participantIds: prev.participantIds.filter(id => id !== peerId),
            }));
          });
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to accept call:', error);
      notify.error(error.message || i18n.t('calls.cannotAccept'));
      cleanupCall();
    }
  }, [callState.remoteId, callState.offerProcessed, callState.isGroup,
    callState.conversationId, callState.callType, cleanupCall, clearPeerTimer, schedulePeerTimeout]);

  const endCall = useCallback(() => {
    const recipients = callState.isGroup ? callState.participantIds : [callState.remoteId];
    recipients.filter(Boolean).forEach(recipientId => {
      socketService.send('/app/webrtc/end', {
        type: 'CALL_END', userId: recipientId,
        data: { senderId: authApi.getCurrentUser()?.id },
        timestamp: new Date().toISOString(),
      });
    });

    const activeCallId = activeCallLogIdRef.current;
    const currentUserId = authApi.getCurrentUser()?.id;
    if (activeCallId && currentUserId) {
      callsApi.end(activeCallId, { userId: currentUserId }).catch(() => {});
    }
    cleanupCall();
  }, [callState.remoteId, callState.isGroup, callState.participantIds, cleanupCall]);

  const leaveCall = useCallback((transferToUserId?: string) => {
    const currentUserId = authApi.getCurrentUser()?.id;
    const activeCallId = activeCallLogIdRef.current;

    // Direct call: leave = end for both
    if (callState.callCategory === 'DIRECT') {
      endCall();
      return;
    }

    // Group call: just leave
    const recipients = callState.participantIds;
    recipients.filter(Boolean).forEach(recipientId => {
      socketService.send('/app/webrtc/end', {
        type: 'CALL_USER_LEFT', userId: recipientId,
        data: { senderId: currentUserId, callId: activeCallId },
        timestamp: new Date().toISOString(),
      });
    });

    if (activeCallId && currentUserId) {
      callsApi.leave(activeCallId, {
        userId: currentUserId,
        transferToUserId,
      }).catch(() => {});
    }
    cleanupCall();
  }, [callState.callCategory, callState.participantIds, endCall, cleanupCall]);

  const endCallForAll = useCallback(() => {
    const currentUserId = authApi.getCurrentUser()?.id;
    const activeCallId = activeCallLogIdRef.current;

    if (activeCallId && currentUserId) {
      callsApi.endAll(activeCallId, { userId: currentUserId }).catch(() => {});
    }
    endCall();
  }, [endCall]);

  const transferHost = useCallback((newHostId: string) => {
    const currentUserId = authApi.getCurrentUser()?.id;
    const activeCallId = activeCallLogIdRef.current;

    if (activeCallId && currentUserId) {
      callsApi.transferHost(activeCallId, {
        userId: currentUserId,
        transferToUserId: newHostId,
      }).catch(() => {});
    }
    setCallState(prev => ({ ...prev, hostId: newHostId }));
  }, []);

  const rejectCall = useCallback(() => {
    const recipients = callState.isGroup ? callState.participantIds : [callState.remoteId];
    recipients.filter(Boolean).forEach(recipientId => {
      socketService.send('/app/webrtc/reject', {
        type: 'CALL_REJECT', userId: recipientId,
        data: { senderId: authApi.getCurrentUser()?.id },
        timestamp: new Date().toISOString(),
      });
    });
    const activeCallId = activeCallLogIdRef.current;
    const currentUserId = authApi.getCurrentUser()?.id;
    if (activeCallId && currentUserId) {
      callsApi.missed(activeCallId, { userId: currentUserId }).catch(() => {});
      activeCallLogIdRef.current = null;
    }
    cleanupCall();
  }, [callState.remoteId, callState.isGroup, callState.participantIds, cleanupCall]);

  // ── Remote stream polling ──
  useEffect(() => {
    if (!callState.isActive) return;
    const interval = setInterval(() => {
      const remoteStream = webrtcService.getRemoteStream();
      const remoteStreams = Array.from(webrtcService.getRemoteStreams().entries()).map(
        ([peerId, stream]) => ({ peerId, stream })
      );
      if (remoteStream && remoteStream !== callState.remoteStream) {
        setCallState(prev => ({ ...prev, remoteStream, remoteStreams }));
      } else if (remoteStreams.length !== callState.remoteStreams.length) {
        setCallState(prev => ({ ...prev, remoteStreams }));
      }
    }, 500);
    return () => clearInterval(interval);
  }, [callState.isActive, callState.remoteStream, callState.remoteStreams.length]);

  const currentUser = authApi.getCurrentUser();

  return (
    <CallContext.Provider value={{
      callState, startCall, acceptCall, rejectCall,
      endCall, leaveCall, endCallForAll, transferHost,
    }}>
      {children}
      {callState.isActive && (
        <CallWindow
          isIncoming={callState.isIncoming}
          callerName={callState.remoteName}
          callType={callState.callType!}
          localStream={callState.localStream}
          remoteStream={callState.remoteStream}
          remoteStreams={callState.remoteStreams}
          isGroup={callState.isGroup}
          callCategory={callState.callCategory}
          hostId={callState.hostId}
          currentUserId={currentUser?.id || ''}
          activeParticipantIds={callState.activeParticipantIds}
          callToasts={callState.callToasts}
          onAccept={acceptCall}
          onReject={rejectCall}
          onEnd={endCall}
          onLeave={leaveCall}
          onEndAll={endCallForAll}
          onTransferHost={transferHost}
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
