// ==============================================================================
// ASSETCARE - MAINTENANCE REMINDER & NOTIFICATION ENGINE
// Service-date linked calculations + advance alert triggers + duplicate prevention
// ==============================================================================

import { Reminder, ReminderLog } from '../db/schema';
import { dbReminders, dbAssets } from '../db/db';

export interface PendingAlert {
  reminderId: string;
  assetId: string;
  assetName: string;
  title: string;
  activity: string;
  dueDate: string;
  daysRemaining: number;
  severity: 'urgent' | 'warning' | 'info';
  message: string;
}

/**
 * Calculates next due date given a base service date and a frequency interval.
 */
export function calculateNextDueDate(
  baseDateStr: string,
  frequency: Reminder['frequency'],
  customDays?: number
): string {
  const d = new Date(baseDateStr);

  switch (frequency) {
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'every_3_months':
      d.setMonth(d.getMonth() + 3);
      break;
    case 'every_6_months':
      d.setMonth(d.getMonth() + 6);
      break;
    case 'annually':
      d.setFullYear(d.getFullYear() + 1);
      break;
    case 'custom':
      d.setDate(d.getDate() + (customDays || 30));
      break;
  }

  return d.toISOString().split('T')[0];
}

/**
 * Evaluates all active reminders and computes pending alerts.
 * Advance periods: 7, 15, 30 days or overdue.
 */
export function checkPendingReminders(userId?: string): PendingAlert[] {
  const reminders = dbReminders.getAll({ userId }).filter((r) => r.is_active);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const alerts: PendingAlert[] = [];

  for (const r of reminders) {
    const dueDate = new Date(r.next_due_date);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const asset = dbAssets.getById(r.asset_id);
    const assetName = asset?.name || r.asset_name || 'Asset';

    if (diffDays < 0) {
      // Overdue
      alerts.push({
        reminderId: r.id,
        assetId: r.asset_id,
        assetName,
        title: r.title,
        activity: r.activity,
        dueDate: r.next_due_date,
        daysRemaining: diffDays,
        severity: 'urgent',
        message: `OVERDUE by ${Math.abs(diffDays)} days: ${r.title} for ${assetName}. Scheduled date was ${r.next_due_date}.`,
      });
    } else if (r.advance_notice_days.includes(diffDays) || diffDays <= 7) {
      // Due soon
      const severity = diffDays <= 3 ? 'urgent' : diffDays <= 15 ? 'warning' : 'info';
      alerts.push({
        reminderId: r.id,
        assetId: r.asset_id,
        assetName,
        title: r.title,
        activity: r.activity,
        dueDate: r.next_due_date,
        daysRemaining: diffDays,
        severity,
        message: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}: ${r.title} for ${assetName} on ${r.next_due_date}.`,
      });
    }
  }

  return alerts;
}
