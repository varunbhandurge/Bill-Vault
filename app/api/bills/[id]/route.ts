import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth/rls-guard';
import { dbDocuments, dbOCRRecords, dbAuditLogs } from '@/lib/db/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = requireAuth(req);
  if (!guard.allowed || !guard.user) return guard.response!;

  const doc = dbDocuments.getById(params.id);
  if (!doc) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  }

  const ocrRecord = dbOCRRecords.getByDocumentId(doc.id);

  return NextResponse.json({ document: doc, ocrRecord });
}

// STRICT RLS REQUIREMENT: Only Administrator can edit bill/invoice information
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminGuard = requireAdmin(req);
  if (!adminGuard.allowed || !adminGuard.user) return adminGuard.response!;

  try {
    const body = await req.json();
    const existing = dbDocuments.getById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    const updated = dbDocuments.update(params.id, body);

    dbAuditLogs.create({
      id: `audit-${Date.now()}`,
      user_id: adminGuard.user.userId,
      username: adminGuard.user.username,
      action: 'ADMIN_DOCUMENT_MODIFIED',
      entity_type: 'document',
      entity_id: params.id,
      details: { updates: body },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, document: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update document.' },
      { status: 500 }
    );
  }
}

// STRICT RLS REQUIREMENT: Only Administrator can delete bills
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminGuard = requireAdmin(req);
  if (!adminGuard.allowed || !adminGuard.user) return adminGuard.response!;

  const existing = dbDocuments.getById(params.id);
  if (!existing) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  }

  const success = dbDocuments.delete(params.id);

  dbAuditLogs.create({
    id: `audit-${Date.now()}`,
    user_id: adminGuard.user.userId,
    username: adminGuard.user.username,
    action: 'ADMIN_DOCUMENT_DELETED',
    entity_type: 'document',
    entity_id: params.id,
    details: { fileName: existing.file_name },
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ success, message: 'Document removed by administrator.' });
}
