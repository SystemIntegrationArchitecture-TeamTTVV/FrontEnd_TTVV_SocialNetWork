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
  /** Chú thích trên ảnh/video (tuỳ chọn) */
  caption?: string;
  duration?: number;             // giây (video hoặc text) – FE dùng progress

  /* ===== META ===== */
  createdAt: string;             // ISO string: 2026-01-25T09:30:00Z
  expiresAt: string;             // auto 24h (BE xử lý)
  isViewed?: boolean;            // user hiện tại đã xem chưa
  viewCount?: number;            // tổng lượt xem

  /* ===== INTERACTION (OPTIONAL) ===== */
  reactions?: Record<string, number>;
  /** Only populated for story owner — list of viewer userIds */
  viewers?: string[];

  /* ===== SYSTEM ===== */
  isActive?: boolean;            // soft delete / hide
};
