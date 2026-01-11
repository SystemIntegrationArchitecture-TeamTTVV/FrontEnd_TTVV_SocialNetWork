import { useLocation } from 'react-router-dom';
import { useChatBox } from '../../contexts/ChatBoxContext';
import ChatBox from './ChatBox';

export default function ChatBoxManager() {
  const { openChatBoxes } = useChatBox();
  const location = useLocation();

  // Ẩn chatbox khi đang ở trang messenger (full page)
  const isMessengerPage = location.pathname.startsWith('/messenger');
  
  if (openChatBoxes.length === 0 || isMessengerPage) return null;

  return (
    <>
      {openChatBoxes.map((contact, index) => (
        <ChatBox key={contact.id} contact={contact} index={index} />
      ))}
    </>
  );
}

