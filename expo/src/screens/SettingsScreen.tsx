/**
 * SettingsScreen — Server Configuration, Diagnostics, App Info & Printer Setup
 * Production-grade settings panel for Roman Island POS Terminal.
 */

import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  Switch,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '../constants/theme';
import { hapticTap, hapticSuccess, hapticWarning } from '../utils/haptics';
import { getBaseApiUrl, setBaseApiUrl, DEFAULT_API_URL } from '../services/api';
import { testServerConnection } from '../utils/network';
import { safeStorage } from '../utils/storage';
import {
  getAppVersionInfo,
  checkForAppUpdates,
  VersionInfo,
  RemoteUpdateCheckResult,
} from '../services/updateService';
import UpdateModal from '../components/UpdateModal';

const APP_VERSION = '1.0.0';
const BUILD_DATE = new Date().toISOString().slice(0, 10);

interface ConnectionResult {
  online: boolean;
  latencyMs: number;
  branchesCount: number;
  error: string | null;
}

export default function SettingsScreen() {
  const { lockTerminal, staffName, userRole, activeBranchId } = useContext(AuthContext);

  // Server Config
  const [serverUrl, setServerUrl] = useState('');
  const [editingUrl, setEditingUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Preferences
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Diagnostics
  const [diagnosticsExpanded, setDiagnosticsExpanded] = useState(false);

  // Over-The-Air Updates
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState<RemoteUpdateCheckResult | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadServerUrl();
    loadPreferences();
    loadVersionInfo();
  }, []);

  const loadVersionInfo = async () => {
    try {
      const info = await getAppVersionInfo();
      setVersionInfo(info);
      const autoUp = await safeStorage.getItem('roman_pos_auto_update');
      if (autoUp === 'false') setAutoUpdateEnabled(false);
    } catch {}
  };

  const handleCheckForUpdates = async () => {
    hapticTap();
    setIsCheckingUpdate(true);
    try {
      const result = await checkForAppUpdates();
      setUpdateResult(result);
      if (result.hasUpdate) {
        hapticSuccess();
        setShowUpdateModal(true);
      } else {
        hapticTap();
        Alert.alert(
          'App is Up to Date',
          result.message || 'You are running the latest version of Roman Island POS.',
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      hapticWarning();
      Alert.alert('Update Check Failed', err?.message || 'Unable to contact update server.');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const loadServerUrl = async () => {
    const url = await getBaseApiUrl();
    setServerUrl(url);
    setEditingUrl(url);
  };

  const loadPreferences = async () => {
    try {
      const haptic = await safeStorage.getItem('roman_pos_haptic');
      if (haptic === 'false') setHapticEnabled(false);
      const refresh = await safeStorage.getItem('roman_pos_auto_refresh');
      if (refresh === 'false') setAutoRefresh(false);
      const sound = await safeStorage.getItem('roman_pos_sound');
      if (sound === 'false') setSoundEnabled(false);
    } catch {}
  };

  const handleTestConnection = async () => {
    hapticTap();
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testServerConnection(editingUrl || serverUrl);
      setTestResult(result);
      if (result.online) {
        hapticSuccess();
        // Pulse animation
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 150, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
      } else {
        hapticWarning();
      }
    } catch (e: any) {
      setTestResult({
        online: false,
        latencyMs: 0,
        branchesCount: 0,
        error: e.message || 'Test failed',
      });
      hapticWarning();
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveUrl = async () => {
    const cleaned = editingUrl.trim().replace(/\/$/, '');
    if (!cleaned) {
      Alert.alert('Invalid URL', 'Please enter a valid server URL');
      return;
    }

    setIsSaving(true);
    try {
      await setBaseApiUrl(cleaned);
      setServerUrl(cleaned);
      setIsEditing(false);
      hapticSuccess();
      Alert.alert('✓ Server Updated', `API endpoint changed to:\n${cleaned}\n\nThe app will now sync with this server.`);
    } catch {
      hapticWarning();
      Alert.alert('Save Failed', 'Could not save the server URL');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetUrl = () => {
    Alert.alert(
      'Reset Server URL',
      `Reset to default?\n\n${DEFAULT_API_URL}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setEditingUrl(DEFAULT_API_URL);
            await setBaseApiUrl(DEFAULT_API_URL);
            setServerUrl(DEFAULT_API_URL);
            setIsEditing(false);
            hapticSuccess();
          },
        },
      ]
    );
  };

  const togglePreference = async (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    await safeStorage.setItem(key, value.toString());
    hapticTap();
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Local Cache',
      'This will clear offline orders and cached data. Active session will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await safeStorage.removeItem('roman_pos_local_orders');
            hapticSuccess();
            Alert.alert('✓ Cache Cleared', 'Offline order cache has been purged.');
          },
        },
      ]
    );
  };

  const renderSectionHeader = (title: string, icon: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header
        subtitle={`Settings • ${staffName}`}
        isOffline={false}
        onLock={lockTerminal}
      />

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollPadding}>

        {/* ─── Server Connection ─── */}
        {renderSectionHeader('Server Connection', '🌐')}
        <View style={styles.card}>
          <View style={styles.serverStatusRow}>
            <View style={styles.serverStatusDot}>
              <Animated.View
                style={[
                  styles.statusIndicator,
                  testResult?.online ? styles.statusOnline : styles.statusUnknown,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Current API Server</Text>
              <Text style={styles.serverUrlText} numberOfLines={1}>
                {serverUrl || 'Not configured'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => {
                hapticTap();
                setIsEditing(!isEditing);
                setEditingUrl(serverUrl);
              }}
            >
              <Text style={styles.editBtnText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          {isEditing && (
            <View style={styles.editSection}>
              <TextInput
                style={styles.urlInput}
                value={editingUrl}
                onChangeText={setEditingUrl}
                placeholder="https://your-store-api.vercel.app"
                placeholderTextColor={Colors.textDim}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.resetBtn} onPress={handleResetUrl}>
                  <Text style={styles.resetBtnText}>Reset Default</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, isSaving && styles.btnDisabled]}
                  onPress={handleSaveUrl}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Test Connection */}
          <TouchableOpacity
            style={[styles.testBtn, isTesting && styles.btnDisabled]}
            onPress={handleTestConnection}
            disabled={isTesting}
          >
            {isTesting ? (
              <ActivityIndicator color={Colors.gold} size="small" />
            ) : (
              <Text style={styles.testBtnText}>🔄 Test Connection</Text>
            )}
          </TouchableOpacity>

          {testResult && (
            <View style={[styles.testResultBox, testResult.online ? styles.testSuccess : styles.testFail]}>
              <Text style={[styles.testResultTitle, { color: testResult.online ? Colors.emerald : Colors.red }]}>
                {testResult.online ? '✓ Connection Successful' : '✕ Connection Failed'}
              </Text>
              {testResult.online ? (
                <View>
                  <Text style={styles.testResultDetail}>
                    Latency: {testResult.latencyMs}ms • Branches: {testResult.branchesCount}
                  </Text>
                </View>
              ) : (
                <Text style={styles.testResultDetail}>{testResult.error}</Text>
              )}
            </View>
          )}
        </View>

        {/* ─── Quick Connect Presets ─── */}
        {renderSectionHeader('Quick Connect', '⚡')}
        <View style={styles.card}>
          <Text style={styles.presetHint}>Tap to instantly connect to a preconfigured server:</Text>
          <View style={styles.presetGrid}>
            {[
              { label: 'Production (Vercel)', url: 'https://clothingstore-pos.vercel.app' },
              { label: 'Local Dev (Wi-Fi)', url: 'http://192.168.29.89:3000' },
              { label: 'Android Emulator', url: 'http://10.0.2.2:3000' },
              { label: 'localhost', url: 'http://localhost:3000' },
            ].map((preset) => (
              <TouchableOpacity
                key={preset.url}
                style={[styles.presetBtn, serverUrl === preset.url && styles.presetBtnActive]}
                onPress={async () => {
                  hapticTap();
                  await setBaseApiUrl(preset.url);
                  setServerUrl(preset.url);
                  setEditingUrl(preset.url);
                  setIsEditing(false);
                  hapticSuccess();
                }}
              >
                <Text style={[styles.presetBtnLabel, serverUrl === preset.url && styles.presetBtnLabelActive]}>
                  {preset.label}
                </Text>
                <Text style={styles.presetBtnUrl} numberOfLines={1}>
                  {preset.url}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ─── Terminal Preferences ─── */}
        {renderSectionHeader('Terminal Preferences', '⚙️')}
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Haptic Feedback</Text>
              <Text style={styles.toggleDesc}>Vibration on button taps</Text>
            </View>
            <Switch
              value={hapticEnabled}
              onValueChange={(v) => togglePreference('roman_pos_haptic', v, setHapticEnabled)}
              trackColor={{ false: Colors.bgInput, true: Colors.goldDim }}
              thumbColor={hapticEnabled ? Colors.gold : Colors.textDim}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Auto-Refresh Data</Text>
              <Text style={styles.toggleDesc}>Real-time 3s catalog sync</Text>
            </View>
            <Switch
              value={autoRefresh}
              onValueChange={(v) => togglePreference('roman_pos_auto_refresh', v, setAutoRefresh)}
              trackColor={{ false: Colors.bgInput, true: Colors.goldDim }}
              thumbColor={autoRefresh ? Colors.gold : Colors.textDim}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Sound Effects</Text>
              <Text style={styles.toggleDesc}>Audio on order completion</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={(v) => togglePreference('roman_pos_sound', v, setSoundEnabled)}
              trackColor={{ false: Colors.bgInput, true: Colors.goldDim }}
              thumbColor={soundEnabled ? Colors.gold : Colors.textDim}
            />
          </View>
        </View>

        {/* ─── Diagnostics ─── */}
        {renderSectionHeader('Diagnostics & Maintenance', '🔧')}
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={handleClearCache}>
            <View>
              <Text style={styles.actionLabel}>Clear Offline Cache</Text>
              <Text style={styles.actionDesc}>Purge locally saved orders and sync data</Text>
            </View>
            <Text style={styles.actionIcon}>🗑️</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => {
              hapticTap();
              setDiagnosticsExpanded(!diagnosticsExpanded);
            }}
          >
            <View>
              <Text style={styles.actionLabel}>System Diagnostics</Text>
              <Text style={styles.actionDesc}>View terminal session details</Text>
            </View>
            <Text style={styles.actionIcon}>{diagnosticsExpanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {diagnosticsExpanded && (
            <View style={styles.diagnosticsPanel}>
              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>Staff Name</Text>
                <Text style={styles.diagValue}>{staffName}</Text>
              </View>
              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>Role</Text>
                <Text style={styles.diagValue}>{userRole || 'N/A'}</Text>
              </View>
              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>Branch ID</Text>
                <Text style={styles.diagValue}>{activeBranchId}</Text>
              </View>
              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>API Server</Text>
                <Text style={styles.diagValue} numberOfLines={1}>{serverUrl}</Text>
              </View>
              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>App Version</Text>
                <Text style={styles.diagValue}>v{APP_VERSION}</Text>
              </View>
              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>Build</Text>
                <Text style={styles.diagValue}>{BUILD_DATE}</Text>
              </View>
            </View>
          )}
        </View>

        {/* ─── Over-The-Air App Upgrades ─── */}
        {renderSectionHeader('System Updates & Over-The-Air', '🚀')}
        <View style={styles.card}>
          <View style={styles.updateStatusRow}>
            <View style={styles.updateInfoLeft}>
              <View style={styles.updateBadgeRow}>
                <Text style={styles.updateAppName}>Roman Island POS</Text>
                <View
                  style={[
                    styles.statusPill,
                    updateResult?.hasUpdate ? styles.statusPillAvailable : styles.statusPillCurrent,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      updateResult?.hasUpdate
                        ? styles.statusPillTextAvailable
                        : styles.statusPillTextCurrent,
                    ]}
                  >
                    {updateResult?.hasUpdate ? 'Update Available' : 'Up to Date'}
                  </Text>
                </View>
              </View>
              <Text style={styles.updateVersionDesc}>
                Installed: v{versionInfo?.currentVersion || APP_VERSION} • Channel: {versionInfo?.channel || 'production'}
              </Text>
              {versionInfo?.updateId && (
                <Text style={styles.updateOtaId} numberOfLines={1}>
                  OTA Bundle: {versionInfo.updateId}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.updateActionsRow}>
            <TouchableOpacity
              style={[styles.checkUpdateBtn, isCheckingUpdate && { opacity: 0.6 }]}
              onPress={handleCheckForUpdates}
              disabled={isCheckingUpdate}
            >
              {isCheckingUpdate ? (
                <ActivityIndicator color={Colors.gold} size="small" />
              ) : (
                <Text style={styles.checkUpdateBtnText}>🔄 Check for Updates</Text>
              )}
            </TouchableOpacity>

            {updateResult?.hasUpdate && (
              <TouchableOpacity
                style={styles.applyUpdateBtn}
                onPress={() => setShowUpdateModal(true)}
              >
                <Text style={styles.applyUpdateBtnText}>⚡ Upgrade App</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Automatic OTA Update</Text>
              <Text style={styles.toggleDesc}>Check for updates when terminal launches</Text>
            </View>
            <Switch
              value={autoUpdateEnabled}
              onValueChange={(v) => togglePreference('roman_pos_auto_update', v, setAutoUpdateEnabled)}
              trackColor={{ false: Colors.bgInput, true: Colors.goldDim }}
              thumbColor={autoUpdateEnabled ? Colors.gold : Colors.textDim}
            />
          </View>
        </View>

        {/* ─── About ─── */}
        {renderSectionHeader('About', 'ℹ️')}
        <View style={styles.card}>
          <View style={styles.aboutSection}>
            <View style={styles.aboutLogoCircle}>
              <Text style={styles.aboutLogoText}>RI</Text>
            </View>
            <Text style={styles.aboutBrand}>Roman Island POS</Text>
            <Text style={styles.aboutVersion}>Version {APP_VERSION} • Build {BUILD_DATE}</Text>
            <Text style={styles.aboutTagline}>
              Premium In-Store Billing & Inventory Terminal{'\n'}
              Designed for Roman Island Clothing
            </Text>
          </View>
        </View>

        {/* Lock Terminal */}
        <TouchableOpacity
          style={styles.lockTerminalBtn}
          onPress={() => {
            hapticWarning();
            lockTerminal();
          }}
        >
          <Text style={styles.lockTerminalText}>🔒 Lock Terminal</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Over-The-Air Upgrade Modal */}
      <UpdateModal
        visible={showUpdateModal}
        updateInfo={updateResult}
        onClose={() => setShowUpdateModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    flex: 1,
  },
  scrollPadding: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  sectionIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.gold,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.black,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  serverStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  serverStatusDot: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusOnline: {
    backgroundColor: Colors.emerald,
    shadowColor: Colors.emerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  statusUnknown: {
    backgroundColor: Colors.textDim,
  },
  cardLabel: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  serverUrlText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
    marginTop: 2,
  },
  editBtn: {
    backgroundColor: Colors.goldDim,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderRadius: Radii.pill,
  },
  editBtnText: {
    color: Colors.gold,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.black,
  },
  editSection: {
    marginTop: Spacing.md,
  },
  urlInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: Colors.textPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
  },
  editActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  resetBtn: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.sm,
    alignItems: 'center',
  },
  resetBtnText: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: Colors.gold,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.sm,
    alignItems: 'center',
  },
  saveBtnText: {
    color: Colors.bg,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.black,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  testBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.goldDim,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radii.sm,
    alignItems: 'center',
  },
  testBtnText: {
    color: Colors.gold,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.black,
  },
  testResultBox: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radii.sm,
    borderWidth: 1,
  },
  testSuccess: {
    backgroundColor: Colors.emeraldDim,
    borderColor: Colors.emeraldBorder,
  },
  testFail: {
    backgroundColor: Colors.redDim,
    borderColor: Colors.redBorder,
  },
  testResultTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.black,
    marginBottom: 4,
  },
  testResultDetail: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  presetHint: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.sm,
  },
  presetGrid: {
    gap: Spacing.sm,
  },
  presetBtn: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    padding: Spacing.md,
  },
  presetBtnActive: {
    borderColor: Colors.gold,
    backgroundColor: Colors.goldDim,
  },
  presetBtnLabel: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  presetBtnLabelActive: {
    color: Colors.gold,
  },
  presetBtnUrl: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.normal,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  toggleLabel: {
    color: Colors.textPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.bold,
  },
  toggleDesc: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.normal,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  actionLabel: {
    color: Colors.textPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.bold,
  },
  actionDesc: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.normal,
    marginTop: 2,
  },
  actionIcon: {
    fontSize: 16,
  },
  diagnosticsPanel: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radii.sm,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.xs + 2,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diagLabel: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  diagValue: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    maxWidth: '60%',
    textAlign: 'right',
  },
  aboutSection: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  aboutLogoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.goldDim,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  aboutLogoText: {
    color: Colors.gold,
    fontSize: 20,
    fontWeight: FontWeights.black,
    letterSpacing: 1,
  },
  aboutBrand: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.black,
    letterSpacing: 1,
  },
  aboutVersion: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    marginTop: 4,
  },
  aboutTagline: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.normal,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  lockTerminalBtn: {
    marginTop: Spacing.xxl,
    backgroundColor: Colors.redDim,
    borderWidth: 1,
    borderColor: Colors.redBorder,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radii.pill,
    alignItems: 'center',
  },
  lockTerminalText: {
    color: Colors.red,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.black,
    letterSpacing: 0.5,
  },
  // Update section styles
  updateStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  updateInfoLeft: {
    flex: 1,
  },
  updateBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  updateAppName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  statusPillCurrent: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    borderColor: 'rgba(52, 199, 89, 0.4)',
  },
  statusPillAvailable: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: Colors.gold,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
  },
  statusPillTextCurrent: {
    color: '#34C759',
  },
  statusPillTextAvailable: {
    color: Colors.gold,
  },
  updateVersionDesc: {
    fontSize: FontSizes.xs,
    color: Colors.textDim,
  },
  updateOtaId: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  updateActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  checkUpdateBtn: {
    flex: 1,
    height: 42,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkUpdateBtnText: {
    color: Colors.gold,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  applyUpdateBtn: {
    flex: 1,
    height: 42,
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
  applyUpdateBtnText: {
    color: Colors.bg,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
});
