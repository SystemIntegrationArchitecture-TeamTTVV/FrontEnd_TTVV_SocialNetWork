import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Root redirect component - checks authentication and redirects accordingly
 * When user visits root path '/', redirects to /home if authenticated, otherwise /auth/login
 * Note: This component is already inside ProtectedRoute, so it will only render if authenticated
 */
export default function RootRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    // Nếu là admin thì đưa vào trang admin, ngược lại vào home
    const role = user?.role?.toUpperCase();
    if (role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/home" replace />;
  }
  
  // If not authenticated, redirect to login (shouldn't happen since MainLayout is protected)
  return <Navigate to="/auth/login" replace />;
}

