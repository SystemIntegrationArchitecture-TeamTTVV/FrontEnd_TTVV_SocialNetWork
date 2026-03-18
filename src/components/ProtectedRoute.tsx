import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { showAuthRequiredPrompt } from '../utils/authPrompt';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  const hasPrompted = useRef(false);

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

  if (requireAdmin) {
    if (!isAuthenticated) {
      return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }
    // Check if user has ADMIN role (case-insensitive)
    const userRole = user?.role?.toUpperCase();
    if (userRole !== 'ADMIN') {
      // Redirect non-admin users to home page
      return <Navigate to="/home" replace />;
    }
  }

  useEffect(() => {
    if (!requireAuth || isAuthenticated || requireAdmin || hasPrompted.current) return;
    hasPrompted.current = true;
    showAuthRequiredPrompt(location.pathname);
  }, [isAuthenticated, location.pathname, requireAdmin, requireAuth]);

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

