import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Flag,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { reportsApi, type Report } from "../../apis/reports";

export default function AdminReports() {
  const { t } = useTranslation();
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
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

      console.log("Loaded reports:", allReports);
      setReports(allReports);

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
  ) => {
    try {
      setProcessingId(reportId);
      await reportsApi.updateReportStatus(reportId, newStatus);

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          report.priority === "high"
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
                  className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap ${
                    report.status === "pending"
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      {t("adminPanel.reports.reporter")}
                    </p>
                    <p className="text-base text-gray-900">
                      {report.reporterName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      {t("adminPanel.reports.target")}
                    </p>
                    <p className="text-base text-gray-900">
                      {targetTypeLabel(report.targetType)} — {report.targetName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      {t("adminPanel.reports.reportTime")}
                    </p>
                    <p className="text-base text-gray-900">
                      {getTimeAgo(report.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {t("adminPanel.reports.reportId")}{" "}
                  <span className="font-mono">{report.id}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReport(report);
                      setShowDetailModal(true);
                    }}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
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
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {t("adminPanel.reports.sectionReport")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      {t("adminPanel.reports.reportType")}
                    </p>
                    <p className="text-base text-gray-900">
                      {selectedReport.type}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      {t("adminPanel.reports.priority")}
                    </p>
                    <span
                      className={`px-3 py-1 rounded-lg text-sm font-semibold inline-block ${
                        selectedReport.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : selectedReport.priority === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {priorityLabel(selectedReport.priority)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {t("adminPanel.reports.sectionReporter")}
                </h3>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-base font-semibold text-gray-900">
                    {selectedReport.reporterName}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {t("adminPanel.reports.sectionTarget")}
                </h3>
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      {t("adminPanel.reports.targetKind")}
                    </p>
                    <p className="text-base text-gray-900 capitalize">
                      {targetTypeLabel(selectedReport.targetType)}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      {t("adminPanel.reports.targetName")}
                    </p>
                    <p className="text-base text-gray-900">
                      {selectedReport.targetName}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {t("adminPanel.reports.sectionReason")}
                </h3>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-base text-gray-900 whitespace-pre-wrap">
                    {selectedReport.reason}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  {t("adminPanel.reports.currentStatus")}
                </p>
                <span
                  className={`px-4 py-2 rounded-lg font-semibold text-base inline-block ${
                    selectedReport.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : selectedReport.status === "reviewing"
                        ? "bg-blue-100 text-blue-700"
                        : selectedReport.status === "resolved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                  }`}
                >
                  {statusLabel(selectedReport.status)}
                </span>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  {t("adminPanel.reports.close")}
                </button>
                {selectedReport.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateReportStatus(
                          selectedReport.id,
                          "reviewing",
                        );
                        setShowDetailModal(false);
                      }}
                      disabled={processingId === selectedReport.id}
                      className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                      {t("adminPanel.reports.actionStartReview")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateReportStatus(selectedReport.id, "resolved");
                        setShowDetailModal(false);
                      }}
                      disabled={processingId === selectedReport.id}
                      className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                      {t("adminPanel.reports.actionResolve")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateReportStatus(selectedReport.id, "rejected");
                        setShowDetailModal(false);
                      }}
                      disabled={processingId === selectedReport.id}
                      className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                      {t("adminPanel.reports.actionReject")}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
