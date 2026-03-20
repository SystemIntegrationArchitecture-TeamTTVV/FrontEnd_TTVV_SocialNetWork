import { useRef, useEffect } from 'react';
import { LogOut, User, Settings, X, LogIn, UserPlus } from 'lucide-react';
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

export default function UserDropdown({ isOpen, onClose, user }: UserDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

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

  if (!isOpen) return null;

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
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
              onClick={() => handleNavigate('/auth/login')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <LogIn className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium">Đăng nhập</span>
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('/auth/register')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium">Đăng ký</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

