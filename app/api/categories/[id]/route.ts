import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/rls-guard';
import { dbCategories, dbAuditLogs } from '@/lib/db/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminGuard = requireAdmin(req);
  if (!adminGuard.allowed || !adminGuard.user) return adminGuard.response!;

  try {
    const body = await req.json();
    const updated = dbCategories.update(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }

    dbAuditLogs.create({
      id: `audit-${Date.now()}`,
      user_id: adminGuard.user.userId,
      username: adminGuard.user.username,
      action: 'ADMIN_CATEGORY_MODIFIED',
      entity_type: 'category',
      entity_id: params.id,
      details: { updates: body },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update category.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminGuard = requireAdmin(req);
  if (!adminGuard.allowed || !adminGuard.user) return adminGuard.response!;

  const existing = dbCategories.getById(params.id);
  if (!existing) {
    return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
  }

  const success = dbCategories.delete(params.id);

  dbAuditLogs.create({
    id: `audit-${Date.now()}`,
    user_id: adminGuard.user.userId,
    username: adminGuard.user.username,
    action: 'ADMIN_CATEGORY_DELETED',
    entity_type: 'category',
    entity_id: params.id,
    details: { name: existing.name },
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ success, message: 'Category deleted by administrator.' });
}
