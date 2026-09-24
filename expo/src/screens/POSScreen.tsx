import React, { useContext, useState, useMemo, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Modal,
  Image,
  BackHandler,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { PosContext } from '../context/PosContext';
import OrderSuccessModal from '../components/OrderSuccessModal';
import SizePickerModal from '../components/SizePickerModal';
import Header from '../components/Header';
import CartPanel from '../components/CartPanel';
import { useIsTablet, useResponsiveColumns } from '../constants/layout';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '../constants/theme';
import { hapticTap, hapticMedium } from '../utils/haptics';

import { DEFAULT_API_URL } from '../services/api';

interface ApparelCardProps {
  item: any;
  inCartQty: number;
  activeBranchId: string;
  onPressItem: (item: any) => void;
}

const getCategoryIcon = (cat: string = '') => {
  const c = (cat || '').toLowerCase();
  if (c.includes('check') || c.includes('shirt') || c.includes('formal')) return '👔';
  if (c.includes('denim') || c.includes('pant') || c.includes('trouser')) return '👖';
  if (c.includes('sneaker') || c.includes('shoe') || c.includes('foot')) return '👟';
  if (c.includes('jacket') || c.includes('hood') || c.includes('vest')) return '🧥';
  if (c.includes('ethnic') || c.includes('kurta')) return '🥻';
  return '👕';
};

// ── Pure Memoized Apparel Card ──
const ApparelCard = React.memo(
  function ApparelCard({ item, inCartQty, activeBranchId, onPressItem }: ApparelCardProps) {
    const [imgErr, setImgErr] = useState(false);
    const hasInCart = inCartQty > 0;

    const branchStockMap: Record<string, any> = (item.inventory && (item.inventory as any)[activeBranchId]) || {};
    const totalBranchStock: number = Object.values(branchStockMap).reduce(
      (acc: number, cnt: any): number => acc + (Number(cnt) || 0),
      0
    );
    const isOut = totalBranchStock <= 0;
    const isLow = totalBranchStock > 0 && totalBranchStock <= 3;

    const rawImg = item.image?.trim();
    const resolvedUri = rawImg
      ? rawImg.startsWith('http')
        ? rawImg
        : `${DEFAULT_API_URL}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`
      : null;

    return (
      <TouchableOpacity
        style={[styles.card, { flex: 1, margin: 5 }, hasInCart && styles.cardActive]}
        onPress={() => {
          if (!isOut) {
            hapticTap();
            onPressItem(item);
          }
        }}
        activeOpacity={0.7}
        delayPressIn={0}
        disabled={isOut}
      >
        <View style={styles.imageWrap}>
          {resolvedUri && !imgErr ? (
            <Image
              source={{ uri: resolvedUri }}
              style={styles.cardImage}
              resizeMode="cover"
              onError={() => setImgErr(true)}
            />
          ) : (
            <View style={styles.cardPlaceholder}>
              <View style={styles.placeholderIconRing}>
                <Text style={styles.placeholderIcon}>{getCategoryIcon(item.category)}</Text>
              </View>
              <Text style={styles.placeholderCatText} numberOfLines={1}>
                {item.category?.toUpperCase() || 'HAUTE COUTURE'}
              </Text>
            </View>
          )}

          {/* Branch Stock Urgency Badge */}
          <View
            style={[
              styles.stockBadge,
              isOut ? styles.stockBadgeOut : isLow ? styles.stockBadgeLow : styles.stockBadgeIn,
            ]}
          >
            <Text style={styles.stockBadgeText}>
              {isOut ? 'SOLD OUT' : isLow ? `⚡ ONLY ${totalBranchStock} LEFT` : `● ${totalBranchStock} IN BRANCH`}
            </Text>
          </View>

          {hasInCart && (
            <View style={styles.cartCountBadge}>
              <Text style={styles.cartCountText}>{inCartQty} IN CART</Text>
            </View>
          )}
        </View>

        <View style={styles.cardInner}>
          <View style={styles.cardMetaRow}>
            <Text style={styles.categoryMicro}>{item.category?.toUpperCase() || 'COLLECTION'}</Text>
            <Text style={styles.priceTag}>₹{item.sellingPrice}</Text>
          </View>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.skuText} numberOfLines={1}>{item.sku || 'SKU-RI'}</Text>

          <TouchableOpacity
            style={[styles.sizeSelectBtn, isOut && styles.sizeSelectBtnDisabled]}
            onPress={() => {
              if (!isOut) {
                hapticTap();
                onPressItem(item);
              }
            }}
            activeOpacity={0.7}
            delayPressIn={0}
            disabled={isOut}
          >
            <Text style={[styles.sizeSelectBtnText, isOut && styles.sizeSelectBtnTextDisabled]}>
              {isOut ? 'Sold Out' : 'Select Size +'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  },
  (prev, next) => {
    return (
      prev.item.id === next.item.id &&
      prev.item.sellingPrice === next.item.sellingPrice &&
      prev.item.name === next.item.name &&
      prev.item.image === next.item.image &&
      prev.inCartQty === next.inCartQty &&
      prev.activeBranchId === next.activeBranchId
    );
  }
);

export default function POSScreen() {
  const { lockTerminal, staffName } = useContext(AuthContext);
  const {
    categories,
    products,
    cart,
    updateCart,
    activeBranchId,
    handlePlaceOrder,
    placingOrder,
    isOffline,
    showSuccess,
    setShowSuccess,
    lastOrderSummary,
    selectedProductForSize,
    setSelectedProductForSize,
    cartTotal,
    cartQty,
  } = useContext(PosContext);

  const isTablet = useIsTablet();
  const numColumns = useResponsiveColumns(2, 3);

  const [activeCategoryId, setActiveCategoryId] = useState('All Apparel');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartSheetOpen, setCartSheetOpen] = useState(false);

  // Android hardware back handler for cart sheet
  useEffect(() => {
    if (!cartSheetOpen) return;
    const onBackPress = () => {
      setCartSheetOpen(false);
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [cartSheetOpen]);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return (products || []).filter((p: any) => {
      const matchCategory =
        activeCategoryId === 'All Apparel' ||
        activeCategoryId === 'All' ||
        (p.category && p.category.toLowerCase() === activeCategoryId.toLowerCase());

      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));

      return matchCategory && matchSearch;
    });
  }, [products, activeCategoryId, searchQuery]);

  // Memoized callbacks for zero-lag touch performance
  const handleSelectItem = useCallback(
    (prod: any) => {
      setSelectedProductForSize(prod);
    },
    [setSelectedProductForSize]
  );

  const renderApparelItem = useCallback(
    ({ item }: { item: any }) => {
      const inCartQty = cart
        .filter((c) => c.productId === item.id)
        .reduce((s, c) => s + c.quantity, 0);

      return (
        <ApparelCard
          item={item}
          inCartQty={inCartQty}
          activeBranchId={activeBranchId}
          onPressItem={handleSelectItem}
        />
      );
    },
    [cart, activeBranchId, handleSelectItem]
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Top Roman Island Header */}
      <Header
        subtitle={`Cashier: ${staffName}`}
        isOffline={isOffline}
        onLock={lockTerminal}
      />

      {/* Main Content Area */}
      <View style={styles.mainArea}>
        {/* Left Catalog View */}
        <View style={styles.catalogArea}>
          {/* Search Bar */}
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search apparel name, SKU, or category..."
              placeholderTextColor={Colors.textDim}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            {filteredProducts.length > 0 && (
              <View style={styles.resultsCountBadge}>
                <Text style={styles.resultsCountText}>{filteredProducts.length}</Text>
              </View>
            )}
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn} delayPressIn={0}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category Chips Carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map((cat: string) => {
              const active = activeCategoryId === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryPill, active && styles.categoryPillActive]}
                  onPress={() => {
                    hapticMedium();
                    setActiveCategoryId(cat);
                  }}
                  activeOpacity={0.7}
                  delayPressIn={0}
                >
                  <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Apparel Grid */}
          <FlatList
            key={`apparel-grid-${numColumns}`}
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            contentContainerStyle={styles.gridContent}
            renderItem={renderApparelItem}
            initialNumToRender={8}
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        </View>

        {/* Tablet Docked Cart Panel */}
        {isTablet && (
          <View style={styles.tabletCartPane}>
            <CartPanel isTablet={true} />
          </View>
        )}
      </View>

      {/* Phone Floating Cart Bar */}
      {!isTablet && (
        <View style={styles.floatingCartBar}>
          <TouchableOpacity
            style={[
              styles.floatingCartContent,
              cartQty === 0 && styles.floatingCartEmpty,
            ]}
            onPress={() => setCartSheetOpen(true)}
            activeOpacity={0.8}
            delayPressIn={0}
          >
            <View style={styles.floatingLeft}>
              <View style={[styles.cartBadge, cartQty === 0 && styles.cartBadgeEmpty]}>
                <Text style={[styles.cartBadgeText, cartQty === 0 && styles.cartBadgeTextEmpty]}>{cartQty}</Text>
              </View>
              <View>
                <Text style={[styles.floatingTitle, cartQty === 0 && styles.floatingTitleEmpty]}>
                  {cartQty === 0 ? 'CURRENT BILL' : 'CURRENT BILL'}
                </Text>
                <Text style={[styles.floatingSubtitle, cartQty === 0 && styles.floatingSubtitleEmpty]}>
                  {cartQty === 0 ? 'Empty • Tap items to add' : `${cartQty} items • ₹${cartTotal}`}
                </Text>
              </View>
            </View>

            <View style={styles.floatingRight}>
              <Text style={[styles.floatingTotal, cartQty === 0 && styles.floatingTotalEmpty]}>₹{cartTotal}</Text>
              <Text style={[styles.reviewBtnText, cartQty === 0 && styles.reviewBtnTextEmpty]}>
                {cartQty === 0 ? 'Open Cart →' : 'Review & Bill →'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Phone Sliding Cart Sheet Modal */}
      <Modal
        visible={cartSheetOpen && !isTablet}
        animationType="slide"
        onRequestClose={() => setCartSheetOpen(false)}
      >
        <SafeAreaView style={styles.sheetContainer} edges={['top', 'bottom']}>
          <CartPanel isTablet={false} onCloseSheet={() => setCartSheetOpen(false)} />
        </SafeAreaView>
      </Modal>

      {/* Size Selector Modal */}
      <SizePickerModal
        product={selectedProductForSize}
        activeBranchId={activeBranchId}
        cart={cart}
        onClose={() => setSelectedProductForSize(null)}
        onAddToCart={updateCart}
      />

      {/* Order Generated Thermal Receipt Modal */}
      <OrderSuccessModal
        visible={showSuccess}
        order={lastOrderSummary}
        onDismiss={() => {
          setShowSuccess(false);
          setCartSheetOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  mainArea: {
    flex: 1,
    flexDirection: 'row',
  },
  catalogArea: {
    flex: 1,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs + 2,
    paddingLeft: Spacing.md,
    paddingRight: 40,
    borderRadius: Radii.sm,
    height: 38,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  categoryScroll: {
    maxHeight: 44,
    marginBottom: Spacing.xs,
  },
  categoryScrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderRadius: Radii.full,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryPillActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  categoryText: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  categoryTextActive: {
    color: Colors.bg,
    fontWeight: FontWeights.black,
  },
  gridContent: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: 85,
  },
  card: {
    backgroundColor: '#0E1424',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.18)',
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: Colors.gold,
    backgroundColor: '#162038',
  },
  imageWrap: {
    width: '100%',
    height: 115,
    position: 'relative',
    backgroundColor: '#0A0F1D',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0D1426',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.12)',
  },
  placeholderIconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 22,
  },
  placeholderCatText: {
    marginTop: 6,
    fontSize: 8.5,
    fontWeight: FontWeights.extrabold,
    color: Colors.gold,
    letterSpacing: 0.8,
  },
  stockBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockBadgeIn: {
    backgroundColor: 'rgba(16, 185, 129, 0.92)',
  },
  stockBadgeLow: {
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
  },
  stockBadgeOut: {
    backgroundColor: 'rgba(239, 68, 68, 0.92)',
  },
  stockBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: FontWeights.black,
    letterSpacing: 0.4,
  },
  resultsCountBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: Radii.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
  },
  resultsCountText: {
    color: Colors.gold,
    fontSize: 9,
    fontWeight: FontWeights.extrabold,
  },
  cartCountBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: Colors.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cartCountText: {
    color: Colors.bg,
    fontSize: 8.5,
    fontWeight: FontWeights.black,
  },
  cardInner: {
    padding: Spacing.sm,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  categoryMicro: {
    fontSize: 8.5,
    fontWeight: FontWeights.extrabold,
    color: Colors.gold,
    letterSpacing: 0.8,
  },
  priceTag: {
    color: '#F59E0B',
    fontSize: FontSizes.body,
    fontWeight: FontWeights.black,
  },
  cardName: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    marginTop: 2,
  },
  skuText: {
    color: Colors.textDim,
    fontSize: FontSizes.xs - 1,
    marginTop: 1,
  },
  sizeSelectBtn: {
    marginTop: Spacing.sm - 2,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingVertical: 5,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    alignItems: 'center',
  },
  sizeSelectBtnDisabled: {
    opacity: 0.35,
    backgroundColor: Colors.bgInput,
    borderColor: Colors.border,
  },
  sizeSelectBtnText: {
    color: Colors.gold,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.black,
    letterSpacing: 0.3,
  },
  sizeSelectBtnTextDisabled: {
    color: Colors.textDim,
  },
  tabletCartPane: {
    width: 380,
    backgroundColor: Colors.bgSurface,
    borderLeftWidth: 1,
    borderLeftColor: Colors.borderLight,
  },
  floatingCartBar: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
    backgroundColor: 'transparent',
  },
  floatingCartContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.gold,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  floatingCartEmpty: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    elevation: 2,
    shadowOpacity: 0.1,
  },
  floatingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cartBadge: {
    backgroundColor: Colors.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  cartBadgeEmpty: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cartBadgeText: {
    color: Colors.gold,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.black,
  },
  cartBadgeTextEmpty: {
    color: Colors.textMuted,
  },
  floatingTitle: {
    color: Colors.bg,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.black,
  },
  floatingTitleEmpty: {
    color: Colors.textPrimary,
  },
  floatingSubtitle: {
    color: 'rgba(9,9,11,0.7)',
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  floatingSubtitleEmpty: {
    color: Colors.textMuted,
  },
  floatingRight: {
    alignItems: 'flex-end',
  },
  floatingTotal: {
    color: Colors.bg,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.black,
  },
  floatingTotalEmpty: {
    color: Colors.gold,
  },
  reviewBtnText: {
    color: Colors.bg,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.extrabold,
    textDecorationLine: 'underline',
  },
  reviewBtnTextEmpty: {
    color: Colors.gold,
    textDecorationLine: 'none',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: Colors.bgSurface,
  },
});
