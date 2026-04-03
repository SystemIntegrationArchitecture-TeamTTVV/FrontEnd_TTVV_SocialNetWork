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
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  statsApi,
  type DashboardStats,
  type TopPost,
  type EngagementStats,
} from "../../apis/stats";
import { reportsApi } from "../../apis/reports";
import { getLocaleTag } from "../../i18n";

interface AdminDashboardStats extends DashboardStats {
  pendingReports: number;
}

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
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
      setError(t("adminPanel.dashboard.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString(getLocaleTag());

  const dashboardCards = useMemo(
    () => [
      {
        icon: Users,
        label: t("adminPanel.dashboard.cardTotalUsers"),
        value: fmt(stats.totalUsers),
        change: "+12.5%",
        changeType: "positive" as const,
        color: "#3B82F6",
      },
      {
        icon: CheckCircle2,
        label: t("adminPanel.dashboard.cardActiveUsers"),
        value: fmt(stats.activeUsers),
        change: "+8.2%",
        changeType: "positive" as const,
        color: "#10B981",
      },
      {
        icon: FileText,
        label: t("adminPanel.dashboard.cardTotalPosts"),
        value: fmt(stats.totalPosts),
        change: "+15.3%",
        changeType: "positive" as const,
        color: "#F59E0B",
      },
      {
        icon: AlertCircle,
        label: t("adminPanel.dashboard.cardPendingReports"),
        value: stats.pendingReports.toString(),
        change: t("adminPanel.dashboard.needsReview"),
        changeType: "warning" as const,
        color: "#EF4444",
      },
    ],
    [stats, t, i18n.language],
  );

  const overviewStats = useMemo(
    () => [
      {
        label: t("adminPanel.dashboard.overviewTotalViews"),
        value: fmt(stats.totalViews),
        change: "+15.3%",
        icon: Eye,
        color: "#3B82F6",
      },
      {
        label: t("adminPanel.dashboard.overviewNewUsers"),
        value: fmt(stats.newUsersThisMonth),
        change: "+8.7%",
        icon: Users,
        color: "#10B981",
      },
      {
        label: t("adminPanel.dashboard.overviewPosts"),
        value: fmt(stats.totalPosts),
        change: "+22.1%",
        icon: FileText,
        color: "#F59E0B",
      },
      {
        label: t("adminPanel.dashboard.overviewComments"),
        value: fmt(stats.totalComments),
        change: "+12.4%",
        icon: MessageSquare,
        color: "#EF4444",
      },
    ],
    [stats, t, i18n.language],
  );

  const keyMetrics = useMemo(
    () => [
      {
        label: t("adminPanel.dashboard.cardTotalUsers"),
        value: stats.totalUsers,
        unit: t("adminPanel.dashboard.unitPeople"),
        color: "#3B82F6",
      },
      {
        label: t("adminPanel.dashboard.cardActiveUsers"),
        value: stats.activeUsers,
        unit: t("adminPanel.dashboard.unitPeople"),
        color: "#10B981",
      },
      {
        label: t("adminPanel.dashboard.cardTotalPosts"),
        value: stats.totalPosts,
        unit: t("adminPanel.dashboard.unitPosts"),
        color: "#F59E0B",
      },
      {
        label: t("adminPanel.dashboard.overviewComments"),
        value: stats.totalComments,
        unit: t("adminPanel.dashboard.unitComments"),
        color: "#EF4444",
      },
    ],
    [stats, t, i18n.language],
  );

  const quickActions = useMemo(
    () => [
      {
        icon: Users,
        label: t("adminPanel.dashboard.manageUsers"),
        desc: t("adminPanel.dashboard.manageUsersDesc"),
        link: "/admin/users",
        color: "#3B82F6",
      },
      {
        icon: FileText,
        label: t("adminPanel.dashboard.managePosts"),
        desc: t("adminPanel.dashboard.managePostsDesc"),
        link: "/admin/posts",
        color: "#F59E0B",
      },
      {
        icon: AlertCircle,
        label: t("adminPanel.dashboard.manageReports"),
        desc: t("adminPanel.dashboard.manageReportsDesc", {
          count: stats.pendingReports,
        }),
        link: "/admin/reports",
        color: "#EF4444",
      },
      {
        icon: BarChart3,
        label: t("adminPanel.dashboard.statsDetails"),
        desc: t("adminPanel.dashboard.statsDetailsDesc"),
        link: "#",
        color: "#10B981",
      },
    ],
    [stats.pendingReports, t, i18n.language],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">{t("adminPanel.dashboard.loading")}</p>
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
            type="button"
            onClick={loadAllData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("adminPanel.dashboard.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t("adminPanel.dashboard.title")}</h1>
          <p className="text-gray-600 text-lg">{t("adminPanel.dashboard.subtitle")}</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="h-12 px-6 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer shadow-sm"
        >
          <option value="7days">{t("adminPanel.dashboard.range7")}</option>
          <option value="30days">{t("adminPanel.dashboard.range30")}</option>
          <option value="90days">{t("adminPanel.dashboard.range90")}</option>
          <option value="1year">{t("adminPanel.dashboard.range1y")}</option>
        </select>
      </div>

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
              <p className="text-sm text-gray-600 mb-2 font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mb-3">{stat.value}</p>
              <div className="flex items-center gap-1">
                {stat.changeType === "positive" && (
                  <>
                    <ArrowUpRight className="w-4 h-4" style={{ color: stat.color }} />
                    <span className="text-sm font-semibold" style={{ color: stat.color }}>
                      {stat.change}
                    </span>
                  </>
                )}
                {stat.changeType === "warning" && (
                  <span className="text-sm font-semibold text-red-600">{stat.change}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
              <p className="text-base text-gray-600 mb-2 font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
              <p className="text-base font-semibold flex items-center gap-1" style={{ color: stat.color }}>
                <ArrowUpRight className="w-5 h-5" />
                {stat.change}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{t("adminPanel.dashboard.userGrowthChart")}</h3>
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
                  title={t("adminPanel.dashboard.growthTooltip", {
                    month,
                    count: fmt(value),
                  })}
                >
                  <div className="absolute -top-8 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 text-center whitespace-nowrap">
                    {fmt(value)}
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

        {engagementStats && (
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">{t("adminPanel.dashboard.engagement")}</h3>
            <div className="space-y-6">
              {Object.entries(engagementStats.metrics).map(([label, value]) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-base font-semibold text-gray-700">{label}</span>
                    <span className="text-base font-bold text-gray-900">{value}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${value}%`,
                        background: `linear-gradient(to right, #3B82F6, #10B981)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-sm p-8 border border-blue-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">{t("adminPanel.dashboard.keyMetrics")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {keyMetrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div
                className="w-20 h-20 rounded-xl mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: metric.color + "20" }}
              >
                <span className="text-2xl font-bold" style={{ color: metric.color }}>
                  {metric.value >= 1000 ? (metric.value / 1000).toFixed(1) + "K" : metric.value}
                </span>
              </div>
              <p className="text-sm text-gray-700 font-medium">{metric.label}</p>
              <p className="text-xs text-gray-500 mt-1">{metric.unit}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("adminPanel.dashboard.topPosts")}</h2>
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
                  <p className="font-bold text-lg text-gray-900">{post.authorName}</p>
                  <p className="text-base text-gray-600">{post.content}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-lg text-gray-900">{fmt(post.views)}</p>
                  <p className="text-sm text-gray-500">{t("adminPanel.dashboard.viewsLabel")}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-lg text-gray-900">{fmt(post.likes)}</p>
                  <p className="text-sm text-gray-500">{t("adminPanel.dashboard.likesLabel")}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">{t("adminPanel.dashboard.noPosts")}</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("adminPanel.dashboard.quickActions")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
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
                  <Icon className="w-8 h-8" style={{ color: action.color }} />
                </div>
                <p className="font-bold text-lg text-gray-900 mb-1">{action.label}</p>
                <p className="text-sm text-gray-600">{action.desc}</p>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
