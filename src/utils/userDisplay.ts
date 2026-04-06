/** Chữ ký tên: tên + họ (vd. Trần Văn Minh → TM), một từ thì lấy tối đa 2 ký tự */
export function getUserInitials(fullName: string | undefined | null): string {
  if (!fullName?.trim()) return 'U';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0][0];
  const lastWord = parts[parts.length - 1];
  const last = lastWord[0];
  return `${first}${last}`.toUpperCase();
}
