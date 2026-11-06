import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rls-guard';
import { dbDocuments, dbAssets, dbAuditLogs } from '@/lib/db/db';
import { computeFileHash } from '@/lib/ocr/preprocess';
import { checkDuplicateDocument, matchAssetFromInvoice, checkActiveWarrantyForRepair } from '@/lib/ocr/matcher';
import { runOCR } from '@/lib/ocr/engine';
import { Document, DocumentType } from '@/lib/db/schema';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const guard = requireAuth(req);
  if (!guard.allowed || !guard.user) return guard.response!;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    let assetId = formData.get('asset_id') as string | null;
    const documentType = (formData.get('document_type') as DocumentType) || 'repair_invoice';
    const autoProcessOCR = formData.get('auto_ocr') !== 'false';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileHash = await computeFileHash(buffer);

    // Duplicate Check
    const duplicateCheck = checkDuplicateDocument(fileHash);
    if (duplicateCheck.isDuplicateHash) {
      return NextResponse.json(
        {
          error: 'Duplicate document detected: This exact file has already been uploaded previously.',
          duplicateDocumentId: duplicateCheck.duplicateDocumentId,
          isDuplicate: true,
        },
        { status: 409 }
      );
    }

    // Determine storage strategy (support serverless Vercel /tmp or Data URL)
    let publicFilePath = `/uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const mimeType = file.type || 'application/octet-stream';
    const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = path.join(uploadDir, safeFileName);
      fs.writeFileSync(filePath, buffer);
      publicFilePath = `/uploads/${safeFileName}`;
    } catch (writeErr) {
      // In serverless read-only environments, fall back to base64 Data URL for universal display
      console.warn('Filesystem write not available, storing as data URI:', writeErr);
      publicFilePath = `data:${mimeType};base64,${buffer.toString('base64')}`;
    }
    const docId = `doc-${Date.now()}`;

    // If assetId was not supplied upfront, try to match or default to first user asset
    if (!assetId) {
      const userAssets = dbAssets.getAll({ userId: guard.user.userId });
      if (userAssets.length > 0) {
        assetId = userAssets[0].id;
      } else {
        assetId = 'unassigned';
      }
    }

    const newDoc: Document = {
      id: docId,
      asset_id: assetId,
      user_id: guard.user.userId,
      document_type: documentType,
      file_name: file.name,
      file_path: publicFilePath,
      file_size: buffer.length,
      mime_type: file.type || 'application/octet-stream',
      file_hash: fileHash,
      storage_type: 'local',
      created_at: new Date().toISOString(),
    };

    dbDocuments.create(newDoc);

    // Audit log
    dbAuditLogs.create({
      id: `audit-${Date.now()}`,
      user_id: guard.user.userId,
      username: guard.user.username,
      action: 'DOCUMENT_UPLOADED',
      entity_type: 'document',
      entity_id: docId,
      details: { fileName: file.name, fileSize: buffer.length, assetId },
      created_at: new Date().toISOString(),
    });

    let ocrResult = null;
    let assetMatches: any[] = [];
    let warrantyAlert = null;

    if (autoProcessOCR && (file.type.startsWith('image/') || file.name.endsWith('.pdf'))) {
      try {
        ocrResult = await runOCR(docId, buffer);
        if (ocrResult && ocrResult.extractedData) {
          assetMatches = matchAssetFromInvoice(ocrResult.extractedData, ocrResult.rawText, guard.user.userId);
          
          // If we matched an asset or already had one, check active warranty
          const effectiveAssetId = assetMatches[0]?.asset?.id || (assetId !== 'unassigned' ? assetId : null);
          const component = ocrResult.extractedData.product_or_component || '';
          if (effectiveAssetId && component) {
            warrantyAlert = checkActiveWarrantyForRepair(effectiveAssetId, component);
          }
        }
      } catch (ocrErr) {
        console.error('Auto OCR failed:', ocrErr);
      }
    }

    return NextResponse.json({
      success: true,
      document: newDoc,
      ocrResult,
      assetMatches,
      warrantyAlert,
      message: 'Document successfully uploaded and secured in vault.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'File upload failed.' },
      { status: 500 }
    );
  }
}
