import React, { useContext, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { PosContext } from '../context/PosContext';
import Header from '../components/Header';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '../constants/theme';
import { hapticTap } from '../utils/haptics';

import { DEFAULT_API_URL } from '../services/api';

const getCategoryIcon = (cat: string = '') => {
  const c = (cat || '').toLowerCase();
  if (c.includes('check') || c.includes('shirt') || c.includes('formal')) return '👔';
  if (c.includes('denim') || c.includes('pant') || c.includes('trouser')) return '👖';
  if (c.includes('sneaker') || c.includes('shoe') || c.includes('foot')) return '👟';
  if (c.includes('jacket') || c.includes('hood') || c.includes('vest')) return '🧥';
  if (c.includes('ethnic') || c.includes('kurta')) return '🥻';
  return '👕';
};

export default function StockScreen() {
  const { lockTerminal, staffName, userRole, activeBranchId } = useContext(AuthContext);
  const { products, branches, isOffline, refreshing, onRefresh } = useContext(PosContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in' | 'low' | 'out'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isAdmin = userRole === 'admin';
  const visibleBranches = useMemo(() => {
    if (isAdmin) return branches || [];
    return (branches || []).filter((b: any) => b.id === activeBranchId);
  }, [branches, isAdmin, activeBranchId]);

  // Real-time stock health metrics
  const stockSummary = useMemo(() => {
    let totalUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    (products || []).forEach((p: any) => {
      let bTotal = 0;
      if (isAdmin) {
        if (p.inventory) {
          Object.values(p.inventory).forEach((bStock: any) => {
            if (bStock) Object.values(bStock).forEach((cnt: any) => { bTotal += Number(cnt) || 0; });
          });
        }
      } else {
        const bStock = p.inventory?.[activeBranchId] || {};
        Object.values(bStock).forEach((cnt: any) => { bTotal += Number(cnt) || 0; });
      }

      totalUnits += bTotal;
      if (bTotal === 0) outOfStockCount++;
      else if (bTotal <= 3) lowStockCount++;
    });

    return { totalUnits, lowStockCount, outOfStockCount, totalSkus: (products || []).length };
  }, [products, isAdmin, activeBranchId]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (products || []).forEach((p: any) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return (products || []).filter((p: any) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q);

      let bTotal = 0;
      if (isAdmin) {
        if (p.inventory) {
          Object.values(p.inventory).forEach((bStock: any) => {
            if (bStock) Object.values(bStock).forEach((cnt: any) => { bTotal += Number(cnt) || 0; });
          });
        }
      } else {
        const bStock = p.inventory?.[activeBranchId] || {};
        Object.values(bStock).forEach((cnt: any) => { bTotal += Number(cnt) || 0; });
      }

      const matchStatus =
        stockStatusFilter === 'all' ||
        (stockStatusFilter === 'in' && bTotal > 3) ||
        (stockStatusFilter === 'low' && bTotal > 0 && bTotal <= 3) ||
        (stockStatusFilter === 'out' && bTotal <= 0);

      return matchCat && matchSearch && matchStatus;
    });
  }, [products, selectedCategory, searchQuery, stockStatusFilter, isAdmin, activeBranchId]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header
        subtitle={isAdmin ? 'Live Stock Matrix • All Stores' : `Live Stock Matrix • ${staffName}`}
        isOffline={isOffline}
        onLock={lockTerminal}
      />

      {/* Real-time Health KPI Strip */}
      <View style={styles.kpiStrip}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiNumberGold}>{stockSummary.totalUnits}</Text>
          <Text style={styles.kpiLabel}>TOTAL GARMENTS</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiNumber, { color: Colors.orange }]}>{stockSummary.lowStockCount}</Text>
          <Text style={styles.kpiLabel}>LOW STOCK (≤3)</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiNumber, { color: Colors.red }]}>{stockSummary.outOfStockCount}</Text>
          <Text style={styles.kpiLabel}>DEPLETED (0)</Text>
        </View>
      </View>

      {/* Search & Filters */}
      <View style={styles.filterWrap}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search garment or SKU (e.g. CHK-01)..."
            placeholderTextColor={Colors.textDim}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {filteredProducts.length > 0 && (
            <View style={styles.skuBadge}>
              <Text style={styles.skuBadgeText}>{filteredProducts.length} SKUs</Text>
            </View>
          )}
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn} delayPressIn={0}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stock Status Filter Tabs */}
        <View style={styles.statusTabRow}>
          {[
            { id: 'all', label: 'All Garments' },
            { id: 'in', label: 'In Stock' },
            { id: 'low', label: '⚡ Low Stock' },
            { id: 'out', label: 'Depleted' },
          ].map((st) => {
            const active = stockStatusFilter === st.id;
            return (
              <TouchableOpacity
                key={st.id}
                style={[styles.statusTab, active && styles.statusTabActive]}
                onPress={() => {
                  hapticTap();
                  setStockStatusFilter(st.id as any);
                }}
                delayPressIn={0}
                activeOpacity={0.7}
              >
                <Text style={[styles.statusTabText, active && styles.statusTabTextActive]}>
                  {st.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Category Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, active && styles.catChipActive]}
                onPress={() => {
                  hapticTap();
                  setSelectedCategory(cat);
                }}
                delayPressIn={0}
                activeOpacity={0.7}
              >
                <Text style={[styles.catText, active && styles.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Products Stock List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
          />
        }
        renderItem={({ item }) => {
          const isExpanded = expandedId === item.id;

          // Extract sizes
          const sizes: string[] =
            item.sizes && Array.isArray(item.sizes) && item.sizes.length > 0
              ? item.sizes
              : ['S', 'M', 'L', 'XL', 'XXL'];

          // Total stock across all branches vs active branch
          let allBranchesTotal = 0;
          if (item.inventory) {
            Object.values(item.inventory).forEach((bStock: any) => {
              if (bStock) {
                Object.values(bStock).forEach((cnt: any) => {
                  allBranchesTotal += Number(cnt) || 0;
                });
              }
            });
          }

          const myBranchMap = (item.inventory && (item.inventory as any)[activeBranchId]) || {};
          const myBranchTotal = sizes.reduce((sum, sz) => sum + (Number(myBranchMap[sz]) || 0), 0);
          const displayTotal = isAdmin ? allBranchesTotal : myBranchTotal;

          const rawImg = item.image?.trim();
          const resolvedUri = rawImg
            ? rawImg.startsWith('http')
              ? rawImg
              : `${DEFAULT_API_URL}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`
            : null;

          return (
            <View style={styles.stockCard}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => {
                  hapticTap();
                  setExpandedId(isExpanded ? null : item.id);
                }}
                activeOpacity={0.8}
              >
                {resolvedUri ? (
                  <Image source={{ uri: resolvedUri }} style={styles.thumbnail} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                    <Text style={{ fontSize: 16 }}>{getCategoryIcon(item.category)}</Text>
                  </View>
                )}

                <View style={styles.headerMeta}>
                  <Text style={styles.categoryBadge}>{item.category?.toUpperCase() || 'APPAREL'}</Text>
                  <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.skuText}>SKU: {item.sku || 'N/A'}</Text>
                </View>

                <View style={styles.headerRight}>
                  <View
                    style={[
                      styles.totalPill,
                      displayTotal <= 0
                        ? styles.totalPillOut
                        : displayTotal <= 3
                        ? styles.totalPillLow
                        : styles.totalPillIn,
                    ]}
                  >
                    <Text
                      style={[
                        styles.totalPillText,
                        displayTotal <= 0
                          ? styles.totalTextOut
                          : displayTotal <= 3
                          ? styles.totalTextLow
                          : styles.totalTextIn,
                      ]}
                    >
                      {displayTotal <= 0 ? 'Depleted' : displayTotal <= 3 ? `⚡ Only ${displayTotal} left` : `${displayTotal} in stock`}
                    </Text>
                  </View>
                  <Text style={styles.expandHint}>{isExpanded ? '▲ Hide' : '▼ View Sizes'}</Text>
                </View>
              </TouchableOpacity>

              {/* Expanded Branch vs Size Matrix */}
              {isExpanded && (
                <View style={styles.matrixArea}>
                  <Text style={styles.matrixTitle}>
                    {isAdmin ? 'ALL STORE INVENTORY BREAKDOWN BY SIZE:' : 'YOUR BRANCH INVENTORY BREAKDOWN BY SIZE:'}
                  </Text>
                  {visibleBranches.map((branch: any) => {
                    const branchMap = item.inventory?.[branch.id] || {};
                    const bTotal = sizes.reduce((sum, sz) => sum + (Number(branchMap[sz]) || 0), 0);

                    return (
                      <View key={branch.id} style={styles.branchBox}>
                        <View style={styles.branchHeaderRow}>
                          <Text style={styles.branchName}>{branch.name}</Text>
                          <Text style={[styles.branchTotal, bTotal > 0 ? styles.branchTotalIn : styles.branchTotalOut]}>
                            {bTotal} units
                          </Text>
                        </View>

                        <View style={styles.sizePillsRow}>
                          {sizes.map((sz) => {
                            const count = Number(branchMap[sz]) || 0;
                            const isOut = count <= 0;
                            const isLow = count > 0 && count <= 3;

                            return (
                              <View
                                key={sz}
                                style={[
                                  styles.sizePill,
                                  isOut && styles.sizePillOut,
                                  isLow && styles.sizePillLow,
                                ]}
                              >
                                <Text style={styles.sizePillLabel}>{sz}</Text>
                                <Text
                                  style={[
                                    styles.sizePillCount,
                                    isOut && styles.countOut,
                                    isLow && styles.countLow,
                                  ]}
                                >
                                  {count}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  kpiStrip: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.sm,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  kpiNumberGold: {
    color: Colors.gold,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.black,
  },
  kpiNumber: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.black,
  },
  kpiLabel: {
    color: Colors.textDim,
    fontSize: 8.5,
    fontWeight: FontWeights.extrabold,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  filterWrap: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  statusTabRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: Radii.xs,
    backgroundColor: Colors.bgInput,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusTabActive: {
    backgroundColor: Colors.goldDim,
    borderColor: Colors.gold,
  },
  statusTabText: {
    color: Colors.textMuted,
    fontSize: 9.5,
    fontWeight: FontWeights.bold,
  },
  statusTabTextActive: {
    color: Colors.gold,
    fontWeight: FontWeights.black,
  },
  skuBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.xs,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginRight: 6,
  },
  skuBadgeText: {
    color: Colors.gold,
    fontSize: 9,
    fontWeight: FontWeights.bold,
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
  catScroll: {
    maxHeight: 36,
  },
  catChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radii.full,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  catChipActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  catText: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  catTextActive: {
    color: Colors.bg,
    fontWeight: FontWeights.black,
  },
  listContent: {
    padding: Spacing.xl,
    gap: Spacing.md,
    paddingBottom: 90,
  },
  stockCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: Radii.sm,
  },
  thumbnailPlaceholder: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMeta: {
    flex: 1,
  },
  categoryBadge: {
    color: Colors.emerald,
    fontSize: FontSizes.xs - 1,
    fontWeight: FontWeights.extrabold,
  },
  productName: {
    color: Colors.textPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.bold,
    marginTop: 1,
  },
  skuText: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  totalPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: Radii.xs,
  },
  totalPillIn: {
    backgroundColor: Colors.greenDim,
  },
  totalPillLow: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  totalPillOut: {
    backgroundColor: Colors.redDim,
  },
  totalPillText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.extrabold,
  },
  totalTextIn: {
    color: Colors.green,
  },
  totalTextLow: {
    color: Colors.orange,
  },
  totalTextOut: {
    color: Colors.red,
  },
  expandHint: {
    color: Colors.gold,
    fontSize: FontSizes.xs - 1,
    fontWeight: FontWeights.bold,
  },
  matrixArea: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    padding: Spacing.md,
    backgroundColor: 'rgba(17,17,19,0.7)',
  },
  matrixTitle: {
    color: Colors.textDim,
    fontSize: FontSizes.xs - 1,
    fontWeight: FontWeights.extrabold,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  branchBox: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  branchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  branchName: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  branchTotal: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.extrabold,
  },
  branchTotalIn: {
    color: Colors.emerald,
  },
  branchTotalOut: {
    color: Colors.red,
  },
  sizePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sizePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sizePillOut: {
    borderColor: Colors.redBorder,
    backgroundColor: Colors.redDim,
  },
  sizePillLow: {
    borderColor: Colors.orangeBorder,
  },
  sizePillLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  sizePillCount: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.black,
  },
  countOut: {
    color: Colors.red,
  },
  countLow: {
    color: Colors.orange,
  },
});
