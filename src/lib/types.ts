export type BranchId = string;

export interface Branch {
  id: string;
  name: string;
  code: string;
  city?: string;
  location: string;
  phone: string;
  managerName?: string;
  status: 'Active' | 'Maintenance';
}

export type SizeInventory = Record<string, number>;

export type BranchInventory = Record<string, SizeInventory>;

export interface SizeMeasurementRow {
  size: string;
  chest?: string;
  length?: string;
  shoulder?: string;
  sleeve?: string;
  waist?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  costPrice: number; // For Gross Profit calculation
  sellingPrice: number;
  tag?: 'Bestseller' | 'New' | 'Trending' | 'Limited' | '';
  image: string;
  sizes?: string[]; // e.g. ['7', '8', '9', '10', '11'] or ['S', 'M', 'L', 'XL']
  fabric?: string;
  care?: string;
  hasSizeChart?: boolean;
  sizeChartMeasurements?: SizeMeasurementRow[];
  sizePrices?: Record<string, { sellingPrice: number; costPrice?: number }>;
  hasVariablePricing?: boolean;
  inventory: BranchInventory;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  description?: string;
  itemCount?: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  category: string;
  image: string;
  size: string; // e.g. '10' or 'XL'
  quantity: number;
  unitCostPrice: number;
  unitSellingPrice: number;
  subtotal: number;
  grossProfit: number;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Card';

export type CustomerTier = 'Silver' | 'Gold' | 'Black Elite';

export interface CustomerProfile {
  id: string;
  phone: string;
  name: string;
  tier: CustomerTier;
  loyaltyPoints: number; // 1 point = ₹1
  totalSpend: number;
  ordersCount: number;
  createdAt: string;
  lastVisit: string;
}

export interface InvoiceNotification {
  channel: 'whatsapp' | 'sms';
  provider: 'meta_cloud_api' | 'twilio' | 'simulated';
  recipient: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'failed' | 'simulated';
  messageId?: string;
  pdfInvoiceUrl?: string;
  error?: string;
}

export interface Order {
  id: string;
  billingId: string; // e.g. "BILL-B1-2026-0042"
  branchId: string;
  branchName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number; // 5% GST
  total: number;
  totalCost: number;
  grossProfit: number;
  paymentMethod: PaymentMethod;
  customerName: string;
  customerPhone: string;
  pointsEarned?: number;
  pointsRedeemed?: number;
  customerTier?: CustomerTier;
  notifications?: InvoiceNotification[];
  upiTransactionRef?: string;
  source: 'web-pos' | 'mobile-expo';
  cashierName: string;
  status: 'Completed' | 'Refunded' | 'Cancelled';
  refundedAt?: string;
  returnReason?: string;
  refundAmount?: number;
  notes?: string;
  createdAt: string;
}

export interface SalesDayTrend {
  date: string;
  revenue: number;
  cost: number;
  grossProfit: number;
  ordersCount: number;
  branchBreakdown: Record<string, number>;
}

export interface TopSellingItem {
  productId: string;
  name: string;
  category: string;
  image: string;
  unitsSold: number;
  totalRevenue: number;
  totalProfit: number;
  sharePct: number;
}

export interface BranchSummary {
  branchId: string;
  branchName: string;
  revenue: number;
  orders: number;
  grossProfit: number;
}

export type AnalyticsReportRange = 'today' | '7d' | '30d' | 'custom';

export interface ItemSalesPerformance {
  productId: string;
  name: string;
  sku?: string;
  category: string;
  image: string;
  sellingPrice: number;
  costPrice: number;
  unitsSold: number;
  totalRevenue: number;
  totalProfit: number;
  currentStock: number;
  sharePct: number;
  sizesSold?: Record<string, number>;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPct: number;
  totalOrders: number;
  averageOrderValue: number;
  branchSummaries: BranchSummary[];
  trends: SalesDayTrend[];
  topSellingItems: TopSellingItem[];
  allItemSales?: ItemSalesPerformance[];
  reportRange?: AnalyticsReportRange;
  startDate?: string;
  endDate?: string;
}

export type ThemeMode = 'dark' | 'light';
export type ThemePalette =
  | 'obsidian-gold'
  | 'midnight-sapphire'
  | 'emerald-reserve'
  | 'royal-amethyst';

export interface UserSession {
  username: string;
  name: string;
  role: 'superadmin' | 'branch_manager' | 'cashier';
  branchId?: string;
  token?: string;
}

export function getProductSizes(product: Product): string[] {
  if (product.sizes && product.sizes.length > 0) {
    return product.sizes;
  }
  const sizeSet = new Set<string>();
  if (product.inventory) {
    Object.values(product.inventory).forEach((branchStock) => {
      if (branchStock && typeof branchStock === 'object') {
        Object.keys(branchStock).forEach((sz) => sizeSet.add(sz));
      }
    });
  }
  if (sizeSet.size > 0) {
    return Array.from(sizeSet);
  }
  return ['S', 'M', 'L', 'XL', 'XXL'];
}

export function getProductPriceForSize(
  product: Product,
  size?: string
): { sellingPrice: number; costPrice: number } {
  if (size && product.sizePrices && product.sizePrices[size]) {
    const sp = product.sizePrices[size];
    const sellingPrice =
      typeof sp === 'number'
        ? sp
        : typeof sp.sellingPrice === 'number'
        ? sp.sellingPrice
        : product.sellingPrice;
    const costPrice =
      typeof sp === 'object' && typeof sp.costPrice === 'number'
        ? sp.costPrice
        : product.costPrice;
    return { sellingPrice, costPrice };
  }
  return { sellingPrice: product.sellingPrice, costPrice: product.costPrice };
}


