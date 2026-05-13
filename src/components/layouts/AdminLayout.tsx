import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  UsersRound,
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
  Search,
  Globe,
} from "lucide-react";
import { usersApi } from "../../apis/users";
import { postsApi } from "../../apis/posts";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";

export default function AdminLayout() {
  const { t } = useTranslation();
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
      labelKey: "adminPanel.layout.navDashboard",
      path: "/admin",
      badge: null,
    },
    {
      id: "users",
      icon: Users,
      labelKey: "adminPanel.layout.navUsers",
      path: "/admin/users",
      badge: userCount > 0 ? userCount : null,
    },
    {
      id: "posts",
      icon: FileText,
      labelKey: "adminPanel.layout.navPosts",
      path: "/admin/posts",
      badge: postCount > 0 ? postCount : null,
    },
    {
      id: "groups",
      icon: UsersRound,
      labelKey: "adminPanel.layout.navGroups",
      path: "/admin/groups",
      badge: null,
    },
    // {
    //   id: "events",
    //   icon: Calendar,
    //   labelKey: "adminPanel.layout.navEvents",
    //   path: "/admin/events",
    //   badge: null,
    // },
    // {
    //   id: "messages",
    //   icon: MessageSquare,
    //   labelKey: "adminPanel.layout.navMessages",
    //   path: "/admin/messages",
    //   badge: null,
    // },
    {
      id: "reports",
      icon: AlertTriangle,
      labelKey: "adminPanel.layout.navReports",
      path: "/admin/reports",
      badge: null,
    },
    {
      id: "settings",
      icon: Settings,
      labelKey: "adminPanel.layout.navSettings",
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
    <div className="h-screen overflow-hidden flex bg-[#F7F8FC] font-sans">
      {/* Sidebar */}
      <aside
        className={`shrink-0 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col ${sidebarCollapsed ? "w-20" : "w-72"
          }`}
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6 mb-2">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">TTVV</h1>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center mx-auto">
              <Shield className="w-5 h-5 text-white" />
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-900"
          >
            {sidebarCollapsed ? (
              <Menu className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-colors group relative ${active
                  ? "bg-gray-100 text-gray-900 font-semibold"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium"
                  }`}
                title={sidebarCollapsed ? t(item.labelKey) : ""}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${active ? "text-gray-900" : "text-gray-400 group-hover:text-gray-600"}`} />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-sm">
                      {t(item.labelKey)}
                    </span>
                    {item.badge && (
                      <span className="min-w-[24px] h-6 px-1.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 text-xs font-semibold flex items-center justify-center">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </>
                )}
                {sidebarCollapsed && item.badge && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gray-400"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-100 p-4">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.fullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {user?.fullName || user?.username || "Admin"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.username || "admin"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.fullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-6 h-6 text-gray-400" />
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              logout();
              navigate("/home");
            }}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors mt-2 w-full ${sidebarCollapsed ? "justify-center" : ""
              }`}
            title={sidebarCollapsed ? t("adminPanel.layout.logout") : ""}
          >
            <div className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 group-hover:text-gray-900">
              <LogOut className="w-4 h-4" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-medium text-sm">{t("adminPanel.layout.logout")}</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-[#F4F5F7] px-8 flex items-center justify-between z-10 sticky top-0">
          <div className="flex-1 flex items-center">
            <div className="relative w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t("adminPanel.layout.searchPlaceholder", "Tìm kiếm...")}
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
              <Globe className="w-4 h-4 text-gray-500" />
            </div>
            <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
              <Bell className="w-4 h-4 text-gray-500" />
            </div>
            <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
              <Settings className="w-4 h-4 text-gray-500" />
            </div>
            <div className="h-8 w-px bg-gray-200 mx-2"></div>
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {user?.fullName || user?.username || "Admin"}
                </p>
                <p className="text-xs text-gray-500">{user?.username}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#F4F5F7]">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
