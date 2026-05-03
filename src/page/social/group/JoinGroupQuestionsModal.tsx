import { useState } from "react";
import { X, Check, Loader2, FileQuestion } from "lucide-react";
import { useTranslation } from "react-i18next";
import { groupsApi, type GroupData } from "../../../apis/groupsApi";

interface Props {
  group: GroupData;
  userId: string;
  onClose: () => void;
  onSuccess: (newMemberCount?: number) => void;
}

export default function JoinGroupQuestionsModal({ group, userId, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<string[]>(Array(group.joinQuestions?.length || 0).fill(""));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!group.id) return;
    try {
      setLoading(true);
      await groupsApi.joinGroup(group.id, userId, answers);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to submit join answers", error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = answers.every(a => a.trim().length > 0);

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-[#1a1d28] rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-card-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#22263a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center text-blue-500">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-[#edf0fa]">
                {t("groupPage.questionsTitle", "Câu hỏi thành viên")}
              </h3>
              <p className="text-xs text-gray-400 dark:text-[#6a7494]">
                {group.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#22263a] text-gray-400 dark:text-[#6a7494] hover:bg-gray-200 dark:hover:bg-[#2b2f45] hover:text-gray-600 dark:hover:text-[#edf0fa] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5 scrollbar-hide">
          <p className="text-sm text-gray-500 dark:text-[#9aa3bc]">
            {t("groupPage.questionsDesc", "Quản trị viên yêu cầu bạn trả lời các câu hỏi sau trước khi tham gia nhóm:")}
          </p>
          
          {group.joinQuestions?.map((question, idx) => (
            <div key={idx} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900 dark:text-[#edf0fa]">
                {idx + 1}. {question}
              </label>
              <textarea
                value={answers[idx]}
                onChange={(e) => {
                  const newAnswers = [...answers];
                  newAnswers[idx] = e.target.value;
                  setAnswers(newAnswers);
                }}
                placeholder={t("groupPage.questionsPlaceholder", "Nhập câu trả lời của bạn...")}
                className="w-full min-h-[80px] p-3 rounded-xl border border-gray-200 dark:border-[#2b2f45] bg-gray-50 dark:bg-[#1e2133] text-sm text-gray-900 dark:text-[#edf0fa] outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-y"
              />
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-[#22263a] bg-gray-50/50 dark:bg-[#1a1d28] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-[#9aa3bc] hover:bg-gray-100 dark:hover:bg-[#22263a] transition-colors"
          >
            {t("common.cancel", "Hủy")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !isFormValid}
            className="px-6 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {loading ? t("groupPage.joining", "Đang xin vào...") : t("groupPage.submitJoin", "Gửi yêu cầu")}
          </button>
        </div>
      </div>
    </div>
  );
}
