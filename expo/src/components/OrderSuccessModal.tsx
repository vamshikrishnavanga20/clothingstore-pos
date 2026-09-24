import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Easing,
  Share,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '../constants/theme';
import { hapticSuccess } from '../utils/haptics';
import { sendDigitalInvoice } from '../services/api';

interface OrderSuccessModalProps {
  visible: boolean;
  order: any | null;
  onDismiss: () => void;
}

export default function OrderSuccessModal({
  visible,
  order,
  onDismiss,
}: OrderSuccessModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const checkScaleAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const [isSendingCloudWa, setIsSendingCloudWa] = useState(false);
  const [cloudWaStatus, setCloudWaStatus] = useState('');

  useEffect(() => {
    if (visible) {
      setCloudWaStatus('');
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      checkScaleAnim.setValue(0);
      ringAnim.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 80,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(checkScaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(ringAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      hapticSuccess();
    }
  }, [visible]);

  if (!order) return null;

  const ringScale = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const ringOpacity = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  const generateReceiptText = () => {
    let msg = `🛍️ *ROMAN ISLAND* - Store Invoice\n`;
    msg += `📍 ${order.branchName || 'Retail Branch'}\n`;
    msg += `🧾 *Invoice #:* ${order.billingId}\n`;
    msg += `👤 *Customer:* ${order.customerName || 'Guest'}\n`;
    if (order.customerTier) {
      msg += `👑 *VIP Club:* ${order.customerTier} Member\n`;
    }
    msg += `💳 *Tender:* ${order.paymentMethod}\n`;
    msg += `--------------------------------\n`;
    (order.items || []).forEach((it: any) => {
      msg += `• ${it.productName} (${it.size}) × ${it.quantity} = ₹${it.unitSellingPrice * it.quantity}\n`;
    });
    msg += `--------------------------------\n`;
    msg += `Subtotal: ₹${order.subtotal}\n`;
    if (order.discount > 0) msg += `Discount: -₹${order.discount}\n`;
    if (order.pointsRedeemed && order.pointsRedeemed > 0) {
      msg += `⭐ Points Redeemed: -${order.pointsRedeemed} Pts (-₹${order.pointsRedeemed})\n`;
    }
    msg += `GST (5%): ₹${order.tax}\n`;
    msg += `*Grand Total: ₹${order.total}*\n`;
    if (order.pointsEarned && order.pointsEarned > 0) {
      msg += `✨ *Points Accrued Today:* +⭐ ${order.pointsEarned} Pts\n`;
    }
    msg += `--------------------------------\n`;
    msg += `📄 *View / Download Digital Tax Invoice (PDF):*\n`;
    msg += `https://romanisland.store/invoice/${encodeURIComponent(order.billingId)}\n`;
    msg += `--------------------------------\n`;
    msg += `🌱 100% Paperless Store • Valid for 7-day exchanges.\n`;
    msg += `Thank you for shopping at Roman Island!`;
    return msg;
  };

  const handleShareWhatsApp = async () => {
    setIsSendingCloudWa(true);
    try {
      await sendDigitalInvoice(order.id, 'whatsapp');
      setCloudWaStatus('✓ Sent via WhatsApp Cloud API!');
    } catch (e) {
      // ignore
    } finally {
      setIsSendingCloudWa(false);
    }

    const text = generateReceiptText();
    const phone = (order.customerPhone || '').replace(/\D/g, '');
    let url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    if (phone && phone.length === 10) {
      url = `whatsapp://send?phone=91${phone}&text=${encodeURIComponent(text)}`;
    }
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
      else await Share.share({ message: text });
    } catch {
      await Share.share({ message: text });
    }
  };

  const handleOpenDigitalInvoice = async () => {
    const invoiceUrl = `https://romanisland.store/invoice/${encodeURIComponent(order.billingId)}`;
    try {
      await Linking.openURL(invoiceUrl);
    } catch {
      await Share.share({ message: `View Roman Island Digital Tax Invoice: ${invoiceUrl}` });
    }
  };

  const handleShareSystem = async () => {
    const text = generateReceiptText();
    try {
      await Share.share({ message: text, title: `Roman Island Invoice ${order.billingId}` });
    } catch {
      // ignore
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Pulse Ring */}
          <View style={styles.iconWrap}>
            <Animated.View
              style={[
                styles.ring,
                { transform: [{ scale: ringScale }], opacity: ringOpacity },
              ]}
            />
            <Animated.View
              style={[styles.checkCircle, { transform: [{ scale: checkScaleAnim }] }]}
            >
              <Text style={styles.checkMark}>✓</Text>
            </Animated.View>
          </View>

          <Text style={styles.title}>Invoice Generated!</Text>
          <View style={styles.orderIdBadge}>
            <Text style={styles.orderIdText}>{order.billingId}</Text>
          </View>
          <Text style={styles.subtitle}>Store inventory updated successfully</Text>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{(order.items || []).length}</Text>
              <Text style={styles.statLabel}>Items</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>₹{order.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{order.paymentMethod}</Text>
              <Text style={styles.statLabel}>Tender</Text>
            </View>
          </View>

          {/* VIP Rewards Banner */}
          {(Boolean(order.pointsEarned) || Boolean(order.customerTier)) && (
            <View style={styles.rewardsBox}>
              <View style={styles.rewardsHeader}>
                <Text style={styles.rewardsIcon}>👑</Text>
                <Text style={styles.rewardsTitle}>
                  {order.customerTier ? `${order.customerTier.toUpperCase()} VIP PERKS` : 'ROMAN ISLAND REWARDS'}
                </Text>
              </View>
              <View style={styles.rewardsRow}>
                {Boolean(order.pointsEarned) && (
                  <Text style={styles.rewardsEarnedText}>
                    +⭐ {order.pointsEarned} Points Accrued
                  </Text>
                )}
                {Boolean(order.pointsRedeemed) && (
                  <Text style={styles.rewardsRedeemedText}>
                    −₹{order.pointsRedeemed} Redeemed
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Automated WhatsApp Cloud Dispatch Badge */}
          {Boolean(order.customerPhone) && order.customerPhone.replace(/\D/g, '').length === 10 && (
            <View style={styles.autoWaBox}>
              <Text style={styles.autoWaText}>
                {cloudWaStatus || `⚡ Digital Bill auto-sent to +91 ${order.customerPhone.replace(/\D/g, '').slice(-10)}`}
              </Text>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.whatsAppBtn}
              onPress={handleShareWhatsApp}
              activeOpacity={0.8}
              disabled={isSendingCloudWa}
            >
              {isSendingCloudWa ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.whatsAppBtnText}>💬 WhatsApp Bill</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShareSystem} activeOpacity={0.8}>
              <Text style={styles.shareBtnText}>📤 Print / Share</Text>
            </TouchableOpacity>
          </View>

          {/* View Digital Tax Invoice Button */}
          <TouchableOpacity
            style={styles.digitalInvoiceBtn}
            onPress={handleOpenDigitalInvoice}
            activeOpacity={0.8}
          >
            <Text style={styles.digitalInvoiceBtnText}>📄 VIEW OFFICIAL DIGITAL TAX INVOICE</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} activeOpacity={0.8}>
            <Text style={styles.dismissText}>START NEXT BILL →</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.sheet,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  iconWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  ring: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: Colors.green,
  },
  checkCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  checkMark: {
    fontSize: 30,
    color: '#000000',
    fontWeight: FontWeights.black,
  },
  title: {
    fontSize: FontSizes.display,
    fontWeight: FontWeights.black,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  orderIdBadge: {
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  orderIdText: {
    color: Colors.gold,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.black,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.black,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textDim,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
    marginBottom: Spacing.md,
  },
  whatsAppBtn: {
    flex: 1,
    backgroundColor: '#25D366',
    paddingVertical: Spacing.md - 2,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  whatsAppBtnText: {
    color: '#FFFFFF',
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.black,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    paddingVertical: Spacing.md - 2,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  shareBtnText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  dismissBtn: {
    width: '100%',
    backgroundColor: Colors.gold,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  dismissText: {
    color: Colors.bg,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.black,
    letterSpacing: 0.5,
  },
  rewardsBox: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderRadius: Radii.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  rewardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  rewardsIcon: {
    fontSize: 12,
  },
  rewardsTitle: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: FontWeights.black,
    letterSpacing: 0.6,
  },
  rewardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardsEarnedText: {
    color: Colors.emerald,
    fontSize: 11,
    fontWeight: FontWeights.black,
  },
  rewardsRedeemedText: {
    color: Colors.orange,
    fontSize: 11,
    fontWeight: FontWeights.bold,
  },
  autoWaBox: {
    width: '100%',
    backgroundColor: 'rgba(37, 211, 102, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.35)',
    borderRadius: Radii.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  autoWaText: {
    color: '#25D366',
    fontSize: 11,
    fontWeight: FontWeights.bold,
    textAlign: 'center',
  },
  digitalInvoiceBtn: {
    width: '100%',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radii.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  digitalInvoiceBtnText: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: FontWeights.black,
    letterSpacing: 0.5,
  },
});
