import React, { useContext, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { PosContext, RetailOrder } from '../context/PosContext';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import OrderSuccessModal from '../components/OrderSuccessModal';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '../constants/theme';
import { hapticTap, hapticMedium, hapticSuccess, hapticWarning } from '../utils/haptics';
import AnimatedNumber from '../components/AnimatedNumber';

type FilterType = 'all' | 'completed' | 'cancelled';

const RETURN_REASONS = [
  'Wrong Size / Fit Exchange',
  'Fabric / Manufacturing Defect',
  'Customer Changed Mind',
  'Incorrect Item Billed',
];

export default function HistoryScreen() {
  const { lockTerminal, staffName, userRole, activeBranchId } = useContext(AuthContext);
  const { tickets, isOffline, refreshing, onRefresh, handleReturnOrder, isProcessingReturn } = useContext(PosContext);

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<RetailOrder | null>(null);
  const [showSlipModal, setShowSlipModal] = useState(false);

  // Return Flow States
  const [showReturnConfirm, setShowReturnConfirm] = useState(false);
  const [selectedReason, setSelectedReason] = useState(RETURN_REASONS[0]);

  // Shift Reconciliation & Z-Report States
  const [showZReportModal, setShowZReportModal] = useState(false);
  const [openingFloat, setOpeningFloat] = useState('2000');
  const [countedCash, setCountedCash] = useState('');
  const [shiftClosed, setShiftClosed] = useState(false);
  const [shiftClosedTime, setShiftClosedTime] = useState<string | null>(null);

  // Live Tender Breakdown & Till Calculations
  const reconciliation = useMemo(() => {
    const list = (tickets || []).filter((o) => {
      if (userRole !== 'admin' && o.branchId && o.branchId !== activeBranchId) {
        return false;
      }
      return true;
    });

    let cashSales = 0;
    let upiSales = 0;
    let cardSales = 0;
    let totalRefunds = 0;

    list.forEach((o) => {
      const amt = Number(o.total) || 0;
      if (o.status === 'Refunded' || o.status === 'Cancelled') {
        totalRefunds += amt;
      } else if (o.status === 'Completed') {
        if (o.paymentMethod === 'Cash') cashSales += amt;
        else if (o.paymentMethod === 'UPI') upiSales += amt;
        else if (o.paymentMethod === 'Card') cardSales += amt;
      }
    });

    const floatNum = Number(openingFloat) || 0;
    const expectedCashInTill = floatNum + cashSales;
    const countedNum = countedCash.trim() !== '' ? Number(countedCash) : null;
    const variance = countedNum !== null ? countedNum - expectedCashInTill : null;

    return {
      cashSales,
      upiSales,
      cardSales,
      grossSales: cashSales + upiSales + cardSales,
      totalRefunds,
      netSales: cashSales + upiSales + cardSales - totalRefunds,
      expectedCashInTill,
      variance,
    };
  }, [tickets, userRole, activeBranchId, openingFloat, countedCash]);

  // Live Shift Metrics
  const shiftMetrics = useMemo(() => {
    const list = (tickets || []).filter((o) => {
      if (userRole !== 'admin' && o.branchId && o.branchId !== activeBranchId) {
        return false;
      }
      return true;
    });

    const completed = list.filter((o) => o.status === 'Completed');
    const refunded = list.filter((o) => o.status === 'Refunded' || o.status === 'Cancelled');
    const netRevenue = completed.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    return {
      totalBills: list.length,
      completedCount: completed.length,
      refundedCount: refunded.length,
      netRevenue,
    };
  }, [tickets, userRole, activeBranchId]);

  // Filter orders by branch isolation, status and search
  const filteredOrders = useMemo(() => {
    return (tickets || []).filter((o) => {
      // Branch Isolation: Cashiers only see orders from their own branch
      if (userRole !== 'admin') {
        if (o.branchId && o.branchId !== activeBranchId) {
          return false;
        }
      }

      const matchFilter =
        activeFilter === 'all' ||
        (activeFilter === 'completed' && o.status === 'Completed') ||
        (activeFilter === 'cancelled' && (o.status === 'Cancelled' || o.status === 'Refunded'));

      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        o.billingId?.toLowerCase().includes(q) ||
        o.customerPhone?.includes(q) ||
        o.customerName?.toLowerCase().includes(q);

      return matchFilter && matchSearch;
    });
  }, [tickets, activeFilter, searchQuery, userRole, activeBranchId]);

  const onConfirmReturn = async () => {
    if (!selectedOrder) return;
    try {
      await handleReturnOrder(selectedOrder.billingId, selectedReason);
      hapticSuccess();
      setShowReturnConfirm(false);
      // Update local selectedOrder state to show refunded status immediately
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              status: 'Refunded',
              returnReason: selectedReason,
              refundedAt: new Date().toISOString(),
            }
          : null
      );
      Alert.alert(
        'Return Processed',
        `₹${selectedOrder.total} refunded to customer. All items have been restocked into branch inventory and deducted from gross revenue.`
      );
    } catch (err: any) {
      hapticWarning();
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header
        subtitle={userRole === 'admin' ? 'Live Invoices • All Branches' : `Live Invoices • ${staffName}`}
        isOffline={isOffline}
        onLock={lockTerminal}
      />

      {/* Live Shift Summary Strip */}
      <View style={styles.shiftStrip}>
        <View style={styles.shiftCard}>
          <AnimatedNumber
            value={shiftMetrics.netRevenue}
            prefix="₹"
            formatIndian
            textStyle={styles.shiftNumGold}
            duration={800}
          />
          <Text style={styles.shiftLabel}>NET REVENUE</Text>
        </View>
        <View style={styles.shiftCard}>
          <AnimatedNumber
            value={shiftMetrics.completedCount}
            textStyle={styles.shiftNum}
            duration={600}
          />
          <Text style={styles.shiftLabel}>PAID BILLS</Text>
        </View>
        <View style={styles.shiftCard}>
          <AnimatedNumber
            value={shiftMetrics.refundedCount}
            textStyle={[styles.shiftNum, { color: Colors.orange }]}
            duration={600}
          />
          <Text style={styles.shiftLabel}>REFUNDS</Text>
        </View>
        <TouchableOpacity
          style={styles.shiftZCard}
          onPress={() => {
            hapticMedium();
            setShowZReportModal(true);
          }}
          activeOpacity={0.7}
          delayPressIn={0}
        >
          <Text style={styles.shiftZIcon}>⚖️</Text>
          <Text style={styles.shiftZLabel}>Z-REPORT</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips & Search Bar */}
      <View style={styles.controlsWrap}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Bill ID (e.g. BILL-B1), phone or customer..."
            placeholderTextColor={Colors.textDim}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearBtn}
              delayPressIn={0}
              activeOpacity={0.7}
            >
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Refunded / Returned' },
          ].map((f) => {
            const active = activeFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => {
                  hapticMedium();
                  setActiveFilter(f.id as FilterType);
                }}
                delayPressIn={0}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Order Invoices List */}
      {filteredOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🧾</Text>
          <Text style={styles.emptyTitle}>No Invoices Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'No receipts match your search.' : 'No invoices recorded yet in this shift.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id || item.billingId}
          contentContainerStyle={styles.listContent}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.gold}
            />
          }
          renderItem={({ item }) => {
            const isRefunded = item.status === 'Refunded';
            return (
              <TouchableOpacity
                style={[styles.orderCard, isRefunded && styles.orderCardRefunded]}
                onPress={() => {
                  hapticTap();
                  setSelectedOrder(item);
                }}
                activeOpacity={0.75}
                delayPressIn={0}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <View style={styles.billingIdRow}>
                      <Text style={styles.billingId}>{item.billingId}</Text>
                      {isRefunded && (
                        <View style={styles.refundBadge}>
                          <Text style={styles.refundBadgeText}>REFUNDED</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.timeText}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} • {item.branchName || 'Retail Branch'}
                    </Text>
                  </View>
                  <View style={styles.totalBlock}>
                    <Text style={[styles.totalValue, isRefunded && styles.totalValueRefunded]}>
                      ₹{item.total}
                    </Text>
                    <StatusBadge status={item.status} />
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.itemsSummary}>
                  {(item.items || []).map((it, idx) => (
                    <Text key={idx} style={styles.itemLine}>
                      • {it.productName} ({it.size}) × {it.quantity} @ ₹{it.unitSellingPrice}
                    </Text>
                  ))}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.customerText}>
                    👤 {item.customerName || 'Walk-in'} {item.customerPhone ? `• 📞 ${item.customerPhone}` : ''}
                  </Text>
                  <View style={styles.tenderPill}>
                    <Text style={styles.tenderText}>{item.paymentMethod}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: INVOICE DETAILS & ONE-CLICK RETURN */}
      {/* ========================================================================= */}
      <Modal
        visible={!!selectedOrder}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setSelectedOrder(null);
          setShowReturnConfirm(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailCard}>
            {selectedOrder && (
              <>
                {/* Modal Header */}
                <View style={styles.detailHeader}>
                  <View>
                    <Text style={styles.detailBrandTitle}>ROMAN ISLAND INVOICE</Text>
                    <Text style={styles.detailBillId}>{selectedOrder.billingId}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeDetailBtn}
                    onPress={() => {
                      setSelectedOrder(null);
                      setShowReturnConfirm(false);
                    }}
                    delayPressIn={0}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.closeDetailBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
                  {/* Status Banner */}
                  {selectedOrder.status === 'Refunded' ? (
                    <View style={styles.refundNoticeBanner}>
                      <Text style={styles.refundNoticeTitle}>⚠️ INVOICE REFUNDED & RESTOCKED</Text>
                      <Text style={styles.refundNoticeSub}>
                        This order has been returned. Amount of ₹{selectedOrder.total} was deducted from gross revenue and items were restored to store stock.
                      </Text>
                      {selectedOrder.returnReason && (
                        <Text style={styles.refundNoticeReason}>Reason: {selectedOrder.returnReason}</Text>
                      )}
                    </View>
                  ) : null}

                  {/* Customer Meta Card */}
                  <View style={styles.metaBox}>
                    <View style={styles.metaBoxRow}>
                      <Text style={styles.metaBoxLabel}>Customer:</Text>
                      <Text style={styles.metaBoxVal}>{selectedOrder.customerName || 'Walk-in Guest'}</Text>
                    </View>
                    <View style={styles.metaBoxRow}>
                      <Text style={styles.metaBoxLabel}>Phone:</Text>
                      <Text style={styles.metaBoxVal}>{selectedOrder.customerPhone || 'N/A'}</Text>
                    </View>
                    <View style={styles.metaBoxRow}>
                      <Text style={styles.metaBoxLabel}>Branch:</Text>
                      <Text style={styles.metaBoxVal}>{selectedOrder.branchName}</Text>
                    </View>
                    <View style={styles.metaBoxRow}>
                      <Text style={styles.metaBoxLabel}>Tender:</Text>
                      <Text style={[styles.metaBoxVal, { color: Colors.gold, fontWeight: FontWeights.black }]}>
                        {selectedOrder.paymentMethod}
                      </Text>
                    </View>
                    <View style={styles.metaBoxRow}>
                      <Text style={styles.metaBoxLabel}>Date:</Text>
                      <Text style={styles.metaBoxVal}>
                        {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('en-IN') : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {/* Purchased Items List */}
                  <Text style={styles.sectionHeaderTitle}>PURCHASED APPAREL</Text>
                  <View style={styles.itemsTable}>
                    {selectedOrder.items.map((it, idx) => (
                      <View key={idx} style={styles.tableRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.tableItemName}>{it.productName}</Text>
                          <Text style={styles.tableItemSub}>
                            Size: <Text style={{ color: Colors.gold, fontWeight: FontWeights.bold }}>{it.size}</Text> • ₹{it.unitSellingPrice} × {it.quantity}
                          </Text>
                        </View>
                        <Text style={styles.tableItemTotal}>₹{it.subtotal || it.unitSellingPrice * it.quantity}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Financial Breakdown */}
                  <View style={styles.finSummaryBox}>
                    <View style={styles.finRow}>
                      <Text style={styles.finLabel}>Subtotal</Text>
                      <Text style={styles.finVal}>₹{selectedOrder.subtotal || selectedOrder.total}</Text>
                    </View>
                    {selectedOrder.discount > 0 && (
                      <View style={styles.finRow}>
                        <Text style={styles.finLabel}>Discount</Text>
                        <Text style={[styles.finVal, { color: Colors.emerald }]}>−₹{selectedOrder.discount}</Text>
                      </View>
                    )}
                    <View style={styles.finRow}>
                      <Text style={styles.finLabel}>GST (5%)</Text>
                      <Text style={styles.finVal}>₹{selectedOrder.tax || 0}</Text>
                    </View>
                    <View style={[styles.finRow, styles.finRowTotal]}>
                      <Text style={styles.finTotalLabel}>PAID TOTAL</Text>
                      <Text style={styles.finTotalVal}>₹{selectedOrder.total}</Text>
                    </View>
                  </View>

                  {/* Return Confirmation Box if triggered */}
                  {showReturnConfirm && selectedOrder.status === 'Completed' && (
                    <View style={styles.returnConfirmCard}>
                      <Text style={styles.returnConfirmTitle}>Confirm Customer Return</Text>
                      <Text style={styles.returnConfirmSub}>
                        Refund ₹{selectedOrder.total} to customer and restock all items into {selectedOrder.branchName} inventory:
                      </Text>

                      <Text style={styles.reasonLabel}>REASON FOR RETURN:</Text>
                      <View style={styles.reasonsList}>
                        {RETURN_REASONS.map((r) => {
                          const active = selectedReason === r;
                          return (
                            <TouchableOpacity
                              key={r}
                              style={[styles.reasonChip, active && styles.reasonChipActive]}
                              onPress={() => setSelectedReason(r)}
                              delayPressIn={0}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.reasonText, active && styles.reasonTextActive]}>
                                {r}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <View style={styles.confirmActionRow}>
                        <TouchableOpacity
                          style={styles.cancelReturnBtn}
                          onPress={() => setShowReturnConfirm(false)}
                          delayPressIn={0}
                        >
                          <Text style={styles.cancelReturnBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.executeReturnBtn}
                          onPress={onConfirmReturn}
                          disabled={isProcessingReturn}
                          delayPressIn={0}
                        >
                          {isProcessingReturn ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <Text style={styles.executeReturnBtnText}>Confirm Refund & Restock</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </ScrollView>

                {/* Modal Footer Actions */}
                <View style={styles.detailFooter}>
                  {selectedOrder.status === 'Completed' && !showReturnConfirm && (
                    <TouchableOpacity
                      style={styles.returnActionBtn}
                      onPress={() => {
                        hapticMedium();
                        setShowReturnConfirm(true);
                      }}
                      delayPressIn={0}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.returnActionBtnText}>↺ Return / Refund Order</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.printSlipBtn}
                    onPress={() => {
                      hapticTap();
                      setShowSlipModal(true);
                    }}
                    delayPressIn={0}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.printSlipBtnText}>🧾 Digital WhatsApp Slip</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Re-print / Digital Receipt Modal */}
      {selectedOrder && (
        <OrderSuccessModal
          visible={showSlipModal}
          order={selectedOrder}
          onDismiss={() => setShowSlipModal(false)}
        />
      )}

      {/* Shift End & Cash Drawer Z-Report Modal */}
      <Modal
        visible={showZReportModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowZReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.zReportModalContent}>
            {/* Header */}
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailBrandTitle}>⚖️ SHIFT Z-REPORT & TILL AUDIT</Text>
                <Text style={styles.detailBillId}>
                  {staffName} • {activeBranchId.toUpperCase()} •{' '}
                  {new Date().toLocaleDateString('en-IN', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeDetailBtn}
                onPress={() => setShowZReportModal(false)}
                delayPressIn={0}
                activeOpacity={0.7}
              >
                <Text style={styles.closeDetailBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
              {/* Shift Lock Banner if signed off */}
              {shiftClosed && (
                <View style={styles.shiftClosedBanner}>
                  <Text style={styles.shiftClosedTitle}>🔒 SHIFT RECONCILED & LOCKED</Text>
                  <Text style={styles.shiftClosedSub}>
                    Audited at {shiftClosedTime}. Digital sign-off recorded in store registry.
                  </Text>
                </View>
              )}

              {/* Float & Opening Balance */}
              <View style={styles.zReportSection}>
                <Text style={styles.zSectionTitle}>1. STARTING CASH FLOAT</Text>
                <View style={styles.floatInputRow}>
                  <Text style={styles.floatCurrency}>₹</Text>
                  <TextInput
                    style={styles.floatInput}
                    value={openingFloat}
                    onChangeText={setOpeningFloat}
                    keyboardType="numeric"
                    placeholder="2000"
                    placeholderTextColor={Colors.textDim}
                    editable={!shiftClosed}
                  />
                  <Text style={styles.floatNote}>Beginning till drawer cash</Text>
                </View>
              </View>

              {/* Tender Breakdown */}
              <View style={styles.zReportSection}>
                <Text style={styles.zSectionTitle}>2. TENDER BREAKDOWN (COLLECTIONS)</Text>
                <View style={styles.tenderBreakdownGrid}>
                  <View style={styles.tenderBreakdownCard}>
                    <Text style={styles.tenderCardIcon}>💵</Text>
                    <Text style={styles.tenderCardVal}>₹{reconciliation.cashSales}</Text>
                    <Text style={styles.tenderCardLabel}>CASH SALES</Text>
                  </View>
                  <View style={styles.tenderBreakdownCard}>
                    <Text style={styles.tenderCardIcon}>📱</Text>
                    <Text style={[styles.tenderCardVal, { color: Colors.upi }]}>
                      ₹{reconciliation.upiSales}
                    </Text>
                    <Text style={styles.tenderCardLabel}>UPI / QR</Text>
                  </View>
                  <View style={styles.tenderBreakdownCard}>
                    <Text style={styles.tenderCardIcon}>💳</Text>
                    <Text style={[styles.tenderCardVal, { color: Colors.card }]}>
                      ₹{reconciliation.cardSales}
                    </Text>
                    <Text style={styles.tenderCardLabel}>CARD / POS</Text>
                  </View>
                </View>

                {/* Net Financials Strip */}
                <View style={styles.zFinRow}>
                  <Text style={styles.zFinLabel}>
                    Gross Sales ({shiftMetrics.completedCount} Bills):
                  </Text>
                  <Text style={styles.zFinVal}>₹{reconciliation.grossSales}</Text>
                </View>
                {reconciliation.totalRefunds > 0 && (
                  <View style={styles.zFinRow}>
                    <Text style={styles.zFinLabel}>
                      Total Refunds Deducted ({shiftMetrics.refundedCount}):
                    </Text>
                    <Text style={[styles.zFinVal, { color: Colors.orange }]}>
                      −₹{reconciliation.totalRefunds}
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    styles.zFinRow,
                    { borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 6 },
                  ]}
                >
                  <Text style={styles.zFinTotalLabel}>NET STORE REVENUE:</Text>
                  <Text style={styles.zFinTotalVal}>₹{reconciliation.netSales}</Text>
                </View>
              </View>

              {/* Cash Drawer Reconciliation */}
              <View style={styles.zReportSection}>
                <Text style={styles.zSectionTitle}>3. CASH DRAWER AUDIT & VARIANCE</Text>
                <View style={styles.tillReconcileBox}>
                  <View style={styles.tillCalcRow}>
                    <Text style={styles.tillCalcLabel}>Starting Float:</Text>
                    <Text style={styles.tillCalcVal}>₹{Number(openingFloat) || 0}</Text>
                  </View>
                  <View style={styles.tillCalcRow}>
                    <Text style={styles.tillCalcLabel}>+ Cash Sales Collected:</Text>
                    <Text style={styles.tillCalcVal}>₹{reconciliation.cashSales}</Text>
                  </View>
                  <View style={[styles.tillCalcRow, styles.tillCalcTotal]}>
                    <Text style={styles.tillExpectedLabel}>EXPECTED CASH IN DRAWER:</Text>
                    <Text style={styles.tillExpectedVal}>₹{reconciliation.expectedCashInTill}</Text>
                  </View>
                </View>

                {/* Actual Count Input */}
                <View style={styles.actualCountWrap}>
                  <Text style={styles.actualCountLabel}>ACTUAL PHYSICAL CASH COUNTED (₹):</Text>
                  <View style={styles.countInputRow}>
                    <Text style={styles.floatCurrency}>₹</Text>
                    <TextInput
                      style={styles.countInput}
                      value={countedCash}
                      onChangeText={setCountedCash}
                      keyboardType="numeric"
                      placeholder={`Enter notes count (e.g. ${reconciliation.expectedCashInTill})`}
                      placeholderTextColor={Colors.textDim}
                      editable={!shiftClosed}
                    />
                  </View>
                </View>

                {/* Variance Banner */}
                {reconciliation.variance !== null && (
                  <View
                    style={[
                      styles.varianceBanner,
                      reconciliation.variance === 0
                        ? styles.varianceBannerExact
                        : reconciliation.variance > 0
                        ? styles.varianceBannerOver
                        : styles.varianceBannerShort,
                    ]}
                  >
                    <Text style={styles.varianceTitle}>
                      {reconciliation.variance === 0
                        ? '✅ TILL BALANCED PERFECTLY'
                        : reconciliation.variance > 0
                        ? `⚠️ CASH DRAWER OVER BY +₹${reconciliation.variance}`
                        : `❌ CASH DRAWER SHORT BY −₹${Math.abs(reconciliation.variance)}`}
                    </Text>
                    <Text style={styles.varianceSub}>
                      {reconciliation.variance === 0
                        ? 'Expected cash matches counted physical drawer notes to the rupee.'
                        : reconciliation.variance > 0
                        ? 'Cash drawer has surplus physical currency compared to recorded sales.'
                        : 'Cash drawer is missing notes compared to recorded sales.'}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.detailFooter}>
              {!shiftClosed ? (
                <TouchableOpacity
                  style={styles.lockShiftBtn}
                  onPress={() => {
                    hapticSuccess();
                    setShiftClosed(true);
                    setShiftClosedTime(
                      new Date().toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    );
                    Alert.alert(
                      'Shift Reconciled & Locked',
                      `Z-Report for ${staffName} completed with Expected ₹${reconciliation.expectedCashInTill} vs Counted ₹${countedCash || '0'}.`,
                      [{ text: 'OK' }]
                    );
                  }}
                  delayPressIn={0}
                  activeOpacity={0.8}
                >
                  <Text style={styles.lockShiftBtnText}>🔒 SIGN-OFF & LOCK SHIFT</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.lockShiftBtn, { backgroundColor: Colors.bgInput }]}
                  onPress={() => {
                    setShiftClosed(false);
                    setShiftClosedTime(null);
                  }}
                  delayPressIn={0}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.lockShiftBtnText, { color: Colors.textSecondary }]}>
                    RE-OPEN SHIFT AUDIT
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  shiftStrip: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  shiftCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.sm,
    paddingVertical: Spacing.xs + 1,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  shiftNumGold: {
    color: Colors.gold,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.black,
  },
  shiftNum: {
    color: Colors.textPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.black,
  },
  shiftLabel: {
    color: Colors.textDim,
    fontSize: 8.5,
    fontWeight: FontWeights.extrabold,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  controlsWrap: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.md,
    height: 38,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
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
  listContent: {
    padding: Spacing.md,
    gap: Spacing.sm + 2,
    paddingBottom: 40,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.huge,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    color: Colors.textDim,
    fontSize: FontSizes.body,
    textAlign: 'center',
    maxWidth: 280,
  },
  orderCard: {
    backgroundColor: '#0E1424',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.18)',
    padding: Spacing.md,
  },
  orderCardRefunded: {
    borderColor: 'rgba(249, 115, 22, 0.4)',
    backgroundColor: '#14101A',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  billingIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  billingId: {
    color: Colors.gold,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.black,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  refundBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radii.xs,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.4)',
  },
  refundBadgeText: {
    color: Colors.orange,
    fontSize: 8.5,
    fontWeight: FontWeights.black,
  },
  timeText: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  totalBlock: {
    alignItems: 'flex-end',
    gap: 3,
  },
  totalValue: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.black,
  },
  totalValueRefunded: {
    color: Colors.orange,
    textDecorationLine: 'line-through',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.sm,
  },
  itemsSummary: {
    gap: 2,
  },
  itemLine: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  customerText: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    flex: 1,
  },
  tenderPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    backgroundColor: Colors.bgInput,
    borderRadius: Radii.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tenderText: {
    color: Colors.gold,
    fontSize: 9.5,
    fontWeight: FontWeights.extrabold,
    textTransform: 'uppercase',
  },

  // Modal Detail Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  detailCard: {
    backgroundColor: '#0A0E1A',
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    maxHeight: '90%',
    paddingBottom: Spacing.xl,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: '#0F1528',
  },
  detailBrandTitle: {
    color: Colors.gold,
    fontSize: 9.5,
    fontWeight: FontWeights.black,
    letterSpacing: 1.2,
  },
  detailBillId: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: FontWeights.black,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  closeDetailBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeDetailBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: FontWeights.bold,
  },
  detailScroll: {
    padding: Spacing.lg,
  },
  refundNoticeBanner: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.4)',
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  refundNoticeTitle: {
    color: Colors.orange,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.black,
    marginBottom: 2,
  },
  refundNoticeSub: {
    color: '#E2E8F0',
    fontSize: 11,
    lineHeight: 15,
  },
  refundNoticeReason: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: FontWeights.bold,
    marginTop: 4,
  },
  metaBox: {
    backgroundColor: '#10162A',
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 4,
    marginBottom: Spacing.md,
  },
  metaBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaBoxLabel: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
  },
  metaBoxVal: {
    color: '#FFFFFF',
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  sectionHeaderTitle: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: FontWeights.black,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  itemsTable: {
    backgroundColor: '#10162A',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tableItemName: {
    color: '#FFFFFF',
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  tableItemSub: {
    color: Colors.textDim,
    fontSize: 10,
    marginTop: 1,
  },
  tableItemTotal: {
    color: Colors.gold,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.black,
  },
  finSummaryBox: {
    backgroundColor: '#10162A',
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 4,
    marginBottom: Spacing.md,
  },
  finRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  finLabel: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
  },
  finVal: {
    color: '#FFFFFF',
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  finRowTotal: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.xs + 2,
    marginTop: 2,
  },
  finTotalLabel: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.black,
  },
  finTotalVal: {
    color: '#F59E0B',
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.black,
  },
  returnConfirmCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  returnConfirmTitle: {
    color: '#F87171',
    fontSize: FontSizes.body,
    fontWeight: FontWeights.black,
    marginBottom: 2,
  },
  returnConfirmSub: {
    color: '#E2E8F0',
    fontSize: 11,
    marginBottom: Spacing.sm,
  },
  reasonLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: FontWeights.black,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  reasonsList: {
    gap: 4,
    marginBottom: Spacing.md,
  },
  reasonChip: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: Radii.xs,
    backgroundColor: '#181C2E',
    borderWidth: 1,
    borderColor: '#334155',
  },
  reasonChipActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  reasonText: {
    color: '#CBD5E1',
    fontSize: 11,
  },
  reasonTextActive: {
    color: '#FFFFFF',
    fontWeight: FontWeights.black,
  },
  confirmActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelReturnBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.sm,
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  cancelReturnBtnText: {
    color: '#94A3B8',
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  executeReturnBtn: {
    flex: 2,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.sm,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  executeReturnBtnText: {
    color: '#FFFFFF',
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.black,
  },
  detailFooter: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  returnActionBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnActionBtnText: {
    color: '#F87171',
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.black,
  },
  printSlipBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printSlipBtnText: {
    color: Colors.bg,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.black,
  },
  shiftZCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: Radii.sm,
    paddingVertical: Spacing.xs + 1,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4338CA',
  },
  shiftZIcon: {
    fontSize: 14,
  },
  shiftZLabel: {
    color: '#A5B4FC',
    fontSize: 9,
    fontWeight: FontWeights.black,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  zReportModalContent: {
    width: '92%',
    maxWidth: 620,
    maxHeight: '90%',
    backgroundColor: '#0F172A',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    paddingBottom: Spacing.md,
  },
  shiftClosedBanner: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: Colors.emerald,
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  shiftClosedTitle: {
    color: Colors.emerald,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.black,
    letterSpacing: 0.5,
  },
  shiftClosedSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  zReportSection: {
    backgroundColor: '#1E293B',
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  zSectionTitle: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: FontWeights.black,
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  floatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  floatCurrency: {
    color: Colors.gold,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.black,
  },
  floatInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: Radii.sm,
    color: '#FFFFFF',
    fontSize: FontSizes.body,
    fontWeight: FontWeights.bold,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    width: 120,
  },
  floatNote: {
    color: '#94A3B8',
    fontSize: 11,
    marginLeft: 4,
    flex: 1,
  },
  tenderBreakdownGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  tenderBreakdownCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tenderCardIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  tenderCardVal: {
    color: Colors.gold,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.black,
  },
  tenderCardLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: FontWeights.bold,
    marginTop: 2,
  },
  zFinRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  zFinLabel: {
    color: '#94A3B8',
    fontSize: 11,
  },
  zFinVal: {
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: FontWeights.bold,
  },
  zFinTotalLabel: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: FontWeights.black,
  },
  zFinTotalVal: {
    color: Colors.gold,
    fontSize: 13,
    fontWeight: FontWeights.black,
  },
  tillReconcileBox: {
    backgroundColor: '#0F172A',
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tillCalcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  tillCalcLabel: {
    color: '#94A3B8',
    fontSize: 11,
  },
  tillCalcVal: {
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: FontWeights.bold,
  },
  tillCalcTotal: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 6,
    marginTop: 4,
  },
  tillExpectedLabel: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: FontWeights.black,
  },
  tillExpectedVal: {
    color: Colors.gold,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.black,
  },
  actualCountWrap: {
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  actualCountLabel: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: FontWeights.black,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  countInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  countInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radii.sm,
    color: '#FFFFFF',
    fontSize: FontSizes.body,
    fontWeight: FontWeights.bold,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  varianceBanner: {
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    borderWidth: 1,
  },
  varianceBannerExact: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: Colors.emerald,
  },
  varianceBannerOver: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: '#F59E0B',
  },
  varianceBannerShort: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  varianceTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: FontWeights.black,
  },
  varianceSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  lockShiftBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockShiftBtnText: {
    color: '#FFFFFF',
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.black,
    letterSpacing: 0.5,
  },
});
