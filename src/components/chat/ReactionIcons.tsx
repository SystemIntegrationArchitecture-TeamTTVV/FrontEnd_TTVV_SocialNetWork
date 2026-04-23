/**
 * Reaction SVG Icons — dùng thay emoji characters.
 * Import: import { REACTIONS, ReactionIcon } from '...'
 */

interface ReactionDef {
  key: string;
  label: string;
  svg: JSX.Element;
}

const sz = 'w-full h-full';

const ThumbsUp = () => (
  <svg className={sz} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 17.5C2 16.12 3.12 15 4.5 15H9V33H4.5C3.12 33 2 31.88 2 30.5V17.5Z" fill="#5B9BD5"/>
    <path d="M9 15L15.36 3.64C15.82 2.77 16.72 2.22 17.7 2.22C19.54 2.22 20.74 4.04 20.04 5.74L17.5 12H30.5C32.16 12 33.5 13.34 33.5 15V15.34C33.5 15.78 33.42 16.22 33.26 16.62L28.6 28.62C28.08 29.96 26.78 30.86 25.34 30.86H12C10.34 30.86 9 29.52 9 27.86V15Z" fill="#FFD93D"/>
    <path d="M17.5 12H30.5C32.16 12 33.5 13.34 33.5 15V15.34C33.5 15.78 33.42 16.22 33.26 16.62L28.6 28.62C28.08 29.96 26.78 30.86 25.34 30.86H12C10.34 30.86 9 29.52 9 27.86V15" stroke="#E8A800" strokeWidth="1" fill="none"/>
  </svg>
);

const Heart = () => (
  <svg className={sz} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 32.43C17.52 32.43 17.06 32.24 16.72 31.9L4.14 19.86C1.12 16.92 1.12 12.14 4.14 9.2C5.58 7.8 7.52 7 9.56 7C11.6 7 13.54 7.8 14.98 9.2L18 12.12L21.02 9.2C22.46 7.8 24.4 7 26.44 7C28.48 7 30.42 7.8 31.86 9.2C34.88 12.14 34.88 16.92 31.86 19.86L19.28 31.9C18.94 32.24 18.48 32.43 18 32.43Z" fill="#F44336"/>
    <path d="M18 28L8 18.5C6 16.5 6 13.5 8 11.5C10 9.5 13 9.5 15 11.5L18 14.5L21 11.5C23 9.5 26 9.5 28 11.5C30 13.5 30 16.5 28 18.5L18 28Z" fill="#E53935"/>
  </svg>
);

const Laugh = () => (
  <svg className={sz} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="16" fill="#FFD93D"/>
    <circle cx="18" cy="18" r="15" stroke="#E8A800" strokeWidth="0.5" fill="none"/>
    <path d="M18 28C22 28 25 25.5 25 22H11C11 25.5 14 28 18 28Z" fill="#F44336"/>
    <path d="M12 22H24V23C24 25.76 21.31 28 18 28C14.69 28 12 25.76 12 23V22Z" fill="#fff" opacity="0.3"/>
    <path d="M8 14C8 14 9.5 12 12 12C14.5 12 16 14 16 14" stroke="#664500" strokeWidth="2" strokeLinecap="round"/>
    <path d="M20 14C20 14 21.5 12 24 12C26.5 12 28 14 28 14" stroke="#664500" strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="10" cy="16" rx="1.2" ry="0.6" fill="#E8A800" opacity="0.4"/>
    <ellipse cx="26" cy="16" rx="1.2" ry="0.6" fill="#E8A800" opacity="0.4"/>
  </svg>
);

const Wow = () => (
  <svg className={sz} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="16" fill="#FFD93D"/>
    <circle cx="18" cy="18" r="15" stroke="#E8A800" strokeWidth="0.5" fill="none"/>
    <ellipse cx="18" cy="26" rx="4" ry="5" fill="#664500"/>
    <ellipse cx="18" cy="25.5" rx="3" ry="4" fill="#7A5200" opacity="0.4"/>
    <circle cx="12" cy="14" r="2.5" fill="white"/>
    <circle cx="24" cy="14" r="2.5" fill="white"/>
    <circle cx="12" cy="14.5" r="1.5" fill="#664500"/>
    <circle cx="24" cy="14.5" r="1.5" fill="#664500"/>
    <path d="M8 10C8 10 9.5 8 12 8" stroke="#664500" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M28 10C28 10 26.5 8 24 8" stroke="#664500" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const Sad = () => (
  <svg className={sz} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="16" fill="#FFD93D"/>
    <circle cx="18" cy="18" r="15" stroke="#E8A800" strokeWidth="0.5" fill="none"/>
    <path d="M12 27C12 27 14.5 24 18 24C21.5 24 24 27 24 27" stroke="#664500" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="12" cy="15" r="2" fill="#664500"/>
    <circle cx="24" cy="15" r="2" fill="#664500"/>
    <path d="M6 18C6.5 17 7.5 17.5 8 18.5" stroke="#5B9BD5" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6.5 20C7 19 8 19.5 8.5 20.5" stroke="#5B9BD5" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
  </svg>
);

const Angry = () => (
  <svg className={sz} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="16" fill="#F44336"/>
    <circle cx="18" cy="18" r="15" stroke="#C62828" strokeWidth="0.5" fill="none"/>
    <path d="M12 27C12 27 14.5 24 18 24C21.5 24 24 27 24 27" stroke="#7A1A1A" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="12" cy="16" r="2" fill="#7A1A1A"/>
    <circle cx="24" cy="16" r="2" fill="#7A1A1A"/>
    <path d="M8 12L16 14" stroke="#7A1A1A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M28 12L20 14" stroke="#7A1A1A" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

/** All available reactions — use this array for rendering */
export const REACTIONS: ReactionDef[] = [
  { key: 'like',  label: 'Thích',     svg: <ThumbsUp /> },
  { key: 'love',  label: 'Yêu thích', svg: <Heart /> },
  { key: 'haha',  label: 'Haha',      svg: <Laugh /> },
  { key: 'wow',   label: 'Wow',       svg: <Wow /> },
  { key: 'sad',   label: 'Buồn',      svg: <Sad /> },
  { key: 'angry', label: 'Phẫn nộ',   svg: <Angry /> },
];

/** Lookup map: key → SVG component */
const REACTION_MAP: Record<string, JSX.Element> = Object.fromEntries(
  REACTIONS.map((r) => [r.key, r.svg])
);

/** Render a reaction icon by key. Falls back to the key text if not found. */
export function ReactionIcon({ reactionKey, className }: { reactionKey: string; className?: string }) {
  const icon = REACTION_MAP[reactionKey];
  if (!icon) return <span className={className}>{reactionKey}</span>;
  return <span className={className ?? 'w-5 h-5 inline-block'}>{icon}</span>;
}

export type { ReactionDef };
