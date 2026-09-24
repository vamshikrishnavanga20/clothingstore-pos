/**
 * NotificationToast — Animated slide-down toast component.
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Notification, NotificationType } from '../context/NotificationContext';
import { Colors, Radii, Spacing, FontSizes, FontWeights } from '../constants/theme';

const TYPE_CONFIG: Record<NotificationType, { bg: string; border: string; badge: string; accentColor: string }> = {
  success: {
    bg: 'rgba(16,185,129,0.14)',
    border: 'rgba(16,185,129,0.4)',
    badge: 'SUCCESS',
    accentColor: Colors.emerald,
  },
  warning: {
    bg: 'rgba(249,115,22,0.14)',
    border: 'rgba(249,115,22,0.4)',
    badge: 'ALERT',
    accentColor: Colors.orange,
  },
  info: {
    bg: 'rgba(212,175,55,0.14)',
    border: 'rgba(212,175,55,0.4)',
    badge: 'INFO',
    accentColor: Colors.gold,
  },
  order_ready: {
    bg: 'rgba(16,185,129,0.16)',
    border: 'rgba(16,185,129,0.45)',
    badge: 'BILLED',
    accentColor: Colors.emerald,
  },
};

const AUTO_DISMISS_MS = 3500;

function SingleToast({
  notification,
  onDismiss,
  index,
}: {
  notification: Notification;
  onDismiss: (id: string) => void;
  index: number;
}) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -80,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => onDismiss(notification.id));
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: Colors.bgCard,
          borderColor: config.border,
          transform: [{ translateY }],
          opacity,
          marginTop: index * 6,
        },
      ]}
    >
      <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
        <Text style={[styles.badgeText, { color: config.accentColor }]}>{config.badge}</Text>
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{notification.body}</Text>
      </View>
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => onDismiss(notification.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function NotificationToast({
  notifications,
  onDismiss,
}: {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  if (notifications.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + Spacing.sm }]} pointerEvents="box-none">
      {notifications.map((n, i) => (
        <SingleToast key={n.id} notification={n} onDismiss={onDismiss} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.sm,
    borderWidth: 1,
    marginRight: Spacing.md,
  },
  badgeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.extrabold,
    letterSpacing: 0.8,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.bold,
  },
  body: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  closeText: {
    color: Colors.textDim,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.bold,
  },
});
