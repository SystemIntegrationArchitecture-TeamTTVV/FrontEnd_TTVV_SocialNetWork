import { useState, useEffect } from "react";
import {
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Flag,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { reportsApi, type Report } from "../../apis/reports";

export default function AdminReports() {
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
      const error = err as Error;
      setError(error.message || "Không thể tải danh sách báo cáo");
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

      // Update local state
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r)),
      );

      if (selectedReport?.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }

      // Reload stats
      const stats = await reportsApi.getReportStats();
      setReportStats({
        total: stats.totalReports,
        pending: stats.pendingReports,
        reviewing: 0,
        resolved: stats.resolvedReports,
        rejected: stats.rejectedReports,
      });
    } catch (err: unknown) {
      const error = err as Error;
      alert("Lỗi khi cập nhật báo cáo: " + (error.message || "Unknown error"));
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

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "vừa xong";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    return `${Math.floor(seconds / 86400)} ngày trước`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải danh sách báo cáo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quản lý báo cáo
          </h1>
          <p className="text-lg text-gray-600">
            Xem xét và xử lý các báo cáo từ người dùng
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="px-4 py-3 bg-red-50 rounded-xl border border-red-100">
            <p className="text-xs text-gray-600 font-medium">Chờ xử lý</p>
            <p className="text-2xl font-bold text-red-600">
              {reportStats.pending}
            </p>
          </div>
          <div className="px-4 py-3 bg-green-50 rounded-xl border border-green-100">
            <p className="text-xs text-gray-600 font-medium">Đã xử lý</p>
            <p className="text-2xl font-bold text-green-600">
              {reportStats.resolved}
            </p>
          </div>
          <div className="px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-gray-600 font-medium">Đang kiểm duyệt</p>
            <p className="text-2xl font-bold text-blue-600">
              {reportStats.reviewing}
            </p>
          </div>
          <div className="px-4 py-3 bg-red-50 rounded-xl border border-red-200">
            <p className="text-xs text-gray-600 font-medium">Đã bác bỏ</p>
            <p className="text-2xl font-bold text-red-600">
              {reportStats.rejected}
            </p>
          </div>
          <div className="px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-gray-600 font-medium">Tổng cộng</p>
            <p className="text-2xl font-bold text-blue-600">
              {reportStats.total}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 font-medium">
          {error}
          <button
            onClick={loadReports}
            className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm báo cáo..."
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
              <option value="all">Tất cả</option>
              <option value="pending">Chờ xử lý</option>
              <option value="reviewing">Đang kiểm duyệt</option>
              <option value="resolved">Đã xử lý</option>
              <option value="rejected">Đã bác bỏ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
            <Flag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Không tìm thấy báo cáo nào</p>
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
                        {report.priority === "high"
                          ? "Cao"
                          : report.priority === "medium"
                            ? "Trung bình"
                            : "Thấp"}
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
                  {report.status === "pending"
                    ? "Chờ xử lý"
                    : report.status === "reviewing"
                      ? "Đang kiểm duyệt"
                      : report.status === "resolved"
                        ? "Đã xử lý"
                        : "Bị bác bỏ"}
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Người báo cáo
                    </p>
                    <p className="text-base text-gray-900">
                      {report.reporterName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Đối tượng báo cáo
                    </p>
                    <p className="text-base text-gray-900">
                      {report.targetType === "post" && `Bài viết`}
                      {report.targetType === "user" && `Người dùng`}
                      {report.targetType === "message" && `Tin nhắn`}
                      {report.targetType === "comment" && `Bình luận`} -{" "}
                      {report.targetName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Thời gian báo cáo
                    </p>
                    <p className="text-base text-gray-900">
                      {getTimeAgo(report.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  ID báo cáo: <span className="font-mono">{report.id}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedReport(report);
                      setShowDetailModal(true);
                    }}
                    title="Xem chi tiết"
                    className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors border border-blue-100"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  {report.status === "pending" && (
                    <>
                      <button
                        onClick={() =>
                          handleUpdateReportStatus(report.id, "reviewing")
                        }
                        disabled={processingId === report.id}
                        title="Bắt đầu kiểm duyệt"
                        className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors border border-blue-100 disabled:opacity-50"
                      >
                        {processingId === report.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <AlertCircle className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateReportStatus(report.id, "resolved")
                        }
                        disabled={processingId === report.id}
                        title="Chấp nhận và xử lý"
                        className="w-10 h-10 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors border border-green-100 disabled:opacity-50"
                      >
                        {processingId === report.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateReportStatus(report.id, "rejected")
                        }
                        disabled={processingId === report.id}
                        title="Bác bỏ báo cáo"
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

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Chi tiết báo cáo</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Report Info */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Thông tin báo cáo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      Loại báo cáo
                    </p>
                    <p className="text-base text-gray-900">
                      {selectedReport.type}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      Độ ưu tiên
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
                      {selectedReport.priority === "high"
                        ? "Cao"
                        : selectedReport.priority === "medium"
                          ? "Trung bình"
                          : "Thấp"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reporter Info */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Thông tin người báo cáo
                </h3>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-base font-semibold text-gray-900">
                    {selectedReport.reporterName}
                  </p>
                </div>
              </div>

              {/* Target Info */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Dối tượng báo cáo
                </h3>
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Loại đối tượng
                    </p>
                    <p className="text-base text-gray-900 capitalize">
                      {selectedReport.targetType}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Tên / Tác giả
                    </p>
                    <p className="text-base text-gray-900">
                      {selectedReport.targetName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Lý do báo cáo
                </h3>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-base text-gray-900 whitespace-pre-wrap">
                    {selectedReport.reason}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Trạng thái hiện tại
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
                  {selectedReport.status === "pending"
                    ? "Chờ xử lý"
                    : selectedReport.status === "reviewing"
                      ? "Đang kiểm duyệt"
                      : selectedReport.status === "resolved"
                        ? "Đã xử lý"
                        : "Bị bác bỏ"}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  Đóng
                </button>
                {selectedReport.status === "pending" && (
                  <>
                    <button
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
                      Bắt đầu Kiểm duyệt
                    </button>
                    <button
                      onClick={() => {
                        handleUpdateReportStatus(selectedReport.id, "resolved");
                        setShowDetailModal(false);
                      }}
                      disabled={processingId === selectedReport.id}
                      className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                      Chấp nhận & Xử lý
                    </button>
                    <button
                      onClick={() => {
                        handleUpdateReportStatus(selectedReport.id, "rejected");
                        setShowDetailModal(false);
                      }}
                      disabled={processingId === selectedReport.id}
                      className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                      Bác bỏ
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
