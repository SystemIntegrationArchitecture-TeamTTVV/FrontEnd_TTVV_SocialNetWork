import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  const hasPrompted = useRef(false);

  // Hooks phải luôn được gọi trước mọi return có điều kiện
  useEffect(() => {
    if (!requireAuth || isAuthenticated || requireAdmin || hasPrompted.current) return;
    hasPrompted.current = true;
    showAuthRequiredPrompt(location.pathname);
  }, [isAuthenticated, location.pathname, requireAdmin, requireAuth]);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (requireAdmin) {
    if (!isAuthenticated) {
      return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }
    const userRole = user?.role?.toUpperCase();
    if (userRole !== 'ADMIN') {
      return <Navigate to="/404" replace />;
    }
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

