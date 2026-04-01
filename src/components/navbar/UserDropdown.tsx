import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, User, Settings, X, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    username: string;
    fullName: string;
    avatar: string;
    role: string;
  } | null;
}

type AuthNavTarget = 'login' | 'register' | null;

export default function UserDropdown({ isOpen, onClose, user }: UserDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [pendingAuthNav, setPendingAuthNav] = useState<AuthNavTarget>(null);
  const authNavTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (authNavTimerRef.current !== null) {
        window.clearTimeout(authNavTimerRef.current);
        authNavTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!pendingAuthNav) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [pendingAuthNav]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleLogout = () => {
    logout();
    onClose();
  };

  /** Modal giữa màn hình ~5s (nền mờ + blur) rồi chuyển trang. */
  const handleAuthNavigate = (path: string, target: Exclude<AuthNavTarget, null>) => {
    if (pendingAuthNav !== null) return;
    setPendingAuthNav(target);
    onClose();
    const displayMs = 5000;
    if (authNavTimerRef.current !== null) window.clearTimeout(authNavTimerRef.current);
    authNavTimerRef.current = window.setTimeout(() => {
      authNavTimerRef.current = null;
      navigate(path);
      setPendingAuthNav(null);
    }, displayMs);
  };

  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const authLoadingModal =
    pendingAuthNav &&
    createPortal(
      <div
        className="fixed inset-0 z-10050 flex items-center justify-center bg-slate-900/40 backdrop-blur-md px-4"
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-loading-title"
          aria-busy="true"
          className="w-full max-w-[340px] rounded-2xl bg-white p-8 shadow-2xl border border-gray-100 dark:bg-gray-900 dark:border-gray-700 flex flex-col items-center text-center gap-5"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/50">
            <Loader2 className="h-9 w-9 text-blue-600 dark:text-blue-400 animate-spin" aria-hidden />
          </div>
          <div className="space-y-1.5">
            <p
              id="auth-loading-title"
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              {pendingAuthNav === 'login' ? 'Đang mở đăng nhập' : 'Đang mở đăng ký'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Vui lòng chờ trong giây lát, hệ thống đang chuyển bạn tới trang tương ứng.
            </p>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      {authLoadingModal}
      {isOpen ? (
    <div
      ref={dropdownRef}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200/80 z-80 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100/80">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Tài khoản</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden shrink-0">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.fullName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-white font-semibold text-sm">${userInitials}</span>`;
                    }
                  }}
                />
              ) : (
                <span className="text-white font-semibold text-sm">{userInitials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{user.fullName}</p>
              <p className="text-sm text-gray-600 truncate">@{user.username}</p>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            Bạn chưa đăng nhập.
          </div>
        )}
      </div>

      {/* Menu Items */}
      <div className="py-2">
        {user ? (
          <>
            <Link
              to={`/profile/${user.id}`}
              onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium">Trang cá nhân</span>
            </Link>

            <Link
              to="/settings"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Settings className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium">Cài đặt</span>
            </Link>

            <div className="border-t border-gray-100 my-2"></div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-red-600"
            >
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <span className="font-medium">Đăng xuất</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={pendingAuthNav !== null}
              onClick={() => handleAuthNavigate('/auth/login', 'login')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 text-left disabled:pointer-events-none disabled:opacity-70"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <LogIn className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium">Đăng nhập</span>
            </button>
            <button
              type="button"
              disabled={pendingAuthNav !== null}
              onClick={() => handleAuthNavigate('/auth/register', 'register')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 text-left disabled:pointer-events-none disabled:opacity-70"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium">Đăng ký</span>
            </button>
          </>
        )}
      </div>
    </div>
      ) : null}
    </>
  );
}

