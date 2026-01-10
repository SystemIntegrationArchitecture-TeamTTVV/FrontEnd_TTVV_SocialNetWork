import { useChatBox } from '../../contexts/ChatBoxContext';
import ChatBox from './ChatBox';

export default function ChatBoxManager() {
  const { openChatBoxes } = useChatBox();

  if (openChatBoxes.length === 0) return null;

  return (
    <>
      {openChatBoxes.map((contact, index) => (
        <ChatBox key={contact.id} contact={contact} index={index} />
      ))}
    </>
  );
}

