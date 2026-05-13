import React, { useEffect, useState } from "react";
import { X, Loader2, Users, UserPlus, AlertCircle, Briefcase, ExternalLink } from "lucide-react";
import { usersApi, type User } from "../../apis/users";
import { reportsApi, type Report } from "../../apis/reports";
import { postsApi, type PostData } from "../../apis/posts";

export type MetricType = "TOTAL_USERS" | "NEW_USERS" | "PENDING_REPORTS" | "TOTAL_POSTS";

interface MetricDetailsModalProps {
  type: MetricType | null;
  timeRange: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  onClose: () => void;
  onPostClick?: (postId: string) => void;
}

export const MetricDetailsModal: React.FC<MetricDetailsModalProps> = ({
  type,
  timeRange,
  startDate,
  endDate,
  onClose,
  onPostClick
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (!type) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Calculate date bounds
        let calculatedStart = new Date(0);
        let calculatedEnd = new Date();
        
        if (timeRange === "7days") {
          calculatedStart = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
          calculatedStart.setHours(0, 0, 0, 0);
        } else if (timeRange === "30days") {
          calculatedStart = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
          calculatedStart.setHours(0, 0, 0, 0);
        } else if (timeRange === "90days") {
          calculatedStart = new Date(Date.now() - 89 * 24 * 60 * 60 * 1000);
          calculatedStart.setHours(0, 0, 0, 0);
        } else if (timeRange === "1year") {
          calculatedStart = new Date();
          calculatedStart.setMonth(calculatedStart.getMonth() - 11);
          calculatedStart.setDate(1);
          calculatedStart.setHours(0, 0, 0, 0);
        } else if (startDate && endDate) {
          calculatedStart = new Date(startDate);
          calculatedEnd = new Date(endDate);
          calculatedEnd.setHours(23, 59, 59, 999);
        }

        const isDateInRange = (dateString: string | undefined) => {
          if (!dateString) return false;
          const created = new Date(dateString);
          return created >= calculatedStart && created <= calculatedEnd;
        };

        if (type === "TOTAL_USERS") {
          const users = await usersApi.getAllUsers();
          setData(users);
        } else if (type === "NEW_USERS") {
          const users = await usersApi.getAllUsers();
          setData(users.filter(u => isDateInRange(u.createdAt)));
        } else if (type === "PENDING_REPORTS") {
          const reports = await reportsApi.getPendingReports();
          // Filter reports if a specific timeRange is selected
          if (timeRange || (startDate && endDate)) {
            setData(reports.filter(r => isDateInRange(r.createdAt)));
          } else {
            setData(reports);
          }
        } else if (type === "TOTAL_POSTS") {
          const posts = await postsApi.getAllPosts();
          if (timeRange || (startDate && endDate)) {
             setData(posts.filter(p => isDateInRange(p.createdAt)));
          } else {
             setData(posts);
          }
        }
      } catch (err: any) {
        console.error("Failed to load metric details:", err);
        setError("Không thể tải dữ liệu chi tiết. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, timeRange, startDate, endDate]);

  if (!type) return null;

  const getTitleInfo = () => {
    switch (type) {
      case "TOTAL_USERS":
        return { title: "Tổng Người Dùng", icon: <Users className="w-6 h-6 text-indigo-600" /> };
      case "NEW_USERS":
        return { title: "Người Dùng Mới", icon: <UserPlus className="w-6 h-6 text-blue-600" /> };
      case "PENDING_REPORTS":
        return { title: "Báo Cáo Cần Duyệt", icon: <AlertCircle className="w-6 h-6 text-red-600" /> };
      case "TOTAL_POSTS":
        return { title: "Tổng Bài Viết", icon: <Briefcase className="w-6 h-6 text-amber-600" /> };
    }
  };

  const { title, icon } = getTitleInfo();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all border border-slate-200/50 dark:border-slate-700/50">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600">
              {icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
              {!loading && !error && (
                <p className="text-sm font-medium text-slate-500">Tìm thấy {data.length} kết quả</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-slate-500 font-medium">Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-red-500">
              <p className="font-medium text-lg">{error}</p>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <p className="font-medium text-lg">Không có dữ liệu nào trong khoảng thời gian này.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                    {type === "TOTAL_USERS" || type === "NEW_USERS" ? (
                      <tr>
                        <th className="px-6 py-4">Người dùng</th>
                        <th className="px-6 py-4">Tên người dùng</th>
                        <th className="px-6 py-4">Trạng thái</th>
                        <th className="px-6 py-4 text-right">Ngày tham gia</th>
                      </tr>
                    ) : type === "PENDING_REPORTS" ? (
                      <tr>
                        <th className="px-6 py-4">Người báo cáo</th>
                        <th className="px-6 py-4">Lý do</th>
                        <th className="px-6 py-4">Mục tiêu</th>
                        <th className="px-6 py-4 text-right">Ngày báo cáo</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="px-6 py-4">Người đăng</th>
                        <th className="px-6 py-4">Nội dung</th>
                        <th className="px-6 py-4">Tương tác</th>
                        <th className="px-6 py-4 text-right">Ngày đăng</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {type === "TOTAL_USERS" || type === "NEW_USERS" ? (
                      data.map((user: User) => (
                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.fullName} className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                  {(user.fullName || user.username || "U").charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{user.fullName}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                            @{user.username}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              {user.isActive ? "Hoạt động" : "Bị khóa"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-slate-500 whitespace-nowrap">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}
                          </td>
                        </tr>
                      ))
                    ) : type === "PENDING_REPORTS" ? (
                      data.map((report: Report) => (
                        <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                            {report.reporterName}
                          </td>
                          <td className="px-6 py-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                            {report.reason}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 uppercase">
                              {report.targetType}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-slate-500 whitespace-nowrap">
                            {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : ""}
                          </td>
                        </tr>
                      ))
                    ) : (
                      data.map((post: PostData) => (
                        <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              {post.authorAvatar ? (
                                <img src={post.authorAvatar} alt={post.authorName} className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold">
                                  {(post.authorName || "U").charAt(0).toUpperCase()}
                                </div>
                              )}
                              <p className="font-semibold text-slate-900 dark:text-white">{post.authorName || "Unknown"}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                            {post.content || "Chỉ có hình ảnh/video"}
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs">
                            <div className="flex space-x-3">
                              <span title="Likes">❤️ {post.likeCount || 0}</span>
                              <span title="Comments">💬 {post.commentCount || 0}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-slate-500 whitespace-nowrap flex justify-end items-center space-x-3">
                            <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""}</span>
                            {onPostClick && post.id && (
                              <button 
                                onClick={() => onPostClick(post.id as string)}
                                className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                title="Xem chi tiết"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
