import { useState, useRef } from 'react';
import { notify } from '../../../services/notify';
import { useTranslation } from 'react-i18next';

interface UseVoiceRecordingProps {
  onSendVoice: (blob: Blob) => Promise<void>;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}

export function useVoiceRecording({ onSendVoice, setMessage }: UseVoiceRecordingProps) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showVoicePreview, setShowVoicePreview] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  
  const voiceTranscriptRef = useRef('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  const handleVoiceRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      recognitionRef.current?.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      return;
    }

    try {
      voiceTranscriptRef.current = '';
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (blob.size > 0) {
          setVoiceBlob(blob);
          setShowVoicePreview(true);
        }
        setRecordingDuration(0);
      };

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'vi-VN';
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.onresult = (event: any) => {
          let text = '';
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
          }
          voiceTranscriptRef.current = text;
        };
        recognition.onerror = () => {};
        recognition.start();
      }

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      notify.error(t('messenger.errors.voiceMessage'));
    }
  };

  const handleVoiceSendAudio = async () => {
    if (voiceBlob) {
      await onSendVoice(voiceBlob);
    }
    setShowVoicePreview(false);
    setVoiceBlob(null);
    voiceTranscriptRef.current = '';
  };

  const handleVoiceConvertToText = () => {
    const text = voiceTranscriptRef.current.trim();
    if (text) {
      setMessage((prev) => (prev ? prev + ' ' : '') + text);
    } else {
      notify.error('Khong nhan dien duoc giong noi. Hay thu lai.');
    }
    setShowVoicePreview(false);
    setVoiceBlob(null);
    voiceTranscriptRef.current = '';
  };

  const handleVoiceCancel = () => {
    setShowVoicePreview(false);
    setVoiceBlob(null);
    voiceTranscriptRef.current = '';
  };

  return {
    isRecording,
    recordingDuration,
    showVoicePreview,
    voiceTranscriptRef,
    handleVoiceRecord,
    handleVoiceSendAudio,
    handleVoiceConvertToText,
    handleVoiceCancel,
  };
}
