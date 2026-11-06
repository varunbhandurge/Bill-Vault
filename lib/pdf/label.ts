// ==============================================================================
// ASSETCARE - PRINTABLE ASSET QR CODE LABEL GENERATOR
// Produces printable physical sticker tags for appliances and vehicles
// ==============================================================================

import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Asset } from '../db/schema';

export async function generatePrintableAssetLabel(
  asset: Asset,
  baseUrl: string = 'http://localhost:3000'
): Promise<jsPDF> {
  // Label size: Standard 4" x 2.5" physical sticker (101.6mm x 63.5mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [102, 64],
  });

  // Border & Header
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.rect(2, 2, 98, 60);

  doc.setFillColor(15, 118, 110); // brand-700
  doc.rect(2, 2, 98, 12, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSETCARE DIGITAL ASSET TAG', 5, 10);

  // Generate QR Code containing the secure asset link
  const assetUrl = `${baseUrl}/assets/${asset.id}?qr=1`;
  const qrDataUrl = await QRCode.toDataURL(assetUrl, {
    margin: 1,
    width: 256,
    color: {
      dark: '#0f766e',
      light: '#ffffff',
    },
  });

  // Add QR Code Image (28mm x 28mm)
  doc.addImage(qrDataUrl, 'PNG', 5, 17, 30, 30);

  // Asset Details on Right Side
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const nameTruncated = asset.name.length > 25 ? asset.name.substring(0, 23) + '...' : asset.name;
  doc.text(nameTruncated, 38, 20);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105); // slate-600

  let y = 26;
  doc.text(`Brand / Model: ${asset.brand} - ${asset.model}`, 38, y);
  y += 5;

  if (asset.registration_number) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 118, 110);
    doc.text(`Reg No: ${asset.registration_number}`, 38, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    y += 5;
  } else if (asset.serial_number) {
    doc.text(`Serial: ${asset.serial_number}`, 38, y);
    y += 5;
  }

  doc.text(`Category: ${asset.category_name || 'Appliance'}`, 38, y);
  y += 5;
  doc.text(`Location: ${asset.location || 'Home'}`, 38, y);

  // Footer Tagline
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Scan with phone camera to view repair history, warranties & invoices. Secure login required.',
    5,
    58
  );

  return doc;
}
