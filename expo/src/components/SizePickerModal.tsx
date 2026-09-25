import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
} from 'react-native';
import { Colors, Spacing, Radii, FontSizes, FontWeights, TouchTargets } from '../constants/theme';
import { hapticTap, hapticSuccess } from '../utils/haptics';

interface SizePickerModalProps {
  product: any | null;
  activeBranchId: string;
  cart: any[];
  onClose: () => void;
  onAddToCart: (product: any, size: string, delta: number, availableStock: number) => void;
}

export default function SizePickerModal({
  product,
  activeBranchId,
  cart,
  onClose,
  onAddToCart,
}: SizePickerModalProps) {
  if (!product) return null;

  // Extract sizes dynamically from product or inventory
  const getSizes = (): string[] => {
    if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
      return product.sizes;
    }
    if (product.inventory && product.inventory[activeBranchId]) {
      return Object.keys(product.inventory[activeBranchId]);
    }
    return ['S', 'M', 'L', 'XL', 'XXL'];
  };

  const sizes = getSizes();

  return (
    <Modal visible={!!product} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.productMeta}>
              {product.image ? (
                <Image source={{ uri: product.image }} style={styles.thumbnail} resizeMode="cover" />
              ) : (
                <View style={[styles.thumbnail, { backgroundColor: Colors.bgInput }]} />
              )}
              <View style={styles.metaText}>
                <Text style={styles.category}>{product.category?.toUpperCase() || 'APPAREL'}</Text>
                <Text style={styles.title} numberOfLines={2}>{product.name}</Text>
                <Text style={styles.sku}>SKU: {product.sku || 'N/A'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              delayPressIn={0}
              activeOpacity={0.7}
              hitSlop={TouchTargets.hitSlop}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.instructionText}>
            Select garment size to add to current bill:
          </Text>

          {/* Sizes Grid */}
          <ScrollView style={styles.sizesScroll} contentContainerStyle={styles.sizesGrid}>
            {sizes.map((size) => {
              const branchStockMap = product.inventory?.[activeBranchId] || {};
              const totalStock = Number(branchStockMap[size]) || 0;
              const cartItem = cart.find(
                (item) => item.productId === product.id && item.size === size
              );
              const inCartQty = cartItem ? cartItem.quantity : 0;
              const remainingStock = Math.max(0, totalStock - inCartQty);
              const isAvailable = remainingStock > 0;

              // Price for size
              let sizePrice = product.sellingPrice;
              if (product.sizePrices && product.sizePrices[size]) {
                const sp = product.sizePrices[size];
                sizePrice = typeof sp === 'number' ? sp : sp.sellingPrice ?? sizePrice;
              }

              return (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeCard,
                    !isAvailable && styles.sizeCardDisabled,
                    inCartQty > 0 && styles.sizeCardInCart,
                  ]}
                  disabled={!isAvailable}
                  onPress={() => {
                    hapticTap();
                    onAddToCart(product, size, 1, totalStock);
                    hapticSuccess();
                    onClose();
                  }}
                  activeOpacity={0.7}
                  delayPressIn={0}
                >
                  <View style={styles.sizeHeader}>
                    <Text style={[styles.sizeLabel, !isAvailable && styles.sizeLabelDisabled]}>
                      {size}
                    </Text>
                    {inCartQty > 0 && (
                      <View style={styles.inCartPill}>
                        <Text style={styles.inCartPillText}>{inCartQty} in cart</Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.sizePrice, !isAvailable && styles.sizePriceDisabled]}>
                    ₹{sizePrice}
                  </Text>

                  <View
                    style={[
                      styles.stockPill,
                      isAvailable ? styles.stockPillIn : styles.stockPillOut,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockPillText,
                        isAvailable ? styles.stockPillTextIn : styles.stockPillTextOut,
                      ]}
                    >
                      {isAvailable
                        ? `${remainingStock} in branch`
                        : inCartQty > 0
                        ? 'All in Cart'
                        : 'Sold Out'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              • Inventory verified against active store branch.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: Spacing.md,
  },
  productMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    flex: 1,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: Radii.sm,
    backgroundColor: Colors.bgSurface,
  },
  metaText: {
    flex: 1,
  },
  category: {
    color: Colors.emerald,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.extrabold,
    letterSpacing: 0.5,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    marginTop: 2,
  },
  sku: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeBtnText: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontWeight: FontWeights.bold,
  },
  instructionText: {
    color: Colors.textMuted,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
    marginVertical: Spacing.sm,
  },
  sizesScroll: {
    maxHeight: 320,
    marginVertical: Spacing.xs,
  },
  sizesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  sizeCard: {
    width: '48%',
    backgroundColor: Colors.bgInput,
    borderRadius: Radii.lg,
    padding: Spacing.md + 2,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 124,
    justifyContent: 'space-between',
  },
  sizeCardDisabled: {
    opacity: 0.45,
    borderColor: Colors.borderLight,
  },
  sizeCardInCart: {
    borderColor: Colors.gold,
    backgroundColor: Colors.goldDim,
  },
  sizeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sizeLabel: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: FontWeights.black,
  },
  sizeLabelDisabled: {
    color: Colors.textDim,
  },
  addBtnPill: {
    marginTop: 8,
    backgroundColor: Colors.gold,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnPillDisabled: {
    backgroundColor: Colors.bgSurface,
  },
  addBtnPillText: {
    color: Colors.bg,
    fontSize: 11,
    fontWeight: FontWeights.black,
    letterSpacing: 0.5,
  },
  addBtnPillTextDisabled: {
    color: Colors.textDim,
  },
  inCartPill: {
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: Radii.xs,
  },
  inCartPillText: {
    color: Colors.bg,
    fontSize: FontSizes.xs - 1,
    fontWeight: FontWeights.black,
  },
  sizePrice: {
    color: Colors.emerald,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.bold,
    marginTop: 4,
  },
  sizePriceDisabled: {
    color: Colors.textDim,
  },
  stockPill: {
    marginTop: Spacing.sm,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radii.xs,
    alignSelf: 'flex-start',
  },
  stockPillIn: {
    backgroundColor: Colors.greenDim,
  },
  stockPillOut: {
    backgroundColor: Colors.redDim,
  },
  stockPillText: {
    fontSize: FontSizes.xs - 1,
    fontWeight: FontWeights.bold,
  },
  stockPillTextIn: {
    color: Colors.green,
  },
  stockPillTextOut: {
    color: Colors.red,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  footerText: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
  },
});
