import { NextResponse } from 'next/server';
import { executeWeeklyS3Backup } from '@/lib/backup';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Optional secret key verification for automated cron/EventBridge callers
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('authorization');
    const secretKey = process.env.BACKUP_CRON_SECRET;

    if (secretKey && (!authHeader || !authHeader.includes(secretKey))) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized backup trigger' },
        { status: 401 }
      );
    }

    const backupResult = await executeWeeklyS3Backup();

    return NextResponse.json({
      success: true,
      message: 'Weekly S3 backup executed successfully',
      backupResult,
    });
  } catch (error: any) {
    console.error('Weekly S3 backup execution error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to complete weekly backup' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Ready',
    schedule: 'Every Sunday 00:00 UTC',
    cronExpression: '0 0 ? * SUN *',
    targetBucket: process.env.AWS_S3_BACKUP_BUCKET || 'roman-island-db-backups',
    backupContents: [
      'Customer Bills & POS Orders (JSON)',
      'Executive Weekly Financial Analytics Report (JSON)',
      'Complete Multi-Branch Database Snapshot (JSON)',
    ],
  });
}
