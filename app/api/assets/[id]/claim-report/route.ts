import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rls-guard';
import { dbAssets, dbServiceRecords, dbWarranties } from '@/lib/db/db';
import { generateWarrantyClaimPDF, generateAssetExpenseReportPDF, exportServiceRecordsCSV } from '@/lib/pdf/generator';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = requireAuth(req);
  if (!guard.allowed || !guard.user) return guard.response!;

  const asset = dbAssets.getById(params.id);
  if (!asset) {
    return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'claim'; // 'claim' | 'expense' | 'csv'
  const warrantyId = searchParams.get('warrantyId');

  const serviceRecords = dbServiceRecords.getAll({ assetId: asset.id });

  if (type === 'csv') {
    const csvContent = exportServiceRecordsCSV(serviceRecords);
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="ServiceHistory-${asset.id}.csv"`,
      },
    });
  }

  if (type === 'expense') {
    const pdf = generateAssetExpenseReportPDF(asset, serviceRecords);
    const buffer = Buffer.from(pdf.output('arraybuffer'));
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ExpenseReport-${asset.id}.pdf"`,
      },
    });
  }

  // Default: Warranty Claim Dossier
  const warranties = dbWarranties.getAll(asset.id);
  const targetWarranty = warrantyId
    ? warranties.find((w) => w.id === warrantyId)
    : warranties[0];

  if (!targetWarranty) {
    return NextResponse.json(
      { error: 'No warranty record found for this asset to generate claim dossier.' },
      { status: 404 }
    );
  }

  const pdf = generateWarrantyClaimPDF(asset, targetWarranty, serviceRecords);
  const buffer = Buffer.from(pdf.output('arraybuffer'));

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="WarrantyClaim-${asset.id}.pdf"`,
    },
  });
}
