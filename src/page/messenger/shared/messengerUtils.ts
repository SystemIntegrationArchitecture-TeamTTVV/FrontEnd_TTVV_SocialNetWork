// Shared utilities for messenger components

/** Deterministic color from string — same input always gives same color */
export const hashColor = (str: string): string => {
  const colors = [
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#2563eb', '#7c3aed', '#db2777',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export const AI_CONVERSATION_ID = '__ai_assistant__';

export const STICKER_TOPICS = [
  {
    id: 'emoji',
    label: 'Emoji',
    files: [
      'sticker-01.svg', 'sticker-02.svg', 'sticker-03.svg', 'sticker-04.svg',
      'sticker-05.svg', 'sticker-06.svg', 'sticker-07.svg', 'sticker-08.svg',
      'sticker-09.svg', 'sticker-10.svg', 'sticker-11.svg', 'sticker-12.svg',
    ],
  },
  {
    id: 'christmas',
    label: 'Christmas',
    files: [
      'christmas/bear.png',
      'christmas/fox.png',
      'christmas/pig.png',
      'christmas/reindeer.png',
      'christmas/santa-claus.png',
    ],
  },
  {
    id: 'home',
    label: 'Home',
    files: [
      'home/coffee-mug.png',
      'home/reading-book.png',
      'home/reading.png',
      'home/stay-home.png',
      'home/stretching.png',
    ],
  },
  {
    id: 'pets',
    label: 'Pets',
    files: [
      'pets/adopt.png',
      'pets/bath.png',
      'pets/cat.png',
      'pets/dog.png',
      'pets/good_morning.png',
      'pets/have_a_nice_day.png',
      'pets/pet_food.png',
    ],
  },
] as const;

export const STICKER_TOPIC_WITH_ALL = [
  {
    id: 'all',
    label: 'All',
    files: STICKER_TOPICS.flatMap((topic) => topic.files),
  },
  ...STICKER_TOPICS,
];
