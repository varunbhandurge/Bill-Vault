import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, clearSessionCookie } from '@/lib/auth/auth';
import { dbUsers } from '@/lib/db/db';

export async function GET(req: NextRequest) {
  const session = getSessionUser(req);
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = dbUsers.getById(session.userId);
  if (!user || !user.is_active) {
    const res = NextResponse.json({ user: null });
    clearSessionCookie(res);
    return res;
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      must_change_password: user.must_change_password,
      phone: user.phone,
      household_id: user.household_id,
    },
  });
}

export async function POST() {
  const res = NextResponse.json({ success: true, message: 'Signed out.' });
  clearSessionCookie(res);
  return res;
}
