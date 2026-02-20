import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  AlertTriangle,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  UserCircle,
  Calendar,
  Bell,
} from "lucide-react";
import { usersApi } from "../../apis/users";
import { postsApi } from "../../apis/posts";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      const [users, posts] = await Promise.all([
        usersApi.getAllUsers(),
        postsApi.getAllPosts(),
      ]);
      setUserCount(users.length);
      setPostCount(posts.length);
    } catch (error) {
      console.error("Failed to load counts:", error);
    }
  };

  const menuItems = [
    {
      id: "admin",
      icon: LayoutDashboard,
      label: "Tổng quan & Thống kê",
      path: "/admin",
      badge: null,
    },
    {
      id: "users",
      icon: Users,
      label: "Người dùng",
      path: "/admin/users",
      badge: userCount > 0 ? userCount : null,
    },
    {
      id: "posts",
      icon: FileText,
      label: "Bài viết",
      path: "/admin/posts",
      badge: postCount > 0 ? postCount : null,
    },
    {
      id: "groups",
      icon: Users,
      label: "Nhóm",
      path: "/admin/groups",
      badge: null,
    },
    {
      id: "events",
      icon: Calendar,
      label: "Sự kiện",
      path: "/admin/events",
      badge: null,
    },
    {
      id: "messages",
      icon: MessageSquare,
      label: "Tin nhắn",
      path: "/admin/messages",
      badge: null,
    },
    {
      id: "reports",
      icon: AlertTriangle,
      label: "Báo cáo",
      path: "/admin/reports",
      badge: null,
    },
    {
      id: "settings",
      icon: Settings,
      label: "Cài đặt",
      path: "/admin/settings",
      badge: null,
    },
  ];

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col ${
          sidebarCollapsed ? "w-24" : "w-80"
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-20 border-b border-gray-200 flex items-center justify-between px-5">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500">Quản trị hệ thống</p>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg mx-auto">
              <Shield className="w-7 h-7 text-white" />
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-11 h-11 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-600 hover:text-gray-900"
          >
            {sidebarCollapsed ? (
              <Menu className="w-6 h-6" />
            ) : (
              <X className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-5 space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-5 px-5 py-4 rounded-xl transition-all group relative ${
                  active
                    ? "bg-blue-50 text-blue-600 shadow-sm"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                title={sidebarCollapsed ? item.label : ""}
              >
                <div
                  className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    active
                      ? "bg-blue-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                {!sidebarCollapsed && (
                  <>
                    <span
                      className={`flex-1 font-bold text-lg ${
                        active ? "text-blue-600" : "text-gray-700"
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="min-w-[32px] h-8 px-2 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </>
                )}
                {sidebarCollapsed && item.badge && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 border-2 border-white"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-5">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-4 px-5 py-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.fullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-7 h-7 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-lg truncate">
                  {user?.fullName || user?.username || "Admin"}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {user?.username || "admin@ttvv.com"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.fullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-7 h-7 text-white" />
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              logout();
              navigate("/home");
            }}
            className={`flex items-center gap-5 px-5 py-4 rounded-xl text-red-600 hover:bg-red-50 transition-colors mt-3 w-full ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
            title={sidebarCollapsed ? "Đăng xuất" : ""}
          >
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <LogOut className="w-6 h-6" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg">Đăng xuất</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {menuItems.find((item) => isActive(item.path))?.label ||
                "Admin Panel"}
            </h2>
          </div>
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
              <Bell className="w-6 h-6 text-gray-600" />
            </div>
            <Link
              to="/home"
              className="px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors text-base"
            >
              Về trang chủ
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
