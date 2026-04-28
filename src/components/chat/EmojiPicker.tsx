import { useState, useRef, useEffect, useCallback } from 'react';
import { Smile, X } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EMOJI_CATEGORIES: Record<string, string[]> = {
  'Mặt cười': [
    '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇',
    '🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝',
    '🤑','🤗','🤭','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥',
    '😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒',
    '🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎',
    '🤓','🧐','😕','🫤','😟','🙁','☹️','😮','😯','😲','😳','🥺',
    '🥹','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞',
    '😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️',
  ],
  'Tay': [
    '👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏',
    '✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️',
    '🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲',
    '🤝','🙏','✍️','💅','🤳','💪','🦾','🦿',
  ],
  'Tim': [
    '❤️','🧡','💛','💚','💙','💜','🤎','🖤','🤍','💔','❤️‍🔥','❤️‍🩹',
    '💕','💞','💓','💗','💖','💘','💝','💟','♥️','💋','💌','💐',
    '🌹','🌷','🌸','💮','🏵️','🌻','🌼','🌺',
  ],
  'Động vật': [
    '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮',
    '🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🦆',
    '🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞',
    '🐢','🐍','🦎','🐙','🦑','🦀','🐡','🐠','🐟','🐬','🐳','🐋',
  ],
  'Đồ ăn': [
    '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒',
    '🍑','🥭','🍍','🥥','🥝','🍅','🥑','🍆','🥦','🥬','🥒','🌽',
    '🥕','🧅','🧄','🥔','🍠','🥐','🍞','🥖','🥨','🧀','🥚','🍳',
    '🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫓',
  ],
  'Hoạt động': [
    '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓',
    '🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿',
    '🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂',
  ],
  'Di chuyển': [
    '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚',
    '🚛','🚜','🛵','🏍️','🛺','🚲','🛴','🚏','🛣️','🛤️','🛞','⛽',
    '✈️','🛩️','🚀','🛸','🚁','⛵','🚤','🛥️','🛳️','⛴️','🚢','🚂',
  ],
};

export default function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const categories = Object.keys(EMOJI_CATEGORIES);
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleEmojiClick = useCallback((emoji: string) => {
    onEmojiSelect(emoji);
  }, [onEmojiSelect]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          isOpen
            ? 'bg-[#1877F2]/10 text-[#1877F2]'
            : 'hover:bg-gray-100 text-gray-500'
        }`}
        title="Emoji"
      >
        <Smile className="w-4.5 h-4.5" />
      </button>

      {/* Picker popup — opens UPWARD */}
      {isOpen && (
        <div
          className="absolute bottom-full left-0 mb-2 bg-white rounded-xl border border-gray-200 shadow-xl z-[100] animate-in fade-in slide-in-from-bottom-2 duration-150"
          style={{ width: '320px' }}
        >
          {/* Header with close button */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-600">Emoji</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              title="Đóng"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          {/* Category tabs */}
          <div className="flex gap-0.5 px-2 py-1.5 border-b border-gray-100 overflow-x-auto scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-2 py-1 text-[11px] font-medium rounded-md whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-[#1877F2]/10 text-[#1877F2]'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Emoji grid */}
          <div className="p-2 grid grid-cols-8 gap-0.5 max-h-[200px] overflow-y-auto">
            {EMOJI_CATEGORIES[activeCategory]?.map((emoji, i) => (
              <button
                key={`${activeCategory}-${i}`}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg rounded-lg hover:bg-gray-100 active:scale-90 transition-all duration-100"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
