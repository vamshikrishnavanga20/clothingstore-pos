import { NextResponse } from 'next/server';
import { getAnalytics } from '../../../lib/db';
import { BranchId, AnalyticsReportRange, Order } from '../../../lib/types';
import { isDynamoConfigured, scanAllBillingOrdersFromDynamo } from '../../../lib/dynamodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = (searchParams.get('branchId') as BranchId) || undefined;
    const range = (searchParams.get('range') as AnalyticsReportRange) || '7d';
    const startDate = searchParams.get('startDate') || searchParams.get('date') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    let dynamoOrders: Order[] | undefined = undefined;
    if (isDynamoConfigured) {
      try {
        const scanned = await scanAllBillingOrdersFromDynamo();
        if (scanned && scanned.length > 0) {
          dynamoOrders = scanned;
        }
      } catch (err) {
        console.warn('Could not scan DynamoDB orders for analytics:', err);
      }
    }

    const analytics = getAnalytics(branchId, range, startDate, endDate, dynamoOrders);
    return NextResponse.json(analytics, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to compute analytics' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
