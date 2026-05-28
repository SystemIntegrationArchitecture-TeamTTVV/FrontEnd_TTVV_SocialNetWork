// src/apis/vip.ts — API client for VIP Livestream Subscriptions
import { httpClient } from './http';

// VNPAY Service URL (reuses the same Node.js VNPAY bridge as coin purchases)
const VNPAY_SERVICE_URL = import.meta.env.VITE_VNPAY_SERVICE_URL || 'https://vp-be-veu1.onrender.com';

// ══════════════════════════════════════════════════════════════════════════════
// ═══ Types ════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface VipSubscription {
  userId: string;
  vipLevel: number;
  status: 'ACTIVE' | 'EXPIRED' | 'NONE';
  priceVnd: number;
  maxLiveDurationMinutes: number;
  activatedAt?: string;
  expiresAt?: string;
}

export interface VipPackageInfo {
  level: number;
  name: string;
  priceVnd: number;
  maxLiveDurationMinutes: number;
  features: string[];
}

export interface VipPaymentOrder {
  id: string;
  orderCode: string;
  userId: string;
  amountVnd: number;
  status: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// ═══ API Client ═══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const vipApi = {
  /** Get current VIP subscription info for a user */
  getVipInfo: async (userId: string): Promise<VipSubscription> => {
    return httpClient.get<VipSubscription>(
      `/api/message/billing/vip/info?userId=${encodeURIComponent(userId)}`
    );
  },

  /** Get available VIP packages */
  getVipPackages: async (): Promise<VipPackageInfo[]> => {
    return httpClient.get<VipPackageInfo[]>('/api/message/billing/vip/packages');
  },

  /** Step 1: Create a VIP payment order */
  purchaseVip: async (userId: string, vipLevel: number): Promise<VipPaymentOrder> => {
    return httpClient.post<VipPaymentOrder>('/api/message/billing/vip/purchase', {
      userId,
      vipLevel,
    });
  },

  /** Step 2: Get VNPAY payment URL (reuses the coin payment VNPAY bridge) */
  getVnpayVipUrl: async (orderCode: string, amountVnd: number): Promise<string> => {
    const returnUrl = `${window.location.origin}/wallet/vnpay-vip-return`;
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

  /** Step 3: Verify VNPAY return */
  verifyVnpayVipReturn: async (queryString: string): Promise<{
    orderCode: string;
    responseCode: string;
    transactionNo: string;
    bankCode: string;
    amount: number;
    isValid: boolean;
    isSuccess: boolean;
  }> => {
    const response = await fetch(`${VNPAY_SERVICE_URL}/order/vnpay_coin_return?${queryString}`);
    if (!response.ok) {
      throw new Error('Không thể xác thực kết quả thanh toán');
    }
    return response.json();
  },

  /** Step 4: Process VIP callback on backend */
  processVipCallback: async (data: {
    orderCode: string;
    vnpResponseCode: string;
    vnpTransactionNo?: string;
    vnpBankCode?: string;
  }): Promise<VipPaymentOrder> => {
    return httpClient.post<VipPaymentOrder>('/api/message/billing/vip/vnpay-callback', data);
  },
};
