// ==============================================================================
// ASSETCARE - OCR PROCESSING ENGINE
// Tesseract.js Worker Integration + PDF text extraction + Pipeline Execution
// ==============================================================================

import { createWorker } from 'tesseract.js';
import { extractInvoiceData } from './extractor';
import { ExtractedInvoiceData, OCRRecord, OCRStatus } from '../db/schema';
import { dbOCRRecords } from '../db/db';

export interface OCRProcessResult {
  ocrRecordId: string;
  status: OCRStatus;
  rawText: string;
  extractedData: ExtractedInvoiceData;
  confidenceScore: number;
  fieldsNeedingVerification: string[];
  errorMessage?: string;
}

/**
 * Runs OCR processing on an image buffer or file path.
 */
export async function runOCR(
  documentId: string,
  imageInput: Buffer | string,
  language: string = 'eng'
): Promise<OCRProcessResult> {
  const ocrRecordId = `ocr-${Date.now()}`;

  // Record initial status
  dbOCRRecords.create({
    id: ocrRecordId,
    document_id: documentId,
    status: 'processing',
    raw_text: '',
    structured_data: {
      spare_parts: [],
      confidence_scores: {},
    },
    confidence_score: 0,
    fields_needing_verification: [],
    created_at: new Date().toISOString(),
  });

  try {
    const worker = await createWorker(language);
    const ret = await worker.recognize(imageInput);
    const rawText = ret.data.text || '';
    const ocrConfidence = ret.data.confidence || 0;
    await worker.terminate();

    // Extract structured invoice data
    const extractedData = extractInvoiceData(rawText);

    // Identify fields requiring manual verification
    const fieldsNeedingVerification: string[] = [];
    if (!extractedData.invoice_number || (extractedData.confidence_scores['invoice_number'] || 0) < 0.75) {
      fieldsNeedingVerification.push('invoice_number');
    }
    if (!extractedData.total_amount || (extractedData.confidence_scores['total_amount'] || 0) < 0.75) {
      fieldsNeedingVerification.push('total_amount');
    }
    if (!extractedData.invoice_date || (extractedData.confidence_scores['invoice_date'] || 0) < 0.75) {
      fieldsNeedingVerification.push('invoice_date');
    }
    if (!extractedData.vendor_name || (extractedData.confidence_scores['vendor_name'] || 0) < 0.75) {
      fieldsNeedingVerification.push('vendor_name');
    }

    const overallConfidence = Number(
      Math.min(100, Math.max(10, ocrConfidence)).toFixed(2)
    );

    const status: OCRStatus =
      fieldsNeedingVerification.length > 0 ? 'verification_required' : 'extraction_completed';

    // Update OCR Record
    dbOCRRecords.update(ocrRecordId, {
      status,
      raw_text: rawText,
      structured_data: extractedData,
      confidence_score: overallConfidence,
      fields_needing_verification: fieldsNeedingVerification,
    });

    return {
      ocrRecordId,
      status,
      rawText,
      extractedData,
      confidenceScore: overallConfidence,
      fieldsNeedingVerification,
    };
  } catch (error: any) {
    console.error('OCR processing error:', error);
    dbOCRRecords.update(ocrRecordId, {
      status: 'failed',
      error_message: error.message || 'Failed to process document through OCR engine.',
    });

    return {
      ocrRecordId,
      status: 'failed',
      rawText: '',
      extractedData: { spare_parts: [], confidence_scores: {} },
      confidenceScore: 0,
      fieldsNeedingVerification: ['invoice_number', 'total_amount', 'invoice_date', 'vendor_name'],
      errorMessage: error.message || 'OCR processing failed.',
    };
  }
}
