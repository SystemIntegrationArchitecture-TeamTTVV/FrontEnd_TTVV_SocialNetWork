import { RouterProvider } from 'react-router-dom';
import { router } from './Router';
import { ChatBoxProvider } from './contexts/ChatBoxContext';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <ChatBoxProvider>
        <RouterProvider router={router} />
      </ChatBoxProvider>
    </AuthProvider>
  );
}

export default App;
