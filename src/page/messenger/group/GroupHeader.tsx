// ─── GroupHeader — header bar for GroupChat page ────────────────────────
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Settings, Pin, Images, MessageSquare } from 'lucide-react';

interface GroupHeaderProps {
  groupName: string;
  memberCount: number;
  onlineCount: number;
  activeTab: 'chat' | 'pinned' | 'media';
  onTabChange: (tab: 'chat' | 'pinned' | 'media') => void;
  onToggleSettings: () => void;
}

export default function GroupHeader({
  groupName,
  memberCount,
  onlineCount,
  activeTab,
  onTabChange,
  onToggleSettings,
}: GroupHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="h-16 border-b border-gray-200 px-4 flex items-center justify-between bg-white">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={() => navigate('/messenger')} className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 truncate">{groupName || 'Group Chat'}</h1>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {memberCount} thanh vien • {onlineCount} online
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onTabChange('chat')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${activeTab === 'chat' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
          title="Chat"
        >
          <MessageSquare className="w-4 h-4 text-gray-700" />
        </button>
        <button
          onClick={() => onTabChange('pinned')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${activeTab === 'pinned' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
          title="Pinned"
        >
          <Pin className="w-4 h-4 text-gray-700" />
        </button>
        <button
          onClick={() => onTabChange('media')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${activeTab === 'media' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
          title="Media"
        >
          <Images className="w-4 h-4 text-gray-700" />
        </button>
        <button onClick={onToggleSettings} className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center">
          <Settings className="w-5 h-5 text-gray-700" />
        </button>
      </div>
    </div>
  );
}
