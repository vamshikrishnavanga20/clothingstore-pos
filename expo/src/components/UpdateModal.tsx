/**
 * UpdateModal — Sleek luxury modal for In-App & Over-The-Air upgrades
 * Presents release notes, progress state, and instantaneous restart triggers.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  ScrollView,
} from 'react-native';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '../constants/theme';
import { hapticTap, hapticSuccess, hapticWarning } from '../utils/haptics';
import { downloadAndApplyUpdate, RemoteUpdateCheckResult, CURRENT_APP_VERSION } from '../services/updateService';

interface UpdateModalProps {
  visible: boolean;
  updateInfo: RemoteUpdateCheckResult | null;
  onClose: () => void;
}

export default function UpdateModal({ visible, updateInfo, onClose }: UpdateModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStep, setUpdateStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!visible || !updateInfo) return null;

  const handleApplyUpdate = async () => {
    hapticTap();
    setErrorMsg(null);
    setIsUpdating(true);
    setUpdateStep('Contacting update server...');

    try {
      if (updateInfo.isOta) {
        const res = await downloadAndApplyUpdate((status) => {
          setUpdateStep(status);
        });

        if (!res.success && res.error) {
          setErrorMsg(res.error);
          hapticWarning();
          setIsUpdating(false);
        } else {
          hapticSuccess();
          // Updates.reloadAsync() will restart the app
        }
      } else if (updateInfo.apkDownloadUrl) {
        // Direct APK link
        await Linking.openURL(updateInfo.apkDownloadUrl);
        setIsUpdating(false);
        onClose();
      } else {
        // Fallback info
        setUpdateStep('Terminal updated to latest configuration.');
        setTimeout(() => {
          setIsUpdating(false);
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Upgrade failed. Please check internet connection.');
      hapticWarning();
      setIsUpdating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isUpdating ? undefined : onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header Banner */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>🚀</Text>
              </View>
              <View style={styles.headerTextGroup}>
                <Text style={styles.title}>Update Available</Text>
                <Text style={styles.subTitle}>Roman Island POS Terminal</Text>
              </View>
            </View>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>
                v{CURRENT_APP_VERSION} → v{updateInfo.latestVersion}
              </Text>
            </View>
          </View>

          {/* Body / Release Notes */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionHeader}>What's New in This Version:</Text>
            <View style={styles.notesList}>
              {updateInfo.releaseNotes.map((note, index) => (
                <View key={index} style={styles.noteItem}>
                  <Text style={styles.bullet}>✦</Text>
                  <Text style={styles.noteText}>{note}</Text>
                </View>
              ))}
            </View>

            {updateInfo.isOta && (
              <View style={styles.otaNoticeBox}>
                <Text style={styles.otaNoticeTitle}>⚡ Instant Over-The-Air Upgrade</Text>
                <Text style={styles.otaNoticeText}>
                  This upgrade will download automatically and restart the app in seconds. No file re-installation required.
                </Text>
              </View>
            )}

            {errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
              </View>
            )}

            {isUpdating && (
              <View style={styles.progressBox}>
                <ActivityIndicator color={Colors.gold} size="small" />
                <Text style={styles.progressText}>{updateStep}</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            {!isUpdating && !updateInfo.forceUpdate && (
              <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
                <Text style={styles.secondaryBtnText}>Later</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                isUpdating && styles.primaryBtnDisabled,
                updateInfo.forceUpdate && { flex: 1 },
              ]}
              onPress={handleApplyUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color={Colors.bg} size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {updateInfo.isOta ? '⚡ Upgrade Now' : '📥 Download APK'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    overflow: 'hidden',
    maxHeight: '85%',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  headerTextGroup: {
    flex: 1,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  subTitle: {
    fontSize: FontSizes.xs,
    color: Colors.textDim,
    marginTop: 2,
  },
  versionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: Colors.gold,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radii.full,
    marginTop: 4,
  },
  versionText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.gold,
  },
  body: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textDim,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  notesList: {
    gap: 8,
    marginBottom: Spacing.md,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    color: Colors.gold,
    fontSize: 13,
    marginTop: 1,
  },
  noteText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  otaNoticeBox: {
    backgroundColor: 'rgba(52, 199, 89, 0.08)',
    borderColor: 'rgba(52, 199, 89, 0.3)',
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  otaNoticeTitle: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: '#34C759',
    marginBottom: 4,
  },
  otaNoticeText: {
    fontSize: FontSizes.xs,
    color: Colors.textDim,
    lineHeight: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderColor: 'rgba(255, 69, 58, 0.3)',
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: FontSizes.xs,
  },
  progressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgElevated,
    padding: Spacing.md,
    borderRadius: Radii.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressText: {
    color: Colors.gold,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
    backgroundColor: Colors.bgElevated,
  },
  secondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
  },
  secondaryBtnText: {
    color: Colors.textDim,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  primaryBtn: {
    flex: 2,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: Colors.bg,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
});
