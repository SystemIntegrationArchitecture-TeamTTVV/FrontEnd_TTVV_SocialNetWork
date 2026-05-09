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
      <Toaster
        position="top-right"
        gutter={10}
        toastOptions={{
          duration: 3400,
          className:
            'rounded-2xl border border-gray-200/80 dark:border-[#2b2f45] bg-white/95 dark:bg-[#1a1d28]/95 text-gray-900 dark:text-[#edf0fa] shadow-lg backdrop-blur-md',
          success: {
            iconTheme: {
              primary: '#16a34a',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#dc2626',
              secondary: '#ffffff',
            },
          },
        }}
      />
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
