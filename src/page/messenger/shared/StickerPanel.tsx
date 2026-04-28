// ─── StickerPanel — sticker selection grid with local + GIPHY tabs ──────
import { useState } from 'react';
import { STICKER_TOPIC_WITH_ALL } from './messengerUtils';
import GiphyStickerGrid from './GiphyStickerGrid';

interface StickerPanelProps {
  activeTopic: string;
  onTopicChange: (topic: string) => void;
  onSendSticker: (stickerFile: string) => void;
  onSendGiphySticker?: (url: string) => void;
}

type PanelMode = 'local' | 'giphy';

export default function StickerPanel({ activeTopic, onTopicChange, onSendSticker, onSendGiphySticker }: StickerPanelProps) {
  const [mode, setMode] = useState<PanelMode>('local');

  const handleGiphyStickerSend = (url: string) => {
    if (onSendGiphySticker) {
      onSendGiphySticker(url);
    } else {
      // Fallback: use onSendSticker with a special prefix so the handler knows it's a URL
      onSendSticker(`__giphy__${url}`);
    }
  };

  return (
    <div className="mb-2 md:mb-3 p-3 bg-white rounded-xl border border-gray-200 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Mode Tabs: Local vs GIPHY */}
      <div className="flex items-center gap-1 mb-3 border-b border-gray-100 pb-2">
        <button
          type="button"
          onClick={() => setMode('local')}
          className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold transition-all ${
            mode === 'local'
              ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          }`}
        >
          <span className="text-base">🎨</span>
          Sticker
        </button>
        <button
          type="button"
          onClick={() => setMode('giphy')}
          className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold transition-all ${
            mode === 'giphy'
              ? 'bg-purple-50 text-purple-700 shadow-sm ring-1 ring-purple-200'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          }`}
        >
          <span className="text-base">✨</span>
          GIPHY
        </button>
      </div>

      {mode === 'local' ? (
        <>
          {/* Local sticker topic tabs */}
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

          {/* Local sticker grid */}
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
        </>
      ) : (
        <GiphyStickerGrid onSendSticker={handleGiphyStickerSend} />
      )}
    </div>
  );
}
