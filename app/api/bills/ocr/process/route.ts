import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rls-guard';
import { dbDocuments } from '@/lib/db/db';
import { runOCR } from '@/lib/ocr/engine';
import { matchAssetFromInvoice, checkActiveWarrantyForRepair } from '@/lib/ocr/matcher';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const guard = requireAuth(req);
  if (!guard.allowed || !guard.user) return guard.response!;

  try {
    const { documentId, language } = await req.json();

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required.' }, { status: 400 });
    }

    const doc = dbDocuments.getById(documentId);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    // Resolve file buffer
    const localPath = path.join(process.cwd(), 'public', doc.file_path);
    if (!fs.existsSync(localPath)) {
      return NextResponse.json({ error: 'Original file not found on disk.' }, { status: 404 });
    }

    const buffer = fs.readFileSync(localPath);
    const ocrResult = await runOCR(doc.id, buffer, language || 'eng');

    // Match assets
    const assetMatches = matchAssetFromInvoice(
      ocrResult.extractedData,
      ocrResult.rawText,
      guard.user.userId
    );

    let warrantyAlert = null;
    const effectiveAssetId = assetMatches[0]?.asset?.id || doc.asset_id;
    const component = ocrResult.extractedData.product_or_component || '';
    if (effectiveAssetId && component) {
      warrantyAlert = checkActiveWarrantyForRepair(effectiveAssetId, component);
    }

    return NextResponse.json({
      success: true,
      ocrResult,
      assetMatches,
      warrantyAlert,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'OCR processing failed.' },
      { status: 500 }
    );
  }
}
