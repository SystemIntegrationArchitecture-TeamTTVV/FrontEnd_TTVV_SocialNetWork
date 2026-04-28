// src/apis/livestream.ts — API client for live streaming
import { httpClient } from './http';

export interface LiveStreamData {
  id: string;
  streamerId: string;
  streamerName: string;
  streamerAvatar?: string;
  title: string;
  description?: string;
  /** Only returned to the stream owner */
  streamKey?: string;
  /** RTMP URL for OBS — only returned to the stream owner */
  rtmpUrl?: string;
  status: 'PENDING' | 'LIVE' | 'ENDED';
  hlsUrl: string;
  thumbnailUrl?: string;
  viewerCount: number;
  viewerIds?: string[];
  chatConversationId?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt?: string;
}

export interface CreateStreamParams {
  userId: string;
  streamerName: string;
  streamerAvatar?: string;
  title: string;
  description?: string;
}

export const livestreamApi = {
  /** Create a new live stream session */
  createStream: async (params: CreateStreamParams): Promise<LiveStreamData> => {
    const qs = new URLSearchParams({
      userId: params.userId,
      title: params.title,
      ...(params.streamerName && { streamerName: params.streamerName }),
      ...(params.streamerAvatar && { streamerAvatar: params.streamerAvatar }),
      ...(params.description && { description: params.description }),
    }).toString();
    return httpClient.post<LiveStreamData>(`/api/message/livestream/create?${qs}`);
  },

  /** Get all currently LIVE streams */
  getActiveStreams: async (): Promise<LiveStreamData[]> => {
    return httpClient.get<LiveStreamData[]>('/api/message/livestream/active');
  },

  /** Get a specific stream by ID */
  getStreamById: async (streamId: string, userId?: string): Promise<LiveStreamData> => {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return httpClient.get<LiveStreamData>(`/api/message/livestream/${streamId}${qs}`);
  },

  /** Get current user's active/pending stream */
  getMyActiveStream: async (userId: string): Promise<LiveStreamData | null> => {
    try {
      return await httpClient.get<LiveStreamData>(`/api/message/livestream/my/${userId}`);
    } catch {
      return null; // 204 No Content = no active stream
    }
  },

  /** Get stream history for a user */
  getMyStreams: async (userId: string): Promise<LiveStreamData[]> => {
    return httpClient.get<LiveStreamData[]>(`/api/message/livestream/my/${userId}/history`);
  },

  /** End a live stream */
  endStream: async (streamId: string, userId: string): Promise<LiveStreamData> => {
    return httpClient.post<LiveStreamData>(
      `/api/message/livestream/${streamId}/end?userId=${encodeURIComponent(userId)}`
    );
  },

  /** Join a stream as a viewer */
  joinStream: async (streamId: string, userId: string): Promise<LiveStreamData> => {
    return httpClient.post<LiveStreamData>(
      `/api/message/livestream/${streamId}/join?userId=${encodeURIComponent(userId)}`
    );
  },

  /** Leave a stream */
  leaveStream: async (streamId: string, userId: string): Promise<void> => {
    await httpClient.post(
      `/api/message/livestream/${streamId}/leave?userId=${encodeURIComponent(userId)}`
    );
  },
};
