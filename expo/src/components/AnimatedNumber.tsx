/**
 * AnimatedNumber — Smooth odometer-style counter with rolling digit animation.
 * Pure RN Animated API, zero external dependencies.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  TextStyle,
  StyleProp,
  ViewStyle,
} from 'react-native';

interface AnimatedNumberProps {
  /** The numeric value to display */
  value: number;
  /** Optional prefix (e.g. "₹") */
  prefix?: string;
  /** Optional suffix (e.g. "%") */
  suffix?: string;
  /** Duration of the animation in ms (default 600) */
  duration?: number;
  /** Text style for the number */
  textStyle?: StyleProp<TextStyle>;
  /** Container style */
  style?: ViewStyle;
  /** Format with Indian locale separators */
  formatIndian?: boolean;
  /** Number of decimal places (default 0) */
  decimals?: number;
}

/**
 * Animates from the previous numeric value to the new one
 * using a smooth easing transition (odometer effect).
 */
export default function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  duration = 600,
  textStyle,
  style,
  formatIndian = false,
  decimals = 0,
}: AnimatedNumberProps) {
  const animatedValue = useRef(new Animated.Value(value)).current;
  const displayValue = useRef(value);
  const textRef = useRef<Text>(null);

  // Track the displayed string for re-render
  const [displayText, setDisplayText] = React.useState(() => {
    return formatNumber(value, formatIndian, decimals);
  });

  useEffect(() => {
    // Only animate if value actually changed
    if (displayValue.current === value) return;

    displayValue.current = value;

    // Stop any running animation
    animatedValue.stopAnimation();

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false, // We need to read interpolated value
      easing: easeOutExpo,
    }).start();

    // Listen to animated value changes and update display
    const listenerId = animatedValue.addListener(({ value: v }) => {
      const rounded = decimals > 0 ? v : Math.round(v);
      setDisplayText(formatNumber(rounded, formatIndian, decimals));
    });

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [value, duration, formatIndian, decimals]);

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.text, textStyle]} ref={textRef}>
        {prefix}{displayText}{suffix}
      </Text>
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Custom easing: fast start, smooth deceleration */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/** Format number with optional Indian locale separators */
function formatNumber(
  num: number,
  formatIndian: boolean,
  decimals: number
): string {
  if (decimals > 0) {
    const fixed = num.toFixed(decimals);
    if (!formatIndian) return fixed;
    const [intPart, decPart] = fixed.split('.');
    return formatIndianInt(parseInt(intPart, 10)) + '.' + decPart;
  }

  const rounded = Math.round(num);
  if (!formatIndian) return rounded.toString();
  return formatIndianInt(rounded);
}

/** Format integer with Indian numbering system (e.g. 1,23,456) */
function formatIndianInt(n: number): string {
  const isNeg = n < 0;
  const abs = Math.abs(n);
  const str = abs.toString();

  if (str.length <= 3) return (isNeg ? '-' : '') + str;

  const lastThree = str.slice(-3);
  const remaining = str.slice(0, -3);
  const formatted =
    remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;

  return (isNeg ? '-' : '') + formatted;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
