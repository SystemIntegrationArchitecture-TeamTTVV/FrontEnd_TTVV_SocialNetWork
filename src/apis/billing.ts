// src/apis/billing.ts — API client for Wallet, Gifts, and Donations
import { httpClient } from './http';

export interface WalletData {
  userId: string;
  balance: number;
}

export interface GiftData {
  id: string;
  name: string;
  price: number;
  emoji: string;
  imageUrl?: string;
  category?: string;
}

export interface DonateRequest {
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  giftId: string;
  roomId: string;
  giftMessage?: string;
}

export interface DonateResponse {
  senderBalance: number;
  gift: GiftData;
  transaction: any;
}

export interface TopDonorData {
  senderId: string;
  senderName: string;
  totalCoins: number;
}

export const billingApi = {
  /** Get user's wallet balance */
  getWallet: async (userId: string): Promise<WalletData> => {
    return httpClient.get<WalletData>(`/api/message/billing/wallet?userId=${encodeURIComponent(userId)}`);
  },

  /** Get all available gifts */
  getGifts: async (): Promise<GiftData[]> => {
    return httpClient.get<GiftData[]>('/api/message/billing/gifts');
  },

  /** Send a gift to a streamer */
  donate: async (params: DonateRequest): Promise<DonateResponse> => {
    return httpClient.post<DonateResponse>('/api/message/billing/donate', params);
  },

  /** Get top donors for a streamer */
  getTopDonors: async (userId: string): Promise<TopDonorData[]> => {
    return httpClient.get<TopDonorData[]>(`/api/message/billing/top-donors/${encodeURIComponent(userId)}`);
  },

  /** Mock deposit coins for demo */
  deposit: async (userId: string, amount: number): Promise<WalletData> => {
    return httpClient.post<WalletData>('/api/message/billing/deposit', { userId, amount });
  },
};
