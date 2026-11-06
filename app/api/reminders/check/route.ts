import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rls-guard';
import { checkPendingReminders } from '@/lib/notifications/scheduler';

export async function GET(req: NextRequest) {
  const guard = requireAuth(req);
  if (!guard.allowed || !guard.user) return guard.response!;

  const userId = guard.user.role === 'admin' ? undefined : guard.user.userId;
  const alerts = checkPendingReminders(userId);

  return NextResponse.json({
    alerts,
    count: alerts.length,
    urgentCount: alerts.filter((a) => a.severity === 'urgent').length,
  });
}
