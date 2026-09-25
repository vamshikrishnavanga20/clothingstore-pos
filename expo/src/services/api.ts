// Central API service for Roman Island POS Mobile Terminal
import { Platform } from 'react-native';
import { safeStorage } from '../utils/storage';

const DEV_MACHINE_IP = '192.168.29.89';

export const DEFAULT_API_URL = __DEV__
  ? Platform.OS === 'android'
    ? `http://${DEV_MACHINE_IP}:3000`
    : `http://localhost:3000`
  : 'https://clothingstore-pos.vercel.app';

let cachedApiUrl: string | null = null;

export async function getBaseApiUrl(): Promise<string> {
  if (cachedApiUrl) return cachedApiUrl;
  try {
    const saved = await safeStorage.getItem('roman_island_server_url');
    if (saved && saved.trim()) {
      cachedApiUrl = saved.trim().replace(/\/$/, '');
      return cachedApiUrl;
    }
  } catch (e) {
    // fallback
  }
  cachedApiUrl = DEFAULT_API_URL;
  return cachedApiUrl;
}

export async function setBaseApiUrl(url: string) {
  cachedApiUrl = url.trim().replace(/\/$/, '');
  await safeStorage.setItem('roman_island_server_url', cachedApiUrl);
}

// 1. Categories
export async function getCategories() {
  const baseUrl = await getBaseApiUrl();
  const res = await fetch(`${baseUrl}/api/categories`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

// 2. Apparel Products
export async function getProducts() {
  const baseUrl = await getBaseApiUrl();
  const res = await fetch(`${baseUrl}/api/products`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Failed to fetch apparel catalog');
  return res.json();
}

// 3. Store Branches
export async function getBranches() {
  const baseUrl = await getBaseApiUrl();
  const res = await fetch(`${baseUrl}/api/branches`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Failed to fetch branches');
  return res.json();
}

// 4. Submit Retail Billing Order
export async function submitBillingOrder(orderData: {
  branchId: string;
  items: Array<{ productId: string; size: string; quantity: number }>;
  discount?: number;
  pointsRedeemed?: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card';
  customerName?: string;
  customerPhone?: string;
  cashierName?: string;
  source?: string;
}) {
  const baseUrl = await getBaseApiUrl();
  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      source: 'mobile-expo',
      ...orderData,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Order generation failed (${res.status})`);
  }

  return res.json();
}

// 5. Get Order History
export async function getOrderHistory(branchId?: string, search?: string) {
  const baseUrl = await getBaseApiUrl();
  let url = `${baseUrl}/api/orders`;
  const params: string[] = [];
  if (branchId) params.push(`branchId=${encodeURIComponent(branchId)}`);
  if (search) params.push(`search=${encodeURIComponent(search)}`);
  if (params.length > 0) url += `?${params.join('&')}`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

// 6. Get Analytics & Revenue
export async function getAnalytics(range: string = 'today') {
  const baseUrl = await getBaseApiUrl();
  const res = await fetch(`${baseUrl}/api/analytics?range=${encodeURIComponent(range)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch store analytics');
  return res.json();
}

// 7. Process Order Return & Restock
export async function returnOrder(orderId: string, reason?: string, cashierName?: string) {
  const baseUrl = await getBaseApiUrl();
  const res = await fetch(`${baseUrl}/api/orders/return`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      orderId,
      reason: reason || 'Customer Return / Exchange',
      cashierName,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Return failed (${res.status})`);
  }

  return res.json();
}

// 8. Verify Terminal PIN & Fetch Cloud Session Token
export async function verifyTerminalPin(pin: string): Promise<{
  success: boolean;
  token?: string;
  user?: {
    role: 'admin' | 'cashier';
    staffName: string;
    branchId: string;
    permissions: string[];
  };
  message?: string;
}> {
  const baseUrl = await getBaseApiUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(`${baseUrl}/api/auth/terminal-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ pin }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json();
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// 9. Customer Loyalty & VIP Profile Lookup
export interface CustomerProfile {
  id: string;
  phone: string;
  name: string;
  tier: 'Silver' | 'Gold' | 'Black Elite';
  loyaltyPoints: number;
  totalSpend: number;
  ordersCount: number;
  createdAt: string;
  lastVisit: string;
}

export async function getCustomerProfile(phone: string): Promise<CustomerProfile | null> {
  const cleanPhone = (phone || '').replace(/\D/g, '');
  if (cleanPhone.length !== 10) return null;

  const baseUrl = await getBaseApiUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(`${baseUrl}/api/customers?phone=${encodeURIComponent(cleanPhone)}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    return data.customer || null;
  } catch (err) {
    clearTimeout(timeoutId);
    return null;
  }
}

// 10. Automated WhatsApp / SMS Digital Invoice Dispatch
export async function sendDigitalInvoice(
  orderId: string,
  channel: 'whatsapp' | 'sms' = 'whatsapp'
): Promise<{ success: boolean; message?: string; notification?: any; error?: string }> {
  const baseUrl = await getBaseApiUrl();
  const res = await fetch(`${baseUrl}/api/notifications/invoice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ orderId, channel }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to dispatch digital invoice');
  }
  return data;
}

