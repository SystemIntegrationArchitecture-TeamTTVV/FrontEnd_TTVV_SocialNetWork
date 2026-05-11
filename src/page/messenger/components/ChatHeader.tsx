// ─── ChatHeader — chat area header with avatar, name, call buttons ─────
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Phone, Video, Info, Pin, Users, Search as SearchIcon } from 'lucide-react';
import type { PresenceStatus } from '../../../apis/users';

interface ActiveConversation {
  id: string;
  name: string;
  avatar: string;
  imageUrl?: string;
  online: boolean;
  color: string;
  isGroup?: boolean;
}

interface ChatHeaderProps {
  conversation: ActiveConversation;
  isGroupChat: boolean;
  isAIChat: boolean;
  showSearch: boolean;
  showPinnedPanel: boolean;
  rightSidebarCollapsed: boolean;
  callBlocked?: boolean;
  onToggleSearch: () => void;
  onTogglePinned: () => void;
  onToggleRightSidebar: () => void;
  onVoiceCall: () => void;
  onVideoCall: () => void;
}

export default function ChatHeader({
  conversation,
  isGroupChat,
  isAIChat,
  showSearch,
  showPinnedPanel,
  rightSidebarCollapsed,
  callBlocked = false,
  onToggleSearch,
  onTogglePinned,
  onToggleRightSidebar,
  onVoiceCall,
  onVideoCall,
}: ChatHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isCallDisabled = isAIChat || callBlocked;

  return (
    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="relative shrink-0">
          {conversation.imageUrl ? (
            <img
              src={conversation.imageUrl}
              alt={conversation.name}
              className="w-12 h-12 rounded-full object-cover shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => navigate(`/profile/${conversation.id}`)}
            />
          ) : conversation.isGroup ? (
            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm cursor-pointer hover:opacity-90 transition-opacity" style={{ backgroundColor: conversation.color }} onClick={() => navigate(`/profile/${conversation.id}`)}>
              <Users className="w-6 h-6 text-white" />
            </div>
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundColor: conversation.color }}
              onClick={() => navigate(`/profile/${conversation.id}`)}
            >
              {conversation.avatar}
            </div>
          )}
          {conversation.online && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-3 border-white"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-lg truncate">{conversation.name}</p>
          {conversation.online && (
            <p className="text-sm text-green-500 font-medium">{t('messenger.activeNow')}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onToggleSearch}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            showSearch ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          title={t('messenger.header.searchIconTitle')}
        >
          <SearchIcon className="w-5 h-5" />
        </button>
        <button
          onClick={onTogglePinned}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            showPinnedPanel ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          title="Tin nhắn đã ghim"
        >
          <Pin className="w-5 h-5" />
        </button>
        <button
          onClick={onVoiceCall}
          disabled={isCallDisabled}
          className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={
            callBlocked
              ? 'Cuộc gọi đã bị chặn'
              : isAIChat
                ? t('messenger.header.voiceCallNotAvailable')
                : isGroupChat
                  ? t('messenger.header.groupCall')
                  : t('messenger.header.call')
          }
        >
          <Phone className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={onVideoCall}
          disabled={isCallDisabled}
          className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={
            callBlocked
              ? 'Cuộc gọi đã bị chặn'
              : isAIChat
                ? t('messenger.header.videoCallNotAvailable')
                : isGroupChat
                  ? t('messenger.header.groupVideoCall')
                  : t('messenger.header.videoCall')
          }
        >
          <Video className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={onToggleRightSidebar}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            !rightSidebarCollapsed ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-600'
          }`}
          title={t('messenger.header.infoIconTitle')}
        >
          <Info className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
