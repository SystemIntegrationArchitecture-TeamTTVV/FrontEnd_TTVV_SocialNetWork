// src/apis/livestream.ts — API client for LiveKit WebRTC live streaming
import { httpClient } from './http';
import { API_CONFIG } from './config';

export interface LiveStreamData {
  id: string;
  streamerId: string;
  streamerName: string;
  streamerAvatar?: string;
  title: string;
  description?: string;

  roomName: string;
  livekitToken?: string;
  livekitUrl?: string;
  requiresApproval: boolean;

  status: 'PENDING' | 'LIVE' | 'ENDED';
  thumbnailUrl?: string;
  viewerCount: number;
  viewerIds?: string[];
  approvedViewerIds?: string[];
  chatConversationId?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt?: string;

  /** Chỉ có khi gọi getToken / create */
  isHost?: boolean;
  canSubscribe?: boolean;
  /** APPROVED | WAITING | ENDED — từ getStreamById / getToken */
  joinStatus?: string;

  /** VIP level of the host (0=Free, 1=Basic, 2=Pro, 3=Enterprise) */
  vipLevel?: number;
  /** Max live duration in minutes (5, 120, 480, -1=unlimited) */
  maxLiveDurationMinutes?: number;
}

export interface CreateStreamParams {
  userId: string;
  streamerName: string;
  streamerAvatar?: string;
  title: string;
  description?: string;
  requiresApproval?: boolean;
  thumbnailUrl?: string;
}

async function uploadThumbnailRaw(streamId: string, userId: string, file: File): Promise<LiveStreamData> {
  const formData = new FormData();
  formData.append('file', file);
  const url = `${API_CONFIG.BASE_URL}/api/message/livestream/${encodeURIComponent(streamId)}/thumbnail?userId=${encodeURIComponent(userId)}`;
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Upload failed (${response.status})`);
  }
  return data as LiveStreamData;
}

export const livestreamApi = {
  createStream: async (params: CreateStreamParams): Promise<LiveStreamData> => {
    return httpClient.post<LiveStreamData>('/api/message/livestream/create', {
      userId: params.userId,
      title: params.title,
      streamerName: params.streamerName,
      streamerAvatar: params.streamerAvatar,
      description: params.description,
      requiresApproval: params.requiresApproval,
      thumbnailUrl: params.thumbnailUrl,
    });
  },

  getToken: async (roomName: string, userId: string, userName: string = 'User'): Promise<LiveStreamData> => {
    const qs = new URLSearchParams({ roomName, userId, userName }).toString();
    return httpClient.get<LiveStreamData>(`/api/message/livestream/token?${qs}`);
  },

  getActiveStreams: async (): Promise<LiveStreamData[]> => {
    return httpClient.get<LiveStreamData[]>('/api/message/livestream/active');
  },

  getStreamById: async (streamId: string, userId?: string): Promise<LiveStreamData> => {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return httpClient.get<LiveStreamData>(`/api/message/livestream/${streamId}${qs}`);
  },

  getMyActiveStream: async (userId: string): Promise<LiveStreamData | null> => {
    try {
      return await httpClient.get<LiveStreamData>(`/api/message/livestream/my/${userId}`);
    } catch {
      return null;
    }
  },

  getMyStreams: async (userId: string): Promise<LiveStreamData[]> => {
    return httpClient.get<LiveStreamData[]>(`/api/message/livestream/my/${userId}/history`);
  },

  endStream: async (streamId: string, userId: string): Promise<LiveStreamData> => {
    return httpClient.post<LiveStreamData>(
      `/api/message/livestream/${streamId}/end?userId=${encodeURIComponent(userId)}`
    );
  },

  joinStream: async (streamId: string, userId: string): Promise<LiveStreamData> => {
    return httpClient.post<LiveStreamData>(
      `/api/message/livestream/${streamId}/join?userId=${encodeURIComponent(userId)}`
    );
  },

  leaveStream: async (streamId: string, userId: string): Promise<void> => {
    await httpClient.post(
      `/api/message/livestream/${streamId}/leave?userId=${encodeURIComponent(userId)}`
    );
  },

  updateSettings: async (
    streamId: string,
    hostUserId: string,
    requiresApproval: boolean
  ): Promise<LiveStreamData> => {
    return httpClient.patch<LiveStreamData>(`/api/message/livestream/${streamId}/settings`, {
      hostUserId,
      requiresApproval,
    });
  },

  approveViewer: async (
    streamId: string,
    hostUserId: string,
    viewerUserId: string
  ): Promise<LiveStreamData> => {
    return httpClient.post<LiveStreamData>(`/api/message/livestream/${streamId}/approve-viewer`, {
      hostUserId,
      viewerUserId,
    });
  },

  kickViewer: async (
    streamId: string,
    hostUserId: string,
    participantUserId: string
  ): Promise<LiveStreamData> => {
    return httpClient.post<LiveStreamData>(`/api/message/livestream/${streamId}/kick`, {
      hostUserId,
      participantUserId,
    });
  },

  uploadThumbnail: async (streamId: string, hostUserId: string, file: File): Promise<LiveStreamData> => {
    return uploadThumbnailRaw(streamId, hostUserId, file);
  },

  sendChat: async (
    streamId: string,
    body: { userId: string; userName: string; content: string }
  ): Promise<void> => {
    await httpClient.post(`/api/message/livestream/${streamId}/chat`, body);
  },
};
