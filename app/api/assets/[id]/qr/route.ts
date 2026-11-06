import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rls-guard';
import { dbAssets } from '@/lib/db/db';
import { generatePrintableAssetLabel } from '@/lib/pdf/label';

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
  const format = searchParams.get('format'); // 'pdf' or json

  if (format === 'pdf') {
    const origin = req.nextUrl.origin || 'http://localhost:3000';
    const pdfDoc = await generatePrintableAssetLabel(asset, origin);
    const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="AssetTag-${asset.id}.pdf"`,
      },
    });
  }

  // Return QR metadata
  return NextResponse.json({
    assetId: asset.id,
    qrCodeId: asset.qr_code_id,
    scanUrl: `${req.nextUrl.origin}/assets/${asset.id}?qr=1`,
    name: asset.name,
    brand: asset.brand,
    model: asset.model,
  });
}
