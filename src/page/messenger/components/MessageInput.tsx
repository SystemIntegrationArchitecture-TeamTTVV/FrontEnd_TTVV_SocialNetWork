// ─── MessageInput — full input area for Messenger chat ──────────────────
import { useRef, type RefObject, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Send, Smile, Mic, Grid3X3, BarChart3, Calendar,
  X, FileText, Video, Music, Sparkles, Reply,
} from 'lucide-react';
import EmojiPicker from '../../../components/chat/EmojiPicker';
import StickerPanel from '../shared/StickerPanel';
import AttachmentMenu from '../shared/AttachmentMenu';
import VoiceRecorder from '../shared/VoiceRecorder';

interface MessageInputProps {
  // Core
  message: string;
  onMessageChange: (v: string) => void;
  onSend: () => void;
  editingMessageId: string | null;
  isAIChat: boolean;
  isAiLoading: boolean;
  // File upload
  uploadingFiles: boolean;
  filePreview: { preview: string; file: File } | null;
  onClearFilePreview: () => void;
  uploadedFiles: File[];
  onSetUploadedFiles: (files: File[] | ((prev: File[]) => File[])) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  // Attachment menu
  showAttachmentMenu: boolean;
  onToggleAttachmentMenu: () => void;
  onShareLocation: () => void;
  onShareContact: () => void;
  // Sticker
  showStickerPanel: boolean;
  onToggleStickerPanel: () => void;
  activeStickerTopic: string;
  onStickerTopicChange: (v: string) => void;
  onSendSticker: (sticker: string) => void;
  // Emoji
  showEmojiPicker: boolean;
  onToggleEmojiPicker: () => void;
  onEmojiSelect: (emoji: string) => void;
  // Voice
  showVoicePreview: boolean;
  voiceTranscript: string | null;
  onVoiceSendAudio: () => void;
  onVoiceConvertToText: () => void;
  onVoiceCancel: () => void;
  isRecording: boolean;
  recordingDuration: number;
  onVoiceRecord: () => void;
  // AI
  onGenerateDailySummary?: (prompt: string) => void;
  // Reply
  replyTo: { sender: string; content: string } | null;
  onCancelReply?: () => void;
  // Poll
  onOpenPollModal?: () => void;
  // Appointment
  onOpenAppointmentModal?: () => void;
  isGroup?: boolean;
  // Permission
  canSend?: boolean;
  sendBlockedReason?: string;
}

