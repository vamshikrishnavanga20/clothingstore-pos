/**
 * useCart — Retail apparel cart state management hook.
 * Pure client-side state matching expo.zip architecture.
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

export interface CartItem {
  id: string; // `${productId}-${size}`
  productId: string;
  productName: string;
  category: string;
  image: string;
  size: string;
  quantity: number;
  maxStock: number;
  unitSellingPrice: number;
  unitCostPrice: number;
  notes?: string;
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const updateCart = useCallback(
    (
      product: {
        id: string;
        name: string;
        category?: string;
        image?: string;
        sellingPrice: number;
        costPrice?: number;
        sizePrices?: Record<string, { sellingPrice: number; costPrice?: number }>;
      },
      size: string,
      delta: number,
      availableStock: number = 999
    ) => {
      const itemId = `${product.id}-${size}`;

      // Resolve size-specific price
      let unitSellingPrice = product.sellingPrice;
      let unitCostPrice = product.costPrice || 0;
      if (product.sizePrices && product.sizePrices[size]) {
        const sp = product.sizePrices[size];
        unitSellingPrice = typeof sp === 'number' ? sp : sp.sellingPrice ?? unitSellingPrice;
        if (typeof sp === 'object' && sp.costPrice !== undefined) {
          unitCostPrice = sp.costPrice;
        }
      }

      setCart(prev => {
        const exists = prev.find(i => i.id === itemId);

        if (!exists && delta > 0) {
          if (availableStock <= 0) {
            Alert.alert('Out of Stock', `Size ${size} of ${product.name} is currently out of stock.`);
            return prev;
          }
          return [
            ...prev,
            {
              id: itemId,
              productId: product.id,
              productName: product.name,
              category: product.category || 'Apparel',
              image: product.image || '',
              size,
              quantity: 1,
              maxStock: availableStock,
              unitSellingPrice,
              unitCostPrice,
              notes: '',
            },
          ];
        }

        if (exists) {
          const newQty = exists.quantity + delta;
          if (newQty <= 0) {
            return prev.filter(i => i.id !== itemId);
          }
          if (delta > 0 && newQty > exists.maxStock) {
            Alert.alert(
              'Stock Limit',
              `Only ${exists.maxStock} units of size ${size} available in store.`
            );
            return prev;
          }
          return prev.map(i => (i.id === itemId ? { ...i, quantity: newQty } : i));
        }

        return prev;
      });
    },
    []
  );

  const updateCartItemNotes = useCallback((itemId: string, notes: string) => {
    setCart(prev => prev.map(i => (i.id === itemId ? { ...i, notes } : i)));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + item.unitSellingPrice * item.quantity, 0);
  const cartQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart,
    setCart,
    updateCart,
    updateCartItemNotes,
    clearCart,
    cartTotal,
    cartQty,
  };
}
