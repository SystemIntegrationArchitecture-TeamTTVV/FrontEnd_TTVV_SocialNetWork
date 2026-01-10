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
    <aside className="hidden xl:block w-80 px-5 py-8">
      <div className="space-y-8">
        {/* Contacts */}
        <div>
          <h3 className="text-base font-bold text-gray-500 uppercase tracking-wide mb-5 px-2">Contacts</h3>
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => handleContactClick(contact)}
                className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-gray-50 cursor-pointer transition-all group"
              >
                <div className="relative">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: contact.color }}
                  >
                    {contact.avatar}
                  </div>
                  {contact.online && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <span className="text-lg font-semibold text-gray-700 group-hover:text-gray-900">{contact.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Group Conversations */}
        <div>
          <h3 className="text-base font-bold text-gray-500 uppercase tracking-wide mb-5 px-2">Groups</h3>
          <div className="space-y-3">
            {groups.map((group, index) => (
              <div
                key={index}
                className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-gray-50 cursor-pointer transition-all group"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: group.color }}
                >
                  {group.avatar}
                </div>
                <span className="text-lg font-semibold text-gray-700 group-hover:text-gray-900">{group.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
