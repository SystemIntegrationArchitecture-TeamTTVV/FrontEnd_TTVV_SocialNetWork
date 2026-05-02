/**
 * Giọng đọc donate cho host (parity ThamKhao LiveWrapper speakText + cleanName).
 */

export function cleanDonorNameForTts(raw: string | undefined | null): string {
  if (!raw || !raw.trim()) return 'Người xem';
  let s = raw.trim();
  s = s.replace(/^Phòng\s+[\d:]+\s+-\s+/i, '');
  s = s.replace(/^Phòng\s+[\d:]+/i, '');
  s = s.replace(/^Phòng\s+live\s+của\s+/i, '');
  s = s.replace(/^uid_[\w\d]+/i, '');
  s = s.replace(/^Khách_[\w\d]+/i, '');
  return s.trim() || 'Người xem';
}

export function speakLiveDonateAnnouncement(options: {
  enabled: boolean;
  senderName?: string;
  giftName?: string;
  giftPrice?: number;
  giftMessage?: string;
}): void {
  const { enabled, senderName, giftName, giftPrice, giftMessage } = options;
  if (!enabled || typeof window === 'undefined' || !window.speechSynthesis) return;

  const name = cleanDonorNameForTts(senderName);
  const gift = giftName?.trim() || 'quà tặng';
  let text = `${name} vừa tặng ${gift}`;
  if (typeof giftPrice === 'number' && giftPrice > 0) {
    text += `, ${giftPrice} xu`;
  }
  const msg = giftMessage?.trim();
  if (msg) {
    text += `. Lời nhắn: ${msg}`;
  }

  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'vi-VN';
    u.rate = 1.0;
    u.pitch = 1.0;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}
