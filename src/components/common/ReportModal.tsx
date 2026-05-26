import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { reportsApi } from "../../apis/reports";
import { notify } from "../../services/notify";
import { useAuth } from "../../contexts/AuthContext";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: "post" | "user" | "group" | "message" | "comment";
  targetName: string;
}

export default function ReportModal({
  isOpen,
  onClose,
  targetId,
  targetType,
  targetName,
}: ReportModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState("");
  const [reporting, setReporting] = useState(false);

  if (!isOpen) return null;

  const PREDEFINED_REASONS = [
    { id: "spam", label: t("reports.reasonSpam", "Spam") },
    { id: "harassment", label: t("reports.reasonHarassment", "Quấy rối") },
    { id: "inappropriate", label: t("reports.reasonInappropriate", "Nội dung không phù hợp") },
    { id: "hatespeech", label: t("reports.reasonHateSpeech", "Ngôn từ thù địch") },
    { id: "other", label: t("reports.reasonOther", "Lý do khác") },
  ];

  const handleReport = async () => {
    if (!selectedReason) {
        notify.error("Vui lòng chọn một lý do báo cáo");
        return;
    }

    const finalReason = selectedReason === "other" 
        ? customReason.trim() || t("reports.reasonOther", "Lý do khác") 
        : PREDEFINED_REASONS.find(r => r.id === selectedReason)?.label || selectedReason;

    setReporting(true);
    try {
      await reportsApi.createReport({
        type: targetType,
        reporterName: user?.id || "",
        targetName: targetName,
        targetType: targetType,
        targetId: targetId,
        reason: finalReason,
        priority: "medium",
      });
      notify.success(t("reports.reportSuccess", "Đã gửi báo cáo thành công"));
      onClose();
      setSelectedReason("");
      setCustomReason("");
    } catch (error) {
      notify.error(t("reports.reportError", "Lỗi khi gửi báo cáo"));
      console.error("Report failed:", error);
    } finally {
      setReporting(false);
    }
  };

  const getTitle = () => {
    switch(targetType) {
        case "user": return t("reports.titleReportUser", "Báo cáo người dùng");
        case "post": return t("reports.titleReportPost", "Báo cáo bài viết");
        case "group": return t("reports.titleReportGroup", "Báo cáo nhóm");
        default: return t("reports.submitReport", "Gửi báo cáo");
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#1a1d28] rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-slide-up" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 dark:border-[#22263a] flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {getTitle()}
          </h3>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#22263a] rounded-lg transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("reports.reportReason", "Lý do báo cáo")}:
            </p>
            
            <div className="space-y-2">
                {PREDEFINED_REASONS.map((reason) => (
                    <label 
                        key={reason.id} 
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                            selectedReason === reason.id 
                                ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50" 
                                : "border-gray-200 dark:border-[#2b2f45] hover:bg-gray-50 dark:hover:bg-[#22263a] text-gray-700 dark:text-gray-300"
                        }`}
                    >
                        <input
                            type="radio"
                            name="reportReason"
                            value={reason.id}
                            checked={selectedReason === reason.id}
                            onChange={() => setSelectedReason(reason.id)}
                            className="w-4 h-4 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm font-medium">{reason.label}</span>
                    </label>
                ))}
            </div>

            {selectedReason === "other" && (
                <div className="mt-3 animate-fade-in">
                    <textarea
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder={t("reports.reportReasonPlaceholder", "Nhập lý do chi tiết (tùy chọn)")}
                        className="w-full h-24 p-3 rounded-xl border border-gray-200 dark:border-[#2b2f45] bg-gray-50 dark:bg-[#0c0e14] text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 dark:text-white resize-none"
                    />
                </div>
            )}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-[#22263a] bg-gray-50/50 dark:bg-[#1a1d28] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={reporting}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#22263a] rounded-xl transition-colors disabled:opacity-50"
          >
            {t("settingsPage.cancel", "Hủy")}
          </button>
          <button
            type="button"
            onClick={handleReport}
            disabled={reporting || !selectedReason}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {reporting && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("reports.submitReport", "Gửi báo cáo")}
          </button>
        </div>
      </div>
    </div>
  );
}
