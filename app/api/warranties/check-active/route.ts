import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rls-guard';
import { checkActiveWarrantyForRepair } from '@/lib/ocr/matcher';

export async function GET(req: NextRequest) {
  const guard = requireAuth(req);
  if (!guard.allowed || !guard.user) return guard.response!;

  const { searchParams } = new URL(req.url);
  const assetId = searchParams.get('assetId');
  const component = searchParams.get('component');

  if (!assetId || !component) {
    return NextResponse.json(
      { error: 'Asset ID and Component are required.' },
      { status: 400 }
    );
  }

  const result = checkActiveWarrantyForRepair(assetId, component);
  return NextResponse.json(result);
}
