import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Flag,
  Loader2,
  AlertCircle,
  Trash2,
  Lock,
  Unlock,
  ShieldAlert,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { reportsApi, type Report } from "../../apis/reports";
import { usersApi, type User } from "../../apis/users";
import { postsApi, type PostData } from "../../apis/posts";
import { groupsApi, type GroupData } from "../../apis/groupsApi";
import { notificationsApi } from "../../apis/notifications";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminReports() {
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [previewPost, setPreviewPost] = useState<PostData | null>(null);
  const [previewUser, setPreviewUser] = useState<User | null>(null);
  const [previewGroup, setPreviewGroup] = useState<GroupData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [auditNote, setAuditNote] = useState("");
  
  type EnforcementAction = {
    type: "hide_post" | "unhide_post" | "delete_post" | "lock_comments" | "ban_user" | "delete_user" | "hide_group" | "delete_group";
    targetId: string;
    label: string;
  };
  const [showEnforcementDialog, setShowEnforcementDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<EnforcementAction | null>(null);

  const [reportStats, setReportStats] = useState({
    total: 0,
    pending: 0,
    reviewing: 0,
    resolved: 0,
    rejected: 0,
  });

  const priorityLabel = useCallback(
    (p: string) => {
      if (p === "high") return t("adminPanel.reports.priorityHigh");
      if (p === "medium") return t("adminPanel.reports.priorityMedium");
      return t("adminPanel.reports.priorityLow");
    },
    [t],
  );

  const statusLabel = useCallback(
    (s: string) => {
      switch (s) {
        case "pending":
          return t("adminPanel.reports.statusPending");
        case "reviewing":
          return t("adminPanel.reports.statusReviewing");
        case "resolved":
          return t("adminPanel.reports.statusResolved");
        default:
          return t("adminPanel.reports.statusRejected");
      }
    },
    [t],
  );

  const targetTypeLabel = useCallback(
    (type: string) => {
      switch (type) {
        case "post":
          return t("adminPanel.reports.targetPost");
        case "user":
          return t("adminPanel.reports.targetUser");
        case "group":
          return t("adminPanel.reports.targetGroup", "Nhóm");
        case "message":
          return t("adminPanel.reports.targetMessage");
        case "comment":
          return t("adminPanel.reports.targetComment");
        default:
          return type;
      }
    },
    [t],
  );

  const getTimeAgo = useCallback(
    (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (seconds < 60) return t("adminPanel.reports.timeJustNow");
      if (seconds < 3600)
        return t("adminPanel.reports.timeMinutesAgo", {
          count: Math.floor(seconds / 60),
        });
      if (seconds < 86400)
        return t("adminPanel.reports.timeHoursAgo", {
          count: Math.floor(seconds / 3600),
        });
      return t("adminPanel.reports.timeDaysAgo", {
        count: Math.floor(seconds / 86400),
      });
    },
    [t],
  );

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const [allReports, stats] = await Promise.all([
        reportsApi.getAllReports(),
        reportsApi.getReportStats(),
      ]);

      const userIdsToFetch = new Set<string>();
      allReports.forEach((r) => {
        if (r.reporterName && (r.reporterName.length === 24 || r.reporterName.length === 36)) {
          userIdsToFetch.add(r.reporterName);
        }
        if (r.targetType.toLowerCase() === "user" && r.targetName && (r.targetName.length === 24 || r.targetName.length === 36)) {
          userIdsToFetch.add(r.targetName);
        }
      });

      const usersMap: Record<string, string> = {};
      await Promise.all(
        Array.from(userIdsToFetch).map(async (id) => {
          try {
            const user = await usersApi.getUserById(id);
            if (user) {
              usersMap[id] = user.fullName || user.username || user.email || id;
            }
          } catch (e) {
            console.error("Failed to fetch user", id);
          }
        })
      );

      const isId = (str: string) => str && (str.length === 24 || str.length === 36 || str.includes("-"));

      const enrichedReports = allReports.map((report) => {
        let rName = usersMap[report.reporterName] || report.reporterName;
        let tName = report.targetName;

        if (report.targetType.toLowerCase() === "user") {
          tName = usersMap[report.targetName] || report.targetName;
        }

        if (!rName || rName.trim() === "" || rName.toLowerCase() === "anonymous" || isId(rName)) {
          rName = t("adminPanel.reports.anonymousUser", "Người dùng ẩn danh");
        }
        if (!tName || tName.trim() === "" || isId(tName)) {
          if (report.targetType.toLowerCase() === "user") {
            tName = t("adminPanel.reports.unknownUser", "Người dùng không xác định");
          } else {
            tName = t("adminPanel.reports.contentHidden", "Nội dung");
          }
        }

        return {
          ...report,
          reporterName: rName,
          targetName: tName,
        };
      });

      console.log("Loaded reports:", enrichedReports);
      setReports(enrichedReports);

      setReportStats({
        total: stats.totalReports,
        pending: stats.pendingReports,
        reviewing: stats.reviewingReports || 0,
        resolved: stats.resolvedReports,
        rejected: stats.rejectedReports,
      });
    } catch (err: unknown) {
      const errObj = err as Error;
      setError(errObj.message || t("adminPanel.reports.loadError"));
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReportStatus = async (
    reportId: string,
    newStatus: "reviewing" | "resolved" | "rejected",
    actionNote?: string
  ) => {
    try {
      setProcessingId(reportId);
      await reportsApi.updateReportStatus(reportId, newStatus, actionNote);

      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r)),
      );

      if (selectedReport?.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }

      const stats = await reportsApi.getReportStats();
      setReportStats({
        total: stats.totalReports,
        pending: stats.pendingReports,
        reviewing: 0,
        resolved: stats.resolvedReports,
        rejected: stats.rejectedReports,
      });
    } catch (err: unknown) {
      const errObj = err as Error;
      alert(
        t("adminPanel.reports.updateError", {
          message: errObj.message || t("calls.unknownError"),
        }),
      );
      console.error("Failed to update report:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const loadPreviewContent = async (report: Report) => {
    setLoadingPreview(true);
    setPreviewPost(null);
    setPreviewUser(null);
    setPreviewGroup(null);
    try {
      if (report.targetType.toLowerCase() === "post" && report.targetId) {
        const post = await postsApi.getPostById(report.targetId);
        setPreviewPost(post);
      } else if (report.targetType.toLowerCase() === "user" && report.targetId) {
        const user = await usersApi.getUserById(report.targetId);
        setPreviewUser(user);
      } else if (report.targetType.toLowerCase() === "group" && report.targetId) {
        const group = await groupsApi.getGroupById(report.targetId);
        setPreviewGroup(group);
      }
    } catch (e) {
      console.error("Failed to load preview content", e);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleOpenDetailModal = (report: Report) => {
    setSelectedReport(report);
    setAuditNote(report.actionTaken || "");
    setShowDetailModal(true);
    loadPreviewContent(report);
  };

  const executeEnforcementAction = async () => {
    if (!pendingAction || !selectedReport) return;
    try {
      setProcessingId(pendingAction.targetId);
      switch (pendingAction.type) {
        case "hide_post":
          await postsApi.hidePost(pendingAction.targetId);
          break;
        case "unhide_post":
          await postsApi.hidePost(pendingAction.targetId); // toggle – second call unhides
          break;
        case "delete_post":
          await postsApi.softDeletePost(pendingAction.targetId, auditNote || "Report resolution");
          break;
        case "lock_comments":
          await postsApi.lockComments(pendingAction.targetId);
          break;
        case "ban_user":
          await usersApi.updateUserStatus(pendingAction.targetId, "BANNED");
          break;
        case "delete_user":
          await usersApi.deleteUser(pendingAction.targetId);
          break;
        case "delete_group":
          await groupsApi.deleteGroup(pendingAction.targetId);
          break;
      }
      
      // Notify target user
      let recipientId = "";
      let title = "";
      let content = "";
      
      if (selectedReport.targetType.toLowerCase() === "post" && previewPost) {
        recipientId = previewPost.authorId || "";
        title = "Thông báo từ quản trị viên";
        if (pendingAction.type === "delete_post") content = "Bài viết của bạn đã bị xóa do vi phạm tiêu chuẩn cộng đồng.";
        if (pendingAction.type === "hide_post") content = "Bài viết của bạn đã bị ẩn do vi phạm tiêu chuẩn cộng đồng.";
        if (pendingAction.type === "unhide_post") content = "Bài viết của bạn đã được bỏ ẩn bởi quản trị viên sau khi xem xét.";
        if (pendingAction.type === "lock_comments") content = "Bài viết của bạn đã bị khóa bình luận do vi phạm tiêu chuẩn cộng đồng.";
      } else if (selectedReport.targetType.toLowerCase() === "user" && previewUser) {
        recipientId = previewUser.id;
        title = "Cảnh báo tài khoản";
        if (pendingAction.type === "ban_user") content = "Tài khoản của bạn đã bị khóa do vi phạm tiêu chuẩn cộng đồng.";
      } else if (selectedReport.targetType.toLowerCase() === "group" && previewGroup) {
        recipientId = previewGroup.adminId || "";
        title = "Cảnh báo nhóm";
        if (pendingAction.type === "delete_group") content = `Nhóm "${previewGroup.name}" của bạn đã bị xóa do vi phạm tiêu chuẩn cộng đồng.`;
      }

      if (recipientId && currentUser) {
        try {
            await notificationsApi.createNotification({
              recipientId,
              actorId: currentUser.id,
              type: "SYSTEM_WARNING",
              title,
              content,
              relatedId: selectedReport.id,
              relatedType: "REPORT"
            });
        } catch(err) {
            console.error("Failed to send notification", err);
        }
      }

      // Auto resolve report
      await handleUpdateReportStatus(selectedReport.id, "resolved", auditNote);
      setShowEnforcementDialog(false);
      setPendingAction(null);
      // alert("Thực thi thành công!");
      setShowDetailModal(false);
    } catch (e: any) {
      alert("Lỗi thực thi: " + e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesStatus =
      filterStatus === "all" || report.status === filterStatus;
    const matchesSearch =
      report.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.targetName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t("adminPanel.reports.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t("adminPanel.reports.pageTitle")}
          </h1>
          <p className="text-lg text-gray-600">
            {t("adminPanel.reports.pageSubtitle")}
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="px-4 py-3 bg-red-50 rounded-xl border border-red-100">
            <p className="text-xs text-gray-600 font-medium">
              {t("adminPanel.reports.statPending")}
            </p>
            <p className="text-2xl font-bold text-red-600">
              {reportStats.pending}
            </p>
          </div>
          <div className="px-4 py-3 bg-green-50 rounded-xl border border-green-100">
            <p className="text-xs text-gray-600 font-medium">
              {t("adminPanel.reports.statResolved")}
            </p>
            <p className="text-2xl font-bold text-green-600">
              {reportStats.resolved}
            </p>
          </div>
          <div className="px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-gray-600 font-medium">
              {t("adminPanel.reports.statReviewing")}
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {reportStats.reviewing}
            </p>
          </div>
          <div className="px-4 py-3 bg-red-50 rounded-xl border border-red-200">
            <p className="text-xs text-gray-600 font-medium">
              {t("adminPanel.reports.statRejected")}
            </p>
            <p className="text-2xl font-bold text-red-600">
              {reportStats.rejected}
            </p>
          </div>
          <div className="px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-gray-600 font-medium">
              {t("adminPanel.reports.statTotal")}
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {reportStats.total}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 font-medium">
          {error}
          <button
            type="button"
            onClick={loadReports}
            className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t("common.retry")}
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t("adminPanel.reports.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-5 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-base transition-all"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-12 px-5 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-medium cursor-pointer"
            >
              <option value="all">{t("adminPanel.reports.filterAll")}</option>
              <option value="pending">
                {t("adminPanel.reports.statusPending")}
              </option>
              <option value="reviewing">
                {t("adminPanel.reports.statusReviewing")}
              </option>
              <option value="resolved">
                {t("adminPanel.reports.statusResolved")}
              </option>
              <option value="rejected">
                {t("adminPanel.reports.statusRejected")}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
            <Flag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">{t("adminPanel.reports.empty")}</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all border-l-4 border border-gray-100"
              style={{
                borderLeftColor:
                  report.priority === "high"
                    ? "#EF4444"
                    : report.priority === "medium"
                      ? "#F59E0B"
                      : "#10B981",
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor:
                        report.priority === "high" ? "#EF444420" : "#F59E0B20",
                    }}
                  >
                    <Flag
                      className="w-7 h-7"
                      style={{
                        color:
                          report.priority === "high" ? "#EF4444" : "#F59E0B",
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-bold text-lg text-gray-900">
                        {report.type}
                      </p>
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${report.priority === "high"
                            ? "bg-red-100 text-red-700"
                            : report.priority === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                      >
                        {priorityLabel(report.priority)}
                      </span>
                    </div>
                    <p className="text-base text-gray-600">{report.reason}</p>
                  </div>
                </div>
                <span
                  className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap ${report.status === "pending"
                      ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                      : report.status === "reviewing"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : report.status === "resolved"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                >
                  {statusLabel(report.status)}
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      {t("adminPanel.reports.reporter")}
                    </p>
                    <p className="text-base font-medium text-gray-900 break-all">
                      {report.reporterName}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      {t("adminPanel.reports.target")}
                    </p>
                    <div className="text-base text-gray-900 break-all">
                      <span className="font-semibold text-blue-600 mr-2 uppercase text-sm">{targetTypeLabel(report.targetType)}</span>
                      <span className="font-medium">{report.targetName}</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      {t("adminPanel.reports.reportTime")}
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {getTimeAgo(report.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 font-medium">
                  {t("adminPanel.reports.reportId")}{" "}
                  <span className="font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded ml-1">{report.id}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDetailModal(report)}
                    title={t("adminPanel.posts.viewDetail")}
                    className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors border border-blue-100"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  {report.status === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateReportStatus(report.id, "reviewing")
                        }
                        disabled={processingId === report.id}
                        title={t("adminPanel.reports.titleReview")}
                        className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors border border-blue-100 disabled:opacity-50"
                      >
                        {processingId === report.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <AlertCircle className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateReportStatus(report.id, "resolved")
                        }
                        disabled={processingId === report.id}
                        title={t("adminPanel.reports.titleResolve")}
                        className="w-10 h-10 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors border border-green-100 disabled:opacity-50"
                      >
                        {processingId === report.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateReportStatus(report.id, "rejected")
                        }
                        disabled={processingId === report.id}
                        title={t("adminPanel.reports.titleReject")}
                        className="w-10 h-10 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors border border-red-200 disabled:opacity-50"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-7xl w-full h-[90vh] flex flex-col overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-white shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                {t("adminPanel.reports.modalTitle")}
              </h2>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
              <div className="flex flex-col lg:flex-row gap-6 h-full">
                {/* Panel 1: Report Info & Timeline */}
                <div className="w-full lg:w-1/3 flex flex-col gap-6">
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{t("adminPanel.reports.sectionReport")}</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Loại vi phạm</p>
                        <p className="text-base font-semibold text-gray-900">{selectedReport.type}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Mức độ ưu tiên</p>
                        <span className={`px-3 py-1 rounded-lg text-sm font-semibold inline-block mt-1 ${selectedReport.priority === "high" ? "bg-red-100 text-red-700" : selectedReport.priority === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                          {priorityLabel(selectedReport.priority)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Người báo cáo</p>
                        <p className="text-sm font-medium text-gray-900">{selectedReport.reporterName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Chi tiết vi phạm</p>
                        <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-1 whitespace-pre-wrap">{selectedReport.reason}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{t("adminPanel.reports.sectionTimeline", "Tiến trình xử lý")}</h3>
                    <ol className="relative border-l-2 border-gray-200 ml-3 space-y-4">
                      <li className="ml-5">
                        <span className="absolute -left-2.5 w-4 h-4 rounded-full bg-yellow-400 border-2 border-white flex items-center justify-center" />
                        <p className="text-sm font-semibold text-gray-800">Tạo báo cáo</p>
                        <p className="text-xs text-gray-500">{new Date(selectedReport.createdAt).toLocaleString("vi-VN")}</p>
                      </li>
                      {selectedReport.reviewedAt && (
                        <li className="ml-5">
                          <span className="absolute -left-2.5 w-4 h-4 rounded-full bg-blue-400 border-2 border-white" />
                          <p className="text-sm font-semibold text-gray-800">Đang xem xét</p>
                          <p className="text-xs text-gray-500">{new Date(selectedReport.reviewedAt).toLocaleString("vi-VN")}</p>
                        </li>
                      )}
                      {selectedReport.resolvedAt && (
                        <li className="ml-5">
                          <span className={`absolute -left-2.5 w-4 h-4 rounded-full border-2 border-white ${selectedReport.status === "resolved" ? "bg-green-500" : "bg-red-400"}`} />
                          <p className="text-sm font-semibold text-gray-800">
                            {selectedReport.status === "resolved" ? "Đã giải quyết" : "Đã từ chối"}
                          </p>
                          <p className="text-xs text-gray-500">{new Date(selectedReport.resolvedAt).toLocaleString("vi-VN")}</p>
                        </li>
                      )}
                    </ol>
                  </div>
                </div>

                {/* Panel 2: Target Content Preview */}
                <div className="w-full lg:w-1/3 flex flex-col">
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm h-full flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between">
                      {t("adminPanel.reports.sectionTarget", "Nội dung")}
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium uppercase tracking-wider">{targetTypeLabel(selectedReport.targetType)}</span>
                    </h3>
                    
                    <div className="flex-1 bg-gray-50 rounded-xl border border-gray-100 p-4 overflow-y-auto">
                      {loadingPreview ? (
                        <div className="h-full flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                      ) : selectedReport.targetType.toLowerCase() === "post" && previewPost ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                              {previewPost.authorName?.substring(0, 2).toUpperCase() || "U"}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-gray-900">{previewPost.authorName}</p>
                              <p className="text-xs text-gray-500">{new Date(previewPost.createdAt || "").toLocaleDateString("vi-VN")}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{previewPost.content}</p>
                          {previewPost.images && previewPost.images.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {previewPost.images.map((img, idx) => (
                                <img key={idx} src={img} className="w-full h-32 object-cover rounded-lg border border-gray-200" alt="" />
                              ))}
                            </div>
                          )}
                          <div className="flex flex-col gap-1 mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-500">Trạng thái bài viết:</p>
                            {previewPost.isDeleted ? (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-semibold w-max">Đã xóa mềm</span>
                            ) : previewPost.isHidden ? (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded font-semibold w-max">Đã ẩn (Shadowban)</span>
                            ) : (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-semibold w-max">Hợp lệ</span>
                            )}
                          </div>
                        </div>
                      ) : selectedReport.targetType.toLowerCase() === "user" && previewUser ? (
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                          <div className="flex items-center gap-4">
                            {previewUser.avatar ? (
                              <img
                                src={previewUser.avatar}
                                alt={previewUser.fullName}
                                className="w-16 h-16 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
                                {previewUser.fullName?.charAt(0)}
                              </div>
                            )}
                            <div>
                              <h4 className="font-semibold text-gray-900 text-lg">
                                {previewUser.fullName}
                              </h4>
                              <p className="text-gray-500 text-sm">
                                @{previewUser.username} • {previewUser.email}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    previewUser.status === "ACTIVE"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {previewUser.status}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-700 text-xs font-medium">
                                  {previewUser.role}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : selectedReport.targetType.toLowerCase() === "group" && previewGroup ? (
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                          <div className="flex items-center gap-4">
                            {previewGroup.coverImage ? (
                               <img src={previewGroup.coverImage} alt={previewGroup.name} className="w-16 h-16 rounded-xl object-cover" />
                            ) : (
                               <div className="w-16 h-16 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
                                 {previewGroup.name.charAt(0)}
                               </div>
                            )}
                            <div>
                              <h4 className="font-semibold text-gray-900 text-lg">{previewGroup.name}</h4>
                              <p className="text-gray-500 text-sm">{previewGroup.description}</p>
                              <div className="flex gap-2 mt-2 text-xs">
                                <span className="bg-gray-200 px-2 py-1 rounded">{previewGroup.privacy}</span>
                                <span className="bg-gray-200 px-2 py-1 rounded">{previewGroup.category}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-32 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-xl border-dashed">
                          <p className="text-gray-400">
                            Không tìm thấy nội dung xem trước
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Panel 3: Enforcement & Actions */}
                <div className="w-full lg:w-1/3 flex flex-col">
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm h-full flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-red-500" />
                      Quyết định xử lý
                    </h3>
                    
                    <div className="space-y-4 flex-1">
                      {selectedReport.status === "resolved" || selectedReport.status === "rejected" ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Ghi chú xử lý:</p>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {selectedReport.actionTaken || "Không có ghi chú."}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Ghi chú (Audit Note)</label>
                          <textarea
                            placeholder="Ghi lại lý do xử lý nội bộ..."
                            value={auditNote}
                            onChange={(e) => setAuditNote(e.target.value)}
                            className="w-full h-24 p-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                          />
                        </div>
                      )}

                      {/* POST ACTIONS */}
                      {selectedReport.targetType.toLowerCase() === "post" && previewPost && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Thực thi bài viết</p>
                          {previewPost.isDeleted ? (
                            <button
                              onClick={async () => {
                                setProcessingId(previewPost.id!);
                                await postsApi.restorePost(previewPost.id!);
                                setPreviewPost({...previewPost, isDeleted: false});
                                setProcessingId(null);
                              }}
                              disabled={processingId === previewPost.id}
                              className="w-full px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                              <Unlock className="w-4 h-4" /> Khôi phục bài viết
                            </button>
                          ) : previewPost.isHidden ? (
                            <>
                              <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg mb-1">
                                <p className="text-xs text-yellow-700 font-semibold">⚠ Bài viết đang bị ẩn (Shadowban)</p>
                              </div>
                              <button
                                onClick={() => { setPendingAction({ type: "unhide_post", targetId: selectedReport.targetId, label: "Bỏ ẩn bài viết" }); setShowEnforcementDialog(true); }}
                                className="w-full px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                              >
                                <Unlock className="w-4 h-4" /> Bỏ ẩn bài viết
                              </button>
                              <button
                                onClick={() => { setPendingAction({ type: "delete_post", targetId: selectedReport.targetId, label: "Xóa bài viết" }); setShowEnforcementDialog(true); }}
                                className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Xóa mềm bài viết
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => { setPendingAction({ type: "hide_post", targetId: selectedReport.targetId, label: "Ẩn bài viết" }); setShowEnforcementDialog(true); }}
                                className="w-full px-4 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" /> Ẩn bài viết (Shadowban)
                              </button>
                              <button
                                onClick={() => { setPendingAction({ type: "delete_post", targetId: selectedReport.targetId, label: "Xóa bài viết" }); setShowEnforcementDialog(true); }}
                                className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Xóa mềm bài viết
                              </button>
                              <button
                                onClick={() => { setPendingAction({ type: "lock_comments", targetId: selectedReport.targetId, label: "Khóa bình luận" }); setShowEnforcementDialog(true); }}
                                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                              >
                                <Lock className="w-4 h-4" /> Khóa bình luận
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* USER ACTIONS */}
                      {selectedReport.targetType.toLowerCase() === "user" && previewUser && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Thực thi người dùng</p>
                          {previewUser.status === "BANNED" ? (
                            <button
                              onClick={async () => {
                                setProcessingId(previewUser.id!);
                                await usersApi.updateUserStatus(previewUser.id!, "ACTIVE");
                                setPreviewUser({...previewUser, status: "ACTIVE"});
                                setProcessingId(null);
                              }}
                              disabled={processingId === previewUser.id}
                              className="w-full px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                              <Unlock className="w-4 h-4" /> Mở khóa tài khoản (Unban)
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => { setPendingAction({ type: "ban_user", targetId: selectedReport.targetId, label: "Khóa tài khoản" }); setShowEnforcementDialog(true); }}
                                className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                              >
                                <Lock className="w-4 h-4" /> Khóa tài khoản (Ban)
                              </button>
                              <button
                                onClick={() => { setPendingAction({ type: "delete_user", targetId: selectedReport.targetId, label: "Xóa tài khoản" }); setShowEnforcementDialog(true); }}
                                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Xóa tài khoản vĩnh viễn
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* GROUP ACTIONS */}
                      {selectedReport.targetType.toLowerCase() === "group" && previewGroup && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Thực thi nhóm</p>
                          {previewGroup.active === false ? (
                            <button
                              onClick={async () => {
                                setProcessingId(previewGroup.id!);
                                await groupsApi.toggleLock(previewGroup.id!);
                                setPreviewGroup({...previewGroup, active: true});
                                setProcessingId(null);
                              }}
                              disabled={processingId === previewGroup.id}
                              className="w-full px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                              <Unlock className="w-4 h-4" /> Khôi phục nhóm
                            </button>
                          ) : (
                             <button
                               onClick={() => { setPendingAction({ type: "delete_group", targetId: selectedReport.targetId, label: "Xóa nhóm vi phạm" }); setShowEnforcementDialog(true); }}
                               className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                             >
                               <Trash2 className="w-4 h-4" />
                               Xóa nhóm vi phạm
                             </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Vòng đời report */}
                    <div className="pt-4 border-t border-gray-100 mt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Xử lý vé báo cáo</p>
                      <div className="flex gap-2">
                        {selectedReport.status === "pending" && (
                          <button
                            onClick={() => { handleUpdateReportStatus(selectedReport.id, "reviewing", auditNote); setShowDetailModal(false); }}
                            disabled={processingId === selectedReport.id}
                            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex justify-center items-center"
                          >
                            {processingId === selectedReport.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Bắt đầu xem xét"}
                          </button>
                        )}
                        {selectedReport.status !== "resolved" && (
                          <button
                            onClick={() => { handleUpdateReportStatus(selectedReport.id, "resolved", auditNote); setShowDetailModal(false); }}
                            disabled={processingId === selectedReport.id}
                            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors flex justify-center items-center"
                          >
                            {processingId === selectedReport.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Chấp thuận (Chỉ đóng)"}
                          </button>
                        )}
                        {selectedReport.status !== "rejected" && (
                          <button
                            onClick={() => { handleUpdateReportStatus(selectedReport.id, "rejected", auditNote); setShowDetailModal(false); }}
                            disabled={processingId === selectedReport.id}
                            className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors flex justify-center items-center"
                          >
                            {processingId === selectedReport.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Bác bỏ"}
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enforcement Confirmation Dialog */}
      {showEnforcementDialog && pendingAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận thực thi</h3>
            <p className="text-sm text-gray-600 mb-4">Bạn đang chuẩn bị thực hiện: <span className="font-bold text-red-600">{pendingAction.label}</span>. Báo cáo này sẽ tự động được đánh dấu là <strong>Đã giải quyết</strong> sau khi hoàn tất. Bạn có chắc chắn không?</p>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowEnforcementDialog(false); setPendingAction(null); }}
                className="px-4 py-2 font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={executeEnforcementAction}
                disabled={processingId === pendingAction.targetId}
                className="px-4 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {processingId === pendingAction.targetId ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
