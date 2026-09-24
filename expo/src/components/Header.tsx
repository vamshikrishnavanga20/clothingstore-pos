import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Colors, Spacing, FontSizes, FontWeights, Radii } from '../constants/theme';
import { PosContext } from '../context/PosContext';
import { AuthContext } from '../context/AuthContext';
import { hapticTap } from '../utils/haptics';

interface HeaderProps {
  subtitle: string;
  isOffline?: boolean;
  onLock: () => void;
  rightContent?: React.ReactNode;
  customTitle?: string;
}

export default function Header({
  subtitle,
  isOffline = false,
  onLock,
  rightContent,
  customTitle,
}: HeaderProps) {
  const { branches, activeBranchId, setActiveBranchId, isSyncing, forceSync } = useContext(PosContext);
  const { userRole } = useContext(AuthContext);
  const activeBranch = branches.find((b: any) => b.id === activeBranchId) || branches[0];
  const isAdmin = userRole === 'admin';

  // Live ticking clock (HH:MM:SS)
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleBranch = () => {
    if (!isAdmin) {
      Alert.alert('Terminal Locked', 'This terminal is strictly assigned to this branch. Only Admin can switch stores.');
      return;
    }
    if (!branches || branches.length <= 1) return;
    const curIdx = branches.findIndex((b: any) => b.id === activeBranchId);
    const nextIdx = (curIdx + 1) % branches.length;
    setActiveBranchId(branches[nextIdx].id);
  };

  const handleManualSync = () => {
    hapticTap();
    if (forceSync) {
      forceSync();
    }
  };

  const branchShortName = activeBranch?.name?.split('-')[1]?.trim() || activeBranch?.name || 'Main Branch';

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.titleSection}>
          {customTitle ? (
            <Text style={styles.customTitle}>{customTitle}</Text>
          ) : (
            <View style={styles.brandRow}>
              <Text style={styles.brandFirst}>ROMAN</Text>
              <Text style={styles.brandSecond}>ISLAND</Text>
              <View style={styles.posBadge}>
                <Text style={styles.posBadgeText}>POS</Text>
              </View>
              <View style={styles.clockPill}>
                <Text style={styles.clockText}>{currentTime}</Text>
              </View>
            </View>
          )}

          <View style={styles.metaSubRow}>
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
            {activeBranch && (
              <TouchableOpacity
                style={[styles.branchPill, !isAdmin && styles.branchPillLocked]}
                onPress={handleToggleBranch}
                activeOpacity={isAdmin ? 0.7 : 1}
                delayPressIn={0}
              >
                <Text style={[styles.branchPillText, !isAdmin && styles.branchPillLockedText]}>
                  {isAdmin ? '🏢 ' : '🔒 '}
                  {branchShortName}
                  {isAdmin ? ' ⇄' : ''}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.rightSection}>
          {isOffline ? (
            <View style={styles.offlinePill}>
              <Text style={styles.offlineText}>OFFLINE</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.livePill, isSyncing && styles.syncingPill]}
              onPress={handleManualSync}
              activeOpacity={0.7}
              delayPressIn={0}
            >
              {isSyncing ? (
                <>
                  <ActivityIndicator size={8} color={Colors.gold} style={{ marginRight: 2 }} />
                  <Text style={styles.syncingText}>SYNCING</Text>
                </>
              ) : (
                <>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>● LIVE CLOUD</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {rightContent}
          <TouchableOpacity onPress={onLock} style={styles.lockBtn} activeOpacity={0.75} delayPressIn={0}>
            <Text style={styles.lockText}>LOCK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs + 2,
    backgroundColor: Colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleSection: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandFirst: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.black,
    color: Colors.gold,
    letterSpacing: 0.8,
  },
  brandSecond: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.black,
    color: Colors.textPrimary,
    letterSpacing: 0.8,
    marginLeft: 3,
  },
  posBadge: {
    backgroundColor: Colors.emerald,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radii.xs,
    marginLeft: 5,
  },
  posBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: FontWeights.black,
  },
  customTitle: {
    fontSize: FontSizes.title,
    fontWeight: FontWeights.black,
    color: Colors.textPrimary,
  },
  metaSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 10.5,
    fontWeight: FontWeights.bold,
    color: Colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  branchPill: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  branchPillText: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: FontWeights.bold,
  },
  branchPillLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  branchPillLockedText: {
    color: Colors.textMuted,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  offlinePill: {
    backgroundColor: Colors.red,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radii.xs,
  },
  offlineText: {
    color: Colors.textPrimary,
    fontSize: 9,
    fontWeight: FontWeights.black,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radii.xs,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.emerald,
  },
  liveText: {
    color: Colors.emerald,
    fontSize: 9,
    fontWeight: FontWeights.extrabold,
    letterSpacing: 0.4,
  },
  syncingPill: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  syncingText: {
    color: Colors.gold,
    fontSize: 9,
    fontWeight: FontWeights.extrabold,
    letterSpacing: 0.4,
  },
  clockPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radii.xs,
    marginLeft: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  clockText: {
    color: Colors.textMuted,
    fontSize: 8.5,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  lockBtn: {
    backgroundColor: Colors.redDim,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.redBorder,
  },
  lockText: {
    color: Colors.red,
    fontSize: 10,
    fontWeight: FontWeights.black,
  },
});
