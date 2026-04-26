// ─── StickerPanel — sticker selection grid ──────────────────────────────
import { STICKER_TOPIC_WITH_ALL } from './messengerUtils';

interface StickerPanelProps {
  activeTopic: string;
  onTopicChange: (topic: string) => void;
  onSendSticker: (stickerFile: string) => void;
}

export default function StickerPanel({ activeTopic, onTopicChange, onSendSticker }: StickerPanelProps) {
  return (
    <div className="mb-2 md:mb-3 p-3 bg-white rounded-xl border border-gray-200 shadow-lg">
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-thin">
        {STICKER_TOPIC_WITH_ALL.map((topic) => (
          <button
            key={topic.id}
            type="button"
            onClick={() => onTopicChange(topic.id)}
            className={`px-3 h-8 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTopic === topic.id
                ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {topic.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2 max-h-[280px] overflow-y-auto pr-1">
        {(STICKER_TOPIC_WITH_ALL.find((topic) => topic.id === activeTopic)?.files ?? []).map((sticker) => (
          <button
            key={sticker}
            type="button"
            onClick={() => onSendSticker(sticker)}
            className="aspect-square rounded-xl bg-gray-50 border border-gray-100 p-2 hover:border-blue-300 hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all duration-150"
          >
            <img
              src={`/stickers/${sticker}`}
              alt={sticker}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
