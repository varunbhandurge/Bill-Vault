'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  FileText,
  Save,
  PlusCircle,
  HelpCircle,
  Eye,
  Calendar,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

function OCRVerificationContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const documentId = params?.id as string;
  const ocrIdParam = searchParams?.get('ocrId');
  const assetIdParam = searchParams?.get('assetId');

  const [document, setDocument] = useState<any>(null);
  const [ocrRecord, setOcrRecord] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [warrantyAlert, setWarrantyAlert] = useState<any>(null);

  // Editable Form Fields
  const [form, setForm] = useState<any>({
    assetId: assetIdParam || '',
    invoiceNumber: '',
    serviceDate: '',
    invoiceDate: '',
    vendorName: '',
    vendorAddress: '',
    vendorPhone: '',
    gstin: '',
    serviceType: 'repair',
    component: '',
    descriptionOfWork: '',
    labourCharges: '0',
    materialCharges: '0',
    discount: '0',
    gstAmount: '0',
    totalAmount: '0',
    paymentMode: 'UPI / Card',
    warrantyDurationMonths: '0',
    updateReminderSchedule: true,
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/bills/${documentId}`).then((r) => r.json()),
      fetch('/api/assets').then((r) => r.json()),
    ])
      .then(([docRes, assetsRes]) => {
        if (docRes.error) throw new Error(docRes.error);
        setDocument(docRes.document);
        setOcrRecord(docRes.ocrRecord);
        const assetList = assetsRes.assets || [];
        setAssets(assetList);

        const extracted = docRes.ocrRecord?.structured_data || {};
        const baseDate = extracted.service_date || extracted.invoice_date || new Date().toISOString().split('T')[0];

        setForm((prev: any) => ({
          ...prev,
          assetId: prev.assetId || docRes.document.asset_id || (assetList[0]?.id || ''),
          invoiceNumber: extracted.invoice_number || '',
          serviceDate: baseDate,
          invoiceDate: extracted.invoice_date || baseDate,
          vendorName: extracted.vendor_name || '',
          vendorAddress: extracted.vendor_address || '',
          vendorPhone: extracted.vendor_phone || '',
          gstin: extracted.gstin || '',
          component: extracted.product_or_component || 'AC Compressor',
          descriptionOfWork: extracted.description_of_work || '',
          labourCharges: extracted.labour_charges?.toString() || '0',
          materialCharges: extracted.material_charges?.toString() || '0',
          discount: extracted.discount?.toString() || '0',
          gstAmount: extracted.gst_amount?.toString() || '0',
          totalAmount: extracted.total_amount?.toString() || '0',
          paymentMode: extracted.payment_mode || 'UPI / Card',
          warrantyDurationMonths: extracted.warranty_duration_months?.toString() || '0',
        }));

        if (docRes.document.asset_id && extracted.product_or_component) {
          fetch(`/api/warranties/check-active?assetId=${docRes.document.asset_id}&component=${encodeURIComponent(extracted.product_or_component)}`)
            .then((r) => r.json())
            .then((data) => setWarrantyAlert(data))
            .catch(() => {});
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [documentId]);

  const handleComponentBlur = () => {
    if (form.assetId && form.component) {
      fetch(`/api/warranties/check-active?assetId=${form.assetId}&component=${encodeURIComponent(form.component)}`)
        .then((r) => r.json())
        .then((data) => setWarrantyAlert(data))
        .catch(() => {});
    }
  };

  const handleVerifyAndCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/bills/ocr/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocrRecordId: ocrRecord?.id,
          documentId,
          assetId: form.assetId,
          invoiceNumber: form.invoiceNumber,
          serviceDate: form.serviceDate,
          vendorName: form.vendorName,
          vendorAddress: form.vendorAddress,
          vendorPhone: form.vendorPhone,
          gstin: form.gstin,
          serviceType: form.serviceType,
          component: form.component,
          descriptionOfWork: form.descriptionOfWork,
          labourCharges: parseFloat(form.labourCharges) || 0,
          materialCharges: parseFloat(form.materialCharges) || 0,
          discount: parseFloat(form.discount) || 0,
          gstAmount: parseFloat(form.gstAmount) || 0,
          totalAmount: parseFloat(form.totalAmount) || 0,
          paymentMode: form.paymentMode,
          warrantyDurationMonths: parseInt(form.warrantyDurationMonths, 10) || 0,
          updateReminderSchedule: form.updateReminderSchedule,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify invoice.');
      }

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      setTimeout(() => {
        router.push(`/assets/${form.assetId}`);
      }, 1200);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
        <p className="text-xs text-slate-500 mt-2">Opening verification studio...</p>
      </div>
    );
  }

  const confidence = ocrRecord?.structured_data?.confidence_scores || {};
  const isFieldLowConfidence = (field: string) => {
    return (confidence[field] || 0) < 0.75;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Side-by-Side OCR Verification Studio
            </h1>
            <p className="text-xs text-slate-500">
              Verify extracted invoice fields against the original preserved document before permanent commitment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Overall Confidence: {ocrRecord?.confidence_score || 88}%</span>
          </span>
        </div>
      </div>

      {warrantyAlert && warrantyAlert.hasActiveWarranty && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-3 shadow-sm">
          <ShieldCheck className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <span className="font-bold uppercase tracking-wider text-amber-800 block">
              Active Warranty Protection Alert
            </span>
            <p className="font-medium mt-0.5">{warrantyAlert.alertMessage}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Original Invoice Viewer */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden sticky top-20">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-teal-400" />
              <span className="text-xs font-bold tracking-wide">Original Invoice Document</span>
            </div>
            <a
              href={document?.file_path || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-teal-400 hover:text-teal-300 underline flex items-center gap-1"
            >
              <span>Full Screen</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="p-3 bg-slate-100 min-h-[500px] max-h-[750px] overflow-auto flex items-center justify-center">
            {document?.mime_type?.includes('pdf') || document?.file_name?.endsWith('.pdf') ? (
              <iframe
                src={`${document.file_path}#toolbar=0`}
                className="w-full h-[650px] rounded-lg border border-slate-300 shadow-sm bg-white"
                title="Invoice PDF"
              />
            ) : (
              <img
                src={document?.file_path}
                alt="Invoice Original"
                className="w-full object-contain max-h-[650px] rounded-lg shadow-sm"
              />
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 font-mono truncate">
            SHA-256: {document?.file_hash}
          </div>
        </div>

        {/* Right Column: Editable Verified Fields */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-7">
          <form onSubmit={handleVerifyAndCommit} className="space-y-5">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Assign to Asset *
              </label>
              <select
                required
                value={form.assetId}
                onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-teal-500/30 focus:outline-none bg-white text-slate-900"
              >
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.brand} - {a.model} {a.registration_number ? `[${a.registration_number}]` : ''})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Vendor / Workshop Name *</label>
                  {isFieldLowConfidence('vendor_name') && (
                    <span className="text-[10px] text-amber-600 font-bold">Needs Review</span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={form.vendorName}
                  onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-teal-500/30 focus:outline-none ${
                    isFieldLowConfidence('vendor_name') ? 'border-amber-300 bg-amber-50/30' : 'border-slate-300'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Invoice / Bill Number</label>
                  {isFieldLowConfidence('invoice_number') && (
                    <span className="text-[10px] text-amber-600 font-bold">Needs Review</span>
                  )}
                </div>
                <input
                  type="text"
                  value={form.invoiceNumber}
                  onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                  placeholder="e.g. APX-2026-1106"
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono focus:ring-2 focus:ring-teal-500/30 focus:outline-none ${
                    isFieldLowConfidence('invoice_number') ? 'border-amber-300 bg-amber-50/30' : 'border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Date *</label>
                <input
                  type="date"
                  required
                  value={form.serviceDate}
                  onChange={(e) => setForm({ ...form, serviceDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor GSTIN</label>
                <input
                  type="text"
                  value={form.gstin}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                  placeholder="e.g. 27AABCA1234F1Z8"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-teal-500/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Phone</label>
                <input
                  type="text"
                  value={form.vendorPhone}
                  onChange={(e) => setForm({ ...form, vendorPhone: e.target.value })}
                  placeholder="+91 98201 54321"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                <input
                  type="text"
                  value={form.paymentMode}
                  onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                  placeholder="UPI, Card, Cash"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500/30 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Component Repaired / Serviced *</label>
                    <span className="text-[10px] text-teal-600 font-medium">Auto-Categorized</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={form.component}
                    onBlur={handleComponentBlur}
                    onChange={(e) => setForm({ ...form, component: e.target.value })}
                    placeholder="e.g. AC Compressor, Battery, Water Purifier Filter"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-teal-900 focus:ring-2 focus:ring-teal-500/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Service Type</label>
                  <select
                    value={form.serviceType}
                    onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500/30 focus:outline-none bg-white"
                  >
                    <option value="repair">Repair Work</option>
                    <option value="general_servicing">General Servicing</option>
                    <option value="routine_maintenance">Routine Maintenance</option>
                    <option value="inspection">Inspection / Diagnostics</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description of Work Performed</label>
                <textarea
                  rows={2}
                  value={form.descriptionOfWork}
                  onChange={(e) => setForm({ ...form, descriptionOfWork: e.target.value })}
                  placeholder="Details of repair, replacement, or testing..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500/30 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Financial Breakdown (₹)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Labour Charges</label>
                  <input
                    type="number"
                    value={form.labourCharges}
                    onChange={(e) => setForm({ ...form, labourCharges: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Material / Parts</label>
                  <input
                    type="number"
                    value={form.materialCharges}
                    onChange={(e) => setForm({ ...form, materialCharges: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Discount</label>
                  <input
                    type="number"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-teal-800 mb-1">Total Paid *</label>
                  <input
                    type="number"
                    required
                    value={form.totalAmount}
                    onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border-2 border-teal-500 font-bold text-sm text-slate-900 bg-teal-50/20"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-teal-950 block">Repair Warranty Duration</label>
                  <span className="text-[11px] text-teal-800">Months of free service/replacement guarantee</span>
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    value={form.warrantyDurationMonths}
                    onChange={(e) => setForm({ ...form, warrantyDurationMonths: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-teal-300 text-xs font-bold text-teal-950 bg-white"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 pt-2 border-t border-teal-200/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.updateReminderSchedule}
                  onChange={(e) => setForm({ ...form, updateReminderSchedule: e.target.checked })}
                  className="mt-0.5 rounded border-teal-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-xs text-teal-900 leading-tight">
                  <strong>Sync Maintenance Schedule:</strong> Reset periodic reminder clock using this invoice's service date as the new reference date.
                </span>
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Verify & Commit Invoice to Permanent Vault</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function OCRVerificationPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-20">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
        <p className="text-xs text-slate-500 mt-2">Loading verification studio...</p>
      </div>
    }>
      <OCRVerificationContent />
    </Suspense>
  );
}
