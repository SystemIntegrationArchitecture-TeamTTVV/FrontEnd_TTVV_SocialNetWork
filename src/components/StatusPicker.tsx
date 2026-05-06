import { useState } from 'react';
import { Smile, X, Check, Loader2 } from 'lucide-react';
import { FEATURE_FLAGS } from '../../apis/config';
import { userStatusApi } from '../../apis/userStatus';

const QUICK_EMOJIS = ['😊', '😎', '🤔', '😴', '🎯', '💪', '🔥', '🎉', '❤️', '🚀', '🎮', '📚', '🍕', '☕', '🎵'];

interface StatusPickerProps {
  currentText?: string;
  currentEmoji?: string;
  onClose: () => void;
  onSaved?: (statusText: string, statusEmoji: string) => void;
}

export default function StatusPicker({ currentText, currentEmoji, onClose, onSaved }: StatusPickerProps) {
  const [text, setText] = useState(currentText ?? '');
  const [emoji, setEmoji] = useState(currentEmoji ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!FEATURE_FLAGS.USER_STATUS) return;
    setSaving(true);
    setError(null);
    try {
      await userStatusApi.update({ statusText: text || undefined, statusEmoji: emoji || undefined });
      onSaved?.(text, emoji);
      onClose();
    } catch {
      setError('Lưu thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!FEATURE_FLAGS.USER_STATUS) return;
    setSaving(true);
    setError(null);
    try {
      await userStatusApi.update({ statusText: undefined, statusEmoji: undefined });
      onSaved?.('', '');
      onClose();
    } catch {
      setError('Xóa thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[360px] p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Smile className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-gray-900 text-base">Đặt trạng thái</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {!FEATURE_FLAGS.USER_STATUS ? (
          <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
            Tính năng này đang tắt. Bật <code className="font-mono">VITE_FEATURE_USER_STATUS=true</code> để sử dụng.
          </p>
        ) : (
          <>
            {/* Preview */}
            {(emoji || text) && (
              <div className="mb-4 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                {emoji && <span className="text-xl leading-none">{emoji}</span>}
                {text && <span className="text-sm text-gray-700">{text}</span>}
              </div>
            )}

            {/* Emoji picker row */}
            <p className="text-xs font-medium text-gray-500 mb-1.5">Chọn biểu tượng</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {QUICK_EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setEmoji(prev => prev === e ? '' : e)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${emoji === e ? 'bg-blue-100 ring-2 ring-blue-400' : 'hover:bg-gray-100'}`}
                >
                  {e}
                </button>
              ))}
            </div>

            {/* Text input */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Nội dung trạng thái</label>
              <input
                type="text"
                maxLength={80}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Đang làm việc..."
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{text.length}/80</p>
            </div>

            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

            {/* Actions */}
            <div className="flex gap-2">
              {(currentText || currentEmoji) && (
                <button
                  disabled={saving}
                  onClick={handleClear}
                  className="h-10 px-3 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Xóa trạng thái
                </button>
              )}
              <button
                disabled={saving}
                onClick={onClose}
                className="flex-1 h-10 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                disabled={saving}
                onClick={handleSave}
                className="flex-1 h-10 rounded-xl bg-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Lưu
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
