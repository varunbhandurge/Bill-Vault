import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rls-guard';
import { dbReminders, dbAuditLogs } from '@/lib/db/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = requireAuth(req);
  if (!guard.allowed || !guard.user) return guard.response!;

  try {
    const { completedDate, invoiceLinkedId } = await req.json();
    const effectiveDate = completedDate || new Date().toISOString().split('T')[0];

    const updated = dbReminders.markComplete(params.id, effectiveDate, invoiceLinkedId);
    if (!updated) {
      return NextResponse.json({ error: 'Reminder not found.' }, { status: 404 });
    }

    dbAuditLogs.create({
      id: `audit-${Date.now()}`,
      user_id: guard.user.userId,
      username: guard.user.username,
      action: 'REMINDER_MARKED_COMPLETED',
      entity_type: 'reminder',
      entity_id: params.id,
      details: { title: updated.title, completedDate: effectiveDate, nextDueDate: updated.next_due_date },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      reminder: updated,
      message: 'Maintenance task logged as completed. Next service date scheduled.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to complete reminder.' },
      { status: 500 }
    );
  }
}
