import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rls-guard';
import { 
  dbOCRRecords, 
  dbDocuments, 
  dbServiceRecords, 
  dbWarranties, 
  dbReminders, 
  dbAssets, 
  dbAuditLogs 
} from '@/lib/db/db';
import { ServiceRecord, Warranty } from '@/lib/db/schema';
import { calculateNextDueDate } from '@/lib/notifications/scheduler';
import { checkActiveWarrantyForRepair } from '@/lib/ocr/matcher';

export async function POST(req: NextRequest) {
  const guard = requireAuth(req);
  if (!guard.allowed || !guard.user) return guard.response!;

  try {
    const body = await req.json();
    const {
      ocrRecordId,
      documentId,
      assetId,
      invoiceNumber,
      serviceDate,
      vendorName,
      vendorAddress,
      vendorPhone,
      gstin,
      serviceType,
      component,
      descriptionOfWork,
      spareParts,
      labourCharges,
      materialCharges,
      discount,
      gstAmount,
      totalAmount,
      paymentMode,
      warrantyDurationMonths,
      updateReminderSchedule,
    } = body;

    if (!documentId || !assetId || !serviceDate || !vendorName || !component || totalAmount === undefined) {
      return NextResponse.json(
        { error: 'Please provide Document, Asset, Service Date, Vendor, Component, and Total Amount.' },
        { status: 400 }
      );
    }

    const doc = dbDocuments.getById(documentId);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    const asset = dbAssets.getById(assetId);
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
    }

    // Check if previous repair warranty for this component was active
    const warrantyAlert = checkActiveWarrantyForRepair(assetId, component);

    // Calculate warranty expiry date
    let warrantyExpiryDate: string | undefined;
    const durMonths = Number(warrantyDurationMonths) || 0;
    if (durMonths > 0) {
      const d = new Date(serviceDate);
      d.setMonth(d.getMonth() + durMonths);
      warrantyExpiryDate = d.toISOString().split('T')[0];
    }

    // 1. Create Service Record
    const serviceRecordId = `svc-${Date.now()}`;
    const newServiceRecord: ServiceRecord = {
      id: serviceRecordId,
      asset_id: assetId,
      document_id: documentId,
      user_id: guard.user.userId,
      invoice_number: invoiceNumber || undefined,
      service_date: serviceDate,
      vendor_name: vendorName.trim(),
      vendor_address: vendorAddress || undefined,
      vendor_phone: vendorPhone || undefined,
      gstin: gstin || undefined,
      service_type: serviceType || 'repair',
      component: component.trim(),
      description_of_work: descriptionOfWork || `${component} repair and servicing`,
      spare_parts_replaced: spareParts || [],
      labour_charges: Number(labourCharges) || 0,
      material_charges: Number(materialCharges) || 0,
      discount: Number(discount) || 0,
      gst_amount: Number(gstAmount) || 0,
      total_amount: Number(totalAmount) || 0,
      payment_mode: paymentMode || 'UPI / Card',
      warranty_duration_months: durMonths,
      warranty_expiry_date: warrantyExpiryDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbServiceRecords.create(newServiceRecord);

    // Update document's asset_id if it was unassigned
    if (doc.asset_id !== assetId) {
      dbDocuments.update(doc.id, { asset_id: assetId });
    }

    // 2. If warranty duration > 0, create Warranty record
    let newWarranty: Warranty | null = null;
    if (durMonths > 0 && warrantyExpiryDate) {
      newWarranty = {
        id: `war-${Date.now()}`,
        asset_id: assetId,
        service_record_id: serviceRecordId,
        document_id: documentId,
        component: component.trim(),
        warranty_type: 'repair_service',
        start_date: serviceDate,
        duration_months: durMonths,
        expiry_date: warrantyExpiryDate,
        provider: vendorName.trim(),
        conditions: `Repair & service warranty on ${component} provided by ${vendorName}.`,
        claim_status: 'active',
        notes: `Recorded from verified invoice #${invoiceNumber || 'N/A'}.`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      dbWarranties.create(newWarranty);
    }

    // 3. Mark OCR Record as verified
    if (ocrRecordId) {
      dbOCRRecords.update(ocrRecordId, {
        status: 'verified',
        verified_by: guard.user.userId,
        verified_at: new Date().toISOString(),
      });
    }

    // 4. Maintenance Reminder Schedule Update (Section 9 Requirement)
    let updatedReminder = null;
    if (updateReminderSchedule !== false) {
      // Find existing reminder for this asset that covers servicing/component
      const reminders = dbReminders.getAll({ assetId });
      const matchingReminder = reminders.find(
        (r) =>
          r.activity.toLowerCase().includes(component.toLowerCase()) ||
          r.title.toLowerCase().includes('service') ||
          r.title.toLowerCase().includes('maintenance')
      );

      if (matchingReminder) {
        const nextDue = calculateNextDueDate(
          serviceDate,
          matchingReminder.frequency,
          matchingReminder.custom_interval_days
        );
        updatedReminder = dbReminders.update(matchingReminder.id, {
          reference_date: serviceDate,
          next_due_date: nextDue,
        });
      }
    }

    // Audit Log
    dbAuditLogs.create({
      id: `audit-${Date.now()}`,
      user_id: guard.user.userId,
      username: guard.user.username,
      action: 'INVOICE_VERIFIED_AND_SAVED',
      entity_type: 'service_record',
      entity_id: serviceRecordId,
      details: {
        assetName: asset.name,
        component,
        amount: totalAmount,
        vendor: vendorName,
        warrantyMonths: durMonths,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      serviceRecord: newServiceRecord,
      warranty: newWarranty,
      updatedReminder,
      warrantyAlert,
      message: 'Invoice verified and committed to asset service record.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Verification submission failed.' },
      { status: 500 }
    );
  }
}
