import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rls-guard';
import { dbReminders, dbAuditLogs } from '@/lib/db/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = requireAuth(req);
  if (!guard.allowed || !guard.user) return guard.response!;

  try {
    const body = await req.json();
    const existing = dbReminders.getById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Reminder not found.' }, { status: 404 });
    }

    // Must be admin or owner
    if (guard.user.role !== 'admin' && existing.user_id !== guard.user.userId) {
      return NextResponse.json({ error: 'Permission denied.' }, { status: 403 });
    }

    const updated = dbReminders.update(params.id, body);
    return NextResponse.json({ success: true, reminder: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update reminder.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = requireAuth(req);
  if (!guard.allowed || !guard.user) return guard.response!;

  const existing = dbReminders.getById(params.id);
  if (!existing) {
    return NextResponse.json({ error: 'Reminder not found.' }, { status: 404 });
  }

  if (guard.user.role !== 'admin' && existing.user_id !== guard.user.userId) {
    return NextResponse.json({ error: 'Permission denied.' }, { status: 403 });
  }

  const success = dbReminders.delete(params.id);
  return NextResponse.json({ success, message: 'Reminder deleted.' });
}
