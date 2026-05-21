import os

filepath = r"d:\DaiHoc\MonHocNam4_2\Kientruc\BaiTapNhom\FrontEnd_TTVV_SocialNetWork\src\page\admin\AdminReports.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
content = content.replace('import { usersApi } from "../../apis/users";', '''import { usersApi, type User } from "../../apis/users";
import { postsApi, type PostData } from "../../apis/posts";''')

content = content.replace('AlertCircle,', '''AlertCircle,
  Trash2,
  Lock,
  Unlock,
  ShieldAlert,''')

# 2. States
state_insert = '''  const [reportStats, setReportStats] = useState({'''
state_replacement = '''  const [previewPost, setPreviewPost] = useState<PostData | null>(null);
  const [previewUser, setPreviewUser] = useState<User | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [auditNote, setAuditNote] = useState("");
  
  type EnforcementAction = {
    type: "hide_post" | "delete_post" | "lock_comments" | "ban_user" | "delete_user";
    targetId: string;
    label: string;
  };
  const [showEnforcementDialog, setShowEnforcementDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<EnforcementAction | null>(null);

  const [reportStats, setReportStats] = useState({'''

content = content.replace(state_insert, state_replacement)

# 3. Modify handleUpdateReportStatus
old_handleUpdateReportStatus = '''  const handleUpdateReportStatus = async (
    reportId: string,
    newStatus: "reviewing" | "resolved" | "rejected",
  ) => {
    try {
      setProcessingId(reportId);
      await reportsApi.updateReportStatus(reportId, newStatus);'''

new_handleUpdateReportStatus = '''  const handleUpdateReportStatus = async (
    reportId: string,
    newStatus: "reviewing" | "resolved" | "rejected",
    actionNote?: string
  ) => {
    try {
      setProcessingId(reportId);
      await reportsApi.updateReportStatus(reportId, newStatus, actionNote);'''

content = content.replace(old_handleUpdateReportStatus, new_handleUpdateReportStatus)

# 4. Add loadPreviewContent & executeEnforcementAction right before `const filteredReports`
old_filtered = '''  const filteredReports = reports.filter((report) => {'''

new_methods = '''  const loadPreviewContent = async (report: Report) => {
    setLoadingPreview(true);
    setPreviewPost(null);
    setPreviewUser(null);
    try {
      if (report.targetType.toLowerCase() === "post" && report.targetId) {
        const post = await postsApi.getPostById(report.targetId);
        setPreviewPost(post);
      } else if (report.targetType.toLowerCase() === "user" && report.targetId) {
        const user = await usersApi.getUserById(report.targetId);
        setPreviewUser(user);
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

  const filteredReports = reports.filter((report) => {'''

content = content.replace(old_filtered, new_methods)

# 5. Fix handleOpenDetailModal usage in JSX
old_open_modal = '''                    onClick={() => {
                      setSelectedReport(report);
                      setShowDetailModal(true);
                    }}'''
new_open_modal = '''                    onClick={() => handleOpenDetailModal(report)}'''
content = content.replace(old_open_modal, new_open_modal)

# 6. Replace Modal JSX
# Find the start of the modal JSX
modal_start = '{showDetailModal && selectedReport && ('
modal_idx = content.find(modal_start)
if modal_idx != -1:
    content = content[:modal_idx] + """{showDetailModal && selectedReport && (
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
                        <div className="flex flex-col items-center text-center py-6">
                          <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-3xl mb-4">
                            {previewUser.fullName?.substring(0, 2).toUpperCase() || "U"}
                          </div>
                          <h4 className="text-lg font-bold text-gray-900">{previewUser.fullName}</h4>
                          <p className="text-sm text-gray-500 mb-4">@{previewUser.username}</p>
                          <div className="w-full space-y-2 text-left bg-white p-3 rounded-lg border border-gray-100">
                            <p className="text-sm"><span className="font-semibold text-gray-600">Email:</span> {previewUser.email}</p>
                            <p className="text-sm"><span className="font-semibold text-gray-600">Vai trò:</span> {previewUser.role}</p>
                            <p className="text-sm flex items-center gap-2">
                              <span className="font-semibold text-gray-600">Trạng thái:</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${previewUser.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {previewUser.isActive ? "Đang hoạt động" : "Bị khóa (Banned)"}
                              </span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                          <AlertCircle className="w-12 h-12 text-gray-300 mb-2" />
                          <p className="text-sm text-gray-500">Nội dung không khả dụng hoặc đây là ID: <br/> {selectedReport.targetName}</p>
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
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Ghi chú (Audit Note)</label>
                        <textarea
                          placeholder="Ghi lại lý do xử lý nội bộ..."
                          value={auditNote}
                          onChange={(e) => setAuditNote(e.target.value)}
                          className="w-full h-24 p-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                        />
                      </div>

                      {/* POST ACTIONS */}
                      {selectedReport.targetType.toLowerCase() === "post" && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Thực thi bài viết</p>
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
                        </div>
                      )}

                      {/* USER ACTIONS */}
                      {selectedReport.targetType.toLowerCase() === "user" && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Thực thi người dùng</p>
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
"""

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
