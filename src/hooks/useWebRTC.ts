import { useRef, useEffect, useState, useCallback } from 'react';
import { socketService } from '../services/socket';
import type { SocketEvent } from '../services/socket';

interface WebRTCCallData {
  callerId: string;
  calleeId: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  iceCandidate?: RTCIceCandidateInit;
}

interface UseWebRTCOptions {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onCallReject?: () => void;
}

export function useWebRTC({
  localVideoRef,
  remoteVideoRef,
  onCallStart,
  onCallEnd,
  onCallReject,
}: UseWebRTCOptions) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [callType, setCallType] = useState<'video' | 'audio'>('video');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const currentCallerRef = useRef<string | null>(null);
  const currentCalleeRef = useRef<string | null>(null);

  // Initialize peer connection with STUN servers
  const createPeerConnection = useCallback(() => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && currentCalleeRef.current) {
        const callData: WebRTCCallData = {
          callerId: currentCallerRef.current || '',
          calleeId: currentCalleeRef.current,
          iceCandidate: event.candidate.toJSON(),
        };

        socketService.send('/app/webrtc/ice-candidate', {
          type: 'CALL_ICE_CANDIDATE',
          userId: currentCalleeRef.current,
          data: callData,
          timestamp: new Date().toISOString(),
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      if (event.streams[0] && remoteVideoRef.current) {
        setRemoteStream(event.streams[0]);
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        endCall();
      }
    };

    return pc;
  }, [remoteVideoRef]);

  // Get user media (camera/microphone)
  const getUserMedia = useCallback(async (type: 'video' | 'audio' = 'video') => {
    try {
      const constraints: MediaStreamConstraints = {
        video: type === 'video' ? true : false,
        audio: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Add tracks to peer connection
      if (peerConnectionRef.current) {
        stream.getTracks().forEach((track) => {
          peerConnectionRef.current?.addTrack(track, stream);
        });
      }

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }, [localVideoRef]);

  // Start a call
  const startCall = useCallback(async (calleeId: string, type: 'video' | 'audio' = 'video') => {
    try {
      setIsCalling(true);
      setCallType(type);
      currentCalleeRef.current = calleeId;

      // Get local media
      await getUserMedia(type);

      // Create peer connection
      const pc = createPeerConnection();

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer through WebSocket
      const callData: WebRTCCallData = {
        callerId: currentCallerRef.current || '',
        calleeId,
        offer,
      };

      socketService.send('/app/webrtc/offer', {
        type: 'CALL_OFFER',
        userId: calleeId,
        data: callData,
        timestamp: new Date().toISOString(),
      });

      onCallStart?.();
    } catch (error) {
      console.error('Error starting call:', error);
      setIsCalling(false);
      throw error;
    }
  }, [getUserMedia, createPeerConnection, onCallStart]);

  // Answer a call
  const answerCall = useCallback(async () => {
    try {
      setIsIncomingCall(false);
      setIsCallActive(true);

      // Get local media
      await getUserMedia(callType);

      // Create peer connection
      const pc = createPeerConnection();

      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send answer through WebSocket
      if (currentCallerRef.current) {
        const callData: WebRTCCallData = {
          callerId: currentCallerRef.current,
          calleeId: currentCalleeRef.current || '',
          answer,
        };

        socketService.send('/app/webrtc/answer', {
          type: 'CALL_ANSWER',
          userId: currentCallerRef.current,
          data: callData,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error answering call:', error);
      rejectCall();
      throw error;
    }
  }, [getUserMedia, createPeerConnection, callType]);

  // Reject a call
  const rejectCall = useCallback(() => {
    if (currentCallerRef.current) {
      const callData: WebRTCCallData = {
        callerId: currentCallerRef.current,
        calleeId: currentCalleeRef.current || '',
      };

      socketService.send('/app/webrtc/reject', {
        type: 'CALL_REJECT',
        userId: currentCallerRef.current,
        data: callData,
        timestamp: new Date().toISOString(),
      });
    }

    setIsIncomingCall(false);
    setIsCalling(false);
    onCallReject?.();
  }, [onCallReject]);

  // End a call
  const endCall = useCallback(() => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear video refs
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Send end signal
    if (currentCalleeRef.current || currentCallerRef.current) {
      const callData: WebRTCCallData = {
        callerId: currentCallerRef.current || '',
        calleeId: currentCalleeRef.current || '',
      };

      socketService.send('/app/webrtc/end', {
        type: 'CALL_END',
        userId: currentCalleeRef.current || currentCallerRef.current || '',
        data: callData,
        timestamp: new Date().toISOString(),
      });
    }

    setIsCallActive(false);
    setIsCalling(false);
    setIsIncomingCall(false);
    currentCallerRef.current = null;
    currentCalleeRef.current = null;
    setRemoteStream(null);
    onCallEnd?.();
  }, [localStream, localVideoRef, remoteVideoRef, onCallEnd]);

  // Toggle audio/video
  const toggleAudio = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
  }, [localStream]);

  // Listen to WebRTC signaling messages
  useEffect(() => {
    const handleWebRTCEvent = (event: SocketEvent) => {
      const data = event.data as WebRTCCallData;

      switch (event.type) {
        case 'CALL_OFFER': {
          setIsIncomingCall(true);
          currentCallerRef.current = data.callerId;
          currentCalleeRef.current = data.calleeId;

          // Set remote description
          if (data.offer && peerConnectionRef.current) {
            peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
          } else {
            // Create new peer connection for incoming call
            const pc = createPeerConnection();
            if (data.offer) {
              pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            }
          }
          break;
        }

        case 'CALL_ANSWER': {
          setIsCalling(false);
          setIsCallActive(true);

          // Set remote description
          if (data.answer && peerConnectionRef.current) {
            peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
          break;
        }

        case 'CALL_ICE_CANDIDATE': {
          // Add ICE candidate
          if (data.iceCandidate && peerConnectionRef.current) {
            peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.iceCandidate));
          }
          break;
        }

        case 'CALL_REJECT': {
          setIsCalling(false);
          setIsIncomingCall(false);
          endCall();
          onCallReject?.();
          break;
        }

        case 'CALL_END': {
          endCall();
          break;
        }
      }
    };

    const unsubscribe = socketService.on('CALL_OFFER', handleWebRTCEvent);
    const unsubscribe2 = socketService.on('CALL_ANSWER', handleWebRTCEvent);
    const unsubscribe3 = socketService.on('CALL_ICE_CANDIDATE', handleWebRTCEvent);
    const unsubscribe4 = socketService.on('CALL_REJECT', handleWebRTCEvent);
    const unsubscribe5 = socketService.on('CALL_END', handleWebRTCEvent);

    // Also listen to wildcard for debugging
    const unsubscribeWildcard = socketService.on('*', (event) => {
      if (event.type.startsWith('CALL_')) {
        handleWebRTCEvent(event);
      }
    });

    return () => {
      unsubscribe();
      unsubscribe2();
      unsubscribe3();
      unsubscribe4();
      unsubscribe5();
      unsubscribeWildcard();
    };
  }, [createPeerConnection, endCall, onCallReject]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    isCallActive,
    isCalling,
    isIncomingCall,
    callType,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    localStream,
    remoteStream,
  };
}

