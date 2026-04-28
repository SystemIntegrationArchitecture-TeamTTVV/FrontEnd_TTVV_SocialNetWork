import { useState, useRef, useEffect } from 'react';
import { X, Minimize2, Send, Phone, Video } from 'lucide-react';
import { useChatBox } from '../../contexts/ChatBoxContext';
import { useCall } from '../../contexts/CallContext';
import EmojiPicker from '../chat/EmojiPicker';
import { ImageUpload, VideoUpload } from '../chat/FileUpload';
import VoiceRecorder from '../chat/VoiceRecorder';
import type { ChatContact } from '../../types/chat';
import { useMessages } from '../../hooks/useMessages';
import { useTranslation } from 'react-i18next';
import { notify } from '../../services/notify';
interface ChatBoxProps {
  contact: ChatContact;
  index: number;
}

/* ── ChatBox positioning ── */
const CHATBOX_GAP = 16;

export default function ChatBox({ contact, index }: ChatBoxProps) {
  const { t } = useTranslation();
  const { closeChatBox, toggleMinimize, minimizedBoxes, messages, sendMessage } = useChatBox();
  const { startCall } = useCall();
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMinimized = minimizedBoxes.has(contact.id);
  const contactMessages = messages[contact.id] || [];
  const { loadConversations } = useMessages();
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom();
    }
  }, [contactMessages, isMinimized]);

  const handleSend = async () => {
    if (!messageInput.trim() || sending) return;

    try {
      setSending(true);
      await sendMessage(contact.id, messageInput);
      await loadConversations();
      setMessageInput('');
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
  };

  const handleFileSelect = async (file: File) => {
    try {
      setSending(true);
      console.log('📤 Uploading file:', file.name, file.type, file.size);

      // Upload file to server
      const { uploadApi } = await import('../../apis/upload');
      const uploadResult = await uploadApi.uploadFile(file);
      console.log('✅ File uploaded successfully:', uploadResult);

      // Send message with file info
      const messageContent = file.type.startsWith('image/') ? t('chatBox.sentImage') :
        file.type.startsWith('video/') ? t('chatBox.sentVideo') :
          `📎 ${file.name}`;

      await sendMessage(contact.id, `${messageContent}\n${uploadResult.url}`);

      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error('❌ Failed to upload file:', error);
      notify.error(t('chatBox.uploadError'));
    } finally {
      setSending(false);
    }
  };

  const handleVoiceRecording = async (blob: Blob) => {
    try {
      setSending(true);
      console.log('🎤 Uploading voice message:', blob.size, 'bytes');

      // Convert blob to file
      const voiceFile = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });

      // Upload voice file
      const { uploadApi } = await import('../../apis/upload');
      const uploadResult = await uploadApi.uploadFile(voiceFile);
      console.log('✅ Voice message uploaded successfully:', uploadResult);

      // Send message with voice file
      await sendMessage(contact.id, `${t('chatBox.voiceMessage')}\n${uploadResult.url}`);

      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error('❌ Failed to upload voice message:', error);
      notify.error(t('chatBox.voiceSendError'));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Calculate position ── */
  const boxWidth = isMinimized ? 260 : 340;
  const rightPos = index * (boxWidth + CHATBOX_GAP);

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-0 bg-white dark:bg-[#1a1d28] rounded-t-xl shadow-lg border border-[#e4e6eb] dark:border-[#2b2f45] cursor-pointer transition-all duration-200 z-50 hover:shadow-xl"
        style={{ right: `${rightPos}px`, width: `${boxWidth}px` }}
        onClick={() => toggleMinimize(contact.id)}
      >
        <div className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#f0f2f5] dark:hover:bg-[#22263a] rounded-t-xl transition-colors">
          <div className="relative">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm"
              style={{ backgroundColor: contact.color }}
            >
              {contact.avatar}
            </div>
            {contact.online && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#1a1d28]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#050505] dark:text-[#edf0fa] text-sm truncate">{contact.name}</p>
            {contactMessages.length > 0 && (
              <p className="text-xs text-[#65676b] dark:text-[#7e89a6] truncate">
                {contactMessages[contactMessages.length - 1].content}
              </p>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); closeChatBox(contact.id); }}
            className="w-6 h-6 rounded-full hover:bg-gray-200 dark:hover:bg-[#2b2f45] flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="w-3 h-3 text-[#65676b] dark:text-[#7e89a6]" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-0 bg-white dark:bg-[#1a1d28] rounded-t-xl shadow-xl border border-[#e4e6eb] dark:border-[#2b2f45] flex flex-col transition-all duration-200 z-50"
      style={{
        right: `${rightPos}px`,
        width: `${boxWidth}px`,
        height: '460px',
        maxHeight: '75vh',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#e4e6eb] dark:border-[#2b2f45] bg-white dark:bg-[#1a1d28] rounded-t-xl shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-sm"
              style={{ backgroundColor: contact.color }}
            >
              {contact.avatar}
            </div>
            {contact.online && (
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-[#1a1d28]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#050505] dark:text-[#edf0fa] text-[13px] truncate leading-tight">{contact.name}</p>
            <p className="text-[11px] text-[#65676b] dark:text-[#7e89a6] leading-tight">{contact.online ? t('chatBox.activeNow') : t('chatBox.offline')}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => contact.userId && startCall(contact.userId, contact.name, 'voice')}
            disabled={!contact.userId}
            className="w-7 h-7 rounded-full hover:bg-[#f0f2f5] dark:hover:bg-[#22263a] flex items-center justify-center transition-colors disabled:opacity-40"
            title={t('chatBox.voiceCall')}
          >
            <Phone className="w-3.5 h-3.5 text-[#1877F2]" />
          </button>
          <button
            onClick={() => contact.userId && startCall(contact.userId, contact.name, 'video')}
            disabled={!contact.userId}
            className="w-7 h-7 rounded-full hover:bg-[#f0f2f5] dark:hover:bg-[#22263a] flex items-center justify-center transition-colors disabled:opacity-40"
            title={t('chatBox.videoCall')}
          >
            <Video className="w-3.5 h-3.5 text-[#1877F2]" />
          </button>
          <button
            onClick={() => toggleMinimize(contact.id)}
            className="w-7 h-7 rounded-full hover:bg-[#f0f2f5] dark:hover:bg-[#22263a] flex items-center justify-center transition-colors"
            title={t('chatBox.minimize')}
          >
            <Minimize2 className="w-3.5 h-3.5 text-[#65676b] dark:text-[#7e89a6]" />
          </button>
          <button
            onClick={() => closeChatBox(contact.id)}
            className="w-7 h-7 rounded-full hover:bg-[#f0f2f5] dark:hover:bg-[#22263a] flex items-center justify-center transition-colors"
            title={t('common.close')}
          >
            <X className="w-3.5 h-3.5 text-[#65676b] dark:text-[#7e89a6]" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#f0f2f5] dark:bg-[#0c0e14]">
        {contactMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg mb-3"
              style={{ backgroundColor: contact.color }}
            >
              {contact.avatar}
            </div>
            <p className="text-sm font-semibold text-[#050505] dark:text-[#edf0fa]">{contact.name}</p>
            <p className="text-xs text-[#65676b] dark:text-[#7e89a6] mt-1">Bắt đầu cuộc trò chuyện</p>
          </div>
        )}
        {contactMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-1.5 ${msg.isMe ? 'flex-row-reverse' : ''}`}
          >
            {!msg.isMe && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold text-[10px] shrink-0 shadow-sm"
                style={{ backgroundColor: contact.color }}
              >
                {contact.avatar}
              </div>
            )}
            <div className={`max-w-[78%] ${msg.isMe ? 'text-right' : ''}`}>
              {/* Attachments */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mb-1.5 space-y-1.5">
                  {msg.attachments.map((attachment, idx) => (
                    <div key={idx} className="rounded-xl overflow-hidden shadow-sm max-w-[220px]">
                      {attachment.type === 'image' && (
                        <img
                          src={attachment.url}
                          alt={attachment.fileName}
                          className="w-full h-auto rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      )}
                      {attachment.type === 'video' && (
                        <video
                          src={attachment.url}
                          controls
                          className="w-full h-auto rounded-xl cursor-pointer"
                        />
                      )}
                      {attachment.type === 'file' && (
                        <a
                          href={attachment.url}
                          download
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1a1d28] border border-[#e4e6eb] dark:border-[#2b2f45] rounded-xl hover:bg-[#f0f2f5] dark:hover:bg-[#22263a] transition-colors text-sm"
                        >
                          <span>📎 {attachment.fileName}</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Message Content */}
              <div
                className={`rounded-2xl px-3 py-2 shadow-sm inline-block text-left ${msg.isMe
                    ? 'bg-[#1877F2] text-white'
                    : 'bg-white dark:bg-[#22263a] text-[#050505] dark:text-[#edf0fa] border border-[#e4e6eb] dark:border-[#2b2f45]'
                  }`}
              >
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed break-words">{msg.content}</p>
              </div>
              <p className="text-[10px] text-[#65676b] dark:text-[#7e89a6] mt-0.5 px-1">{msg.time}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-3 py-2 border-t border-[#e4e6eb] dark:border-[#2b2f45] bg-white dark:bg-[#1a1d28] rounded-b-xl shrink-0">
        {/* Action row */}
        <div className="flex items-center gap-0.5 mb-1.5">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          <ImageUpload onFileSelect={handleFileSelect} />
          <VideoUpload onFileSelect={handleFileSelect} />
          <VoiceRecorder onRecordingComplete={handleVoiceRecording} />
        </div>
        {/* Input + Send */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={t('chatBox.messagePlaceholder')}
              className="w-full px-3 py-2 bg-[#f0f2f5] dark:bg-[#22263a] border border-[#e4e6eb] dark:border-[#2b2f45] rounded-full resize-none focus:outline-none focus:border-[#1877F2] max-h-20 text-[13px] text-[#050505] dark:text-[#edf0fa] placeholder-[#65676b] dark:placeholder-[#7e89a6]"
              rows={1}
              disabled={sending}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!messageInput.trim() || sending}
            className="w-8 h-8 bg-[#1877F2] text-white rounded-full hover:bg-[#1664d9] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