export default function MessageInput({
  message,
  onMessageChange,
  onSend,
  editingMessageId,
  isAIChat,
  isAiLoading,
  uploadingFiles,
  filePreview,
  onClearFilePreview,
  uploadedFiles,
  onSetUploadedFiles,
  fileInputRef,
  onFileUpload,
  showAttachmentMenu,
  onToggleAttachmentMenu,
  onShareLocation,
  onShareContact,
  showStickerPanel,
  onToggleStickerPanel,
  activeStickerTopic,
  onStickerTopicChange,
  onSendSticker,
  showEmojiPicker,
  onToggleEmojiPicker,
  onEmojiSelect,
  showVoicePreview,
  voiceTranscript,
  onVoiceSendAudio,
  onVoiceConvertToText,
  onVoiceCancel,
  isRecording,
  recordingDuration,
  onVoiceRecord,
  onGenerateDailySummary,
  replyTo,
  onCancelReply,
  onOpenPollModal,
  onOpenAppointmentModal,
  isGroup,
  canSend = true,
  sendBlockedReason,
}: MessageInputProps) {
  const { t } = useTranslation();

  if (!canSend) {
    return (
      <div className="border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white px-4 py-4 flex flex-col items-center gap-2">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <rect x="3" y="11" width="18" height="11" rx="2" strokeLinecap="round" strokeLinejoin="round" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-500 text-center leading-snug">
          {sendBlockedReason || 'Chỉ trưởng nhóm và phó nhóm mới được gửi tin nhắn'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 lg:p-5 border-t border-gray-100 bg-white">
      {/* AI Quick Actions */}
      {isAIChat && onGenerateDailySummary && (
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            onClick={() => onGenerateDailySummary(t('messenger.aiAssistant.summaryQuickPrompt'))}
            disabled={isAiLoading}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium"
            title={t('messenger.aiAssistant.summarizeToday')}
          >
            <Sparkles className="w-4 h-4" />
            {t('messenger.aiAssistant.summarizeToday')}
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {uploadingFiles && (
        <div className="mb-3 flex items-center gap-2 text-sm text-blue-600">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>{t('messenger.uploadingFiles')}</span>
        </div>
      )}

      {/* File Preview */}
      {filePreview && (
        <div className="mb-3 relative inline-block">
          <img 
            src={filePreview.preview} 
            alt="Preview" 
            className="max-w-xs max-h-40 rounded-lg shadow-sm"
          />
          <button
            onClick={onClearFilePreview}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="mb-2 md:mb-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">
              {uploadedFiles.length} {uploadedFiles.length === 1 ? 'tệp' : 'tệp'} đã chọn
            </span>
            <button
              onClick={() => onSetUploadedFiles([])}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Xóa tất cả
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {uploadedFiles.map((file, idx) => (
              <div key={idx} className="relative shrink-0 group/file">
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover border border-gray-200"
                    onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                  />
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-gray-100 flex flex-col items-center justify-center border border-gray-200">
                    {file.type.startsWith('video/') ? (
                      <Video className="w-5 h-5 text-green-500" />
                    ) : file.type.startsWith('audio/') ? (
                      <Music className="w-5 h-5 text-pink-500" />
                    ) : (
                      <FileText className="w-5 h-5 text-purple-500" />
                    )}
                    <span className="text-[9px] text-gray-400 mt-0.5">
                      {file.name.split('.').pop()?.toUpperCase()}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => onSetUploadedFiles((prev: File[]) => prev.filter((_, i) => i !== idx))}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover/file:opacity-100"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
                <p className="text-[10px] text-gray-500 mt-0.5 truncate w-16 md:w-20 text-center">{file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachment Menu */}
      {showAttachmentMenu && (
        <AttachmentMenu
          fileInputRef={fileInputRef}
          onFileUpload={onFileUpload}
          onShareLocation={onShareLocation}
          onShareContact={onShareContact}
        />
      )}

      {/* Sticker Panel */}
      {showStickerPanel && (
        <StickerPanel
          activeTopic={activeStickerTopic}
          onTopicChange={onStickerTopicChange}
          onSendSticker={onSendSticker}
        />
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <EmojiPicker
          onEmojiSelect={onEmojiSelect}
        />
      )}

      {/* Voice Preview */}
      {showVoicePreview && (
        <VoiceRecorder
          transcript={voiceTranscript}
          onSendAudio={onVoiceSendAudio}
          onConvertToText={onVoiceConvertToText}
          onCancel={onVoiceCancel}
        />
      )}

      {/* Reply Preview */}
      {replyTo && (
        <div className="mb-3 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border-l-4 border-blue-500 flex items-center gap-3 relative animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Reply className="w-3 h-3 text-blue-600" />
              <p className="text-[11px] font-bold text-blue-600 uppercase tracking-tight">
                {t('messenger.replyingTo', { sender: replyTo.sender })}
              </p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 truncate leading-relaxed">
              {replyTo.content}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="w-7 h-7 rounded-full hover:bg-white dark:hover:bg-gray-800 shadow-sm flex items-center justify-center transition-all group"
            title={t('common.cancel')}
          >
            <X className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 md:gap-2.5">
        <button 
          onClick={onToggleAttachmentMenu}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
            showAttachmentMenu ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title={t('messenger.attachmentsTitle')}
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onToggleStickerPanel}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
            showStickerPanel ? 'text-pink-600 bg-pink-50' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="Nhan dan"
        >
          <Grid3X3 className="w-5 h-5" />
        </button>
        {isGroup && (
          <>
            <button
              type="button"
              onClick={onOpenPollModal}
              className="w-8 h-8 rounded-full flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0"
              title="Tạo bình chọn"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onOpenAppointmentModal}
              className="w-8 h-8 rounded-full flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors shrink-0"
              title="Lên lịch hẹn"
            >
              <Calendar className="w-5 h-5" />
            </button>
          </>
        )}
        <input
          type="text"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={isRecording ? 'Dang ghi am...' : editingMessageId ? 'Chinh sua tin nhan...' : replyTo ? t('messenger.replyingTo', { sender: replyTo.sender }) : t('messenger.typeMessagePlaceholder')}
          className={`flex-1 h-10 px-4 rounded-full border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:bg-white dark:focus:bg-[#1a1d28] text-sm transition-all dark:text-gray-100 dark:placeholder:text-gray-500 ${
            isRecording ? 'bg-red-50 ring-2 ring-red-200' : 'bg-gray-100/70 dark:bg-[#22263a]/60'
          }`}
        />

        {/* Recording indicator */}
        {isRecording && (
          <div className="flex items-center gap-1.5 px-2 shrink-0">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-600 font-mono font-medium tabular-nums">
              {Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:{(recordingDuration % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Mic button */}
        <button
          onClick={onVoiceRecord}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
            isRecording ? 'text-red-600 bg-red-100 animate-pulse' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title={isRecording ? 'Dung ghi am' : 'Ghi am giong noi'}
          disabled={uploadingFiles}
        >
          <Mic className="w-4 h-4" />
        </button>

        <button 
          onClick={onToggleEmojiPicker}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
            showEmojiPicker ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title={t('messenger.emojiPicker.title')}
          disabled={uploadingFiles}
        >
          <Smile className="w-5 h-5" />
        </button>
        <button
          onClick={onSend}
          disabled={uploadingFiles || isAiLoading || (isAIChat && !message.trim()) || (!message.trim() && !filePreview)}
          className="w-8 h-8 rounded-full text-gray-600 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          title={editingMessageId ? 'Cap nhat tin nhan' : t('messenger.send')}
        >
          {isAiLoading ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
