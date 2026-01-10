import { RouterProvider } from 'react-router-dom';
import { router } from './Router';
import { ChatBoxProvider } from './contexts/ChatBoxContext';

function App() {
  return (
    <ChatBoxProvider>
      <RouterProvider router={router} />
    </ChatBoxProvider>
  );
}

export default App;
