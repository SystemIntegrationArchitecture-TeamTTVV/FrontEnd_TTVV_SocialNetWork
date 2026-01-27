import { RouterProvider } from 'react-router-dom';
import { router } from './Router';
import { ChatBoxProvider } from './contexts/ChatBoxContext';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { CallProvider } from './contexts/CallContext';
import { MusicProvider } from './contexts/MusicContext';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <CallProvider>
          <ChatBoxProvider>
            <MusicProvider>
              <RouterProvider router={router} />
            </MusicProvider>
          </ChatBoxProvider>
        </CallProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
