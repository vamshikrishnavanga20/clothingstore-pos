import React, { useContext, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { PosContext } from '../context/PosContext';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '../constants/theme';
import { hapticTap, hapticMedium, hapticWarning } from '../utils/haptics';

interface CartPanelProps {
  isTablet: boolean;
  onCloseSheet?: () => void;
  onOpenNotes?: (item: { id: string; name: string; notes: string }) => void;
}

const ORDER_TYPE_OPTIONS = [
  { key: 'walk-in', label: 'Walk-in', value: 'walk-in' },
  { key: 'vip', label: 'VIP Fitting', value: 'vip' },
  { key: 'reserve', label: 'Hold & Reserve', value: 'reserve' },
] as const;

const DISCOUNT_PRESETS = ['0', '5%', '10%', '15%', '100', '250', '500'];
const CUSTOMER_PRESETS = ['Walk-in Guest', 'VIP Client', 'Regular Store Guest'];

export default function CartPanel({ isTablet, onCloseSheet, onOpenNotes }: CartPanelProps) {
  const {
    cart,
    updateCart,
    clearCart,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    customerProfile,
    isLoadingCustomer,
    pointsToRedeem,
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
    placingOrder,
    cartTotal,
    cartQty,
  } = useContext(PosContext);

  const [showCustomerUpiModal, setShowCustomerUpiModal] = useState(false);
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10).replace(/-/g, ''), []);
  const provisionalRef = useMemo(() => `BILL-M1-${todayStr}-${Math.floor(1000 + Math.random() * 9000)}`, [todayStr, cart.length]);
  const upiUri = useMemo(() => {
    return `upi://pay?pa=romanisland@okhdfcbank&pn=Roman%20Island&am=${grandTotal.toFixed(2)}&tr=${provisionalRef}&cu=INR&tn=Roman%20Island%20Bill%20${provisionalRef}`;
  }, [grandTotal, provisionalRef]);

  return (
    <View style={styles.cartWrap}>
      {/* Header */}
      <View style={styles.cartHeader}>
        {!isTablet && onCloseSheet ? (
          <TouchableOpacity onPress={onCloseSheet} style={styles.backBtn} activeOpacity={0.7} delayPressIn={0}>
            <Text style={styles.backText}>‹ BACK</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={styles.cartTitle}>Current Bill ({cartQty} items)</Text>
        {!isTablet && onCloseSheet ? (
          <TouchableOpacity onPress={onCloseSheet} style={styles.closeBtn} activeOpacity={0.7} delayPressIn={0}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        ) : (
          !isTablet ? null : (
            cart.length > 0 ? (
              <TouchableOpacity
                onPress={() => {
                  hapticWarning();
                  clearCart();
                }}
                delayPressIn={0}
              >
                <Text style={styles.clearBtnText}>Clear All</Text>
              </TouchableOpacity>
            ) : <View style={{ width: 32 }} />
          )
        )}
      </View>

      {/* Order Type Selection */}
      <View style={styles.typeWrap}>
        <Text style={styles.sectionLabel}>TYPE OF SERVICE</Text>
        <View style={styles.typeGrid}>
          {ORDER_TYPE_OPTIONS.map(opt => {
            const active = orderType === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.typeCard, active && styles.typeCardActive]}
                onPress={() => {
                  hapticMedium();
                  setOrderType(opt.key as any);
                }}
                activeOpacity={0.7}
                delayPressIn={0}
              >
                <Text style={[styles.typeText, active && styles.typeTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Customer Info Form */}
      <View style={styles.customerFormWrap}>
        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>CUSTOMER NAME</Text>
            <TextInput
              style={styles.textInput}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={Colors.textGhost}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>PHONE (WHATSAPP INVOICE)</Text>
            <TextInput
              style={styles.textInput}
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="10-digit mobile"
              placeholderTextColor={Colors.textGhost}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        </View>
        <View style={styles.quickCustomerRow}>
          {CUSTOMER_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[
                styles.quickCustomerChip,
                customerName === preset && styles.quickCustomerChipActive,
              ]}
              onPress={() => {
                hapticTap();
                setCustomerName(preset);
              }}
              delayPressIn={0}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.quickCustomerText,
                  customerName === preset && styles.quickCustomerTextActive,
                ]}
              >
                {preset}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* VIP Loyalty Membership Card */}
        {customerPhone.replace(/\D/g, '').length === 10 && (
          <View style={styles.vipLoyaltyContainer}>
            {isLoadingCustomer ? (
              <View style={styles.vipLoadingRow}>
                <ActivityIndicator size="small" color={Colors.gold} />
                <Text style={styles.vipLoadingText}>Checking Roman Island VIP Club...</Text>
              </View>
            ) : customerProfile ? (
              <View
                style={[
                  styles.vipCard,
                  customerProfile.tier === 'Black Elite'
                    ? styles.vipCardBlackElite
                    : customerProfile.tier === 'Gold'
                    ? styles.vipCardGold
                    : styles.vipCardSilver,
                ]}
              >
                <View style={styles.vipCardTop}>
                  <View
                    style={[
                      styles.vipBadgePill,
                      customerProfile.tier === 'Black Elite'
                        ? styles.vipBadgePillBlackElite
                        : customerProfile.tier === 'Gold'
                        ? styles.vipBadgePillGold
                        : styles.vipBadgePillSilver,
                    ]}
                  >
                    <Text style={styles.vipBadgeText}>
                      {customerProfile.tier === 'Black Elite'
                        ? '💎 BLACK ELITE'
                        : customerProfile.tier === 'Gold'
                        ? '🥇 GOLD CLUB'
                        : '🥈 SILVER VIP'}
                    </Text>
                  </View>
                  <Text style={styles.vipSpendText}>
                    Spend: ₹{Number(customerProfile.totalSpend).toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.vipCardBottom}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vipPointsAvailable}>
                      ⭐ {customerProfile.loyaltyPoints} Pts Available
                    </Text>
                    <Text style={styles.vipPointsNote}>
                      {customerProfile.tier === 'Black Elite'
                        ? '7% reward rate • VIP Fitting Service'
                        : customerProfile.tier === 'Gold'
                        ? '5% reward rate • Priority Stylist'
                        : '3% reward rate on apparel'}
                    </Text>
                  </View>
                  {customerProfile.loyaltyPoints > 0 && cart.length > 0 && (
                    <TouchableOpacity
                      style={[
                        styles.redeemBtn,
                        pointsToRedeem > 0 && styles.redeemBtnActive,
                      ]}
                      onPress={() => {
                        toggleRedeemPoints();
                      }}
                      activeOpacity={0.8}
                      delayPressIn={0}
                    >
                      <Text
                        style={[
                          styles.redeemBtnText,
                          pointsToRedeem > 0 && styles.redeemBtnTextActive,
                        ]}
                      >
                        {pointsToRedeem > 0
                          ? `✓ Redeemed ₹${loyaltyDiscount}`
                          : `Redeem Pts`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.newGuestPill}>
                <Text style={styles.newGuestIcon}>✨</Text>
                <Text style={styles.newGuestText}>
                  New Guest: Auto-enrolling into Silver VIP (Earns 3% points on this invoice)
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Cart Items */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {cart.length === 0 ? (
          <View style={styles.emptyCart}>
            <Text style={styles.emptyCartText}>No apparel selected</Text>
            <Text style={styles.emptyCartSub}>Select clothes from catalog to add to bill</Text>
          </View>
        ) : (
          <>
            {cart.map(item => {
              const isAtMax = item.quantity >= item.maxStock;

              return (
                <View key={item.id} style={styles.cartRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartName} numberOfLines={1}>{item.productName}</Text>
                    <View style={styles.metaRow}>
                      <View style={styles.sizePill}>
                        <Text style={styles.sizeText}>Size {item.size}</Text>
                      </View>
                      <Text style={styles.cartUnitPrice}>₹{item.unitSellingPrice} each</Text>
                    </View>
                    {item.notes ? (
                      <Text style={styles.cartNotes} numberOfLines={1}>NOTE: {item.notes}</Text>
                    ) : null}
                    {isAtMax && (
                      <Text style={styles.stockWarn}>Max store stock reached</Text>
                    )}
                  </View>

                  {/* Stepper with branch stock boundary protection */}
                  <View style={styles.stepperCol}>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        delayPressIn={0}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => {
                          hapticTap();
                          updateCart({ id: item.productId, name: item.productName, sellingPrice: item.unitSellingPrice }, item.size, -1);
                        }}
                      >
                        <Text style={styles.stepperBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperQty}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={[styles.stepperBtn, isAtMax && styles.stepperBtnDisabled]}
                        disabled={isAtMax}
                        delayPressIn={0}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => {
                          hapticTap();
                          updateCart({ id: item.productId, name: item.productName, sellingPrice: item.unitSellingPrice }, item.size, 1, item.maxStock);
                        }}
                      >
                        <Text style={[styles.stepperBtnText, isAtMax && styles.stepperBtnTextDisabled]}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.cartItemTotal}>₹{item.unitSellingPrice * item.quantity}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Discount Presets & Payment Tender */}
      {cart.length > 0 && (
        <View style={styles.checkoutConfigWrap}>
          {/* Quick Discounts */}
          <View style={styles.discountRow}>
            <Text style={styles.sectionLabel}>STORE DISCOUNT</Text>
            {discountAmount > 0 && (
              <Text style={styles.savingsText}>−₹{discountAmount} saved</Text>
            )}
          </View>
          <View style={styles.presetChips}>
            {DISCOUNT_PRESETS.map(preset => {
              const active = discountInput === preset;
              const label = preset === '0' ? 'None' : preset.endsWith('%') ? `${preset} OFF` : `₹${preset} OFF`;
              return (
                <TouchableOpacity
                  key={preset}
                  style={[styles.discountChip, active && styles.discountChipActive]}
                  onPress={() => {
                    hapticTap();
                    setDiscountInput(preset);
                  }}
                  activeOpacity={0.7}
                  delayPressIn={0}
                >
                  <Text style={[styles.discountChipText, active && styles.discountChipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Payment Tender Selection */}
          <Text style={[styles.sectionLabel, { marginTop: Spacing.sm }]}>PAYMENT TENDER</Text>
          <View style={styles.tenderGrid}>
            {[
              { id: 'UPI', label: '📱 UPI / QR', color: Colors.upi },
              { id: 'Cash', label: '💵 Cash', color: Colors.cash },
              { id: 'Card', label: '💳 Card', color: Colors.card },
            ].map(tender => {
              const active = paymentMethod === tender.id;
              return (
                <TouchableOpacity
                  key={tender.id}
                  style={[
                    styles.tenderCard,
                    active && { borderColor: tender.color, backgroundColor: 'rgba(255,255,255,0.06)' },
                  ]}
                  onPress={() => {
                    hapticTap();
                    setPaymentMethod(tender.id as any);
                  }}
                  activeOpacity={0.7}
                  delayPressIn={0}
                >
                  <Text style={[styles.tenderText, active && { color: tender.color, fontWeight: FontWeights.black }]}>
                    {tender.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Dynamic UPI Scan-to-Pay QR Card */}
          {paymentMethod === 'UPI' && grandTotal > 0 && (
            <View style={styles.upiQrBox}>
              <View style={styles.upiQrHeader}>
                <View style={styles.upiLivePulse} />
                <Text style={styles.upiQrTitle}>DYNAMIC INSTANT UPI SCAN & PAY</Text>
              </View>
              <View style={styles.upiQrRow}>
                <View style={styles.qrImageFrame}>
                  <Image
                    source={{
                      uri: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUri)}`,
                    }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.upiDetails}>
                  <Text style={styles.upiAmount}>₹{grandTotal.toFixed(2)}</Text>
                  <Text style={styles.upiVpa}>romanisland@okhdfcbank</Text>
                  <Text style={styles.upiInstructions}>
                    Customer scans with PhonePe, GPay, or Paytm with exact bill amount pre-filled.
                  </Text>
                  <TouchableOpacity
                    style={styles.customerDisplayBtn}
                    onPress={() => setShowCustomerUpiModal(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.customerDisplayBtnText}>📱 Present QR to Customer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Bottom checkout section */}
      <View style={styles.bottomSection}>
        {cart.length > 0 && (
          <View style={styles.calcSummary}>
            <View style={styles.calcLine}>
              <Text style={styles.calcLabel}>Subtotal</Text>
              <Text style={styles.calcValue}>₹{cartTotal}</Text>
            </View>
            {discountAmount > 0 && (
              <View style={styles.calcLine}>
                <Text style={styles.calcLabel}>Store Discount</Text>
                <Text style={[styles.calcValue, { color: Colors.emerald }]}>−₹{discountAmount}</Text>
              </View>
            )}
            {loyaltyDiscount > 0 && (
              <View style={styles.calcLine}>
                <Text style={styles.calcLabel}>⭐ VIP Points Redeemed</Text>
                <Text style={[styles.calcValue, { color: Colors.gold }]}>−₹{loyaltyDiscount}</Text>
              </View>
            )}
            <View style={styles.calcLine}>
              <Text style={styles.calcLabel}>GST (5% Apparel Tax)</Text>
              <Text style={styles.calcValue}>₹{gstTax}</Text>
            </View>
          </View>
        )}

        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.taxNote}>Inclusive of 5% GST</Text>
          </View>
          <Text style={styles.totalValue}>₹{grandTotal}</Text>
        </View>

        <TouchableOpacity
          style={[styles.checkoutBtn, (cart.length === 0 || placingOrder) && styles.checkoutBtnDisabled]}
          disabled={cart.length === 0 || placingOrder}
          onPress={handlePlaceOrder}
          activeOpacity={0.8}
          delayPressIn={0}
        >
          {placingOrder ? (
            <ActivityIndicator color={Colors.bg} />
          ) : (
            <Text style={styles.checkoutBtnText}>COMPLETE SALE & ISSUE INVOICE</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Customer-Facing UPI QR Presentation Modal (for Swivel / Table Presentation) */}
      <Modal
        visible={showCustomerUpiModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomerUpiModal(false)}
      >
        <View style={styles.customerModalOverlay}>
          <View style={styles.customerModalCard}>
            <View style={styles.customerModalTop}>
              <View style={styles.customerModalBrand}>
                <Text style={styles.customerModalBrandName}>ROMAN ISLAND</Text>
                <Text style={styles.customerModalSub}>LUXURY BOUTIQUE SCAN-TO-PAY</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCustomerUpiModal(false)}
                style={styles.customerModalCloseBtn}
              >
                <Text style={styles.customerModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.customerAmountBox}>
              <Text style={styles.customerAmountLabel}>EXACT PAYABLE AMOUNT</Text>
              <Text style={styles.customerAmountVal}>₹{grandTotal.toFixed(2)}</Text>
              <Text style={styles.customerAmountNote}>Ref: {provisionalRef} • Zero typing needed</Text>
            </View>

            <View style={styles.customerQrFrame}>
              <Image
                source={{
                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(upiUri)}`,
                }}
                style={styles.customerQrImg}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.customerScanGuide}>
              Scan with Google Pay, PhonePe, Paytm, BHIM, or any UPI App
            </Text>

            <TouchableOpacity
              style={styles.customerConfirmBtn}
              onPress={() => {
                setShowCustomerUpiModal(false);
                handlePlaceOrder();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.customerConfirmBtnText}>✓ CONFIRM PAYMENT RECEIVED</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  cartWrap: {
    flex: 1,
    backgroundColor: Colors.bgSurface,
    display: 'flex',
    flexDirection: 'column',
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.bg,
  },
  backBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  backText: {
    color: Colors.gold,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.bold,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  closeText: {
    color: Colors.textMuted,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  cartTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.black,
    letterSpacing: 0.5,
  },
  clearBtnText: {
    color: Colors.red,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  typeWrap: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sectionLabel: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.extrabold,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeCard: {
    flex: 1,
    paddingVertical: Spacing.sm - 2,
    backgroundColor: Colors.bgInput,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  typeCardActive: {
    borderColor: Colors.gold,
    backgroundColor: Colors.goldDim,
  },
  typeText: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  typeTextActive: {
    color: Colors.gold,
    fontWeight: FontWeights.black,
  },
  customerFormWrap: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  inputLabel: {
    color: Colors.textDim,
    fontSize: FontSizes.xs - 1,
    fontWeight: FontWeights.bold,
    marginBottom: 3,
  },
  textInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
  },
  quickCustomerRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  quickCustomerChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickCustomerChipActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: Colors.gold,
  },
  quickCustomerText: {
    color: Colors.textDim,
    fontSize: 9.5,
    fontWeight: FontWeights.bold,
  },
  quickCustomerTextActive: {
    color: Colors.gold,
  },
  emptyCart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl * 1.5,
  },
  emptyCartText: {
    color: Colors.textDim,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  emptyCartSub: {
    color: Colors.textGhost,
    fontSize: FontSizes.xs,
    marginTop: 4,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  cartName: {
    color: Colors.textPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.bold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  sizePill: {
    backgroundColor: Colors.bgInput,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sizeText: {
    color: Colors.emerald,
    fontSize: FontSizes.xs - 1,
    fontWeight: FontWeights.bold,
  },
  cartUnitPrice: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
  },
  cartNotes: {
    color: Colors.gold,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  stockWarn: {
    color: Colors.orange,
    fontSize: FontSizes.xs - 1,
    fontWeight: FontWeights.bold,
    marginTop: 2,
  },
  stepperCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepperBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs - 1,
  },
  stepperBtnDisabled: {
    opacity: 0.3,
  },
  stepperBtnText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  stepperBtnTextDisabled: {
    color: Colors.textDim,
  },
  stepperQty: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.extrabold,
    minWidth: 20,
    textAlign: 'center',
  },
  cartItemTotal: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.extrabold,
  },
  checkoutConfigWrap: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.bgCard,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savingsText: {
    color: Colors.emerald,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.extrabold,
  },
  presetChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  discountChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.sm,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  discountChipActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  discountChipText: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  discountChipTextActive: {
    color: Colors.bg,
    fontWeight: FontWeights.black,
  },
  tenderGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  tenderCard: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.sm,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  tenderText: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  bottomSection: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.bg,
  },
  calcSummary: {
    gap: 3,
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  calcLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calcLabel: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
  },
  calcValue: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  totalLabel: {
    color: Colors.textPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.black,
    letterSpacing: 0.5,
  },
  taxNote: {
    color: Colors.textDim,
    fontSize: FontSizes.xs - 1,
  },
  totalValue: {
    color: Colors.gold,
    fontSize: FontSizes.title,
    fontWeight: FontWeights.black,
  },
  checkoutBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  checkoutBtnDisabled: {
    backgroundColor: Colors.bgInput,
    opacity: 0.5,
  },
  checkoutBtnText: {
    color: Colors.bg,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.black,
    letterSpacing: 0.5,
  },
  upiQrBox: {
    marginTop: Spacing.sm,
    backgroundColor: '#0c1410',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    borderRadius: Radii.md,
    padding: Spacing.sm,
  },
  upiQrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  upiLivePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.emerald,
  },
  upiQrTitle: {
    color: Colors.emerald,
    fontSize: FontSizes.xs - 1,
    fontWeight: FontWeights.black,
    letterSpacing: 0.5,
  },
  upiQrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  qrImageFrame: {
    backgroundColor: '#ffffff',
    padding: 4,
    borderRadius: Radii.sm,
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: 82,
    height: 82,
  },
  upiDetails: {
    flex: 1,
  },
  upiAmount: {
    color: Colors.gold,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.black,
  },
  upiVpa: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 2,
  },
  upiInstructions: {
    color: Colors.textDim,
    fontSize: 10,
    lineHeight: 13,
  },
  upiBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  upiBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    color: Colors.emerald,
    fontSize: 9,
    fontWeight: FontWeights.bold,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  vipLoyaltyContainer: {
    marginTop: Spacing.xs,
  },
  vipLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#0F172A',
    borderRadius: Radii.sm,
  },
  vipLoadingText: {
    color: Colors.gold,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  vipCard: {
    borderRadius: Radii.md,
    padding: Spacing.sm,
    borderWidth: 1,
    marginTop: 2,
  },
  vipCardSilver: {
    backgroundColor: '#1E293B',
    borderColor: '#475569',
  },
  vipCardGold: {
    backgroundColor: '#1A180E',
    borderColor: 'rgba(217, 119, 6, 0.45)',
  },
  vipCardBlackElite: {
    backgroundColor: '#0A0A0E',
    borderColor: 'rgba(212, 175, 55, 0.6)',
  },
  vipCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  vipBadgePill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radii.xs,
  },
  vipBadgePillSilver: {
    backgroundColor: '#334155',
  },
  vipBadgePillGold: {
    backgroundColor: '#78350F',
  },
  vipBadgePillBlackElite: {
    backgroundColor: '#27200B',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  vipBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: FontWeights.black,
    letterSpacing: 0.5,
  },
  vipSpendText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: FontWeights.bold,
  },
  vipCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  vipPointsAvailable: {
    color: Colors.gold,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.black,
  },
  vipPointsNote: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 1,
  },
  redeemBtn: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radii.sm,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  redeemBtnActive: {
    backgroundColor: Colors.emerald,
    borderColor: Colors.emerald,
  },
  redeemBtnText: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: FontWeights.black,
  },
  redeemBtnTextActive: {
    color: '#07090E',
    fontWeight: FontWeights.black,
  },
  newGuestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: Radii.sm,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  newGuestIcon: {
    fontSize: 11,
  },
  newGuestText: {
    color: '#38BDF8',
    fontSize: 10,
    flex: 1,
    lineHeight: 13,
  },
  customerDisplayBtn: {
    marginTop: Spacing.xs,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    alignItems: 'center',
  },
  customerDisplayBtnText: {
    color: Colors.green,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  customerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  customerModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.sheet,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  customerModalTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  customerModalBrand: {
    flex: 1,
  },
  customerModalBrandName: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.black,
    letterSpacing: 1,
  },
  customerModalSub: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
  },
  customerModalCloseBtn: {
    padding: Spacing.xs,
  },
  customerModalCloseText: {
    color: Colors.textMuted,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  customerAmountBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
  },
  customerAmountLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: FontWeights.extrabold,
    letterSpacing: 1,
  },
  customerAmountVal: {
    color: Colors.green,
    fontSize: 30,
    fontWeight: FontWeights.black,
    marginTop: 2,
  },
  customerAmountNote: {
    color: Colors.textDim,
    fontSize: 10,
    marginTop: 2,
  },
  customerQrFrame: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.sm,
    borderRadius: Radii.lg,
    marginBottom: Spacing.sm,
  },
  customerQrImg: {
    width: 200,
    height: 200,
  },
  customerScanGuide: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  customerConfirmBtn: {
    width: '100%',
    backgroundColor: Colors.green,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  customerConfirmBtnText: {
    color: Colors.bg,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.black,
    letterSpacing: 0.5,
  },
});
