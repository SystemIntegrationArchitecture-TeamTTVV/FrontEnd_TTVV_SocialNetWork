import { Navigate } from 'react-router-dom';
import { authApi } from '../apis/auth';

/**
 * Root redirect component - checks authentication and redirects accordingly
 * When user visits root path '/', redirects to /home if authenticated, otherwise /auth/login
 */
export default function RootRedirect() {
  const isAuthenticated = authApi.isAuthenticated();
  
  if (isAuthenticated) {
    // If authenticated, redirect to home
    return <Navigate to="/home" replace />;
  }
  
  // If not authenticated, redirect to login
  return <Navigate to="/auth/login" replace />;
}

