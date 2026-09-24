import React, { useContext, useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Vibration,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { Colors, Spacing, Radii, FontSizes, FontWeights, TABLET_BREAKPOINT } from '../constants/theme';
import { hapticTap, hapticWarning, hapticSuccess } from '../utils/haptics';

const PIN_LENGTH = 4;

const PAD_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
];

export default function LoginScreen() {
  const { unlockTerminal } = useContext(AuthContext);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const triggerShake = () => {
    setShake(true);
    hapticWarning();
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start(() => setShake(false));
  };

  const handleKey = async (key: string) => {
    if (loading) return;
    if (key === '⌫') {
      hapticTap();
      setPin((prev) => prev.slice(0, -1));
      return;
    }
    if (key === '') return;

    hapticTap();
    const newPin = pin + key;
    setPin(newPin);

    // Auto-unlock on 3 digits (111 / 222 / 333 / 999) or 4 digits
    if (
      newPin === '111' ||
      newPin === '222' ||
      newPin === '333' ||
      newPin === '999' ||
      newPin.length >= PIN_LENGTH
    ) {
      setLoading(true);
      try {
        const success = await unlockTerminal(newPin);
        if (success) {
          hapticSuccess();
        } else {
          triggerShake();
          setPin('');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const padKeySize = isTablet ? 88 : 74;

  return (
    <SafeAreaView style={styles.screen}>
      <Animated.View
        style={[
          styles.card,
          isTablet && styles.cardTablet,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateX: shakeAnim }],
          },
        ]}
      >
        {/* Logo & Title */}
        <View style={styles.brandWrap}>
          <View style={styles.brandIconCircle}>
            <Text style={styles.brandIconText}>RI</Text>
          </View>
          <View style={styles.brandTitleRow}>
            <Text style={styles.brandFirst}>ROMAN</Text>
            <Text style={styles.brandSecond}> ISLAND</Text>
          </View>
          <Text style={styles.brandTagline}>IN-STORE BILLING & POS TERMINAL</Text>
        </View>

        <Text style={styles.instruction}>Enter 4-digit Staff Passcode</Text>

        {/* PIN Indicators */}
        <View style={styles.dotsRow}>
          {Array.from({ length: PIN_LENGTH }).map((_, idx) => {
            const filled = idx < pin.length;
            return (
              <View
                key={idx}
                style={[
                  styles.dot,
                  filled && styles.dotFilled,
                  shake && styles.dotError,
                ]}
              />
            );
          })}
        </View>

        {/* Keypad */}
        <View style={styles.keypad}>
          {PAD_KEYS.map((row, rIdx) => (
            <View key={rIdx} style={styles.keypadRow}>
              {row.map((key, kIdx) => {
                const isEmpty = key === '';
                return (
                  <TouchableOpacity
                    key={kIdx}
                    style={[
                      styles.keyBtn,
                      { width: padKeySize, height: padKeySize },
                      isEmpty && styles.keyBtnEmpty,
                    ]}
                    onPress={() => handleKey(key)}
                    disabled={isEmpty || loading}
                    activeOpacity={0.7}
                    delayPressIn={0}
                  >
                    {key === '⌫' ? (
                      <Text style={styles.backspaceIcon}>⌫</Text>
                    ) : (
                      <Text style={styles.keyText}>{key}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.gold} style={{ marginTop: Spacing.md }} />
        ) : (
          <View style={styles.presetHints}>
            <Text style={styles.hintTitle}>Branch Passcodes (Isolated Access):</Text>
            <View style={styles.quickLoginGrid}>
              <TouchableOpacity
                style={styles.quickLoginBtn}
                onPress={async () => {
                  hapticTap();
                  setLoading(true);
                  try {
                    await unlockTerminal('1111');
                  } finally {
                    setLoading(false);
                  }
                }}
                activeOpacity={0.7}
                delayPressIn={0}
              >
                <Text style={styles.quickLoginBtnText}>Downtown (1111)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickLoginBtn}
                onPress={async () => {
                  hapticTap();
                  setLoading(true);
                  try {
                    await unlockTerminal('2222');
                  } finally {
                    setLoading(false);
                  }
                }}
                activeOpacity={0.7}
                delayPressIn={0}
              >
                <Text style={styles.quickLoginBtnText}>Uptown (2222)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickLoginBtn}
                onPress={async () => {
                  hapticTap();
                  setLoading(true);
                  try {
                    await unlockTerminal('3333');
                  } finally {
                    setLoading(false);
                  }
                }}
                activeOpacity={0.7}
                delayPressIn={0}
              >
                <Text style={styles.quickLoginBtnText}>Banjara (3333)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickLoginBtn, styles.quickLoginAdminBtn]}
                onPress={async () => {
                  hapticTap();
                  setLoading(true);
                  try {
                    await unlockTerminal('9999');
                  } finally {
                    setLoading(false);
                  }
                }}
                activeOpacity={0.7}
                delayPressIn={0}
              >
                <Text style={[styles.quickLoginBtnText, styles.quickLoginAdminText]}>HQ Admin (9999)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
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
  cardTablet: {
    maxWidth: 440,
    padding: Spacing.xxxl,
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  brandIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.goldDim,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  brandIconText: {
    color: Colors.gold,
    fontSize: 22,
    fontWeight: FontWeights.black,
    letterSpacing: 1,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandFirst: {
    fontSize: FontSizes.hero,
    fontWeight: FontWeights.black,
    color: Colors.gold,
    letterSpacing: 1.5,
  },
  brandSecond: {
    fontSize: FontSizes.hero,
    fontWeight: FontWeights.black,
    color: Colors.textPrimary,
    letterSpacing: 1.5,
  },
  brandTagline: {
    fontSize: FontSizes.xs - 1,
    color: Colors.textDim,
    fontWeight: FontWeights.extrabold,
    letterSpacing: 1,
    marginTop: 3,
  },
  instruction: {
    color: Colors.textMuted,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.md,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgInput,
  },
  dotFilled: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  dotError: {
    borderColor: Colors.red,
    backgroundColor: Colors.redDim,
  },
  keypad: {
    gap: Spacing.sm,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  keyBtn: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBtnEmpty: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  keyText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.title,
    fontWeight: FontWeights.extrabold,
  },
  backspaceIcon: {
    color: Colors.textMuted,
    fontSize: FontSizes.title,
    fontWeight: FontWeights.bold,
  },
  presetHints: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    width: '100%',
  },
  hintTitle: {
    color: Colors.textDim,
    fontSize: FontSizes.xs - 1,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  quickLoginGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.xs,
    width: '100%',
  },
  quickLoginBtn: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: Radii.pill,
  },
  quickLoginBtnText: {
    color: Colors.gold,
    fontSize: 10.5,
    fontWeight: FontWeights.bold,
  },
  quickLoginAdminBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  quickLoginAdminText: {
    color: Colors.green,
  },
});
