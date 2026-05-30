// ─── ChatSidebar — left sidebar with conversation list, search, context menu ──
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Edit, Search, ChevronLeft, ChevronRight,
  Users, Bot, EyeOff, X, UserRound, Image, Video, Mic, Paperclip, CornerUpLeft,
  MoreVertical, Pin, PinOff,
} from 'lucide-react';
import { parseConversationPreview } from '../../../utils/messagePreview';

export interface FormattedConversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  avatar: string;
  imageUrl?: string;
  color: string;
  isGroup?: boolean;
  pinned?: boolean;
  otherParticipantId?: string;
}

interface ChatSidebarProps {
  formattedConversations: FormattedConversation[];
  activeChat: string | null;
  onSelectChat: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  sidebarSearch: string;
  onSearchChange: (v: string) => void;
  loading: boolean;
  // AI
  aiConversationId: string;
  // Context menu
  contextMenu: { x: number; y: number; convId: string } | null;
  onContextMenu: (e: React.MouseEvent, convId: string) => void;
  // Hide conversation
  showHideInput: string | null;
  hidePin: string;
  onHidePinChange: (v: string) => void;
  hideLoading: boolean;
  hideError: string | null;
  onHideError: (v: string | null) => void;
  onHideConversation: (convId: string, pin: string) => void;
  onCancelHide: () => void;
  // Hidden panel trigger
  onShowHidden: () => void;
  onStartHide: (convId: string) => void;
  // Pin conversation
  onTogglePinConversation?: (convId: string) => void;
  pinLoading?: boolean;
  onViewProfile?: (userId: string, userName: string, userAvatar?: string) => void;
}

