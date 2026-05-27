// src/apis/billing.ts — API client for Wallet, Coins, Gifts, Donations, and VNPAY Payments
import { httpClient } from './http';

// ══════════════════════════════════════════════════════════════════════════════
// ═══ Types ════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface WalletData {
  userId: string;
  balance: number;
}

export interface CoinPackageData {
  id: string;
  name: string;
  coins: number;
  bonusCoins: number;
  priceVnd: number;
  description: string;
  active: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GiftData {
  id: string;
  name: string;
  price: number;
  emoji: string;
  imageUrl?: string;
  category?: string;
  active?: boolean;
  sortOrder?: number;
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
  transaction: TransactionData;
}

export interface TransactionData {
  id: string;
  userId: string;
  type: 'deposit' | 'donate' | 'receive';
  amount: number;
  giftId?: string;
  giftName?: string;
  roomId?: string;
  senderId?: string;
  senderName?: string;
  receiverId?: string;
  receiverName?: string;
  giftMessage?: string;
  status: string;
  createdAt: string;
}

export interface PaymentTransactionData {
  id: string;
  orderCode: string;
  userId: string;
  coinPackageId: string;
  coinPackageName: string;
  coinAmount: number;
  amountVnd: number;
  paymentProvider: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  vnpTransactionNo?: string;
  vnpResponseCode?: string;
  vnpBankCode?: string;
  coinsCredited: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface TopDonorData {
  senderId: string;
  senderName: string;
  totalCoins: number;
}

export interface VnpayReturnResult {
  orderCode: string;
  responseCode: string;
  transactionNo: string;
  bankCode: string;
  amount: number;
  payDate: string;
  isValid: boolean;
  isSuccess: boolean;
}

export interface AdminReportData {
  totalRevenue: number;
  totalSuccessPayments: number;
  totalPayments: number;
  totalGiftTransactions: number;
  topDepositors: Array<{ userId: string; totalSpent: number; count: number }>;
  topStreamers: Array<{ receiverId: string; receiverName: string; totalCoins: number; giftCount: number }>;
}

// VNPAY Service URL (the Node.js VNPAY bridge)
const VNPAY_SERVICE_URL = import.meta.env.VITE_VNPAY_SERVICE_URL || 'https://vp-be-veu1.onrender.com';

// ══════════════════════════════════════════════════════════════════════════════
// ═══ API Client ═══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const billingApi = {
  // ── Wallet ────────────────────────────────────────────────────────────────
  /** Get user's wallet balance */
  getWallet: async (userId: string): Promise<WalletData> => {
    return httpClient.get<WalletData>(`/api/message/billing/wallet?userId=${encodeURIComponent(userId)}`);
  },

  // ── Coin Packages ─────────────────────────────────────────────────────────
  /** Get active coin packages for users */
  getCoinPackages: async (): Promise<CoinPackageData[]> => {
    return httpClient.get<CoinPackageData[]>('/api/message/billing/coin-packages');
  },

  /** Get ALL coin packages (admin) */
  getAllCoinPackages: async (): Promise<CoinPackageData[]> => {
    return httpClient.get<CoinPackageData[]>('/api/message/billing/coin-packages/all');
  },

  /** Create coin package (admin) */
  createCoinPackage: async (pkg: Partial<CoinPackageData>): Promise<CoinPackageData> => {
    return httpClient.post<CoinPackageData>('/api/message/billing/coin-packages', pkg);
  },

  /** Update coin package (admin) */
  updateCoinPackage: async (id: string, pkg: Partial<CoinPackageData>): Promise<CoinPackageData> => {
    return httpClient.put<CoinPackageData>(`/api/message/billing/coin-packages/${id}`, pkg);
  },

  /** Toggle coin package (admin) */
  toggleCoinPackage: async (id: string, active: boolean): Promise<void> => {
    await httpClient.patch(`/api/message/billing/coin-packages/${id}/toggle?active=${active}`);
  },

  /** Delete coin package (admin) */
  deleteCoinPackage: async (id: string): Promise<void> => {
    await httpClient.delete(`/api/message/billing/coin-packages/${id}`);
  },

