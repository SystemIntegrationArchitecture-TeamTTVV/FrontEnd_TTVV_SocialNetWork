import {
  Users,
  CheckCircle2,
  FileText,
  AlertCircle,
  BarChart3,
  Calendar,
  Briefcase,
  UserPlus,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  statsApi,
  type DashboardStats,
  type TopPost,
  type EngagementStats,
} from "../../apis/stats";
import { reportsApi } from "../../apis/reports";
import { getLocaleTag } from "../../i18n";
import { useAuth } from "../../contexts/AuthContext";
import { PostPreviewModal } from "../../components/admin/PostPreviewModal";
import { MetricDetailsModal, type MetricType } from "../../components/admin/MetricDetailsModal";

interface AdminDashboardStats extends DashboardStats {
  pendingReports: number;
}

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("7days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [activeMetricModal, setActiveMetricModal] = useState<MetricType | null>(null);

  const [stats, setStats] = useState<AdminDashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalViews: 0,
    newUsersThisMonth: 0,
    engagementRate: 0,
    userGrowth: {},
    pendingReports: 0,
  });

  const [topPosts, setTopPosts] = useState<TopPost[]>([]);

  useEffect(() => {
    loadAllData();
  }, [timeRange, startDate, endDate]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build time range string. If custom dates are used, we might pass them differently.
      // Assuming backend statsApi gets updated to support ?startDate=xxx&endDate=yyy or a custom timeRange string
      const timeParam = startDate && endDate ? `custom_${startDate}_${endDate}` : timeRange;
      
      const [dashboardStats, reportStats, posts] = await Promise.all([
        statsApi.getDashboardStats(timeParam),
        reportsApi.getReportStats(),
        statsApi.getTopPosts(5),
      ]);

      setStats({
        ...dashboardStats,
        pendingReports: reportStats.pendingReports,
      });
      setTopPosts(posts);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError(t("adminPanel.dashboard.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString(getLocaleTag());

  const metricCards = useMemo(
    () => [
      {
        title: "TỔNG NGƯỜI DÙNG",
        value: fmt(stats.totalUsers),
        icon: Users,
        blobColor: "bg-indigo-50",
        titleColor: "text-indigo-600",
        type: "TOTAL_USERS" as MetricType,
      },
      {
        title: "NGƯỜI DÙNG MỚI",
        value: fmt(stats.newUsersThisMonth || 0),
        icon: UserPlus,
        blobColor: "bg-blue-50",
        titleColor: "text-blue-600",
        type: "NEW_USERS" as MetricType,
      },
      {
        title: "BÁO CÁO CẦN DUYỆT",
        value: stats.pendingReports.toString(),
        icon: AlertCircle,
        blobColor: "bg-red-50",
        titleColor: "text-red-600",
        type: "PENDING_REPORTS" as MetricType,
      },
      {
        title: "TỔNG BÀI VIẾT",
        value: fmt(stats.totalPosts),
        icon: Briefcase,
        blobColor: "bg-amber-50",
        titleColor: "text-amber-600",
        type: "TOTAL_POSTS" as MetricType,
      },
    ],
    [stats]
  );

  const pieData = useMemo(() => {
    return [
      { name: "Active", value: stats.activeUsers },
      { name: "Inactive", value: Math.max(0, stats.totalUsers - stats.activeUsers) },
    ];
  }, [stats]);
  const pieColors = ["#10B981", "#E5E7EB"];

  const barData = useMemo(() => {
    if (!stats.userGrowth) return [];
    
    return Object.entries(stats.userGrowth).map(([month, value]) => ({
      name: month,
      users: value,
    }));
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2 tracking-tight">
            Welcome back, {user?.fullName || "Admin"}! <span className="text-2xl">👋</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Here's what's happening in your network today.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 shadow-xs">
            <span className="text-xs text-gray-500 font-medium ml-1">Từ:</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setTimeRange(""); }}
              className="h-10 text-sm font-semibold focus:outline-none text-gray-700 bg-transparent"
            />
            <span className="text-xs text-gray-500 font-medium">Đến:</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setTimeRange(""); }}
              className="h-10 text-sm font-semibold focus:outline-none text-gray-700 bg-transparent"
            />
          </div>
          
          <select
            value={timeRange}
            onChange={(e) => {
              setTimeRange(e.target.value);
              if (e.target.value !== "") {
                setStartDate("");
                setEndDate("");
              }
            }}
            className="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm font-semibold focus:outline-none text-gray-700 shadow-xs"
          >
            <option value="" disabled hidden>Mốc cố định</option>
            <option value="7days">7 Ngày qua</option>
            <option value="30days">30 Ngày qua</option>
            <option value="90days">90 Ngày qua</option>
            <option value="1year">1 Năm qua</option>
          </select>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              onClick={() => setActiveMetricModal(card.type)}
              className="bg-white rounded-2xl p-6 border border-gray-200 relative overflow-hidden h-36 flex flex-col justify-between shadow-xs cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`absolute top-0 right-0 w-28 h-28 ${card.blobColor} rounded-bl-[60px] -mr-6 -mt-6 opacity-60 pointer-events-none transition-transform duration-500 group-hover:scale-110`}></div>
              <h3 className={`text-[11px] font-bold uppercase tracking-wider z-10 ${card.titleColor}`}>{card.title}</h3>
              <div className="flex items-end justify-between z-10">
                <span className="text-4xl font-extrabold text-gray-900 leading-none">{card.value}</span>
                <Icon className="w-6 h-6 text-gray-300 mb-1" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* User Status Pie */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Trạng thái người dùng</h3>
          <p className="text-xs text-gray-500 mb-4">Tổng cộng {fmt(stats.totalUsers)} người dùng</p>
          <div className="flex-1 min-h-[200px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="40%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Bar Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Tăng trưởng người dùng</h3>
              <p className="text-xs text-gray-500">Người dùng mới theo thời gian</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Users</span>
            </div>
          </div>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="users" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Area: Top Posts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs lg:col-span-2">
          <div className="border-b border-gray-100 flex gap-6 mb-4">
            <button className="pb-3 text-sm font-bold text-blue-600 border-b-2 border-blue-600">Bài viết thịnh hành ({topPosts.length})</button>
            <button className="pb-3 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors">Need Review</button>
          </div>
          <div className="space-y-2">
            {topPosts.length > 0 ? (
              topPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {post.authorName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{post.authorName}</p>
                      <p className="text-xs text-gray-500 truncate max-w-sm">{post.content}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-gray-900">{fmt(post.views)}</p>
                      <p className="text-[10px] text-gray-500 uppercase">Views</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-900">{fmt(post.likes)}</p>
                      <p className="text-[10px] text-gray-500 uppercase">Likes</p>
                    </div>
                    <button 
                      onClick={() => setSelectedPostId(post.id)}
                      className="text-xs font-bold text-blue-600 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      VIEW
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">Không có bài viết nào.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3 flex-1">
            <a href="/admin/users" className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group border border-transparent hover:border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Users className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-gray-700 group-hover:text-gray-900">Quản lý người dùng</span>
              </div>
            </a>
            <a href="/admin/posts" className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group border border-transparent hover:border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-gray-700 group-hover:text-gray-900">Quản lý bài viết</span>
              </div>
            </a>
            <a href="/admin/reports" className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group border border-transparent hover:border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-gray-700 group-hover:text-gray-900">Báo cáo vi phạm</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      <PostPreviewModal 
        postId={selectedPostId} 
        onClose={() => setSelectedPostId(null)} 
      />

      <MetricDetailsModal 
        type={activeMetricModal}
        timeRange={timeRange}
        startDate={startDate}
        endDate={endDate}
        onClose={() => setActiveMetricModal(null)}
        onPostClick={(id) => {
          setActiveMetricModal(null);
          setSelectedPostId(id);
        }}
      />
    </div>
  );
}
