import { API_CONFIG } from '../apis/config';

/** Ảnh/video: full URL (Cloudinary) giữ nguyên; path relative (/api/...) ghép BASE_URL (Gateway). */
export function resolveMediaUrl(url: string | undefined | null): string {
  if (url == null || typeof url !== 'string') return '';
  const u = url.trim();
  if (!u) return '';
  // Base64 / blob từ form chỉnh profile — không được ghép BASE_URL
  if (u.startsWith('data:') || u.startsWith('blob:')) return u;
  if (/^https?:\/\//i.test(u)) return u;
  // Protocol-relative //domain/...
  if (u.startsWith('//')) {
    if (typeof window !== 'undefined' && window.location?.protocol) {
      return `${window.location.protocol}${u}`;
    }
    return `https:${u}`;
  }
  const base = API_CONFIG.BASE_URL.replace(/\/$/, '');
  const path = u.startsWith('/') ? u : `/${u}`;
  return `${base}${path}`;
}

/**
 * URL ảnh/video trong entity Story (`content`) — full https giữ nguyên; path upload local ghép CommonService.
 */
export function resolveStoryContentUrl(content: string | undefined | null): string {
  if (content == null || typeof content !== 'string') return '';
  const c = content.trim();
  if (!c) return '';
  if (/^https?:\/\//i.test(c)) return c;
  if (c.startsWith('data:') || c.startsWith('blob:')) return c;
  const base = API_CONFIG.COMMON_SERVICE_URL.replace(/\/$/, '');
  const path = c.startsWith('/') ? c : `/${c}`;
  return `${base}${path}`;
}
