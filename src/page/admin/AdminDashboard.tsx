import {
  Users,
  CheckCircle2,
  FileText,
  AlertCircle,
  BarChart3,
  ArrowUpRight,
  Eye,
  MessageSquare,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  statsApi,
  type DashboardStats,
  type TopPost,
  type EngagementStats,
} from "../../apis/stats";
import { reportsApi } from "../../apis/reports";

interface AdminDashboardStats extends DashboardStats {
  pendingReports: number;
}

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState("7days");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const [engagementStats, setEngagementStats] =
    useState<EngagementStats | null>(null);

  useEffect(() => {
    loadAllData();
  }, [timeRange]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboardStats, reportStats, posts, engagement] = await Promise.all([
        statsApi.getDashboardStats(),
        reportsApi.getReportStats(),
        statsApi.getTopPosts(3),
        statsApi.getEngagementStats(),
      ]);

      setStats({
        ...dashboardStats,
        pendingReports: reportStats.pendingReports,
      });
      setTopPosts(posts);
      setEngagementStats(engagement);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Không thể tải dữ liệu tổng quan");
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards = [
    {
      icon: Users,
      label: "Tổng người dùng",
      value: stats.totalUsers.toLocaleString(),
      change: "+12.5%",
      changeType: "positive",
      color: "#3B82F6",
    },
    {
      icon: CheckCircle2,
      label: "Đang hoạt động",
      value: stats.activeUsers.toLocaleString(),
      change: "+8.2%",
      changeType: "positive",
      color: "#10B981",
    },
    {
      icon: FileText,
      label: "Tổng bài viết",
      value: stats.totalPosts.toLocaleString(),
      change: "+15.3%",
      changeType: "positive",
      color: "#F59E0B",
    },
    {
      icon: AlertCircle,
      label: "Báo cáo chờ xử lý",
      value: stats.pendingReports.toString(),
      change: "Cần xem xét",
      changeType: "warning",
      color: "#EF4444",
    },
  ];

  const overviewStats = [
    {
      label: "Tổng lượt xem",
      value: stats.totalViews.toLocaleString(),
      change: "+15.3%",
      icon: Eye,
      color: "#3B82F6",
    },
    {
      label: "Người dùng mới",
      value: stats.newUsersThisMonth.toLocaleString(),
      change: "+8.7%",
      icon: Users,
      color: "#10B981",
    },
    {
      label: "Bài viết",
      value: stats.totalPosts.toLocaleString(),
      change: "+22.1%",
      icon: FileText,
      color: "#F59E0B",
    },
    {
      label: "Bình luận",
      value: stats.totalComments.toLocaleString(),
      change: "+12.4%",
      icon: MessageSquare,
      color: "#EF4444",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">
            Đang tải dữ liệu tổng quan...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={loadAllData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Tổng quan & Thống kê
          </h1>
          <p className="text-gray-600 text-lg">
            Theo dõi các chỉ số quan trọng và hoạt động của hệ thống
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="h-12 px-6 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer shadow-sm"
        >
          <option value="7days">7 ngày qua</option>
          <option value="30days">30 ngày qua</option>
          <option value="90days">90 ngày qua</option>
          <option value="1year">1 năm qua</option>
        </select>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="group bg-white rounded-2xl shadow-sm p-6 hover:shadow-xl hover:-translate-y-1 transition-all border border-gray-100 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: stat.color + "15" }}
                >
                  <Icon className="w-7 h-7" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2 font-medium">
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-3">
                {stat.value}
              </p>
              <div className="flex items-center gap-1">
                {stat.changeType === "positive" && (
                  <>
                    <ArrowUpRight
                      className="w-4 h-4"
                      style={{ color: stat.color }}
                    />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: stat.color }}
                    >
                      {stat.change}
                    </span>
                  </>
                )}
                {stat.changeType === "warning" && (
                  <span className="text-sm font-semibold text-red-600">
                    {stat.change}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="group bg-white rounded-2xl shadow-sm p-6 hover:shadow-xl hover:-translate-y-1 transition-all border border-gray-100 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: stat.color + "20" }}
                >
                  <Icon className="w-7 h-7" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-base text-gray-600 mb-2 font-medium">
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {stat.value}
              </p>
              <p
                className="text-base font-semibold flex items-center gap-1"
                style={{ color: stat.color }}
              >
                <ArrowUpRight className="w-5 h-5" />
                {stat.change}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Tăng trưởng người dùng
          </h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {Object.entries(stats.userGrowth).map(([month, value]) => {
              const max = Math.max(...Object.values(stats.userGrowth));
              const height = (value / max) * 100;
              return (
                <div
                  key={month}
                  className="flex-1 rounded-t-lg hover:opacity-80 transition-opacity cursor-pointer group relative"
                  style={{
                    height: `${height}%`,
                    background: `linear-gradient(to top, #3B82F6, #60A5FA)`,
                  }}
                  title={`${month}: ${value.toLocaleString()} người`}
                >
                  <div className="absolute -top-8 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 text-center whitespace-nowrap">
                    {value.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-6 text-sm text-gray-600 font-medium">
            {Object.keys(stats.userGrowth).map((month) => (
              <span key={month}>{month}</span>
            ))}
          </div>
        </div>

        {/* Engagement Chart */}
        {engagementStats && (
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Mức độ tương tác
            </h3>
            <div className="space-y-6">
              {Object.entries(engagementStats.metrics).map(([label, value]) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-base font-semibold text-gray-700">
                      {label}
                    </span>
                    <span className="text-base font-bold text-gray-900">
                      {value}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${value}%`,
                        background: `linear-gradient(to right, #3B82F6, #10B981)`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics Section */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-sm p-8 border border-blue-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Tóm tắt chỉ số chính
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: "Tổng người dùng",
              value: stats.totalUsers,
              unit: "người",
              color: "#3B82F6",
            },
            {
              label: "Người dùng hoạt động",
              value: stats.activeUsers,
              unit: "người",
              color: "#10B981",
            },
            {
              label: "Tổng bài viết",
              value: stats.totalPosts,
              unit: "bài",
              color: "#F59E0B",
            },
            {
              label: "Tổng bình luận",
              value: stats.totalComments,
              unit: "bình luận",
              color: "#EF4444",
            },
          ].map((metric, index) => (
            <div key={index} className="text-center">
              <div
                className="w-20 h-20 rounded-xl mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: metric.color + "20" }}
              >
                <span
                  className="text-2xl font-bold"
                  style={{ color: metric.color }}
                >
                  {metric.value >= 1000
                    ? (metric.value / 1000).toFixed(1) + "K"
                    : metric.value}
                </span>
              </div>
              <p className="text-sm text-gray-700 font-medium">
                {metric.label}
              </p>
              <p className="text-xs text-gray-500 mt-1">{metric.unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Posts */}
      <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Bài viết nổi bật
        </h2>
        <div className="space-y-4">
          {topPosts.length > 0 ? (
            topPosts.map((post, index) => (
              <div
                key={post.id}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, #3B82F6, #10B981)`,
                  }}
                >
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg text-gray-900">
                    {post.authorName}
                  </p>
                  <p className="text-base text-gray-600">{post.content}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-lg text-gray-900">
                    {post.views.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">lượt xem</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-lg text-gray-900">
                    {post.likes.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">likes</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">Không có bài viết</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Hành động nhanh
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Users,
              label: "Quản lý người dùng",
              desc: "Xem và quản lý tài khoản",
              link: "/admin/users",
              color: "#3B82F6",
            },
            {
              icon: FileText,
              label: "Quản lý bài viết",
              desc: "Kiểm duyệt nội dung",
              link: "/admin/posts",
              color: "#F59E0B",
            },
            {
              icon: AlertCircle,
              label: "Xử lý báo cáo",
              desc: `${stats.pendingReports} báo cáo chờ`,
              link: "/admin/reports",
              color: "#EF4444",
            },
            {
              icon: BarChart3,
              label: "Chi tiết thống kê",
              desc: "Phân tích chuyên sâu",
              link: "#",
              color: "#10B981",
            },
          ].map((action, index) => {
            const Icon = action.icon;
            return (
              <a
                key={index}
                href={action.link}
                className="p-6 rounded-2xl bg-gray-50 hover:shadow-lg transition-all text-center hover:bg-white group cursor-pointer border border-transparent hover:border-gray-100"
              >
                <div
                  className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: action.color + "15" }}
                >
                  <Icon
                    className="w-8 h-8"
                    style={{ color: action.color }}
                  />
                </div>
                <p className="font-bold text-lg text-gray-900 mb-1">
                  {action.label}
                </p>
                <p className="text-sm text-gray-600">{action.desc}</p>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
