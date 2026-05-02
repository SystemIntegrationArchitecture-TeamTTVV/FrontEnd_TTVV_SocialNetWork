import { X } from 'lucide-react';

interface LiveRegulationsModalProps {
  open: boolean;
  onClose: () => void;
  /** Nếu có — nút xác nhận thay vì chỉ đóng */
  onAccept?: () => void;
  acceptLabel?: string;
}

/**
 * Modal nội quy live (nội dung tương đương ThamKhao) — UI web Tailwind.
 */
export default function LiveRegulationsModal({
  open,
  onClose,
  onAccept,
  acceptLabel = 'Tôi đã đọc và đồng ý',
}: LiveRegulationsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl border border-[#e4e6eb] dark:border-[#2b2f45] bg-white dark:bg-[#1a1d28] shadow-xl flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-blue-100 dark:border-blue-900/40 bg-blue-50/80 dark:bg-blue-950/30">
          <h2 className="text-lg font-bold text-[#050505] dark:text-[#edf0fa]">Quy định live stream</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-5 text-sm text-[#65676b] dark:text-[#9ca3af]">
          <section>
            <h3 className="text-base font-bold text-blue-800 dark:text-blue-300 mb-3">Hạng VIP (tham khảo)</h3>
            <div className="space-y-2 rounded-xl border border-[#e4e6eb] dark:border-[#2b2f45] p-3 bg-[#f8fafc] dark:bg-[#22263a]">
              <p><span className="font-semibold text-[#050505] dark:text-white">VIP0</span> — Miễn phí, gói cơ bản.</p>
              <p><span className="font-semibold text-[#050505] dark:text-white">VIP1 / VIP2</span> — Gói trả phí (nếu hệ thống thanh toán được bật).</p>
            </div>
          </section>

          <section>
            <h3 className="text-base font-bold text-blue-800 dark:text-blue-300 mb-3">Quy tắc cộng đồng</h3>
            <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
              <li>Không phát nội dung vi phạm pháp luật, đồi trụy, bạo lực.</li>
              <li>Tôn trọng người xem, không xúc phạm hay quấy rối.</li>
              <li>Không spam, quảng cáo trái phép trong phòng live.</li>
              <li>Nội dung phù hợp thuần phong mỹ tục.</li>
              <li>Vi phạm có thể bị khóa tính năng live.</li>
            </ol>
          </section>

          <section>
            <h3 className="text-base font-bold text-blue-800 dark:text-blue-300 mb-3">Lưu ý</h3>
            <ul className="space-y-2 leading-relaxed list-disc pl-5">
              <li>Chủ phòng có thể bật <strong className="text-[#050505] dark:text-white">duyệt người xem</strong> (waiting room).</li>
              <li>Quà tặng / xu là tính năng riêng; vui lòng nạp xu qua kênh chính thức của ứng dụng.</li>
            </ul>
          </section>
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-[#e4e6eb] dark:border-[#2b2f45]">
          {onAccept ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-[#e4e6eb] dark:border-[#2b2f45] font-medium text-[#65676b] dark:text-[#9ca3af] hover:bg-[#f0f2f5] dark:hover:bg-[#22263a]"
              >
                Để sau
              </button>
              <button
                type="button"
                onClick={() => onAccept?.()}
                className="flex-1 py-3 rounded-xl bg-[#1877F2] hover:bg-[#1664d9] text-white font-semibold shadow-md"
              >
                {acceptLabel}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-[#1877F2] hover:bg-[#1664d9] text-white font-semibold"
            >
              Đã hiểu
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
