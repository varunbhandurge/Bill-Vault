import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/rls-guard';
import { dbStats, dbAuditLogs, dbOCRRecords, dbDocuments } from '@/lib/db/db';

export async function GET(req: NextRequest) {
  const adminGuard = requireAdmin(req);
  if (!adminGuard.allowed || !adminGuard.user) return adminGuard.response!;

  const stats = dbStats.getSystemStats();
  const auditLogs = dbAuditLogs.getAll().slice(0, 100); // Last 100 logs
  const failedOCRRecords = dbOCRRecords.getAll().filter((r) => r.status === 'failed');
  const documents = dbDocuments.getAll();

  // Storage usage details
  const storageBreakdown = {
    totalBytes: stats.storageBytesUsed,
    totalFiles: stats.totalDocuments,
    formattedSize: (stats.storageBytesUsed / (1024 * 1024)).toFixed(2) + ' MB',
    byType: {
      pdf: documents.filter((d) => d.mime_type.includes('pdf')).length,
      image: documents.filter((d) => d.mime_type.startsWith('image/')).length,
      other: documents.filter((d) => !d.mime_type.includes('pdf') && !d.mime_type.startsWith('image/')).length,
    },
  };

  return NextResponse.json({
    stats,
    storageBreakdown,
    failedOCRRecords,
    auditLogs,
  });
}
