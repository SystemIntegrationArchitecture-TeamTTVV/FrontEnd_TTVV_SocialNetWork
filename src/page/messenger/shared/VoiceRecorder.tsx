// ─── VoiceRecorder — voice recording preview with send/convert/cancel ───
import { Mic, Send, FileText, X } from 'lucide-react';

interface VoiceRecorderProps {
  transcript?: string | null;
  onSendAudio: () => void;
  onConvertToText: () => void;
  onCancel: () => void;
}

export default function VoiceRecorder({
  transcript,
  onSendAudio,
  onConvertToText,
  onCancel,
}: VoiceRecorderProps) {
  return (
    <div className="mb-2 p-3 bg-white rounded-xl border border-gray-200 shadow-md flex items-center gap-3">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <Mic className="w-4 h-4 text-blue-600" />
        </div>
        <span className="text-sm text-gray-700 font-medium truncate">
          {transcript ? transcript.substring(0, 50) + (transcript.length > 50 ? '...' : '') : 'Da ghi am xong'}
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onSendAudio}
          className="px-3 h-8 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition-colors flex items-center gap-1.5"
          title="Gui tin nhan thoai"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Gui am</span>
        </button>
        <button
          onClick={onConvertToText}
          className="px-3 h-8 rounded-lg bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors flex items-center gap-1.5"
          title="Chuyen thanh van ban"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Chuyen chu</span>
        </button>
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors flex items-center justify-center"
          title="Huy"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
