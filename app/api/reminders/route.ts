import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rls-guard';
import { dbReminders, dbAssets, dbAuditLogs } from '@/lib/db/db';
import { calculateNextDueDate } from '@/lib/notifications/scheduler';
import { Reminder } from '@/lib/db/schema';

export async function GET(req: NextRequest) {
  const guard = requireAuth(req);
  if (!guard.allowed || !guard.user) return guard.response!;

  const { searchParams } = new URL(req.url);
  const assetId = searchParams.get('assetId') || undefined;

  const userId = guard.user.role === 'admin' ? undefined : guard.user.userId;
  const reminders = dbReminders.getAll({ assetId, userId });

  const assets = dbAssets.getAll();
  const enriched = reminders.map((r) => {
    const asset = assets.find((a) => a.id === r.asset_id);
    return {
      ...r,
      asset_name: asset?.name || r.asset_name || 'Asset',
      asset_brand: asset?.brand || '',
      asset_model: asset?.model || '',
    };
  });

  return NextResponse.json({ reminders: enriched });
}

export async function POST(req: NextRequest) {
  const guard = requireAuth(req);
  if (!guard.allowed || !guard.user) return guard.response!;

  try {
    const body = await req.json();

    if (!body.asset_id || !body.title || !body.activity || !body.reference_date || !body.frequency) {
      return NextResponse.json(
        { error: 'Asset, Title, Activity, Reference Date, and Frequency are required.' },
        { status: 400 }
      );
    }

    const asset = dbAssets.getById(body.asset_id);
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
    }

    // Compute next due date using reference date + frequency
    const nextDueDate =
      body.next_due_date ||
      calculateNextDueDate(body.reference_date, body.frequency, body.custom_interval_days);

    const newReminder: Reminder = {
      id: `rem-${Date.now()}`,
      asset_id: body.asset_id,
      asset_name: asset.name,
      user_id: guard.user.userId,
      title: body.title.trim(),
      activity: body.activity.trim(),
      reference_date: body.reference_date,
      frequency: body.frequency,
      custom_interval_days: body.custom_interval_days ? Number(body.custom_interval_days) : undefined,
      advance_notice_days: body.advance_notice_days || [7, 15, 30],
      next_due_date: nextDueDate,
      repeat_enabled: body.repeat_enabled !== false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbReminders.create(newReminder);

    dbAuditLogs.create({
      id: `audit-${Date.now()}`,
      user_id: guard.user.userId,
      username: guard.user.username,
      action: 'REMINDER_CREATED',
      entity_type: 'reminder',
      entity_id: newReminder.id,
      details: { title: newReminder.title, nextDueDate: newReminder.next_due_date },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, reminder: newReminder }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create reminder.' },
      { status: 500 }
    );
  }
}
