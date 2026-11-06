import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rls-guard';
import { dbStats, dbServiceRecords } from '@/lib/db/db';
import { exportServiceRecordsCSV } from '@/lib/pdf/generator';

export async function GET(req: NextRequest) {
  const guard = requireAuth(req);
  if (!guard.allowed || !guard.user) return guard.response!;

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format');

  if (format === 'csv') {
    const records = dbServiceRecords.getAll();
    const csv = exportServiceRecordsCSV(records);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="AssetCare_Expenses_Full.csv"',
      },
    });
  }

  const stats = dbStats.getSystemStats();
  const analytics = dbStats.getExpenseAnalytics();

  return NextResponse.json({
    stats,
    ...analytics,
  });
}
