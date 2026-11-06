import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rls-guard';
import { dbDocuments, dbAssets } from '@/lib/db/db';

export async function GET(req: NextRequest) {
  const guard = requireAuth(req);
  if (!guard.allowed || !guard.user) return guard.response!;

  const { searchParams } = new URL(req.url);
  const assetId = searchParams.get('assetId') || undefined;

  let documents = dbDocuments.getAll(assetId);

  // If user is regular user, only show documents for assets they own
  if (guard.user.role !== 'admin') {
    const userAssets = dbAssets.getAll({ userId: guard.user.userId }).map((a) => a.id);
    documents = documents.filter((d) => userAssets.includes(d.asset_id));
  }

  // Enrich with asset name
  const assets = dbAssets.getAll();
  const enriched = documents.map((doc) => {
    const asset = assets.find((a) => a.id === doc.asset_id);
    return {
      ...doc,
      asset_name: asset?.name || 'Asset',
      asset_brand: asset?.brand || '',
      asset_model: asset?.model || '',
    };
  });

  return NextResponse.json({ documents: enriched });
}
