import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rls-guard';
import { dbWarranties, dbAssets, dbAuditLogs } from '@/lib/db/db';
import { Warranty } from '@/lib/db/schema';

export async function GET(req: NextRequest) {
  const guard = requireAuth(req);
  if (!guard.allowed || !guard.user) return guard.response!;

  const { searchParams } = new URL(req.url);
  const assetId = searchParams.get('assetId') || undefined;
  const status = searchParams.get('status') || undefined;

  let warranties = dbWarranties.getAll(assetId);

  // Non-admins see only warranties for their assets
  if (guard.user.role !== 'admin') {
    const userAssetIds = dbAssets.getAll({ userId: guard.user.userId }).map((a) => a.id);
    warranties = warranties.filter((w) => userAssetIds.includes(w.asset_id));
  }

  if (status) {
    warranties = warranties.filter((w) => w.claim_status === status);
  }

  // Enrich with asset name and brand
  const assets = dbAssets.getAll();
  const enriched = warranties.map((w) => {
    const asset = assets.find((a) => a.id === w.asset_id);
    return {
      ...w,
      asset_name: asset?.name || 'Asset',
      asset_brand: asset?.brand || '',
      asset_model: asset?.model || '',
    };
  });

  return NextResponse.json({ warranties: enriched });
}

export async function POST(req: NextRequest) {
  const guard = requireAuth(req);
  if (!guard.allowed || !guard.user) return guard.response!;

  try {
    const body = await req.json();

    if (!body.asset_id || !body.component || !body.start_date || !body.duration_months || !body.provider) {
      return NextResponse.json(
        { error: 'Asset, Component, Start Date, Duration, and Provider are required.' },
        { status: 400 }
      );
    }

    const startDate = new Date(body.start_date);
    const durMonths = Number(body.duration_months) || 12;
    startDate.setMonth(startDate.getMonth() + durMonths);
    const expiryDate = body.expiry_date || startDate.toISOString().split('T')[0];

    const newWarranty: Warranty = {
      id: `war-${Date.now()}`,
      asset_id: body.asset_id,
      service_record_id: body.service_record_id || undefined,
      document_id: body.document_id || undefined,
      component: body.component.trim(),
      warranty_type: body.warranty_type || 'manufacturer',
      start_date: body.start_date,
      duration_months: durMonths,
      expiry_date: expiryDate,
      provider: body.provider.trim(),
      conditions: body.conditions || '',
      claim_status: 'active',
      notes: body.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbWarranties.create(newWarranty);

    dbAuditLogs.create({
      id: `audit-${Date.now()}`,
      user_id: guard.user.userId,
      username: guard.user.username,
      action: 'WARRANTY_CREATED',
      entity_type: 'warranty',
      entity_id: newWarranty.id,
      details: { component: newWarranty.component, provider: newWarranty.provider },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, warranty: newWarranty }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create warranty.' },
      { status: 500 }
    );
  }
}
