import { RouterProvider } from 'react-router-dom';
import { router } from './Router';
import { ChatBoxProvider } from './contexts/ChatBoxContext';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { CallProvider } from './contexts/CallContext';
import { MusicProvider } from './contexts/MusicContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <CallProvider>
            <ChatBoxProvider>
              <MusicProvider>
                <ToastProvider>
                  <RouterProvider router={router} />
                </ToastProvider>
              </MusicProvider>
            </ChatBoxProvider>
          </CallProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
