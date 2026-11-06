// ==============================================================================
// ASSETCARE - INTELLIGENT INVOICE INFORMATION EXTRACTOR
// Deterministic pattern extraction + regex parsing + confidence scoring
// ==============================================================================

import { ExtractedInvoiceData, SparePartItem } from '../db/schema';

export function extractInvoiceData(rawText: string): ExtractedInvoiceData {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const fullText = rawText.replace(/\r/g, '');

  const confidence: Record<string, number> = {};

  // 1. GSTIN Extraction (Indian GSTIN format: 2 digits + 5 chars + 4 digits + 1 char + 1 char + Z + 1 char)
  let gstin: string | undefined;
  const gstinMatch = fullText.match(/\b([0-9]{2}[A-Z]{5}[0-9]{4}[1-9A-Z]{1}Z[0-9A-Z]{1})\b/i);
  if (gstinMatch) {
    gstin = gstinMatch[1].toUpperCase();
    confidence['gstin'] = 0.95;
  } else {
    confidence['gstin'] = 0.0;
  }

  // 2. Phone Number Extraction
  let vendor_phone: string | undefined;
  const phoneMatch = fullText.match(/(?:ph(?:one)?|mob(?:ile)?|contact|tel)?[:.\s]*(\+91[\s-]?)?([6-9]\d{4}[\s-]?\d{5}|\d{3,4}[\s-]?\d{6,8})/i);
  if (phoneMatch) {
    vendor_phone = phoneMatch[0].replace(/[^\d+]/g, '');
    if (vendor_phone.length >= 10) {
      confidence['vendor_phone'] = 0.90;
    }
  }

  // 3. Invoice Number Extraction
  let invoice_number: string | undefined;
  const invMatch = fullText.match(/(?:inv(?:oice)?|bill|receipt|cash memo)[\s#.:-]*([A-Za-z0-9\/-]{3,25})/i);
  if (invMatch) {
    invoice_number = invMatch[1].trim();
    confidence['invoice_number'] = 0.88;
  } else {
    // Fallback: look for lines starting with INV- or Bill-
    const fallbackInv = lines.find((l) => /^(?:INV|BILL|REC|TAX)[\s#.:-]*\w+/i.test(l));
    if (fallbackInv) {
      invoice_number = fallbackInv.replace(/^(?:INV|BILL|REC|TAX)[\s#.:-]*/i, '').trim();
      confidence['invoice_number'] = 0.70;
    }
  }

  // 4. Dates Extraction (Invoice date & Service date)
  let invoice_date: string | undefined;
  let service_date: string | undefined;

  // Formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD-Mon-YYYY
  const dateRegex = /\b(\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4}|\d{4}[-\/.]\d{1,2}[-\/.]\d{1,2}|\d{1,2}[-\s](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-\s]\d{2,4})\b/gi;
  const dateMatches = fullText.match(dateRegex);

  if (dateMatches && dateMatches.length > 0) {
    const parsedDate = normalizeDate(dateMatches[0]);
    if (parsedDate) {
      invoice_date = parsedDate;
      confidence['invoice_date'] = 0.85;
    }
    if (dateMatches.length > 1) {
      const parsedSvcDate = normalizeDate(dateMatches[1]);
      if (parsedSvcDate) {
        service_date = parsedSvcDate;
        confidence['service_date'] = 0.80;
      }
    }
  }

  if (!service_date && invoice_date) {
    // Default service date to invoice date if not separately stated
    service_date = invoice_date;
    confidence['service_date'] = confidence['invoice_date'] ? confidence['invoice_date'] * 0.9 : 0.6;
  }

  // 5. Vendor Name & Address
  let vendor_name: string | undefined;
  let vendor_address: string | undefined;

  // The first 1-3 prominent lines usually contain vendor name
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const l = lines[i];
    if (
      !/^(tax invoice|cash memo|bill|invoice|date|estimate|quotation)/i.test(l) &&
      l.length > 3 &&
      l.length < 60
    ) {
      vendor_name = l.replace(/[^\w\s&.,'-]/g, '').trim();
      confidence['vendor_name'] = 0.82;
      // Address usually follows
      if (lines[i + 1] && lines[i + 1].length > 10) {
        vendor_address = lines[i + 1].trim();
        confidence['vendor_address'] = 0.75;
      }
      break;
    }
  }

  // 6. Total Amount, Labour, Material, Taxes, Discounts
  let total_amount: number | undefined;
  let labour_charges: number | undefined;
  let material_charges: number | undefined;
  let discount: number | undefined;
  let gst_amount: number | undefined;

  // Look for total
  const totalMatch = fullText.match(/(?:grand\s*total|net\s*payable|total\s*amount|total|amount\s*paid)[:.\s]*₹?[\s]*([0-9,]+(?:\.[0-9]{2})?)/i);
  if (totalMatch) {
    total_amount = parseAmount(totalMatch[1]);
    confidence['total_amount'] = 0.92;
  }

  const labourMatch = fullText.match(/(?:labour|labor|service\s*charge|service\s*fee|work\s*charge)[:.\s]*₹?[\s]*([0-9,]+(?:\.[0-9]{2})?)/i);
  if (labourMatch) {
    labour_charges = parseAmount(labourMatch[1]);
    confidence['labour_charges'] = 0.85;
  }

  const materialMatch = fullText.match(/(?:material|parts|spare|spares|item\s*total)[:.\s]*₹?[\s]*([0-9,]+(?:\.[0-9]{2})?)/i);
  if (materialMatch) {
    material_charges = parseAmount(materialMatch[1]);
    confidence['material_charges'] = 0.80;
  }

  const discountMatch = fullText.match(/(?:discount|less|disc)[:.\s]*₹?[\s]*([0-9,]+(?:\.[0-9]{2})?)/i);
  if (discountMatch) {
    discount = parseAmount(discountMatch[1]);
    confidence['discount'] = 0.80;
  }

  const gstMatch = fullText.match(/(?:gst|cgst\s*\+\s*sgst|igst|tax\s*amount|vat)[:.\s]*₹?[\s]*([0-9,]+(?:\.[0-9]{2})?)/i);
  if (gstMatch) {
    gst_amount = parseAmount(gstMatch[1]);
    confidence['gst_amount'] = 0.85;
  }

  // If total is missing but labour and material exist, compute it
  if (!total_amount && (labour_charges || material_charges)) {
    total_amount = (labour_charges || 0) + (material_charges || 0) + (gst_amount || 0) - (discount || 0);
    confidence['total_amount'] = 0.70;
  }

  // 7. Component & Work Description Detection
  let product_or_component: string | undefined;
  let description_of_work: string | undefined;

  const componentKeywords = [
    'AC Compressor',
    'Compressor',
    'Cooling Coil',
    'AC Gas',
    'Refrigerant',
    'Engine',
    'Clutch',
    'Brake Pads',
    'Brakes',
    'Battery',
    'Tyres',
    'Suspension',
    'Water Purifier Filter',
    'RO Membrane',
    'Sediment Filter',
    'Thermostat',
    'Display',
    'Keyboard',
    'Fan Motor',
    'Water Pump',
  ];

  for (const comp of componentKeywords) {
    if (new RegExp(comp, 'i').test(fullText)) {
      product_or_component = comp;
      confidence['product_or_component'] = 0.88;
      break;
    }
  }

  // Description of work: lines with repair/replace/servicing
  const workLines = lines.filter((l) =>
    /(repair|service|replaced|overhaul|cleaning|recharge|refill|flush|installation|tested)/i.test(l)
  );
  if (workLines.length > 0) {
    description_of_work = workLines.slice(0, 3).join('. ');
    confidence['description_of_work'] = 0.85;
  } else if (product_or_component) {
    description_of_work = `${product_or_component} servicing and repair`;
    confidence['description_of_work'] = 0.65;
  }

  // 8. Spare Parts Replaced
  const spare_parts: SparePartItem[] = [];
  lines.forEach((l) => {
    // Pattern: Part Name ... Qty ... Price
    const partMatch = l.match(/^([A-Za-z0-9\s&-]{4,35})\s+(?:qty[:.\s]*)?(\d+)\s+(?:₹|Rs\.?)?\s*([0-9,]+(?:\.[0-9]{2})?)/i);
    if (partMatch) {
      const name = partMatch[1].trim();
      const quantity = parseInt(partMatch[2], 10) || 1;
      const unit_price = parseAmount(partMatch[3]);
      spare_parts.push({
        name,
        quantity,
        unit_price,
        total_price: quantity * unit_price,
      });
    }
  });

  // 9. Warranty Duration & Expiry Date Extraction
  let warranty_duration_months: number | undefined;
  let warranty_expiry_date: string | undefined;

  const warrantyMatch = fullText.match(/(\d+)\s*(months?|years?|days?|mon)\s*(?:warranty|guarantee|validity)/i);
  if (warrantyMatch) {
    const val = parseInt(warrantyMatch[1], 10);
    const unit = warrantyMatch[2].toLowerCase();

    if (unit.startsWith('year')) {
      warranty_duration_months = val * 12;
    } else if (unit.startsWith('mon')) {
      warranty_duration_months = val;
    } else if (unit.startsWith('day')) {
      warranty_duration_months = Math.ceil(val / 30);
    }
    confidence['warranty_duration_months'] = 0.90;

    // Calculate expiry date if service_date or invoice_date is available
    const baseDateStr = service_date || invoice_date;
    if (baseDateStr && warranty_duration_months) {
      try {
        const d = new Date(baseDateStr);
        d.setMonth(d.getMonth() + warranty_duration_months);
        warranty_expiry_date = d.toISOString().split('T')[0];
        confidence['warranty_expiry_date'] = 0.85;
      } catch (e) {
        // ignore
      }
    }
  }

  // 10. Payment Mode
  let payment_mode: string | undefined;
  if (/upi|gpay|google\s*pay|phonepe|paytm/i.test(fullText)) {
    payment_mode = 'UPI';
    confidence['payment_mode'] = 0.90;
  } else if (/credit\s*card|debit\s*card|card|visa|mastercard/i.test(fullText)) {
    payment_mode = 'Card';
    confidence['payment_mode'] = 0.90;
  } else if (/cash/i.test(fullText)) {
    payment_mode = 'Cash';
    confidence['payment_mode'] = 0.85;
  } else if (/neft|rtgs|net\s*banking/i.test(fullText)) {
    payment_mode = 'Net Banking';
    confidence['payment_mode'] = 0.85;
  }

  return {
    invoice_number,
    invoice_date,
    service_date,
    vendor_name,
    vendor_address,
    vendor_phone,
    gstin,
    description_of_work,
    product_or_component,
    spare_parts,
    labour_charges,
    material_charges,
    discount,
    gst_amount,
    total_amount,
    payment_mode,
    warranty_duration_months,
    warranty_expiry_date,
    confidence_scores: confidence,
  };
}

function parseAmount(val: string): number {
  const clean = val.replace(/,/g, '').trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

function normalizeDate(raw: string): string | null {
  try {
    const clean = raw.trim().replace(/[.]/g, '-').replace(/[\/]/g, '-');
    
    // Check if format is DD-Mon-YYYY (e.g. 06-Nov-2026)
    const monthNames: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    const monMatch = clean.match(/^(\d{1,2})[-\s]([A-Za-z]{3,})[-\s](\d{4})$/);
    if (monMatch) {
      const day = monMatch[1].padStart(2, '0');
      const mon = monthNames[monMatch[2].toLowerCase().substring(0, 3)] || '01';
      const year = monMatch[3];
      return `${year}-${mon}-${day}`;
    }

    // Check if format is DD-MM-YYYY
    const parts = clean.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else {
        // DD-MM-YYYY
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        let year = parts[2];
        if (year.length === 2) year = `20${year}`;
        return `${year}-${month}-${day}`;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}
