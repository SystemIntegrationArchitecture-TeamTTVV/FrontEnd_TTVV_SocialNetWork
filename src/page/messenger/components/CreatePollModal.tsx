// CreatePollModal – full poll creation modal matching the design spec
import { useState, useRef, useEffect } from 'react';
import { X, Calendar, Plus, Trash2, HelpCircle } from 'lucide-react';

export interface PollFormData {
  question: string;
  options: string[];
  deadline: string | null; // ISO string or null
  pinToTop: boolean;
  multipleChoice: boolean;
  canAddOptions: boolean;
  hideResultsBeforeVote: boolean;
  hideVoters: boolean;
}

interface CreatePollModalProps {
  onClose: () => void;
  onSubmit: (data: PollFormData) => Promise<void>;
  creating?: boolean;
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-10 h-5 rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-blue-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function CreatePollModal({ onClose, onSubmit, creating = false }: CreatePollModalProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [deadline, setDeadline] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pinToTop, setPinToTop] = useState(false);
  const [multipleChoice, setMultipleChoice] = useState(true);
  const [canAddOptions, setCanAddOptions] = useState(true);
  const [hideResultsBeforeVote, setHideResultsBeforeVote] = useState(false);
  const [hideVoters, setHideVoters] = useState(false);

  const datePickerRef = useRef<HTMLDivElement>(null);
  const MAX_OPTIONS = 10;
  const MAX_QUESTION_LEN = 200;

  // Close date picker when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    };
    if (showDatePicker) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDatePicker]);

  const setOptionAt = (idx: number, val: string) => {
    setOptions((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, '']);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!question.trim() || creating) return;
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) return;

    await onSubmit({
      question: question.trim(),
      options: validOptions,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      pinToTop,
      multipleChoice,
      canAddOptions,
      hideResultsBeforeVote,
      hideVoters,
    });
  };

  const formattedDeadline = deadline
    ? new Date(deadline).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  const canCreate = question.trim().length > 0 && options.filter((o) => o.trim()).length >= 2 && !creating;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Tạo bình chọn</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-5">
            {/* Left column */}
            <div className="space-y-5">
              {/* Question */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Chủ đề bình chọn</label>
                <div className="relative">
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value.slice(0, MAX_QUESTION_LEN))}
                    placeholder="Đặt câu hỏi bình chọn"
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none"
                  />
                  <span className="absolute bottom-2 right-3 text-xs text-gray-400">
                    {question.length}/{MAX_QUESTION_LEN}
                  </span>
                </div>
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Các lựa chọn</label>
                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        value={opt}
                        onChange={(e) => setOptionAt(idx, e.target.value)}
                        placeholder={`Lựa chọn ${idx + 1}`}
                        className="flex-1 h-10 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {options.length < MAX_OPTIONS && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="mt-2.5 flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-700 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm lựa chọn
                  </button>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Thời hạn bình chọn</label>
                <div className="relative" ref={datePickerRef}>
                  <button
                    type="button"
                    onClick={() => setShowDatePicker((v) => !v)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm flex items-center justify-between text-left"
                  >
                    <span className={deadline ? 'text-gray-800' : 'text-gray-400'}>
                      {deadline ? formattedDeadline : 'Không thời hạn'}
                    </span>
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </button>
                  {showDatePicker && (
                    <div className="absolute top-12 left-0 right-0 z-10 bg-white rounded-xl border border-gray-200 shadow-lg p-3">
                      <input
                        type="datetime-local"
                        min={(() => {
                          const now = new Date();
                          const year = now.getFullYear();
                          const month = String(now.getMonth() + 1).padStart(2, '0');
                          const day = String(now.getDate()).padStart(2, '0');
                          const hours = String(now.getHours()).padStart(2, '0');
                          const minutes = String(now.getMinutes()).padStart(2, '0');
                          return `${year}-${month}-${day}T${hours}:${minutes}`;
                        })()}
                        value={deadline}
                        onChange={(e) => {
                          setDeadline(e.target.value);
                          setShowDatePicker(false);
                        }}
                        className="w-full text-sm border-none focus:outline-none"
                      />
                      {deadline && (
                        <button
                          type="button"
                          onClick={() => { setDeadline(''); setShowDatePicker(false); }}
                          className="mt-2 w-full text-xs text-red-500 hover:text-red-700 text-center"
                        >
                          Xóa thời hạn
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Advanced settings */}
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">Thiết lập nâng cao</p>
                <div className="space-y-3">
                  <SettingRow
                    label="Ghim lên đầu trò chuyện"
                    checked={pinToTop}
                    onChange={setPinToTop}
                  />
                  <SettingRow
                    label="Chọn nhiều phương án"
                    tooltip="Cho phép thành viên chọn nhiều lựa chọn cùng lúc"
                    checked={multipleChoice}
                    onChange={setMultipleChoice}
                  />
                  <SettingRow
                    label="Có thể thêm phương án"
                    tooltip="Cho phép thành viên thêm lựa chọn mới"
                    checked={canAddOptions}
                    onChange={setCanAddOptions}
                  />
                </div>
              </div>

              {/* Anonymous settings */}
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">Bình chọn ẩn danh</p>
                <div className="space-y-3">
                  <SettingRow
                    label="Ẩn kết quả khi chưa bình chọn"
                    tooltip="Chỉ hiển thị kết quả sau khi người dùng đã bình chọn"
                    checked={hideResultsBeforeVote}
                    onChange={setHideResultsBeforeVote}
                  />
                  <SettingRow
                    label="Ẩn người bình chọn"
                    tooltip="Không hiển thị danh sách người đã chọn từng phương án"
                    checked={hideVoters}
                    onChange={setHideVoters}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 hover:bg-gray-100 transition-colors"
            title="Tuỳ chọn khác"
          >
            <HelpCircle className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canCreate}
              className="h-9 px-5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang tạo...
                </span>
              ) : (
                'Tạo bình chọn'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SettingRowProps {
  label: string;
  tooltip?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function SettingRow({ label, tooltip, checked, onChange }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700 flex items-center gap-1">
        {label}
        {tooltip && (
          <span title={tooltip} className="cursor-help">
            <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
          </span>
        )}
      </span>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}
