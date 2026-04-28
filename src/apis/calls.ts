import { httpClient } from './http';

export type CallType = 'VOICE' | 'VIDEO';
export type CallStatus = 'RINGING' | 'ONGOING' | 'COMPLETED' | 'MISSED' | 'DECLINED';
export type CallState = 'RINGING' | 'CONNECTED' | 'ENDED';
export type CallCategory = 'DIRECT' | 'GROUP';

export interface CallRecord {
  id: string;
  conversationId: string;
  callerId: string;
  calleeIds: string[];
  type: CallType;
  status: CallStatus;
  callType: CallCategory;
  hostId: string;
  activeParticipantIds: string[];
  state: CallState;
  durationSeconds: number;
  startedAt: string;
  endedAt?: string;
}

export interface InitiateCallRequest {
  conversationId: string;
  callerId: string;
  calleeIds: string[];
  type: CallType;
}

export interface CallActionPayload {
  userId: string;
  transferToUserId?: string;
}

export const callsApi = {
  getCallsByConversationId: async (conversationId: string): Promise<CallRecord[]> => {
    return httpClient.get<CallRecord[]>(`/api/message/calls/conversation/${conversationId}`);
  },

  initiate: async (payload: InitiateCallRequest): Promise<CallRecord> => {
    return httpClient.post<CallRecord>(`/api/message/calls/initiate`, payload);
  },

  join: async (callId: string, payload: CallActionPayload): Promise<CallRecord> => {
    return httpClient.post<CallRecord>(`/api/message/calls/${callId}/join`, payload);
  },

  leave: async (callId: string, payload: CallActionPayload): Promise<CallRecord> => {
    return httpClient.post<CallRecord>(`/api/message/calls/${callId}/leave`, payload);
  },

  end: async (callId: string, payload: CallActionPayload): Promise<CallRecord> => {
    return httpClient.post<CallRecord>(`/api/message/calls/${callId}/end`, payload);
  },

  endAll: async (callId: string, payload: CallActionPayload): Promise<CallRecord> => {
    return httpClient.post<CallRecord>(`/api/message/calls/${callId}/end-all`, payload);
  },

  rejoin: async (callId: string, payload: CallActionPayload): Promise<CallRecord> => {
    return httpClient.post<CallRecord>(`/api/message/calls/${callId}/rejoin`, payload);
  },

  transferHost: async (callId: string, payload: CallActionPayload): Promise<CallRecord> => {
    return httpClient.post<CallRecord>(`/api/message/calls/${callId}/transfer-host`, payload);
  },

  missed: async (callId: string, payload: CallActionPayload): Promise<CallRecord> => {
    return httpClient.post<CallRecord>(`/api/message/calls/${callId}/missed`, payload);
  },

  getParticipants: async (callId: string): Promise<string[]> => {
    return httpClient.get<string[]>(`/api/message/calls/${callId}/participants`);
  },
};
