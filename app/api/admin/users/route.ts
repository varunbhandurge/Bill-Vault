import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/rls-guard';
import { dbUsers, dbAuditLogs } from '@/lib/db/db';
import { hashPassword } from '@/lib/auth/auth';
import { User } from '@/lib/db/schema';

export async function GET(req: NextRequest) {
  const adminGuard = requireAdmin(req);
  if (!adminGuard.allowed || !adminGuard.user) return adminGuard.response!;

  const users = dbUsers.getAll().map((u) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    must_change_password: u.must_change_password,
    phone: u.phone,
    is_active: u.is_active,
    household_id: u.household_id,
    created_at: u.created_at,
    updated_at: u.updated_at,
  }));

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const adminGuard = requireAdmin(req);
  if (!adminGuard.allowed || !adminGuard.user) return adminGuard.response!;

  try {
    const { username, email, password, full_name, role, phone, household_id } = await req.json();

    if (!username || !email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Username, email, password, and full name are required.' },
        { status: 400 }
      );
    }

    if (dbUsers.getByUsername(username)) {
      return NextResponse.json({ error: 'Username already exists.' }, { status: 400 });
    }

    if (dbUsers.getByEmail(email)) {
      return NextResponse.json({ error: 'Email already exists.' }, { status: 400 });
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password_hash: hashPassword(password),
      full_name: full_name.trim(),
      role: role === 'admin' ? 'admin' : 'user',
      must_change_password: true, // Force new users created by admin to change password
      phone: phone || '',
      is_active: true,
      household_id: household_id || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbUsers.create(newUser);

    dbAuditLogs.create({
      id: `audit-${Date.now()}`,
      user_id: adminGuard.user.userId,
      username: adminGuard.user.username,
      action: 'ADMIN_USER_CREATED',
      entity_type: 'user',
      entity_id: newUser.id,
      details: { username: newUser.username, role: newUser.role },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create user.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const adminGuard = requireAdmin(req);
  if (!adminGuard.allowed || !adminGuard.user) return adminGuard.response!;

  try {
    const { id, ...updates } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    // If password is being updated
    if (updates.password) {
      updates.password_hash = hashPassword(updates.password);
      delete updates.password;
    }

    const updated = dbUsers.update(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    dbAuditLogs.create({
      id: `audit-${Date.now()}`,
      user_id: adminGuard.user.userId,
      username: adminGuard.user.username,
      action: 'ADMIN_USER_MODIFIED',
      entity_type: 'user',
      entity_id: id,
      details: { updates },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update user.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const adminGuard = requireAdmin(req);
  if (!adminGuard.allowed || !adminGuard.user) return adminGuard.response!;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
  }

  // Safeguard: Cannot delete yourself
  if (id === adminGuard.user.userId) {
    return NextResponse.json({ error: 'Cannot delete your own admin account.' }, { status: 400 });
  }

  const success = dbUsers.delete(id);

  dbAuditLogs.create({
    id: `audit-${Date.now()}`,
    user_id: adminGuard.user.userId,
    username: adminGuard.user.username,
    action: 'ADMIN_USER_DELETED',
    entity_type: 'user',
    entity_id: id,
    details: { targetUserId: id },
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ success, message: 'User account removed.' });
}
