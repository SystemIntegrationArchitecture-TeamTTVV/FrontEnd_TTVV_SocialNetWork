// src/apis/aiConsultation.ts — API client for AI Livestream Consultation
import { httpClient } from './http';

export interface ConsultationLog {
  id: string;
  callId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  phoneNumber: string;
  status: 'calling' | 'completed' | 'failed' | 'no-answer';
  result: 'pending' | 'interested' | 'registered' | 'not_interested' | 'callback';
  recommendedPackage?: string;
  duration: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ConsultationSettings {
  packages: string;
  instructions: string;
  wsUrl: string;
  groqApiKey: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
}

export interface ConsultationSummary {
  total: number;
  pending: number;
  interested: number;
  registered: number;
  notInterested: number;
  callback: number;
}

export interface StartCallParams {
  userId: string;
  phoneNumber: string;
}

export interface StartCallResponse {
  success: boolean;
  callId?: string;
  message: string;
}

export const aiConsultationApi = {
  /**
   * Get consultation history logs
   */
  getLogs: async (): Promise<ConsultationLog[]> => {
    try {
      return await httpClient.get<ConsultationLog[]>('/api/common/ai-consultation/logs');
    } catch {
      return [];
    }
  },

  /**
   * Get consultation summary stats
   */
  getSummary: async (): Promise<ConsultationSummary> => {
    try {
      return await httpClient.get<ConsultationSummary>('/api/common/ai-consultation/summary');
    } catch {
      return { total: 0, pending: 0, interested: 0, registered: 0, notInterested: 0, callback: 0 };
    }
  },

  /**
   * Get consultation settings
   */
  getSettings: async (): Promise<ConsultationSettings> => {
    try {
      return await httpClient.get<ConsultationSettings>('/api/common/ai-consultation/settings');
    } catch {
      return { 
        packages: '', instructions: '', wsUrl: '', groqApiKey: '',
        twilioAccountSid: '', twilioAuthToken: '', twilioPhoneNumber: ''
      };
    }
  },

  /**
   * Save consultation settings
   */
  saveSettings: async (settings: Partial<ConsultationSettings>): Promise<{ success: boolean }> => {
    return httpClient.put<{ success: boolean }>('/api/common/ai-consultation/settings', settings);
  },

  /**
   * Start AI consultation call to a user
   */
  startCall: async (params: StartCallParams): Promise<StartCallResponse> => {
    return httpClient.post<StartCallResponse>('/api/common/ai-consultation/call', params);
  },

  /**
   * Update consultation result
   */
  updateResult: async (logId: string, data: {
    result: string;
    notes?: string;
    recommendedPackage?: string;
  }): Promise<{ success: boolean }> => {
    return httpClient.put<{ success: boolean }>(`/api/common/ai-consultation/logs/${logId}`, data);
  },
};
