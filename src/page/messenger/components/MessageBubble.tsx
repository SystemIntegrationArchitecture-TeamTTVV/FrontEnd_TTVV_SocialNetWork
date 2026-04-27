// ─── MessageBubble — single message rendering ──────────────────────────
// Extracted from Messenger.tsx lines 2178–2510

import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MoreVertical, Reply, Forward, Copy, Pin, Star,
  Pencil, Trash2, Check, CheckCheck, Plus, Mic, FileText, Bot,
} from 'lucide-react';
import { REACTIONS } from '../../../components/chat/ReactionIcons';
import type { DisplayMessage } from '../../../hooks/useMessages';
import { hashColor } from '../shared/messengerUtils';

export interface MessageBubbleProps {
  msg: DisplayMessage;
  isSelected: boolean;
  isGroupChat: boolean;
  canRecall: boolean;
  selectedMessage: string | null;
  menuPosition: { top: number; left?: number; right?: number } | null;
  onSelectMessage: (id: string | null) => void;
  onSetMenuPosition: (pos: { top: number; left?: number; right?: number } | null) => void;
  onMessageAction: (action: string, messageId: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
}

export default function MessageBubble({
  msg,
  isSelected,
  isGroupChat,
  canRecall,
  selectedMessage,
  menuPosition,
  onSelectMessage,
  onSetMenuPosition,
  onMessageAction,
  onReaction,
}: MessageBubbleProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const legacyContactName = msg.content.startsWith('[Contact]')
    ? msg.content.replace('[Contact]', '').trim()
    : '';
  const toContactUserId = (url?: string) => {
    if (!url || !url.startsWith('user:')) return null;
    const id = url.slice(5).trim();
    return id || null;
  };

  return (
    <div
      id={`msg-${msg.id}`}
      className={`group flex items-end gap-2 ${msg.isMe ? 'flex-row-reverse' : ''} transition-all duration-300`}
    >
      {!msg.isMe && (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            msg.senderId === 'ai'
              ? 'bg-gradient-to-br from-blue-500 to-blue-600'
              : 'cursor-pointer'
          }`}
          style={msg.senderId !== 'ai' ? { backgroundColor: hashColor(msg.senderId || 'u') } : undefined}
          onClick={msg.senderId === 'ai' ? undefined : () => navigate(`/profile/${msg.senderId}`)}
        >
          {msg.senderId === 'ai' ? (
            <Bot className="w-4 h-4 text-white" />
          ) : (
            <span className="text-white font-semibold text-xs">{msg.sender.charAt(0)}</span>
          )}
        </div>
      )}
      <div className={`max-w-[70%] relative ${msg.isMe ? 'text-right' : ''}`}>
        {/* Sender name for incoming messages (group + direct) */}
        {!msg.isMe && (
          <p className="text-[11px] font-medium text-gray-400 mb-0.5 ml-1">{msg.sender}</p>
        )}
        {/* Reply To */}
        {msg.replyTo && (
          <div className="mb-1 p-2 rounded-lg bg-gray-100 border-l-3 border-blue-400 text-left">
            <p className="text-[11px] font-semibold text-gray-500">{msg.replyTo.sender}</p>
            <p className="text-xs text-gray-600 line-clamp-1">{msg.replyTo.content}</p>
          </div>
        )}

        {/* Pinned Badge */}
        {msg.pinned && (
          <div className="mb-1 flex items-center gap-1 text-[11px] text-gray-400">
            <Pin className="w-3 h-3" />
            <span>{t('messenger.messageOptions.pinned')}</span>
          </div>
        )}

        {/* Attachments */}
        {msg.attachments && msg.attachments.length > 0 && (() => {
          const images = msg.attachments!.filter(a => a.type === 'image');
          const others = msg.attachments!.filter(a => a.type !== 'image');
          return (
            <div className="mb-1 space-y-1">
              {/* Image grid */}
              {images.length === 1 && (
                <div className="max-w-[240px] rounded-2xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                  <img
                    src={images[0].url}
                    alt={images[0].fileName || t('messenger.attachment.imageAlt')}
                    className="w-full h-auto"
                    onClick={() => window.open(images[0].url, '_blank')}
                  />
                </div>
              )}
              {images.length >= 2 && (
                <div className={`grid gap-0.5 rounded-2xl overflow-hidden max-w-[280px] ${
                  images.length === 2 ? 'grid-cols-2' :
                  images.length === 3 ? 'grid-cols-2' :
                  'grid-cols-2'
                }`}>
                  {images.slice(0, 4).map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative cursor-pointer hover:opacity-90 transition-opacity ${
                        images.length === 3 && idx === 0 ? 'row-span-2' : ''
                      }`}
                      onClick={() => window.open(img.url, '_blank')}
                    >
                      <img
                        src={img.url}
                        alt={img.fileName || ''}
                        className={`w-full object-cover ${
                          images.length === 3 && idx === 0 ? 'h-full' : 'h-[120px]'
                        }`}
                      />
                      {idx === 3 && images.length > 4 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-xl font-bold">+{images.length - 4}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {/* Non-image attachments */}
              {others.map((attachment, idx) => (
                <div key={`other-${idx}`}>
                  {attachment.type === 'video' && (
                    <div className="max-w-[240px] rounded-2xl overflow-hidden">
                      <video src={attachment.url} controls className="w-full h-auto" />
                    </div>
                  )}
                  {attachment.type === 'audio' && (
                    <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-2xl max-w-[240px]">
                      <Mic className="w-4 h-4 text-blue-500 shrink-0" />
                      <audio src={attachment.url} controls className="flex-1 h-8" />
                    </div>
                  )}
                  {attachment.type === 'file' && (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-2xl max-w-[240px] hover:bg-gray-100 transition-colors"
                    >
                      <FileText className="w-5 h-5 text-gray-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {attachment.fileName || t('messenger.attachment.fileAlt')}
                        </p>
                        {attachment.fileSize && (
                          <p className="text-[11px] text-gray-400">
                            {(attachment.fileSize / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                    </a>
                  )}
                  {attachment.type === 'contact' && (
                    <button
                      type="button"
                      onClick={() => {
                        const contactUserId = toContactUserId(attachment.url);
                        if (contactUserId) {
                          navigate(`/profile/${contactUserId}`);
                        }
                      }}
                      className="w-full text-left flex items-center gap-2.5 p-2.5 bg-blue-50 border border-blue-100 rounded-2xl max-w-[260px] hover:bg-blue-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-semibold">
                        {(attachment.fileName || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-blue-700 font-medium">Contact</p>
                        <p className="text-sm font-semibold text-blue-900 truncate">
                          {attachment.fileName || 'Unknown contact'}
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })()}

        {/* Text content */}
        {legacyContactName && !(msg.attachments || []).some((a) => a.type === 'contact') && (
          <div className="mb-1 flex items-center gap-2.5 p-2.5 bg-blue-50 border border-blue-100 rounded-2xl max-w-[260px]">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-semibold">
              {legacyContactName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-blue-700 font-medium">Contact</p>
              <p className="text-sm font-semibold text-blue-900 truncate">{legacyContactName}</p>
            </div>
          </div>
        )}
        {msg.content && !legacyContactName && (
          <div
            className={`relative inline-block px-3.5 py-2 ${
              msg.isMe
                ? 'bg-blue-500 text-white rounded-2xl rounded-br-md'
                : 'bg-gray-100 dark:bg-[#2a2d3a] text-gray-800 dark:text-gray-100 rounded-2xl rounded-bl-md'
            }`}
            onDoubleClick={() => onReaction(msg.id, 'LOVE')}
          >
            <p className="whitespace-pre-line text-[14px] leading-relaxed">{msg.content}</p>
          </div>
        )}

        {/* Message Options */}
        <div className={`absolute ${msg.isMe ? 'left-0' : 'right-0'} top-0 ${msg.isMe ? '-left-12' : '-right-12'} opacity-0 group-hover:opacity-100 transition-opacity z-20`}>
          <div className="relative">
            <button
              ref={isSelected ? menuButtonRef : null}
              onClick={(e) => {
                e.stopPropagation();
                if (!isSelected) {
                  const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  if (msg.isMe) {
                    onSetMenuPosition({
                      top: buttonRect.top,
                      right: window.innerWidth - buttonRect.left + 8,
                    });
                  } else {
                    onSetMenuPosition({
                      top: buttonRect.top,
                      left: buttonRect.right + 8,
                    });
                  }
                  onSelectMessage(msg.id);
                } else {
                  onSelectMessage(null);
                  onSetMenuPosition(null);
                }
              }}
              className="w-8 h-8 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors z-20"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>

            {isSelected && selectedMessage === msg.id && menuPosition && (
              <div
                data-message-menu
                className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[9999] min-w-[180px]"
                style={menuPosition}
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={() => onMessageAction('reply', msg.id)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                  <Reply className="w-4 h-4" /><span>{t('messenger.messageOptions.reply')}</span>
                </button>
                <button onClick={() => onMessageAction('forward', msg.id)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                  <Forward className="w-4 h-4" /><span>{t('messenger.messageOptions.forward')}</span>
                </button>
                <button onClick={() => onMessageAction('copy', msg.id)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                  <Copy className="w-4 h-4" /><span>{t('messenger.messageOptions.copy')}</span>
                </button>
                <button onClick={() => onMessageAction('pin', msg.id)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                  <Pin className="w-4 h-4" /><span>{msg.pinned ? t('messenger.messageOptions.unpin') : t('messenger.messageOptions.pin')}</span>
                </button>
                <button onClick={() => onMessageAction('star', msg.id)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                  <Star className={`w-4 h-4 ${msg.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} /><span>{msg.starred ? t('messenger.messageOptions.unstar') : t('messenger.messageOptions.star')}</span>
                </button>
                {msg.isMe && (
                  <button onClick={() => onMessageAction('edit', msg.id)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                    <Pencil className="w-4 h-4" /><span>{t('messenger.messageOptions.edit')}</span>
                  </button>
                )}
                <div className="border-t border-gray-100 my-1"></div>
                {canRecall && (
                  <button onClick={() => onMessageAction('delete', msg.id)} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3">
                    <Trash2 className="w-4 h-4" /><span>{t('messenger.messageOptions.delete')}</span>
                  </button>
                )}
                {msg.isMe && !canRecall && (
                  <div className="w-full px-4 py-2 text-left text-sm text-gray-400 flex items-center gap-3" title="Chi thu hoi trong 2 phut dau">
                    <Trash2 className="w-4 h-4" /><span>Het han thu hoi</span>
                  </div>
                )}
                <button onClick={() => onMessageAction('delete_for_me', msg.id)} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3">
                  <Trash2 className="w-4 h-4" /><span>Xoa phia toi</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reactions */}
        {msg.reactions && msg.reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-2 ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
            {msg.reactions.map((reaction, idx) => (
              <button
                key={idx}
                onClick={() => onReaction(msg.id, reaction.emoji)}
                className="px-2 py-1 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-1 text-xs"
              >
                <span>{reaction.emoji}</span>
                <span className="text-gray-600 font-medium">{reaction.users.length}</span>
              </button>
            ))}
            <button
              onClick={() => {
                const picker = document.getElementById(`reaction-picker-${msg.id}`);
                if (picker) {
                  picker.classList.toggle('hidden');
                  picker.classList.toggle('flex');
                }
              }}
              className="w-6 h-6 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
            >
              <Plus className="w-3 h-3 text-gray-600" />
            </button>

            {/* Quick Reactions Picker */}
            <div
              id={`reaction-picker-${msg.id}`}
              className="hidden absolute bottom-full mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 gap-1 z-20"
            >
              {REACTIONS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => {
                    onReaction(msg.id, r.key);
                    const picker = document.getElementById(`reaction-picker-${msg.id}`);
                    if (picker) {
                      picker.classList.add('hidden');
                      picker.classList.remove('flex');
                    }
                  }}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                  title={r.label}
                >
                  <span className="w-5 h-5 inline-block">{r.svg}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Time and Status */}
        <div className={`flex items-center gap-1 mt-0.5 ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
          <p className="text-[11px] text-gray-400">{msg.time}</p>
          {msg.isMe && msg.status && (
            <div className="flex items-center">
              {msg.status === 'read' ? (
                <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
              ) : msg.status === 'delivered' ? (
                <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <Check className="w-3.5 h-3.5 text-gray-400" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
