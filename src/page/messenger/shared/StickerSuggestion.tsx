// ─── StickerSuggestion — inline sticker suggestion based on typed text ──
// Only fetches GIPHY when user explicitly clicks the suggestion button.
import { useState, useCallback, useRef, useEffect } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';

const GIPHY_API_KEY = 'pWQXUVmyIAkQDvRczFcT2t3kPzjncYiO';

interface StickerItem {
  id: string;
  preview: string;
  original: string;
}

interface StickerSuggestionProps {
  /** Current text in the chat input */
  inputText: string;
  /** Called when user picks a sticker */
  onSendSticker: (url: string) => void;
}

export default function StickerSuggestion({ inputText, onSendSticker }: StickerSuggestionProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<StickerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const url = `https://api.giphy.com/v1/stickers/search?q=${encodeURIComponent(query.trim())}&api_key=${GIPHY_API_KEY}&limit=12&offset=0&rating=g&lang=en`;
      const data = await fetch(url).then((r) => r.json());
      const results: StickerItem[] = Array.isArray(data?.data)
        ? data.data
            .map((item: any) => {
              const media = item?.images || {};
              const preview =
                media?.fixed_height_small?.url ||
                media?.fixed_height?.url ||
                media?.original?.url ||
                '';
              const original = media?.original?.url || preview;
              if (!preview || !original) return null;
              return { id: String(item?.id || ''), preview, original };
            })
            .filter(Boolean)
        : [];
      setItems(results);
      setLastQuery(query.trim());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClick = () => {
    const query = inputText.trim();
    if (!query) return;

    if (open && lastQuery === query) {
      // Already showing results for the same query → close
      setOpen(false);
      return;
    }

    setOpen(true);
    fetchSuggestions(query);
  };

  const handleSelect = (url: string) => {
    onSendSticker(url);
    setOpen(false);
    setItems([]);
  };

  // Don't show button if no text typed
  const trimmed = inputText.trim();
  if (!trimmed) return null;

  return (
    <div ref={panelRef} className="relative">
      {/* Trigger button — small sparkle icon */}
      <button
        type="button"
        onClick={handleClick}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
          open
            ? 'text-purple-600 bg-purple-50 ring-1 ring-purple-200 shadow-sm'
            : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
        }`}
        title={`Gợi ý sticker cho "${trimmed.length > 20 ? trimmed.slice(0, 20) + '…' : trimmed}"`}
      >
        <Sparkles className="w-4 h-4" />
      </button>

      {/* Suggestion popup */}
      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 w-[280px] bg-white rounded-xl border border-gray-200 shadow-2xl z-[100] overflow-hidden"
          style={{ animation: 'fadeInUp 150ms ease-out' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-[11px] font-bold text-purple-700 tracking-wide">
                Sticker cho "{trimmed.length > 15 ? trimmed.slice(0, 15) + '…' : trimmed}"
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-5 h-5 rounded-full hover:bg-white/80 flex items-center justify-center transition-colors"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-2">
            {loading && (
              <div className="flex items-center justify-center py-6 gap-2">
                <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                <span className="text-[11px] text-gray-400">Đang tìm sticker...</span>
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6">
                <span className="text-2xl mb-1">🤷</span>
                <span className="text-[11px] text-gray-400">Không tìm thấy sticker phù hợp</span>
              </div>
            )}

            {!loading && items.length > 0 && (
              <div className="grid grid-cols-3 gap-1.5 max-h-[200px] overflow-y-auto scrollbar-thin">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.original)}
                    className="aspect-square rounded-lg bg-gray-50/80 border border-gray-100 p-1 hover:border-purple-300 hover:bg-purple-50 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-150 group"
                  >
                    <img
                      src={item.preview}
                      alt="sticker"
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50/50">
            <span className="text-[9px] text-gray-400">Powered by GIPHY</span>
          </div>
        </div>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
