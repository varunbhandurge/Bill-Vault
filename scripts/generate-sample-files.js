const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

// 1. Generate sample invoice PDF: Apex Auto AC Compressor Repair (06-Nov-2026, Rs. 6000)
function createApexInvoicePDF() {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('APEX AUTO COOLING WORKS', 14, 18);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Automotive Air Conditioning Specialist & Electrical Workshop', 14, 25);
  doc.text('Gala 4, CST Road, Kurla West, Mumbai 400070 | Tel: +91 98201 54321', 14, 30);

  // Invoice Details Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', 14, 45);

  doc.setFont('helvetica', 'normal');
  doc.text('Invoice No: APX-2026-1106', 14, 52);
  doc.text('Invoice Date: 06-Nov-2026', 14, 58);
  doc.text('GSTIN: 27AABCA1234F1Z8', 14, 64);

  // Customer / Vehicle Details
  doc.text('Customer: John Doe', 120, 52);
  doc.text('Vehicle: Honda City 1.5V MT', 120, 58);
  doc.text('Registration: MH 02 BG 4821', 120, 64);
  doc.text('Odometer: 148,500 km', 120, 70);

  // Line items
  const items = [
    ['1', 'AC Compressor Magnetic Clutch Coil (Genuine)', '1', 'INR 2,200.00', 'INR 2,200.00'],
    ['2', 'Compressor Shaft Seal & Bearing Kit', '1', 'INR 1,400.00', 'INR 1,400.00'],
    ['3', 'High-Pressure Relief Valve & O-Ring Set', '1', 'INR 400.00', 'INR 400.00'],
    ['4', 'AC Compressor Overhaul & Fitting Labour', '1', 'INR 1,500.00', 'INR 1,500.00'],
    ['5', 'Diagnostic Leak Test & Pressure Vacuuming', '1', 'INR 500.00', 'INR 500.00'],
  ];

  doc.autoTable({
    startY: 78,
    head: [['#', 'Description of Work / Component Replaced', 'Qty', 'Unit Price', 'Total']],
    body: items,
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255] },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 95 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
  });

  const finalY = doc.lastAutoTable.finalY + 8;

  // Totals Breakdown
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 130, finalY);
  doc.text('INR 6,000.00', 190, finalY, { align: 'right' });

  doc.text('Discount:', 130, finalY + 6);
  doc.text('- INR 200.00', 190, finalY + 6, { align: 'right' });

  doc.text('CGST + SGST (Included):', 130, finalY + 12);
  doc.text('INR 700.00', 190, finalY + 12, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('NET TOTAL PAID:', 130, finalY + 20);
  doc.text('INR 6,000.00', 190, finalY + 20, { align: 'right' });

  // Warranty Box
  doc.setFillColor(254, 243, 199); // amber-100
  doc.roundedRect(14, finalY, 105, 28, 2, 2, 'F');
  doc.setTextColor(146, 64, 14); // amber-800
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('WARRANTY CERTIFICATE', 18, finalY + 8);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Warranty Duration: 3 MONTHS (Valid till 06-Feb-2027)', 18, finalY + 14);
  doc.text('Covers magnetic coil, compressor bearing & seal workmanship.', 18, finalY + 19);
  doc.text('Present this original invoice for free warranty claims.', 18, finalY + 24);

  // Footer Signature
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.text('Authorized Signatory:', 140, finalY + 40);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Apex Auto Cooling Works (Rajesh K.)', 140, finalY + 48);

  const outputPath = path.join(process.cwd(), 'public', 'sample-invoices', 'apex-auto-ac-repair-6000.pdf');
  fs.writeFileSync(outputPath, Buffer.from(doc.output('arraybuffer')));
  console.log('Created:', outputPath);
}

// 2. Generate sample Honda servicing invoice PDF
function createHondaServicePDF() {
  const doc = new jsPDF();
  doc.setFillColor(220, 38, 38); // Honda red
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('HONDA AUTHORIZED SERVICE CENTER', 14, 18);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Link Road, Andheri West, Mumbai | GSTIN: 27AAACH8821K1ZF', 14, 25);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.text('Invoice # HND-SRV-9428 | Service Date: 12-Jun-2026', 14, 40);
  doc.text('Vehicle: Honda City (MH 02 BG 4821) | 140,000 km Service', 14, 46);

  const items = [
    ['1', 'Engine Oil Full Synthetic 0W-20 (3.6L)', '1', '2100.00', '2100.00'],
    ['2', 'Honda Genuine Oil Filter', '1', '350.00', '350.00'],
    ['3', 'Engine Air Filter Cartridge', '1', '650.00', '650.00'],
    ['4', 'Periodic Maintenance Labour & Caliper Service', '1', '1400.00', '1400.00'],
  ];

  doc.autoTable({
    startY: 55,
    head: [['#', 'Item / Service', 'Qty', 'Rate', 'Amount (INR)']],
    body: items,
    headStyles: { fillColor: [220, 38, 38] },
  });

  doc.setFont('helvetica', 'bold');
  doc.text('Total Paid: INR 4,500.00', 140, doc.lastAutoTable.finalY + 15);

  const outputPath = path.join(process.cwd(), 'public', 'sample-invoices', 'honda-general-service-4500.pdf');
  fs.writeFileSync(outputPath, Buffer.from(doc.output('arraybuffer')));
  console.log('Created:', outputPath);
}

createApexInvoicePDF();
createHondaServicePDF();
