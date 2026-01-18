import { RouterProvider } from 'react-router-dom';
import { router } from './Router';
import { ChatBoxProvider } from './contexts/ChatBoxContext';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { CallProvider } from './contexts/CallContext';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <CallProvider>
          <ChatBoxProvider>
            <RouterProvider router={router} />
          </ChatBoxProvider>
        </CallProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
