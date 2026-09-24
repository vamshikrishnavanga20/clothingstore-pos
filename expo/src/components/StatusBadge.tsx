/**
 * StatusBadge — Reusable order/billing status indicator.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusColors, FontSizes, FontWeights, Radii, Spacing, Colors } from '../constants/theme';

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = StatusColors[status as keyof typeof StatusColors] || {
    text: Colors.green,
    bg: Colors.greenDim,
    border: Colors.greenBorder,
    label: status.toUpperCase(),
  };
  const displayLabel = label || config.label;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Text style={[styles.text, { color: config.text }]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.sm,
    borderWidth: 1,
  },
  text: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.extrabold,
    letterSpacing: 0.5,
  },
});
