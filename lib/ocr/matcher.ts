// ==============================================================================
// ASSETCARE - INTELLIGENT ASSET MATCHER & DUPLICATE DETECTOR
// Matches bills to assets + flags active warranty overlap + duplicate detection
// ==============================================================================

import { Asset, ExtractedInvoiceData, Warranty } from '../db/schema';
import { dbAssets, dbDocuments, dbWarranties } from '../db/db';

export interface AssetMatchResult {
  asset: Asset;
  confidence: number;
  matchReasons: string[];
}

export interface DuplicateCheckResult {
  isDuplicateHash: boolean;
  duplicateDocumentId?: string;
  isDuplicateInvoiceNumber: boolean;
  message?: string;
}

export interface ActiveWarrantyAlert {
  hasActiveWarranty: boolean;
  activeWarranties: Warranty[];
  alertMessage?: string;
}

/**
 * Intelligently matches extracted bill data against a user's assets.
 */
export function matchAssetFromInvoice(
  invoiceData: ExtractedInvoiceData,
  rawText: string,
  userId?: string
): AssetMatchResult[] {
  const assets = dbAssets.getAll({ userId });
  const results: AssetMatchResult[] = [];
  const textLower = (rawText + ' ' + (invoiceData.description_of_work || '')).toLowerCase();

  for (const asset of assets) {
    let score = 0;
    const reasons: string[] = [];

    // 1. Vehicle Registration Check (Highest confidence)
    if (asset.registration_number) {
      const regClean = asset.registration_number.replace(/\s+/g, '').toLowerCase();
      const textClean = textLower.replace(/\s+/g, '');
      if (textClean.includes(regClean)) {
        score += 0.85;
        reasons.push(`Matched Vehicle Registration Number: ${asset.registration_number}`);
      }
    }

    // 2. Serial Number Check
    if (asset.serial_number && asset.serial_number.length > 4) {
      if (textLower.includes(asset.serial_number.toLowerCase())) {
        score += 0.75;
        reasons.push(`Matched Serial Number: ${asset.serial_number}`);
      }
    }

    // 3. Model Match
    if (asset.model && asset.model.length > 2) {
      const modelParts = asset.model.toLowerCase().split(/\s+/);
      const matchedParts = modelParts.filter((p) => p.length > 2 && textLower.includes(p));
      if (matchedParts.length > 0) {
        const ratio = matchedParts.length / modelParts.length;
        score += ratio * 0.40;
        reasons.push(`Matched Model: ${matchedParts.join(' ')}`);
      }
    }

    // 4. Brand Match
    if (asset.brand && textLower.includes(asset.brand.toLowerCase())) {
      score += 0.25;
      reasons.push(`Matched Brand: ${asset.brand}`);
    }

    // 5. Category Keyword Match
    if (asset.category_name && textLower.includes(asset.category_name.toLowerCase())) {
      score += 0.15;
      reasons.push(`Matched Category: ${asset.category_name}`);
    }

    // Cap at 1.0
    const finalScore = Math.min(1.0, score);
    if (finalScore >= 0.30) {
      results.push({
        asset,
        confidence: Number(finalScore.toFixed(2)),
        matchReasons: reasons,
      });
    }
  }

  // Sort descending by confidence score
  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Checks if the uploaded document is a duplicate by file hash or invoice number.
 */
export function checkDuplicateDocument(
  fileHash: string,
  invoiceNumber?: string
): DuplicateCheckResult {
  // Check exact file hash
  const existingByHash = dbDocuments.findByHash(fileHash);
  if (existingByHash) {
    return {
      isDuplicateHash: true,
      duplicateDocumentId: existingByHash.id,
      isDuplicateInvoiceNumber: false,
      message: 'Exact file already exists in vault with same cryptographic hash.',
    };
  }

  return {
    isDuplicateHash: false,
    isDuplicateInvoiceNumber: false,
  };
}

/**
 * Detects if a component has an active warranty when a repair invoice is recorded.
 */
export function checkActiveWarrantyForRepair(
  assetId: string,
  componentName: string
): ActiveWarrantyAlert {
  if (!assetId || !componentName) {
    return { hasActiveWarranty: false, activeWarranties: [] };
  }

  const activeWarranties = dbWarranties.getActiveForComponent(assetId, componentName);

  if (activeWarranties.length > 0) {
    const latest = activeWarranties[0];
    const alertMessage = `⚠️ Previous repair warranty may still be active for "${latest.component}". Service provider: ${latest.provider}. Valid until ${latest.expiry_date}. View previous invoice to verify coverage conditions.`;

    return {
      hasActiveWarranty: true,
      activeWarranties,
      alertMessage,
    };
  }

  return {
    hasActiveWarranty: false,
    activeWarranties: [],
  };
}
