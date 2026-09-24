import React, { useContext, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { PosContext } from '../../context/PosContext';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import { useIsTablet } from '../../constants/layout';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '../../constants/theme';
import { hapticTap, hapticMedium } from '../../utils/haptics';

type TimeFilter = 'today' | 'week' | 'month' | 'all';

export default function AdminRevenueScreen() {
  const { lockTerminal, staffName } = useContext(AuthContext);
  const { tickets, branches, isOffline, refreshing, onRefresh } = useContext(PosContext);

  const isTablet = useIsTablet();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');

  // Filter orders by timeframe
  const filteredTickets = useMemo(() => {
    if (timeFilter === 'all') return tickets || [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return (tickets || []).filter((t: any) => {
      const tTime = new Date(t.createdAt).getTime();
      if (timeFilter === 'today') return tTime >= startOfToday;
      if (timeFilter === 'week') return tTime >= startOfWeek;
      if (timeFilter === 'month') return tTime >= startOfMonth;
      return true;
    });
  }, [tickets, timeFilter]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    const list = filteredTickets.filter((t) => t.status === 'Completed');
    const totalRev = list.reduce((s, t) => s + (Number(t.total) || 0), 0);
    const totalTax = list.reduce((s, t) => s + (Number(t.tax) || 0), 0);
    const totalDiscount = list.reduce((s, t) => s + (Number(t.discount) || 0), 0);
    const aov = list.length > 0 ? Math.round(totalRev / list.length) : 0;

    let totalGarments = 0;
    list.forEach((o) => {
      (o.items || []).forEach((it: any) => {
        totalGarments += Number(it.quantity) || 1;
      });
    });

    const upiRev = list.filter((t) => t.paymentMethod === 'UPI').reduce((s, t) => s + (Number(t.total) || 0), 0);
    const cashRev = list.filter((t) => t.paymentMethod === 'Cash').reduce((s, t) => s + (Number(t.total) || 0), 0);
    const cardRev = list.filter((t) => t.paymentMethod === 'Card').reduce((s, t) => s + (Number(t.total) || 0), 0);

    return {
      totalRevenue: totalRev,
      totalOrders: list.length,
      totalGarments,
      averageOrderValue: aov,
      totalTax,
      totalDiscount,
      upiRev,
      cashRev,
      cardRev,
    };
  }, [filteredTickets]);

  // Branch Revenue Split
  const branchBreakdown = useMemo(() => {
    const list = filteredTickets.filter((t) => t.status === 'Completed');
    return (branches || []).map((b: any) => {
      const bOrders = list.filter((o) => o.branchId === b.id);
      const bRev = bOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
      const pct = metrics.totalRevenue > 0 ? Math.round((bRev / metrics.totalRevenue) * 100) : 0;
      return {
        id: b.id,
        name: b.name,
        code: b.code || 'B',
        ordersCount: bOrders.length,
        revenue: bRev,
        percentage: pct,
      };
    });
  }, [filteredTickets, branches, metrics.totalRevenue]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header
        subtitle={`Executive Revenue • ${staffName}`}
        isOffline={isOffline}
        onLock={lockTerminal}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
          />
        }
      >
        {/* Timeframe Chips */}
        <View style={styles.filterRow}>
          {[
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'all', label: 'All History' },
          ].map((f) => {
            const active = timeFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => {
                  hapticMedium();
                  setTimeFilter(f.id as TimeFilter);
                }}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Primary KPI Grid */}
        <View style={[styles.kpiGrid, isTablet && styles.kpiGridTablet]}>
          <View style={[styles.kpiCard, { flex: 1 }]}>
            <Text style={styles.kpiLabel}>TOTAL REVENUE</Text>
            <Text style={styles.kpiValueGold}>₹{metrics.totalRevenue}</Text>
            <Text style={styles.kpiSub}>{metrics.totalGarments} garments sold</Text>
          </View>

          <View style={[styles.kpiCard, { flex: 1 }]}>
            <Text style={styles.kpiLabel}>TOTAL INVOICES</Text>
            <Text style={styles.kpiValue}>#{metrics.totalOrders}</Text>
            <Text style={styles.kpiSub}>Bills issued</Text>
          </View>

          <View style={[styles.kpiCard, { flex: 1 }]}>
            <Text style={styles.kpiLabel}>AVERAGE TICKET</Text>
            <Text style={styles.kpiValue}>₹{metrics.averageOrderValue}</Text>
            <Text style={styles.kpiSub}>Per customer</Text>
          </View>
        </View>

        {/* Store Branch Sales Comparison */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>STORE BRANCH REVENUE DISTRIBUTION</Text>
          <View style={styles.branchList}>
            {branchBreakdown.map((b) => (
              <View key={b.id} style={styles.branchMetricRow}>
                <View style={styles.branchInfo}>
                  <Text style={styles.branchNameText}>{b.name}</Text>
                  <Text style={styles.branchOrdersText}>{b.ordersCount} orders • {b.percentage}% share</Text>
                </View>
                <View style={styles.branchRevenueArea}>
                  <Text style={styles.branchRevenueText}>₹{b.revenue}</Text>
                  <View style={styles.branchBarTrack}>
                    <View style={[styles.branchBarFill, { width: `${Math.max(b.percentage, 4)}%` }]} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Tender Split Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>PAYMENT TENDER COLLECTION</Text>
          <View style={styles.tenderSplitRow}>
            <View style={styles.tenderBox}>
              <Text style={[styles.tenderLabel, { color: Colors.upi }]}>📱 UPI COLLECTION</Text>
              <Text style={styles.tenderAmount}>₹{metrics.upiRev}</Text>
              <View style={[styles.barTrack, { backgroundColor: 'rgba(139,92,246,0.15)' }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: Colors.upi,
                      width: metrics.totalRevenue > 0 ? `${(metrics.upiRev / metrics.totalRevenue) * 100}%` : '0%',
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.tenderBox}>
              <Text style={[styles.tenderLabel, { color: Colors.cash }]}>💵 CASH TENDER</Text>
              <Text style={styles.tenderAmount}>₹{metrics.cashRev}</Text>
              <View style={[styles.barTrack, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: Colors.cash,
                      width: metrics.totalRevenue > 0 ? `${(metrics.cashRev / metrics.totalRevenue) * 100}%` : '0%',
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.tenderBox}>
              <Text style={[styles.tenderLabel, { color: Colors.card }]}>💳 CARD SWIPES</Text>
              <Text style={styles.tenderAmount}>₹{metrics.cardRev}</Text>
              <View style={[styles.barTrack, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: Colors.card,
                      width: metrics.totalRevenue > 0 ? `${(metrics.cardRev / metrics.totalRevenue) * 100}%` : '0%',
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* GST & Discount Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>TAX & DISCOUNT AUDIT</Text>
          <View style={styles.auditRow}>
            <View style={styles.auditItem}>
              <Text style={styles.auditLabel}>GST Collected (5%)</Text>
              <Text style={styles.auditVal}>₹{metrics.totalTax}</Text>
            </View>
            <View style={styles.auditDivider} />
            <View style={styles.auditItem}>
              <Text style={styles.auditLabel}>Total Store Discounts</Text>
              <Text style={[styles.auditVal, { color: Colors.emerald }]}>−₹{metrics.totalDiscount}</Text>
            </View>
          </View>
        </View>

        {/* Recent Shift Bills Table */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>SHIFT TRANSACTION LEDGER ({filteredTickets.length})</Text>
          {filteredTickets.length === 0 ? (
            <Text style={styles.emptyText}>No transactions in selected period</Text>
          ) : (
            filteredTickets.slice(0, 15).map((t) => (
              <View key={t.id || t.billingId} style={styles.ledgerRow}>
                <View>
                  <Text style={styles.ledgerBillId}>{t.billingId}</Text>
                  <Text style={styles.ledgerTime}>
                    {t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} • {t.customerName}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.ledgerTotal}>₹{t.total}</Text>
                  <Text style={styles.ledgerTender}>{t.paymentMethod}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 90,
    gap: Spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderRadius: Radii.full,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  filterText: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  filterTextActive: {
    color: Colors.bg,
    fontWeight: FontWeights.black,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  kpiGridTablet: {
    gap: Spacing.lg,
  },
  kpiCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  kpiLabel: {
    color: Colors.textDim,
    fontSize: FontSizes.xs - 1,
    fontWeight: FontWeights.extrabold,
    letterSpacing: 0.5,
  },
  kpiValueGold: {
    color: Colors.gold,
    fontSize: FontSizes.display,
    fontWeight: FontWeights.black,
    marginTop: 4,
  },
  kpiValue: {
    color: Colors.textPrimary,
    fontSize: FontSizes.display,
    fontWeight: FontWeights.black,
    marginTop: 4,
  },
  kpiSub: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitle: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.extrabold,
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  branchList: {
    gap: Spacing.md,
  },
  branchMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  branchInfo: {
    flex: 1,
  },
  branchNameText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  branchOrdersText: {
    color: Colors.textDim,
    fontSize: FontSizes.xs - 1,
    marginTop: 2,
  },
  branchRevenueArea: {
    alignItems: 'flex-end',
    width: 140,
  },
  branchRevenueText: {
    color: Colors.gold,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.black,
    marginBottom: 4,
  },
  branchBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  branchBarFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  tenderSplitRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  tenderBox: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    padding: Spacing.md,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tenderLabel: {
    fontSize: FontSizes.xs - 1,
    fontWeight: FontWeights.extrabold,
  },
  tenderAmount: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.black,
    marginTop: 4,
    marginBottom: 8,
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  auditItem: {
    flex: 1,
    alignItems: 'center',
  },
  auditLabel: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
  },
  auditVal: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.black,
    marginTop: 2,
  },
  auditDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  ledgerBillId: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  ledgerTime: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
  },
  ledgerTotal: {
    color: Colors.gold,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.black,
  },
  ledgerTender: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs - 1,
  },
  emptyText: {
    color: Colors.textDim,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});
