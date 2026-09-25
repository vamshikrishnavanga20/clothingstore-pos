/**
 * useOrders — Retail Billing & Invoices hook using TanStack React Query.
 * Matching expo.zip architecture.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { safeStorage } from '../utils/storage';
import {
  getCategories,
  getProducts,
  getBranches,
  getOrderHistory,
  submitBillingOrder,
  returnOrder,
} from '../services/api';
import { FALLBACK_BRANCHES, FALLBACK_PRODUCTS, CATEGORIES } from '../constants/fallbacks';
import { hapticSuccess, hapticWarning } from '../utils/haptics';

export type OrderType = 'walk-in' | 'vip' | 'reserve';

export interface RetailOrderItem {
  productId: string;
  productName: string;
  category: string;
  image: string;
  size: string;
  quantity: number;
  unitSellingPrice: number;
  unitCostPrice: number;
  subtotal: number;
  grossProfit?: number;
}

export interface RetailOrder {
  id: string;
  billingId: string;
  branchId: string;
  branchName: string;
  items: RetailOrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card';
  customerName: string;
  customerPhone: string;
  pointsEarned?: number;
  pointsRedeemed?: number;
  customerTier?: 'Silver' | 'Gold' | 'Black Elite';
  cashierName: string;
  orderType: OrderType;
  status: 'Completed' | 'Refunded' | 'Cancelled';
  returnReason?: string;
  refundedAt?: string;
  createdAt: string;
  source: string;
}

const STORAGE_ORDERS_KEY = 'roman_pos_local_orders';

export function useOrders(activeBranchId: string) {
  const queryClient = useQueryClient();
  const [localOrders, setLocalOrders] = useState<RetailOrder[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const appStateRef = useRef(AppState.currentState);

  // 1. Categories Query
  const { data: categories = CATEGORIES } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const res = await getCategories();
        if (Array.isArray(res) && res.length > 0) {
          return ['All Apparel', ...res.map((c: any) => c.name)];
        }
      } catch (e) {
        // fallback
      }
      return CATEGORIES;
    },
    staleTime: 1000 * 60 * 10,
  });

  // 2. Apparel Products Query (5m stale time, catalog doesn't shift continuously)
  const {
    data: products = FALLBACK_PRODUCTS,
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<any[]> => {
      try {
        const res = await getProducts();
        if (Array.isArray(res) && res.length > 0) {
          setLastSyncTime(new Date());
          return res;
        }
      } catch (e) {
        // fallback
      }
      return FALLBACK_PRODUCTS;
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnMount: false,
  });

  // 3. Branches Query
  const { data: branches = FALLBACK_BRANCHES } = useQuery({
    queryKey: ['branches'],
    queryFn: async (): Promise<any[]> => {
      try {
        const res = await getBranches();
        if (Array.isArray(res) && res.length > 0) {
          return res;
        }
      } catch (e) {
        // fallback
      }
      return FALLBACK_BRANCHES;
    },
    staleTime: 1000 * 60 * 30,
  });

  // 4. Orders / Invoices Query (20s interval, instant caching)
  const {
    data: serverOrders = [],
    isLoading: isLoadingOrders,
    isFetching: isFetchingOrders,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['orders', activeBranchId],
    queryFn: async (): Promise<RetailOrder[]> => {
      try {
        const res = await getOrderHistory(activeBranchId);
        if (Array.isArray(res)) {
          setLastSyncTime(new Date());
          safeStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(res)).catch(() => {});
          return res;
        }
      } catch (e) {
        // fallback to locally saved orders
      }
      const saved = await safeStorage.getItem(STORAGE_ORDERS_KEY);
      return saved ? JSON.parse(saved) : [];
    },
    staleTime: 1000 * 10,
    refetchInterval: 20000,
    refetchIntervalInBackground: false,
    refetchOnMount: false,
  });

  // Background AppState Foreground Listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App returned to foreground: force immediate data refresh
        refetchProducts();
        refetchOrders();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [refetchProducts, refetchOrders]);

  // Combined orders (server + offline)
  const tickets: RetailOrder[] = useMemo(() => {
    const list = Array.isArray(serverOrders) ? [...serverOrders] : [];
    localOrders.forEach(lo => {
      if (!list.some(so => so.id === lo.id || so.billingId === lo.billingId)) {
        list.unshift(lo);
      }
    });
    return list;
  }, [serverOrders, localOrders]);

  // 5. Submit Order Mutation
  const placeOrderMutation = useMutation({
    mutationFn: async (payload: {
      branchId: string;
      items: Array<{ productId: string; size: string; quantity: number }>;
      discount: number;
      pointsRedeemed?: number;
      paymentMethod: 'Cash' | 'UPI' | 'Card';
      customerName: string;
      customerPhone: string;
      cashierName: string;
      orderType: OrderType;
      rawCart: any[];
      subtotal: number;
      tax: number;
      total: number;
    }) => {
      const activeBranch = branches.find((b: any) => b.id === payload.branchId) || branches[0];

      try {
        const res = await submitBillingOrder({
          branchId: payload.branchId,
          items: payload.items,
          discount: payload.discount,
          pointsRedeemed: payload.pointsRedeemed,
          paymentMethod: payload.paymentMethod,
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          cashierName: payload.cashierName,
        });

        if (res.success && res.order) {
          hapticSuccess();
          return res.order;
        }
      } catch (err: any) {
        // Fallback: create local offline invoice
        const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const branchCode = activeBranch.code || 'B1';
        const randomSeq = String(Math.floor(Math.random() * 9000) + 1000);

        const offlineOrder: RetailOrder = {
          id: `ord-local-${Date.now()}`,
          billingId: `BILL-${branchCode}-${todayStr}-${randomSeq}`,
          branchId: payload.branchId,
          branchName: activeBranch.name,
          items: payload.rawCart.map(c => ({
            productId: c.productId,
            productName: c.productName,
            category: c.category,
            image: c.image,
            size: c.size,
            quantity: c.quantity,
            unitSellingPrice: c.unitSellingPrice,
            unitCostPrice: c.unitCostPrice,
            subtotal: c.unitSellingPrice * c.quantity,
          })),
          subtotal: payload.subtotal,
          discount: payload.discount,
          tax: payload.tax,
          total: payload.total,
          paymentMethod: payload.paymentMethod,
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          cashierName: payload.cashierName,
          orderType: payload.orderType,
          status: 'Completed',
          createdAt: new Date().toISOString(),
          source: 'mobile-expo',
        };

        const existingRaw = await safeStorage.getItem(STORAGE_ORDERS_KEY);
        const existingList = existingRaw ? JSON.parse(existingRaw) : [];
        const updated = [offlineOrder, ...existingList];
        await safeStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updated));

        setLocalOrders(prev => [offlineOrder, ...prev]);
        hapticSuccess();
        return offlineOrder;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => {
      hapticWarning();
      Alert.alert('Billing Error', err.message || 'Could not process order');
    },
  });

  // 6. Return / Refund Order Mutation
  const returnOrderMutation = useMutation({
    mutationFn: async ({
      orderId,
      reason,
      cashierName,
    }: {
      orderId: string;
      reason?: string;
      cashierName?: string;
    }) => {
      const res = await returnOrder(orderId, reason, cashierName);
      return res;
    },
    onSuccess: () => {
      hapticSuccess();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => {
      hapticWarning();
      Alert.alert('Return Error', err.message || 'Could not process refund');
    },
  });

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchProducts(), refetchOrders()]);
  }, [refetchProducts, refetchOrders]);

  return {
    categories,
    products,
    branches,
    tickets,
    isLoadingProducts,
    isLoadingOrders,
    isFetchingOrders,
    isSyncing: isFetchingOrders,
    lastSyncTime,
    placeOrder: placeOrderMutation.mutateAsync,
    isPlacingOrder: placeOrderMutation.isPending,
    processReturn: returnOrderMutation.mutateAsync,
    isProcessingReturn: returnOrderMutation.isPending,
    onRefresh,
    forceSync: onRefresh,
  };
}
