import { useState, useRef, useEffect } from 'react';
import { X, Minimize2, Send, Phone, Video } from 'lucide-react';
import { useChatBox } from '../../contexts/ChatBoxContext';
import { useCall } from '../../contexts/CallContext';
import EmojiPicker from '../chat/EmojiPicker';
import { ImageUpload, VideoUpload } from '../chat/FileUpload';
import VoiceRecorder from '../chat/VoiceRecorder';
import type { ChatContact, ChatMessage } from '../../types/chat';

interface ChatBoxProps {
  contact: ChatContact;
  index: number;
}

export default function ChatBox({ contact, index }: ChatBoxProps) {
  const { closeChatBox, toggleMinimize, minimizedBoxes, messages, sendMessage } = useChatBox();
  const { startCall } = useCall();
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMinimized = minimizedBoxes.has(contact.id);
  const contactMessages = messages[contact.id] || [];

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
      const messageContent = file.type.startsWith('image/') ? '📷 Đã gửi ảnh' : 
                            file.type.startsWith('video/') ? '🎥 Đã gửi video' : 
                            `📎 ${file.name}`;
      
      await sendMessage(contact.id, `${messageContent}\n${uploadResult.url}`);
      
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error('❌ Failed to upload file:', error);
      alert('Lỗi khi upload file. Vui lòng thử lại!');
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
      await sendMessage(contact.id, `🎤 Tin nhắn thoại\n${uploadResult.url}`);
      
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error('❌ Failed to upload voice message:', error);
      alert('Lỗi khi gửi tin nhắn thoại. Vui lòng thử lại!');
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

  if (isMinimized) {
    const minimizedWidth = 260;
    const minimizedGap = 16;
    const rightPosition = index * (minimizedWidth + minimizedGap);
    
    return (
      <div
        className="fixed bottom-0 bg-white rounded-t-xl shadow-xl border border-gray-200 cursor-pointer transition-all duration-300 z-50"
        style={{
          right: `${rightPosition}px`,
          width: `${minimizedWidth}px`,
        }}
        onClick={() => toggleMinimize(contact.id)}
      >
        <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-100 hover:bg-gray-50">
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm"
              style={{ backgroundColor: contact.color }}
            >
              {contact.avatar}
            </div>
            {contact.online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{contact.name}</p>
            {contactMessages.length > 0 && (
              <p className="text-xs text-gray-500 truncate">
                {contactMessages[contactMessages.length - 1].content}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const boxWidth = 340;
  const boxGap = 16;
  const rightPosition = index * (boxWidth + boxGap);
  
  return (
    <div
      className="fixed bottom-0 bg-white rounded-t-xl shadow-xl border border-gray-200 flex flex-col transition-all duration-300 z-50"
      style={{
        right: `${rightPosition}px`,
        width: `${boxWidth}px`,
        height: '520px',
        maxHeight: '80vh',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm"
              style={{ backgroundColor: contact.color }}
            >
              {contact.avatar}
            </div>
            {contact.online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{contact.name}</p>
            <p className="text-xs text-gray-500">{contact.online ? 'Đang hoạt động' : 'Offline'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => startCall(contact.userId, contact.name, 'voice')}
            className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
            title="Gọi thoại"
          >
            <Phone className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button
            onClick={() => startCall(contact.userId, contact.name, 'video')}
            className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
            title="Gọi video"
          >
            <Video className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button
            onClick={() => toggleMinimize(contact.id)}
            className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
            title="Thu gọn"
          >
            <Minimize2 className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button
            onClick={() => closeChatBox(contact.id)}
            className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
            title="Đóng"
          >
            <X className="w-3.5 h-3.5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {contactMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.isMe ? 'flex-row-reverse' : ''}`}
          >
            {!msg.isMe && (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0 shadow-sm"
                style={{ backgroundColor: contact.color }}
              >
                {contact.avatar}
              </div>
            )}
            <div className={`max-w-[75%] ${msg.isMe ? 'text-right' : ''}`}>
              {/* Attachments */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mb-2 space-y-2">
                  {msg.attachments.map((attachment, idx) => (
                    <div key={idx} className="rounded-xl overflow-hidden shadow-sm max-w-xs">
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
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
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
                className={`rounded-xl px-3 py-2 mb-1 shadow-sm ${
                  msg.isMe
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-900 border border-gray-100'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              </div>
              <p className="text-xs text-gray-500 px-1.5">{msg.time}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-gray-200 bg-white rounded-b-xl">
        <div className="flex items-end gap-2">
          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            <ImageUpload onFileSelect={handleFileSelect} />
            <VideoUpload onFileSelect={handleFileSelect} />
            <VoiceRecorder onRecordingComplete={handleVoiceRecording} />
          </div>

          {/* Message Input */}
          <div className="flex-1">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nhắn tin..."
              className="w-full px-3 py-2 bg-gray-100 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-24 text-sm"
              rows={1}
              disabled={sending}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!messageInput.trim() || sending}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

