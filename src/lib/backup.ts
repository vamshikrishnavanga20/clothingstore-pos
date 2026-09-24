import { getDatabase, getOrders, getAnalytics } from './db';
import { scanAllBillingOrdersFromDynamo, isDynamoConfigured } from './dynamodb';
import { uploadBackupToStorage } from './s3';
import { Order, AnalyticsSummary } from './types';

export interface BackupExecutionResult {
  timestamp: string;
  yearWeek: string;
  totalBillsBackedUp: number;
  totalRevenue: number;
  grossProfit: number;
  files: Array<{
    type: 'customer_bills' | 'weekly_analytics_report' | 'full_database_snapshot';
    filename: string;
    location: string;
    provider: 'aws-s3' | 'local';
  }>;
}

/**
 * Calculates current ISO year and week number (e.g. "2026-W38")
 */
function getIsoYearWeek(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Executes a comprehensive weekly backup to AWS S3:
 * 1. Customer Bills & Transaction Logs
 * 2. Weekly Executive Analytics Report (Revenue, Profit, Branch Performance)
 * 3. Complete Store Database Snapshot
 */
export async function executeWeeklyS3Backup(): Promise<BackupExecutionResult> {
  const now = new Date();
  const yearWeek = getIsoYearWeek(now);
  const dateStr = now.toISOString().split('T')[0];
  const subFolder = `weekly-backups/${yearWeek}`;

  // 1. Gather all customer bills (prefer DynamoDB if active, fallback to local DB)
  let allOrders: Order[] = [];
  if (isDynamoConfigured) {
    const dynamoOrders = await scanAllBillingOrdersFromDynamo();
    if (dynamoOrders && dynamoOrders.length > 0) {
      allOrders = dynamoOrders;
    }
  }

  if (allOrders.length === 0) {
    allOrders = getOrders();
  }

  // 2. Generate Weekly Financial & Retail Analytics Report
  const analytics: AnalyticsSummary = getAnalytics(undefined, '7d');

  // Deep financial calculation for the backup archive
  const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalCost = allOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
  const grossProfit = allOrders.reduce((sum, o) => sum + (o.grossProfit || 0), 0);

  const paymentBreakdown = {
    Cash: allOrders.filter((o) => o.paymentMethod === 'Cash').length,
    UPI: allOrders.filter((o) => o.paymentMethod === 'UPI').length,
    Card: allOrders.filter((o) => o.paymentMethod === 'Card').length,
  };

  const branchBreakdown: Record<string, { revenue: number; ordersCount: number }> = {};
  for (const order of allOrders) {
    if (!branchBreakdown[order.branchId]) {
      branchBreakdown[order.branchId] = { revenue: 0, ordersCount: 0 };
    }
    branchBreakdown[order.branchId].revenue += order.total;
    branchBreakdown[order.branchId].ordersCount += 1;
  }

  const weeklyAnalyticsReport = {
    reportTitle: 'Roman Island Apparel - Weekly Executive Analytics Report',
    period: yearWeek,
    generatedAt: now.toISOString(),
    metrics: {
      totalBillsProcessed: allOrders.length,
      totalRevenue,
      totalCost,
      grossProfit,
      grossProfitMarginPct: totalRevenue > 0 ? Number(((grossProfit / totalRevenue) * 100).toFixed(2)) : 0,
      averageOrderValue: allOrders.length > 0 ? Number((totalRevenue / allOrders.length).toFixed(2)) : 0,
      paymentMethodDistribution: paymentBreakdown,
      branchBreakdown,
    },
    topPerformers: analytics.topSellingItems || [],
    dailyTrend: analytics.trends || [],
  };

  // 3. Backup Payload 1: Customer Bills Archive
  const billsPayload = JSON.stringify(
    {
      exportType: 'Customer_Bills_Weekly_Archive',
      backupWeek: yearWeek,
      exportedAt: now.toISOString(),
      billCount: allOrders.length,
      orders: allOrders,
    },
    null,
    2
  );

  const billsFilename = `customer_bills_${dateStr}.json`;
  const billsResult = await uploadBackupToStorage(billsPayload, billsFilename, subFolder);

  // 4. Backup Payload 2: Weekly Analytics Report
  const analyticsPayload = JSON.stringify(weeklyAnalyticsReport, null, 2);
  const analyticsFilename = `weekly_analytics_report_${dateStr}.json`;
  const analyticsResult = await uploadBackupToStorage(analyticsPayload, analyticsFilename, subFolder);

  // 5. Backup Payload 3: Full System Database Snapshot
  const fullDb = getDatabase();
  const fullDbPayload = JSON.stringify(
    {
      snapshotType: 'Full_Store_Data_Snapshot',
      backupWeek: yearWeek,
      timestamp: now.toISOString(),
      data: fullDb,
    },
    null,
    2
  );
  const snapshotFilename = `store_data_full_snapshot_${dateStr}.json`;
  const snapshotResult = await uploadBackupToStorage(fullDbPayload, snapshotFilename, subFolder);

  return {
    timestamp: now.toISOString(),
    yearWeek,
    totalBillsBackedUp: allOrders.length,
    totalRevenue,
    grossProfit,
    files: [
      {
        type: 'customer_bills',
        filename: billsFilename,
        location: billsResult.location,
        provider: billsResult.provider,
      },
      {
        type: 'weekly_analytics_report',
        filename: analyticsFilename,
        location: analyticsResult.location,
        provider: analyticsResult.provider,
      },
      {
        type: 'full_database_snapshot',
        filename: snapshotFilename,
        location: snapshotResult.location,
        provider: snapshotResult.provider,
      },
    ],
  };
}
