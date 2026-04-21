import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from './Router';
import { ChatBoxProvider } from './contexts/ChatBoxContext';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { CallProvider } from './contexts/CallContext';
import { MusicProvider } from './contexts/MusicContext';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Toaster />
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
    </ThemeProvider>
  );
}

export default App;
