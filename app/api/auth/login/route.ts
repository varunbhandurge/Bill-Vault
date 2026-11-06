import { NextRequest, NextResponse } from 'next/server';
import { dbUsers, dbAuditLogs } from '@/lib/db/db';
import { comparePassword, signToken, setSessionCookie } from '@/lib/auth/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const user = dbUsers.getByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'This account has been deactivated. Please contact an administrator.' },
        { status: 403 }
      );
    }

    const isValid = comparePassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    // Sign JWT
    const token = signToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      mustChangePassword: user.must_change_password,
      householdId: user.household_id,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        must_change_password: user.must_change_password,
        household_id: user.household_id,
      },
      token,
      message: user.must_change_password
        ? 'First login detected. You must change your password to proceed.'
        : 'Sign in successful.',
    });

    setSessionCookie(res, token);

    // Audit log
    dbAuditLogs.create({
      id: `audit-${Date.now()}`,
      user_id: user.id,
      username: user.username,
      action: 'USER_LOGIN',
      entity_type: 'auth',
      entity_id: user.id,
      details: { role: user.role, mustChangePassword: user.must_change_password },
      ip_address: req.ip || '127.0.0.1',
      created_at: new Date().toISOString(),
    });

    return res;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Authentication failed.' },
      { status: 500 }
    );
  }
}
