import { NextResponse } from 'next/server';
import { getAnalytics } from '../../../lib/db';
import { BranchId, AnalyticsReportRange } from '../../../lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = (searchParams.get('branchId') as BranchId) || undefined;
    const range = (searchParams.get('range') as AnalyticsReportRange) || '7d';
    const startDate = searchParams.get('startDate') || searchParams.get('date') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const analytics = getAnalytics(branchId, range, startDate, endDate);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to compute analytics' },
      { status: 500 }
    );
  }
}