  // ── VNPAY Payment Flow ────────────────────────────────────────────────────

  /**
   * Step 1: Create payment order in MessageService
   * Returns PaymentTransaction with orderCode
   */
  createPaymentOrder: async (userId: string, coinPackageId: string): Promise<PaymentTransactionData> => {
    return httpClient.post<PaymentTransactionData>('/api/message/billing/payment/create', {
      userId,
      coinPackageId,
    });
  },

  /**
   * Step 2: Get VNPAY payment URL from VNPAY Node.js service
   * Uses the orderCode from Step 1
   */
  getVnpayPaymentUrl: async (orderCode: string, amountVnd: number): Promise<string> => {
    const returnUrl = `${window.location.origin}/wallet/vnpay-return`;
    const response = await fetch(`${VNPAY_SERVICE_URL}/order/create_coin_payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderCode,
        amount: amountVnd,
        returnUrl,
      }),
    });
    if (!response.ok) {
      throw new Error('Không thể tạo liên kết thanh toán VNPAY');
    }
    const data = await response.json();
    return data.paymentUrl;
  },

  /**
   * Step 3: Verify VNPAY return (called when user is redirected back)
   */
  verifyVnpayReturn: async (queryString: string): Promise<VnpayReturnResult> => {
    const response = await fetch(`${VNPAY_SERVICE_URL}/order/vnpay_coin_return?${queryString}`);
    if (!response.ok) {
      throw new Error('Không thể xác thực kết quả thanh toán');
    }
    return response.json();
  },

  // ── Transaction History ───────────────────────────────────────────────────
  /** All coin transactions for a user */
  getTransactions: async (userId: string): Promise<TransactionData[]> => {
    return httpClient.get<TransactionData[]>(`/api/message/billing/transactions?userId=${encodeURIComponent(userId)}`);
  },

  /** Deposit-only history */
  getDeposits: async (userId: string): Promise<TransactionData[]> => {
    return httpClient.get<TransactionData[]>(`/api/message/billing/transactions/deposits?userId=${encodeURIComponent(userId)}`);
  },

  /** Gift-sending history */
  getDonations: async (userId: string): Promise<TransactionData[]> => {
    return httpClient.get<TransactionData[]>(`/api/message/billing/transactions/donations?userId=${encodeURIComponent(userId)}`);
  },

  /** Payment transactions (VNPAY) */
  getPayments: async (userId: string): Promise<PaymentTransactionData[]> => {
    return httpClient.get<PaymentTransactionData[]>(`/api/message/billing/payments?userId=${encodeURIComponent(userId)}`);
  },

  // ── Gifts ─────────────────────────────────────────────────────────────────
  /** Get all available gifts */
  getGifts: async (): Promise<GiftData[]> => {
    return httpClient.get<GiftData[]>('/api/message/billing/gifts');
  },

  /** Get ALL gifts including inactive (admin) */
  getAllGiftsAdmin: async (): Promise<GiftData[]> => {
    return httpClient.get<GiftData[]>('/api/message/billing/gifts/all');
  },

  /** Create gift (admin) */
  createGift: async (gift: Partial<GiftData>): Promise<GiftData> => {
    return httpClient.post<GiftData>('/api/message/billing/gifts', gift);
  },

  /** Update gift (admin) */
  updateGift: async (id: string, gift: Partial<GiftData>): Promise<GiftData> => {
    return httpClient.put<GiftData>(`/api/message/billing/gifts/${id}`, gift);
  },

  /** Toggle gift visibility (admin) */
  toggleGift: async (id: string, active: boolean): Promise<void> => {
    await httpClient.patch(`/api/message/billing/gifts/${id}/toggle?active=${active}`);
  },

  // ── Donate ────────────────────────────────────────────────────────────────
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

  // ── Admin Reports ─────────────────────────────────────────────────────────
  /** Get admin billing report */
  getAdminReport: async (): Promise<AdminReportData> => {
    return httpClient.get<AdminReportData>('/api/message/billing/admin/report');
  },
};
