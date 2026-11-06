import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth/rls-guard';
import { 
  dbAssets, 
  dbServiceRecords, 
  dbDocuments, 
  dbWarranties, 
  dbReminders, 
  dbAuditLogs,
  dbCategories 
} from '@/lib/db/db';

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

  // Permission check: admin or owner
  if (guard.user.role !== 'admin' && asset.user_id !== guard.user.userId) {
    return NextResponse.json(
      { error: 'You do not have permission to view this asset.' },
      { status: 403 }
    );
  }

  // Retrieve full history & associated records
  const category = dbCategories.getById(asset.category_id);
  const serviceRecords = dbServiceRecords.getAll({ assetId: asset.id });
  const documents = dbDocuments.getAll(asset.id);
  const warranties = dbWarranties.getAll(asset.id);
  const reminders = dbReminders.getAll({ assetId: asset.id });

  // Calculate total money spent on this asset
  const totalRepairSpend = serviceRecords
    .filter((s) => s.service_type === 'repair')
    .reduce((sum, s) => sum + s.total_amount, 0);

  const totalServiceSpend = serviceRecords
    .filter((s) => s.service_type !== 'repair')
    .reduce((sum, s) => sum + s.total_amount, 0);

  const totalLifetimeCost = asset.purchase_price + totalRepairSpend + totalServiceSpend;

  // Distinct components that have been worked on
  const distinctComponents = Array.from(
    new Set(serviceRecords.map((s) => s.component).filter(Boolean))
  );

  return NextResponse.json({
    asset: {
      ...asset,
      category_name: category?.name || asset.category_name || 'Appliance',
      category_section: category?.section || asset.category_section || 'Household',
    },
    serviceRecords,
    documents,
    warranties,
    reminders,
    distinctComponents,
    stats: {
      totalRepairSpend,
      totalServiceSpend,
      totalMaintenanceSpend: totalRepairSpend + totalServiceSpend,
      totalLifetimeCost,
      serviceCount: serviceRecords.length,
      documentCount: documents.length,
    },
  });
}

// STRICT RLS REQUIREMENT: Only Administrator can edit existing asset details
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminGuard = requireAdmin(req);
  if (!adminGuard.allowed || !adminGuard.user) return adminGuard.response!;

  try {
    const body = await req.json();
    const existing = dbAssets.getById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
    }

    const updated = dbAssets.update(params.id, body);

    dbAuditLogs.create({
      id: `audit-${Date.now()}`,
      user_id: adminGuard.user.userId,
      username: adminGuard.user.username,
      action: 'ADMIN_ASSET_MODIFIED',
      entity_type: 'asset',
      entity_id: params.id,
      details: { previous: existing, updated: body },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, asset: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update asset.' },
      { status: 500 }
    );
  }
}

// STRICT RLS REQUIREMENT: Only Administrator can delete assets
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminGuard = requireAdmin(req);
  if (!adminGuard.allowed || !adminGuard.user) return adminGuard.response!;

  const existing = dbAssets.getById(params.id);
  if (!existing) {
    return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
  }

  const success = dbAssets.delete(params.id);

  dbAuditLogs.create({
    id: `audit-${Date.now()}`,
    user_id: adminGuard.user.userId,
    username: adminGuard.user.username,
    action: 'ADMIN_ASSET_DELETED',
    entity_type: 'asset',
    entity_id: params.id,
    details: { assetName: existing.name },
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ success, message: 'Asset deleted by administrator.' });
}
