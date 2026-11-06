import { NextRequest, NextResponse } from 'next/server';
import { dbUsers, dbAuditLogs } from '@/lib/db/db';
import { getSessionUser, hashPassword, signToken, setSessionCookie } from '@/lib/auth/auth';

export async function POST(req: NextRequest) {
  try {
    const session = getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { newPassword } = await req.json();
    if (!newPassword || newPassword.length < 5) {
      return NextResponse.json(
        { error: 'Password must be at least 5 characters long.' },
        { status: 400 }
      );
    }

    const user = dbUsers.getById(session.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const updated = dbUsers.update(user.id, {
      password_hash: hashPassword(newPassword),
      must_change_password: false, // Cleared!
    });

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update password.' }, { status: 500 });
    }

    // Refresh token with mustChangePassword = false
    const token = signToken({
      userId: updated.id,
      username: updated.username,
      email: updated.email,
      role: updated.role,
      mustChangePassword: false,
      householdId: updated.household_id,
    });

    const res = NextResponse.json({
      success: true,
      message: 'Password successfully changed.',
    });

    setSessionCookie(res, token);

    dbAuditLogs.create({
      id: `audit-${Date.now()}`,
      user_id: user.id,
      username: user.username,
      action: 'PASSWORD_CHANGED',
      entity_type: 'user',
      entity_id: user.id,
      details: { role: user.role },
      created_at: new Date().toISOString(),
    });

    return res;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error updating password.' },
      { status: 500 }
    );
  }
}
