import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth/rls-guard';
import { dbCategories, dbAuditLogs } from '@/lib/db/db';
import { Category } from '@/lib/db/schema';

export async function GET() {
  const categories = dbCategories.getAll();
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const adminGuard = requireAdmin(req);
  if (!adminGuard.allowed || !adminGuard.user) return adminGuard.response!;

  try {
    const { name, section, icon, description } = await req.json();

    if (!name || !section) {
      return NextResponse.json({ error: 'Name and section are required.' }, { status: 400 });
    }

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      section,
      icon: icon || 'box',
      description: description || '',
      is_default: false,
      created_at: new Date().toISOString(),
    };

    dbCategories.create(newCategory);

    dbAuditLogs.create({
      id: `audit-${Date.now()}`,
      user_id: adminGuard.user.userId,
      username: adminGuard.user.username,
      action: 'ADMIN_CATEGORY_CREATED',
      entity_type: 'category',
      entity_id: newCategory.id,
      details: { name: newCategory.name, section: newCategory.section },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, category: newCategory }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create category.' },
      { status: 500 }
    );
  }
}
