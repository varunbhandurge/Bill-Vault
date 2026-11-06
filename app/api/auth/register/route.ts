import { NextRequest, NextResponse } from 'next/server';
import { dbUsers, dbAuditLogs } from '@/lib/db/db';
import { hashPassword, signToken, setSessionCookie } from '@/lib/auth/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, full_name, phone } = await req.json();

    if (!username || !email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Please provide full name, username, email, and password.' },
        { status: 400 }
      );
    }

    if (dbUsers.getByUsername(username)) {
      return NextResponse.json(
        { error: 'Username is already taken.' },
        { status: 400 }
      );
    }

    if (dbUsers.getByEmail(email)) {
      return NextResponse.json(
        { error: 'Email address is already registered.' },
        { status: 400 }
      );
    }

    const newUser = dbUsers.create({
      id: `user-${Date.now()}`,
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password_hash: hashPassword(password),
      full_name: full_name.trim(),
      role: 'user', // Always 'user' for public registration
      must_change_password: false,
      phone: phone || '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const token = signToken({
      userId: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      mustChangePassword: false,
      householdId: newUser.household_id,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
      },
      token,
      message: 'Account successfully registered.',
    });

    setSessionCookie(res, token);

    dbAuditLogs.create({
      id: `audit-${Date.now()}`,
      user_id: newUser.id,
      username: newUser.username,
      action: 'USER_REGISTERED',
      entity_type: 'user',
      entity_id: newUser.id,
      details: { email: newUser.email },
      created_at: new Date().toISOString(),
    });

    return res;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Registration failed.' },
      { status: 500 }
    );
  }
}
