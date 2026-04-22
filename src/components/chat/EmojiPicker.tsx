import { useState, useRef, useEffect, useCallback } from 'react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EMOJI_CATEGORIES: Record<string, string[]> = {
  'Mat cuoi': [
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
  'Dong vat': [
    '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮',
    '🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🦆',
    '🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞',
    '🐢','🐍','🦎','🐙','🦑','🦀','🐡','🐠','🐟','🐬','🐳','🐋',
  ],
  'Do an': [
    '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒',
    '🍑','🥭','🍍','🥥','🥝','🍅','🥑','🍆','🥦','🥬','🥒','🌽',
    '🥕','🧅','🧄','🥔','🍠','🥐','🍞','🥖','🥨','🧀','🥚','🍳',
    '🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫓',
  ],
  'Hoat dong': [
    '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓',
    '🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿',
    '🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂',
  ],
  'Di chuyen': [
    '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚',
    '🚛','🚜','🛵','🏍️','🛺','🚲','🛴','🚏','🛣️','🛤️','🛞','⛽',
    '✈️','🛩️','🚀','🛸','🚁','⛵','🚤','🛥️','🛳️','⛴️','🚢','🚂',
  ],
};

export default function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const categories = Object.keys(EMOJI_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // parent controls visibility via showEmojiPicker state
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleEmojiClick = useCallback((emoji: string) => {
    onEmojiSelect(emoji);
  }, [onEmojiSelect]);

  return (
    <div
      ref={containerRef}
      className="mb-2 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
      style={{ maxWidth: 380 }}
    >
      {/* Category tabs */}
      <div className="flex gap-1 p-2 border-b border-gray-100 overflow-x-auto scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="p-2 grid grid-cols-8 gap-0.5 max-h-[240px] overflow-y-auto">
        {EMOJI_CATEGORIES[activeCategory]?.map((emoji, i) => (
          <button
            key={`${activeCategory}-${i}`}
            type="button"
            onClick={() => handleEmojiClick(emoji)}
            className="w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-gray-100 active:scale-90 transition-all duration-100"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
