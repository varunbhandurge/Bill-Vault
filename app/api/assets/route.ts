import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rls-guard';
import { dbAssets, dbCategories, dbAuditLogs } from '@/lib/db/db';
import { Asset } from '@/lib/db/schema';

export async function GET(req: NextRequest) {
  const guard = requireAuth(req);
  if (!guard.allowed || !guard.user) return guard.response!;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || undefined;
  const categoryId = searchParams.get('categoryId') || undefined;

  // If regular user, restrict to their own userId unless admin
  const userId = guard.user.role === 'admin' ? undefined : guard.user.userId;

  const assets = dbAssets.getAll({ userId, categoryId, search });

  // Enrich with category name
  const categories = dbCategories.getAll();
  const enriched = assets.map((a) => {
    const cat = categories.find((c) => c.id === a.category_id);
    return {
      ...a,
      category_name: cat?.name || a.category_name || 'Appliance',
      category_section: cat?.section || a.category_section || 'Household',
    };
  });

  return NextResponse.json({ assets: enriched });
}

export async function POST(req: NextRequest) {
  const guard = requireAuth(req);
  if (!guard.allowed || !guard.user) return guard.response!;

  try {
    const body = await req.json();

    if (!body.name || !body.category_id || !body.brand || !body.model) {
      return NextResponse.json(
        { error: 'Name, Category, Brand, and Model are required.' },
        { status: 400 }
      );
    }

    const cat = dbCategories.getById(body.category_id);
    const assetId = `asset-${Date.now()}`;
    const qrCodeId = `AC-${Date.now().toString(36).toUpperCase()}`;

    const newAsset: Asset = {
      id: assetId,
      user_id: guard.user.userId,
      household_id: guard.user.householdId,
      name: body.name.trim(),
      category_id: body.category_id,
      category_name: cat?.name || 'Appliance',
      category_section: cat?.section || 'Household',
      brand: body.brand.trim(),
      model: body.model.trim(),
      serial_number: body.serial_number || '',
      purchase_date: body.purchase_date || undefined,
      purchase_price: Number(body.purchase_price) || 0,
      seller_name: body.seller_name || '',
      dealer_contact: body.dealer_contact || '',
      installation_date: body.installation_date || undefined,
      warranty_start_date: body.warranty_start_date || undefined,
      warranty_expiry_date: body.warranty_expiry_date || undefined,
      location: body.location || '',
      notes: body.notes || '',
      photos: body.photos || [],
      qr_code_id: qrCodeId,

      // Vehicle specific
      registration_number: body.registration_number || undefined,
      chassis_number: body.chassis_number || undefined,
      engine_number: body.engine_number || undefined,
      odometer_reading: body.odometer_reading ? Number(body.odometer_reading) : undefined,
      insurance_expiry_date: body.insurance_expiry_date || undefined,
      puc_expiry_date: body.puc_expiry_date || undefined,
      service_interval_km: body.service_interval_km ? Number(body.service_interval_km) : undefined,
      service_interval_months: body.service_interval_months ? Number(body.service_interval_months) : undefined,

      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbAssets.create(newAsset);

    dbAuditLogs.create({
      id: `audit-${Date.now()}`,
      user_id: guard.user.userId,
      username: guard.user.username,
      action: 'ASSET_CREATED',
      entity_type: 'asset',
      entity_id: assetId,
      details: { name: newAsset.name, brand: newAsset.brand, model: newAsset.model },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, asset: newAsset }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create asset.' },
      { status: 500 }
    );
  }
}
