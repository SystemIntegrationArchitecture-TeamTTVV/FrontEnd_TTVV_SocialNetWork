// ─── GiphyStickerGrid — GIPHY sticker search & selection ────────────────
import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Loader2, AlertCircle, Sparkles } from 'lucide-react';

const GIPHY_API_KEY = 'pWQXUVmyIAkQDvRczFcT2t3kPzjncYiO';
const DEFAULT_STICKER_QUERY = 'hello';

interface GiphyStickerItem {
  id: string;
  preview: string;
  original: string;
  width?: number;
  height?: number;
}

interface GiphyStickerGridProps {
  onSendSticker: (stickerUrl: string) => void;
}

const TRENDING_TAGS = ['hello', 'love', 'happy', 'sad', 'angry', 'laugh', 'thank you', 'congratulations', 'good night', 'cute'];

export default function GiphyStickerGrid({ onSendSticker }: GiphyStickerGridProps) {
  const [stickerItems, setStickerItems] = useState<GiphyStickerItem[]>([]);
  const [stickerLoading, setStickerLoading] = useState(false);
  const [stickerError, setStickerError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState(DEFAULT_STICKER_QUERY);
  const searchTimerRef = useRef<number | null>(null);

  const fetchStickers = useCallback(async (rawQuery = DEFAULT_STICKER_QUERY) => {
    const query = String(rawQuery || '').trim() || DEFAULT_STICKER_QUERY;
    setStickerLoading(true);
    setStickerError('');

    try {
      const url = `https://api.giphy.com/v1/stickers/search?q=${encodeURIComponent(query)}&api_key=${GIPHY_API_KEY}&limit=24&offset=0&rating=g&lang=en`;
      const data = await fetch(url).then((res) => res.json());
      const items: GiphyStickerItem[] = Array.isArray(data?.data)
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

              return {
                id: String(item?.id || ''),
                preview,
                original,
                width: Number(media?.original?.width || 0) || undefined,
                height: Number(media?.original?.height || 0) || undefined,
              };
            })
            .filter(Boolean)
        : [];
      setStickerItems(items);
    } catch (error) {
      console.error('Error loading GIPHY stickers:', error);
      setStickerError('Không tải được sticker từ GIPHY');
      setStickerItems([]);
    } finally {
      setStickerLoading(false);
    }
  }, []);

  // Fetch stickers on mount and when activeQuery changes
  useEffect(() => {
    fetchStickers(activeQuery);
  }, [activeQuery, fetchStickers]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = window.setTimeout(() => {
      setActiveQuery(value.trim() || DEFAULT_STICKER_QUERY);
    }, 500);
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    setActiveQuery(tag);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Tìm sticker GIPHY..."
          className="w-full h-8 pl-8 pr-3 rounded-lg bg-gray-100 text-xs text-gray-700 placeholder:text-gray-400 border border-transparent focus:border-purple-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/10 transition-all"
        />
      </div>

      {/* Trending tags */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
        {TRENDING_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleTagClick(tag)}
            className={`px-2.5 h-6 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all ${
              activeQuery === tag
                ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-200 shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {stickerLoading && (
        <div className="flex items-center justify-center py-8 gap-2">
          <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
          <span className="text-xs text-gray-500">Đang tải sticker...</span>
        </div>
      )}

      {/* Error state */}
      {stickerError && !stickerLoading && (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <span className="text-xs text-red-500">{stickerError}</span>
          <button
            type="button"
            onClick={() => fetchStickers(activeQuery)}
            className="px-3 h-7 rounded-full bg-red-50 text-red-600 text-[10px] font-semibold hover:bg-red-100 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Empty state */}
      {!stickerLoading && !stickerError && stickerItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Sparkles className="w-6 h-6 text-gray-300" />
          <span className="text-xs text-gray-400">Không tìm thấy sticker</span>
        </div>
      )}

      {/* Sticker grid */}
      {!stickerLoading && !stickerError && stickerItems.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5 max-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin">
          {stickerItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSendSticker(item.original)}
              className="aspect-square rounded-xl bg-gray-50/80 border border-gray-100 p-1.5 hover:border-purple-300 hover:bg-purple-50 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-150 group relative overflow-hidden"
              title="Gửi sticker"
            >
              <img
                src={item.preview}
                alt="GIPHY sticker"
                className="w-full h-full object-contain"
                loading="lazy"
              />
              {/* Hover overlay effect */}
              <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/5 rounded-xl transition-colors duration-150" />
            </button>
          ))}
        </div>
      )}

      {/* GIPHY attribution */}
      <div className="flex items-center justify-center pt-1 pb-0.5">
        <span className="text-[9px] text-gray-400 font-medium tracking-wide">Powered by GIPHY</span>
      </div>
    </div>
  );
}