export default function ChatSidebar({
  formattedConversations,
  activeChat,
  onSelectChat,
  collapsed,
  onToggleCollapse,
  sidebarSearch,
  onSearchChange,
  loading,
  aiConversationId,
  contextMenu: _contextMenu,
  onContextMenu,
  showHideInput,
  hidePin,
  onHidePinChange,
  hideLoading,
  hideError,
  onHideError,
  onHideConversation,
  onCancelHide,
  onShowHidden,
  onStartHide,
  onTogglePinConversation,
  pinLoading,
  onViewProfile,
}: ChatSidebarProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const filteredConversations = sidebarSearch
    ? formattedConversations.filter(c => c.name.toLowerCase().includes(sidebarSearch.toLowerCase()))
    : formattedConversations;

  const renderPreview = (previewRaw: string) => {
    const preview = parseConversationPreview(previewRaw);
    const iconClass = 'w-3.5 h-3.5 shrink-0';

    switch (preview.kind) {
      case 'contact':
        return (
          <span className="flex items-center gap-1.5 min-w-0">
            <UserRound className={`${iconClass} text-blue-500`} />
            <span className="truncate">Contact: {preview.text}</span>
          </span>
        );
      case 'image':
        return (
          <span className="flex items-center gap-1.5 min-w-0">
            <Image className={`${iconClass} text-indigo-500`} />
            <span className="truncate">{preview.text}</span>
          </span>
        );
      case 'video':
        return (
          <span className="flex items-center gap-1.5 min-w-0">
            <Video className={`${iconClass} text-purple-500`} />
            <span className="truncate">{preview.text}</span>
          </span>
        );
      case 'audio':
        return (
          <span className="flex items-center gap-1.5 min-w-0">
            <Mic className={`${iconClass} text-emerald-500`} />
            <span className="truncate">{preview.text}</span>
          </span>
        );
      case 'file':
        return (
          <span className="flex items-center gap-1.5 min-w-0">
            <Paperclip className={`${iconClass} text-gray-500`} />
            <span className="truncate">{preview.text}</span>
          </span>
        );
      case 'reply':
        return (
          <span className="flex items-center gap-1.5 min-w-0">
            <CornerUpLeft className={`${iconClass} text-amber-500`} />
            <span className="truncate">{preview.text}</span>
          </span>
        );
      default:
        return <span className="truncate">{preview.text}</span>;
    }
  };

  return (
    <div className={`border-r border-gray-200/50 dark:border-white/5 glass-surface flex flex-col h-full transition-all duration-300 ease-in-out shrink-0 ${collapsed ? 'w-20' : 'w-full md:w-[340px]'
      }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        {!collapsed && (
          <h1 className="text-xl font-bold text-gray-900">{t('messenger.messagesHeader')}</h1>
        )}
        <div className={`flex gap-2 ${collapsed ? 'flex-col w-full' : ''}`}>
          {!collapsed && (
            <>
              <button
                onClick={() => navigate('/messenger/new')}
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                title={t('messenger.newMessageIconTitle')}
              >
                <Edit className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={() => navigate('/messenger/new', { state: { createGroup: true } })}
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                title={t('messenger.createGroupIconTitle')}
              >
                <Users className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={onShowHidden}
                className="w-10 h-10 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200/60 flex items-center justify-center transition-colors relative group"
                title="Chat ẩn"
              >
                <EyeOff className="w-5 h-5 text-amber-600" />
              </button>
            </>
          )}
          <button
            onClick={onToggleCollapse}
            className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            title={collapsed ? t('messenger.expandSidebarTitle') : t('messenger.collapseSidebarTitle')}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-700" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-100/50 dark:border-white/5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={sidebarSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('messenger.searchMessagesPlaceholder')}
            className="w-full h-11 pl-11 pr-4 rounded-2xl bg-gray-100/50 dark:bg-[#22263a]/50 border border-transparent focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-[#1a1d28] text-sm transition-all dark:text-gray-200"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {/* Show skeleton loaders while conversations are loading */}
        {loading && formattedConversations.length <= 1 && (
          <>
            {[...Array(6)].map((_, i) => (
              <div key={`skel-${i}`} className="px-3 py-2.5 mx-1 my-0.5 flex items-center gap-3 animate-pulse">
                <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                {!collapsed && (
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded-full" style={{ width: `${60 + i * 12}px` }} />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-10" />
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full" style={{ width: `${100 + i * 15}px` }} />
                  </div>
                )}
              </div>
            ))}
          </>
        )}
        {filteredConversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => {
              if (showHideInput === conv.id) return;
              onSelectChat(conv.id);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              onContextMenu(e, conv.id);
            }}
            className={`group/conv cursor-pointer transition-all duration-200 rounded-xl overflow-hidden ${activeChat === conv.id
              ? 'bg-blue-50 dark:bg-blue-500/15'
              : 'hover:bg-gray-100/80 dark:hover:bg-[#1e2130]/80'
              } ${collapsed ? 'p-2 mx-2 my-0.5 flex items-center justify-center' : 'px-3 py-2.5 mx-1 my-0.5 flex items-center gap-3'}`}
            title={collapsed ? conv.name : ''}
          >
            {showHideInput === conv.id ? (
              <div className="w-full flex flex-col gap-2 p-1 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                    <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate flex-1">Ẩn "{conv.name}"</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="password"
                    maxLength={6}
                    autoFocus
                    value={hidePin}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => { onHidePinChange(e.target.value.replace(/\D/g, '')); onHideError(null); }}
                    placeholder="Mã PIN"
                    className="w-full h-8 px-2.5 text-sm bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none dark:text-white transition-all font-mono tracking-widest text-center"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && hidePin.length >= 4) {
                        e.preventDefault();
                        onHideConversation(conv.id, hidePin);
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onHideConversation(conv.id, hidePin);
                    }}
                    disabled={hidePin.length < 4 || hideLoading}
                    className="h-8 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
                  >
                    {hideLoading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Ẩn'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancelHide();
                    }}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg shrink-0 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {hideError && <p className="text-[10px] text-red-500 text-center font-medium">{hideError}</p>}
              </div>
            ) : collapsed ? (
              <div 
                className="relative shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                onClick={(e) => {
                  if (conv.otherParticipantId && onViewProfile) {
                    e.stopPropagation();
                    onViewProfile(conv.otherParticipantId, conv.name, conv.imageUrl);
                  }
                }}
              >
                {conv.id === aiConversationId ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <>
                    {conv.imageUrl ? (
                      <img
                        src={conv.imageUrl}
                        alt={conv.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0 shadow-sm border border-gray-100 dark:border-white/5"
                      />
                    ) : conv.isGroup ? (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: conv.color }}>
                        <Users className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                        style={{ backgroundColor: conv.color }}
                      >
                        {conv.avatar}
                      </div>
                    )}
                    {conv.online && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-[#1a1d28]"></div>
                    )}
                    {conv.unread > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg animate-bounce">
                        {conv.unread}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                <div 
                  className="relative shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                  onClick={(e) => {
                    if (conv.otherParticipantId && onViewProfile) {
                      e.stopPropagation();
                      onViewProfile(conv.otherParticipantId, conv.name, conv.imageUrl);
                    }
                  }}
                >
                  {conv.id === aiConversationId ? (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <>
                      {conv.imageUrl ? (
                        <img
                          src={conv.imageUrl}
                          alt={conv.name}
                          className="w-11 h-11 rounded-full object-cover shrink-0 shadow-sm border border-gray-100 dark:border-white/5"
                        />
                      ) : conv.isGroup ? (
                        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: conv.color }}>
                          <Users className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                          style={{ backgroundColor: conv.color }}
                        >
                          {conv.avatar}
                        </div>
                      )}
                      {conv.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#1a1d28]"></div>
                      )}
                    </>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate flex items-center gap-1 ${conv.unread > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'}`}>
                      {conv.name}
                      {conv.pinned && <Pin className="w-3 h-3 text-blue-400 rotate-45 shrink-0" />}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`text-xs ${conv.unread > 0 ? 'text-gray-700 font-semibold' : 'text-gray-400'}`}>{conv.time}</span>
                      {/* 3-dot menu button — only show for non-AI conversations */}
                      {conv.id !== aiConversationId && onTogglePinConversation && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === conv.id ? null : conv.id);
                            }}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors opacity-0 group-hover/conv:opacity-100"
                            title="Tùy chọn"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {/* Dropdown menu */}
                          {openMenuId === conv.id && (
                            <div
                              ref={menuRef}
                              className="absolute right-0 top-7 z-50 w-44 bg-white dark:bg-[#22263a] rounded-xl shadow-xl border border-gray-100 dark:border-white/10 py-1 animate-in fade-in zoom-in-95 duration-150"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTogglePinConversation(conv.id);
                                  setOpenMenuId(null);
                                }}
                                disabled={pinLoading}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2.5 transition-colors disabled:opacity-50"
                              >
                                {conv.pinned ? (
                                  <>
                                    <PinOff className="w-4 h-4 text-gray-500" />
                                    Bỏ ghim hội thoại
                                  </>
                                ) : (
                                  <>
                                    <Pin className="w-4 h-4 text-blue-500 rotate-45" />
                                    Ghim hội thoại
                                  </>
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStartHide(conv.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                              >
                                <EyeOff className="w-4 h-4 text-amber-500" />
                                Ẩn hội thoại
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className={`text-xs truncate ${conv.unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                      {renderPreview(conv.lastMessage)}
                    </p>
                    {conv.unread > 0 && (
                      <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
