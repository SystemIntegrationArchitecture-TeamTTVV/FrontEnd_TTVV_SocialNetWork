import { RouterProvider } from 'react-router-dom';
import { router } from './Router';
import { ChatBoxProvider } from './contexts/ChatBoxContext';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ChatBoxProvider>
          <RouterProvider router={router} />
        </ChatBoxProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
