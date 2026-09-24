/**
 * PosContext — Thin orchestrator composing domain hooks matching expo.zip architecture.
 */

import React, { createContext, useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { Alert } from 'react-native';
import { useCart, CartItem } from '../hooks/useCart';
import { useOrders, OrderType, RetailOrder, RetailOrderItem } from '../hooks/useOrders';
import { useNetwork } from '../hooks/useNetwork';
import { useNotification } from './NotificationContext';
import { AuthContext } from './AuthContext';
import { CustomerProfile, getCustomerProfile } from '../services/api';

export type { CartItem } from '../hooks/useCart';
export type { OrderType, RetailOrder, RetailOrderItem } from '../hooks/useOrders';
export type { CustomerProfile } from '../services/api';

interface PosContextType {
  // Catalog & Branches
  categories: string[];
  products: any[];
  branches: any[];
  activeBranchId: string;
  setActiveBranchId: (id: string) => void;

  // Cart
  cart: CartItem[];
  updateCart: (product: any, size: string, delta: number, availableStock?: number) => void;
  updateCartItemNotes: (itemId: string, notes: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartQty: number;

  // Customer & Billing Details
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  customerProfile: CustomerProfile | null;
  isLoadingCustomer: boolean;
  pointsToRedeem: number;
  setPointsToRedeem: (v: number) => void;
  toggleRedeemPoints: () => void;
  loyaltyDiscount: number;
  orderType: OrderType;
  setOrderType: (v: OrderType) => void;

  // Financials & Discounts
  discountInput: string;
  setDiscountInput: (v: string) => void;
  discountAmount: number;
  taxableAmount: number;
  gstTax: number;
  grandTotal: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card';
  setPaymentMethod: (pm: 'Cash' | 'UPI' | 'Card') => void;

  // Actions
  handlePlaceOrder: () => Promise<RetailOrder | null>;
  placingOrder: boolean;
  handleReturnOrder: (orderId: string, reason?: string) => Promise<any>;
  isProcessingReturn: boolean;

  // Tickets / Order History
  tickets: RetailOrder[];

  // Modals & UI
  selectedProductForSize: any | null;
  setSelectedProductForSize: (prod: any | null) => void;
  showSuccess: boolean;
  setShowSuccess: (v: boolean) => void;
  lastOrderSummary: RetailOrder | null;
  setLastOrderSummary: (ord: RetailOrder | null) => void;

  // Network & Sync
  isOffline: boolean;
  refreshing: boolean;
  isSyncing: boolean;
  lastSyncTime: Date;
  onRefresh: () => Promise<void>;
  forceSync: () => Promise<void>;
}

export const PosContext = createContext<PosContextType>({} as PosContextType);

export const PosProvider = ({ children }: { children: React.ReactNode }) => {
  const { staffName, activeBranchId, setActiveBranchId } = useContext(AuthContext);
  const { isOffline } = useNetwork();
  const { showNotification } = useNotification();

  // 1. Compose useCart
  const {
    cart,
    updateCart,
    updateCartItemNotes,
    clearCart,
    cartTotal,
    cartQty,
  } = useCart();

  // 2. Compose useOrders
  const {
    categories,
    products,
    branches,
    tickets,
    placeOrder,
    isPlacingOrder,
    processReturn,
    isProcessingReturn,
    onRefresh,
    forceSync,
    isLoadingProducts,
    isSyncing,
    lastSyncTime,
  } = useOrders(activeBranchId);

  // 3. Customer & Billing Config
  const [customerName, setCustomerName] = useState('Walk-in Guest');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  const [orderType, setOrderType] = useState<OrderType>('walk-in');
  const [discountInput, setDiscountInput] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card'>('UPI');

  // Auto-fetch Customer Loyalty profile when 10-digit phone is entered
  useEffect(() => {
    const clean = (customerPhone || '').replace(/\D/g, '');
    if (clean.length === 10) {
      let isCurrent = true;
      setIsLoadingCustomer(true);
      getCustomerProfile(clean)
        .then((profile) => {
          if (!isCurrent) return;
          setCustomerProfile(profile);
          if (
            profile &&
            profile.name &&
            (customerName === 'Walk-in Guest' ||
              customerName === 'VIP Client' ||
              customerName === 'Regular Store Guest' ||
              !customerName.trim())
          ) {
            setCustomerName(profile.name);
          }
        })
        .finally(() => {
          if (isCurrent) setIsLoadingCustomer(false);
        });
      return () => {
        isCurrent = false;
      };
    } else {
      setCustomerProfile(null);
      setPointsToRedeem(0);
    }
  }, [customerPhone]);

  // 4. Modals State
  const [selectedProductForSize, setSelectedProductForSize] = useState<any | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrderSummary, setLastOrderSummary] = useState<RetailOrder | null>(null);

  // 5. Financial Calculations with Loyalty Redemption
  const { discountAmount, loyaltyDiscount, taxableAmount, gstTax, grandTotal } = useMemo(() => {
    let disc = 0;
    const cleanStr = (discountInput || '').trim();
    if (cleanStr.endsWith('%')) {
      const pct = parseFloat(cleanStr.replace('%', ''));
      if (!isNaN(pct) && pct > 0) {
        disc = Math.round((cartTotal * pct) / 100);
      }
    } else {
      const flat = parseFloat(cleanStr);
      if (!isNaN(flat) && flat > 0) {
        disc = flat;
      }
    }
    disc = Math.min(Math.max(0, disc), cartTotal);

    // Max points redeemable: available points, capped at 50% cart total
    const remainingToDiscount = Math.max(0, cartTotal - disc);
    const maxRedeemable = customerProfile
      ? Math.min(customerProfile.loyaltyPoints, Math.floor(cartTotal * 0.5), remainingToDiscount)
      : 0;
    const actualPointsRedeemed = Math.min(pointsToRedeem, maxRedeemable);

    const totalDisc = Math.min(cartTotal, disc + actualPointsRedeemed);
    const taxable = Math.max(0, cartTotal - totalDisc);
    const tax = Math.round(taxable * 0.05 * 100) / 100; // 5% GST
    const total = Math.round((taxable + tax) * 100) / 100;

    return {
      discountAmount: disc,
      loyaltyDiscount: actualPointsRedeemed,
      taxableAmount: taxable,
      gstTax: tax,
      grandTotal: total,
    };
  }, [cartTotal, discountInput, customerProfile, pointsToRedeem]);

  const toggleRedeemPoints = useCallback(() => {
    if (!customerProfile || customerProfile.loyaltyPoints <= 0) return;
    if (pointsToRedeem > 0) {
      setPointsToRedeem(0);
    } else {
      const maxRedeemable = Math.min(
        customerProfile.loyaltyPoints,
        Math.floor(cartTotal * 0.5)
      );
      setPointsToRedeem(maxRedeemable);
    }
  }, [customerProfile, pointsToRedeem, cartTotal]);

  // 6. Place Order Handler
  const handlePlaceOrder = useCallback(async (): Promise<RetailOrder | null> => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Select apparel items and sizes before generating invoice.');
      return null;
    }

    try {
      const order = await placeOrder({
        branchId: activeBranchId,
        items: cart.map((c) => ({
          productId: c.productId,
          size: c.size,
          quantity: c.quantity,
        })),
        discount: discountAmount,
        pointsRedeemed: loyaltyDiscount,
        paymentMethod,
        customerName: customerName.trim() || 'Walk-in Guest',
        customerPhone: customerPhone.trim() || 'N/A',
        cashierName: staffName,
        orderType,
        rawCart: cart,
        subtotal: cartTotal,
        tax: gstTax,
        total: grandTotal,
      });

      if (order) {
        setLastOrderSummary(order);
        setShowSuccess(true);
        clearCart();
        setCustomerName('Walk-in Guest');
        setCustomerPhone('');
        setPointsToRedeem(0);
        setCustomerProfile(null);
        setDiscountInput('0');
        showNotification(
          'Invoice Generated',
          `${order.billingId} • Total: ₹${order.total}${order.pointsEarned ? ` (+${order.pointsEarned} Pts)` : ''}`,
          'order_ready'
        );
        return order;
      }
      return null;
    } catch (e: any) {
      Alert.alert('Order Failed', e.message || 'Could not complete transaction');
      return null;
    }
  }, [
    cart,
    activeBranchId,
    discountAmount,
    loyaltyDiscount,
    paymentMethod,
    customerName,
    customerPhone,
    staffName,
    orderType,
    cartTotal,
    gstTax,
    grandTotal,
    placeOrder,
    clearCart,
    showNotification,
  ]);

  // 7. Return Order Handler
  const handleReturnOrder = useCallback(
    async (orderId: string, reason?: string) => {
      try {
        const res = await processReturn({ orderId, reason, cashierName: staffName });
        showNotification(
          'Return Processed',
          `Order refunded. Revenue deducted and stock restocked.`,
          'order_ready'
        );
        return res;
      } catch (err: any) {
        Alert.alert('Refund Error', err.message || 'Could not refund order');
        throw err;
      }
    },
    [processReturn, staffName, showNotification]
  );

  return (
    <PosContext.Provider
      value={{
        categories,
        products,
        branches,
        activeBranchId,
        setActiveBranchId,
        cart,
        updateCart,
        updateCartItemNotes,
        clearCart,
        cartTotal,
        cartQty,
        customerName,
        setCustomerName,
        customerPhone,
        setCustomerPhone,
        customerProfile,
        isLoadingCustomer,
        pointsToRedeem,
        setPointsToRedeem,
        toggleRedeemPoints,
        loyaltyDiscount,
        orderType,
        setOrderType,
        discountInput,
        setDiscountInput,
        discountAmount,
        taxableAmount,
        gstTax,
        grandTotal,
        paymentMethod,
        setPaymentMethod,
        handlePlaceOrder,
        placingOrder: isPlacingOrder,
        handleReturnOrder,
        isProcessingReturn,
        tickets,
        selectedProductForSize,
        setSelectedProductForSize,
        showSuccess,
        setShowSuccess,
        lastOrderSummary,
        setLastOrderSummary,
        isOffline,
        refreshing: isLoadingProducts,
        isSyncing,
        lastSyncTime,
        onRefresh,
        forceSync,
      }}
    >
      {children}
    </PosContext.Provider>
  );
};
