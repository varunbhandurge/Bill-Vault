'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

function BillUploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedAssetId = searchParams?.get('assetId');

  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(preselectedAssetId || '');
  const [documentType, setDocumentType] = useState<string>('repair_invoice');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [assetMatches, setAssetMatches] = useState<any[]>([]);
  const [warrantyAlert, setWarrantyAlert] = useState<any>(null);
  const [uploadedDoc, setUploadedDoc] = useState<any>(null);

  useEffect(() => {
    fetch('/api/assets')
      .then((r) => r.json())
      .then((data) => {
        setAssets(data?.assets || []);
      });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError('');
      setOcrResult(null);
      setAssetMatches([]);
      setWarrantyAlert(null);
      setUploadedDoc(null);

      if (selected.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(selected));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleUploadAndScan = async () => {
    if (!file) {
      setError('Please choose or photograph an invoice first.');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress('Uploading document & computing SHA-256 hash...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (selectedAssetId) formData.append('asset_id', selectedAssetId);
      formData.append('document_type', documentType);
      formData.append('auto_ocr', 'true');

      setUploadProgress('Running local OCR text extraction & pattern parsing...');

      const res = await fetch('/api/bills/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.isDuplicate) {
          throw new Error(`Duplicate File Detected: ${data.error}`);
        }
        throw new Error(data.error || 'Failed to process document.');
      }

      setUploadedDoc(data.document);
      setOcrResult(data.ocrResult);
      setAssetMatches(data.assetMatches || []);
      setWarrantyAlert(data.warrantyAlert);

      if (!selectedAssetId && data.assetMatches && data.assetMatches.length > 0) {
        setSelectedAssetId(data.assetMatches[0].asset.id);
      }

      setUploadProgress('Extraction complete! Ready for side-by-side verification.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Intelligent Bill Scanner & OCR Studio</h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload or capture any purchase bill, repair invoice, or service receipt. Our local OCR engine automatically extracts invoice numbers, components, dates, warranty periods, and GST details.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {warrantyAlert && warrantyAlert.hasActiveWarranty && (
        <div className="p-4.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-3 shadow-sm">
          <ShieldCheck className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <span className="font-bold uppercase tracking-wider text-amber-800 block">
              Active Warranty Detected
            </span>
            <p className="font-medium mt-0.5">{warrantyAlert.alertMessage}</p>
          </div>
        </div>
      )}

      {!ocrResult ? (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Target Asset
              </label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-teal-500/30 focus:outline-none bg-white text-slate-900"
              >
                <option value="">Auto-Detect from Invoice Content</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.brand} {a.registration_number ? `- ${a.registration_number}` : ''})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Document Category
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-teal-500/30 focus:outline-none bg-white text-slate-900"
              >
                <option value="repair_invoice">Repair Invoice</option>
                <option value="service_invoice">Periodic Service Invoice</option>
                <option value="purchase_invoice">Original Purchase Bill</option>
                <option value="warranty_certificate">Warranty Certificate</option>
                <option value="insurance_document">Vehicle / Asset Insurance</option>
                <option value="other">Other Supporting Document</option>
              </select>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-8 text-center transition-colors relative bg-slate-50/50">
            <input
              type="file"
              accept="image/*,.pdf"
              capture="environment"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-3.5 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100">
                <UploadCloud className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {file ? file.name : 'Tap to photograph bill or drop invoice file here'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports Camera Capture, PDF Invoices, JPG, PNG (Multi-page PDF supported)
                </p>
              </div>
              {file && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Selected: {(file.size / 1024).toFixed(1)} KB</span>
                </div>
              )}
            </div>
          </div>

          {previewUrl && (
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center max-h-60 overflow-hidden">
              <img src={previewUrl} alt="Invoice Preview" className="max-h-56 object-contain rounded-lg" />
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleUploadAndScan}
              disabled={!file || uploading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                  <span>{uploadProgress || 'Processing OCR...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Secure in Vault & Run OCR Scan</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-teal-700">
              <CheckCircle2 className="h-6 w-6" />
              <div>
                <h3 className="text-base font-bold text-slate-900">OCR Extraction Completed</h3>
                <p className="text-xs text-slate-500">
                  Confidence Score: <strong>{ocrResult.confidenceScore}%</strong> • Document secured in vault
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setOcrResult(null);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Upload Another
            </button>
          </div>

          {assetMatches.length > 0 && (
            <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200 text-teal-950 space-y-2">
              <div className="flex items-center gap-2 text-teal-900 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-teal-600" />
                <span>Intelligent Asset Match Found ({Math.round(assetMatches[0].confidence * 100)}% Confidence)</span>
              </div>
              <p className="text-sm font-semibold">
                Suggested Asset: <span className="underline">{assetMatches[0].asset.name}</span>
              </p>
              <div className="text-xs text-teal-800 space-y-0.5">
                {assetMatches[0].matchReasons.map((r: string, idx: number) => (
                  <div key={idx}>• {r}</div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Vendor</span>
              <span className="font-bold text-slate-800 truncate block">
                {ocrResult.extractedData.vendor_name || 'Not detected'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Invoice Number</span>
              <span className="font-bold text-slate-800 truncate block">
                {ocrResult.extractedData.invoice_number || 'Not detected'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Service Date</span>
              <span className="font-bold text-slate-800">
                {ocrResult.extractedData.service_date || ocrResult.extractedData.invoice_date || 'Not detected'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Component</span>
              <span className="font-bold text-teal-700">
                {ocrResult.extractedData.product_or_component || 'Not detected'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Amount</span>
              <span className="font-bold text-slate-900">
                ₹{Number(ocrResult.extractedData.total_amount || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Warranty Period</span>
              <span className="font-bold text-slate-800">
                {ocrResult.extractedData.warranty_duration_months || 0} Months
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => {
                if (uploadedDoc) {
                  router.push(`/bills/verify/${uploadedDoc.id}?ocrId=${ocrResult.ocrRecordId}&assetId=${selectedAssetId}`);
                }
              }}
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
            >
              <span>Proceed to Side-by-Side Verification Screen</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BillUploadPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-20">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
        <p className="text-xs text-slate-500 mt-2">Loading bill scanner...</p>
      </div>
    }>
      <BillUploadContent />
    </Suspense>
  );
}
