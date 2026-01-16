import { useChatBox } from '../../contexts/ChatBoxContext';
import type { ChatContact } from '../../types/chat';

export default function RightSidebar() {
  const { openChatBox } = useChatBox();

  const contacts: ChatContact[] = [
    { id: 'alex-chen', name: 'Alex Chen', online: true, avatar: 'AC', color: '#1877F2' },
    { id: 'maria-garcia', name: 'Maria Garcia', online: true, avatar: 'MG', color: '#42B72A' },
    { id: 'david-kim', name: 'David Kim', online: false, avatar: 'DK', color: '#FF6B6B' },
    { id: 'lisa-wang', name: 'Lisa Wang', online: true, avatar: 'LW', color: '#4ECDC4' },
    { id: 'tom-brown', name: 'Tom Brown', online: false, avatar: 'TB', color: '#FFD93D' },
  ];

  const groups = [
    { name: 'Weekend Plans', avatar: 'WP', color: '#9B59B6' },
    { name: 'Work Team', avatar: 'WT', color: '#E67E22' },
  ];

  const handleContactClick = (contact: ChatContact) => {
    openChatBox(contact);
  };

  return (
    <aside className="hidden xl:block w-72 px-4 py-6">
      <div className="space-y-7">
        {/* Contacts */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 px-2">Contacts</h3>
          <div className="space-y-2.5">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => handleContactClick(contact)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 cursor-pointer transition-all duration-200 group"
              >
                <div className="relative flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: contact.color }}
                  >
                    {contact.avatar}
                  </div>
                  {contact.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">{contact.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Group Conversations */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 px-2">Groups</h3>
          <div className="space-y-2.5">
            {groups.map((group, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 cursor-pointer transition-all duration-200 group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                  style={{ backgroundColor: group.color }}
                >
                  {group.avatar}
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">{group.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
