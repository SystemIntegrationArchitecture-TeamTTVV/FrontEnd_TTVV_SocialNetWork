import { httpClient } from './http';

export type CallType = 'VOICE' | 'VIDEO';
export type CallStatus = 'RINGING' | 'ONGOING' | 'COMPLETED' | 'MISSED' | 'DECLINED';

export interface CallRecord {
  id: string;
  conversationId: string;
  callerId: string;
  calleeIds: string[];
  type: CallType;
  status: CallStatus;
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

export interface JoinCallRequest {
  userId: string;
}

export interface EndCallRequest {
  userId: string;
}

export interface MissedCallRequest {
  userId: string;
}

export const callsApi = {
  getCallsByConversationId: async (conversationId: string): Promise<CallRecord[]> => {
    return httpClient.get<CallRecord[]>(`/api/message/calls/conversation/${conversationId}`);
  },

  initiate: async (payload: InitiateCallRequest): Promise<CallRecord> => {
    return httpClient.post<CallRecord>(`/api/message/calls/initiate`, payload);
  },

  join: async (callId: string, payload: JoinCallRequest): Promise<CallRecord> => {
    return httpClient.post<CallRecord>(`/api/message/calls/${callId}/join`, payload);
  },

  end: async (callId: string, payload: EndCallRequest): Promise<CallRecord> => {
    return httpClient.post<CallRecord>(`/api/message/calls/${callId}/end`, payload);
  },

  missed: async (callId: string, payload: MissedCallRequest): Promise<CallRecord> => {
    return httpClient.post<CallRecord>(`/api/message/calls/${callId}/missed`, payload);
  },
};
