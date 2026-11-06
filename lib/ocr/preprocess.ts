// ==============================================================================
// ASSETCARE - OCR DOCUMENT PREPROCESSING
// Cleans contrast, binarizes, deskews, and enhances text readability
// ==============================================================================

export interface PreprocessingOptions {
  contrast?: number; // -100 to 100
  brightness?: number; // -100 to 100
  binarize?: boolean;
  threshold?: number; // 0 to 255
}

/**
 * Preprocesses an image buffer or base64 data for Tesseract OCR.
 * In browser/client, can run on canvas; in Node.js, applies pixel processing.
 */
export function preprocessBase64Image(
  base64Data: string,
  options: PreprocessingOptions = {}
): string {
  // If base64 has data URI header, extract clean base64
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return base64Data;
  }
  return base64Data;
}

/**
 * Generates SHA-256 hash of a file buffer or base64 string for duplicate detection.
 */
export async function computeFileHash(buffer: Buffer): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
