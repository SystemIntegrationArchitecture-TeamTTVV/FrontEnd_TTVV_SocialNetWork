export type Story = {
  id: string;

  /* ===== OWNER ===== */
  user: {
    id: string;
    name: string;
    avatar: string;
  };

  /* ===== CONTENT ===== */
  contentType: 'image' | 'video' | 'text';
  content: string;              // image/video URL hoặc text
  background?: string;           // dùng cho text story
  duration?: number;             // giây (video hoặc text) – FE dùng progress

  /* ===== META ===== */
  createdAt: string;             // ISO string: 2026-01-25T09:30:00Z
  expiresAt: string;             // auto 24h (BE xử lý)
  isViewed?: boolean;            // user hiện tại đã xem chưa
  viewCount?: number;            // tổng lượt xem

  /* ===== INTERACTION (OPTIONAL) ===== */
  reactions?: {
    like?: number;
    love?: number;
    haha?: number;
  };

  /* ===== SYSTEM ===== */
  isActive?: boolean;            // soft delete / hide
};
