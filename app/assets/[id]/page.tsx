'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Layers,
  ArrowLeft,
  Calendar,
  Receipt,
  ShieldCheck,
  Clock,
  Wrench,
  Download,
  QrCode,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  PlusCircle,
  Filter,
  Car,
  Tag,
  Info,
  MapPin,
  ChevronDown
} from 'lucide-react';

export default function AssetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assetId = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<string>('All');
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'documents' | 'warranties' | 'reminders'>('timeline');

  useEffect(() => {
    if (!assetId) return;
    fetch(`/api/assets/${assetId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.error) throw new Error(res.error);
        setData(res);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [assetId]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
        <p className="text-xs text-slate-500 mt-2">Opening asset vault...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Unable to load asset</h2>
        <p className="text-xs text-slate-500">{error || 'Asset not found.'}</p>
        <button
          onClick={() => router.push('/assets')}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          Back to Assets
        </button>
      </div>
    );
  }

  const { asset, serviceRecords, documents, warranties, reminders, distinctComponents, stats } = data;

  // Filter service records by component
  const filteredRecords = serviceRecords.filter((s: any) => {
    if (selectedComponent === 'All') return true;
    return s.component.toLowerCase().includes(selectedComponent.toLowerCase());
  });

  // Check active repair warranties
  const today = new Date().toISOString().split('T')[0];
  const activeRepairWarranties = warranties.filter(
    (w: any) => w.claim_status === 'active' && w.expiry_date >= today
  );

  return (
    <div className="space-y-6">
      {/* Top Back & Action Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => router.push('/assets')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-semibold shadow-sm transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All Assets</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Printable QR Tag */}
          <button
            onClick={() => setShowQRModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
          >
            <QrCode className="h-3.5 w-3.5 text-teal-600" />
            <span>Asset QR Label</span>
          </button>

          {/* Export Report */}
          <a
            href={`/api/assets/${asset.id}/claim-report?type=expense`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="h-3.5 w-3.5 text-slate-600" />
            <span>Export Statement</span>
          </a>

          {/* Scan Bill against this Asset */}
          <button
            onClick={() => router.push(`/bills/upload?assetId=${asset.id}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Add Bill</span>
          </button>
        </div>
      </div>

      {/* Active Warranty Notice Alert Banner */}
      {activeRepairWarranties.length > 0 && (
        <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-4.5 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-200/60 text-amber-900 shrink-0 mt-0.5">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Active Service Warranty In Effect
              </div>
              <p className="text-sm font-semibold mt-0.5">
                {activeRepairWarranties[0].component} warranty active until{' '}
                <span className="underline font-bold">{activeRepairWarranties[0].expiry_date}</span>
                {' '}(Provider: {activeRepairWarranties[0].provider})
              </p>
              <p className="text-xs text-amber-800/90 mt-0.5">
                If component malfunctions again, present the verified invoice for free warranty re-repair.
              </p>
            </div>
          </div>
          <a
            href={`/api/assets/${asset.id}/claim-report?type=claim&warrantyId=${activeRepairWarranties[0].id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Claim Dossier (PDF)</span>
          </a>
        </div>
      )}

      {/* Asset Hero Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-5">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
              {asset.photos && asset.photos[0] ? (
                <img src={asset.photos[0]} alt={asset.name} className="h-full w-full object-cover" />
              ) : (
                <Layers className="h-10 w-10 text-slate-400" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
                  {asset.category_name}
                </span>
                {asset.registration_number && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-300 text-slate-950">
                    {asset.registration_number}
                  </span>
                )}
                <span className="text-xs text-slate-400">ID: {asset.qr_code_id}</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{asset.name}</h1>
              <p className="text-sm text-slate-500 font-medium">
                {asset.brand} • {asset.model} {asset.serial_number ? `• Serial: ${asset.serial_number}` : ''}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Purchase Price</span>
              <span className="text-sm font-bold text-slate-900">
                ₹{Number(asset.purchase_price).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Maintenance</span>
              <span className="text-sm font-bold text-indigo-600">
                ₹{stats.totalMaintenanceSpend.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Lifetime Cost</span>
              <span className="text-sm font-bold text-slate-900">
                ₹{stats.totalLifetimeCost.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Specs Strip */}
        <div className="px-6 sm:px-8 py-3.5 bg-slate-50/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Location</span>
            <span className="font-semibold text-slate-800">{asset.location || 'Home'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Purchase Date</span>
            <span className="font-semibold text-slate-800">{asset.purchase_date || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Seller / Dealer</span>
            <span className="font-semibold text-slate-800">{asset.seller_name || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Dealer Contact</span>
            <span className="font-semibold text-slate-800">{asset.dealer_contact || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex items-center space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'timeline'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="h-4 w-4" />
          <span>Chronological Service History ({serviceRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'documents'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>Original Invoices & Bills ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('warranties')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'warranties'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Warranty Records ({warranties.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'reminders'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Maintenance Reminders ({reminders.length})</span>
        </button>
      </div>

      {/* TAB 1: Chronological Service History & Component-Level Filter */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          {/* Component-Level Filter Pills (Exact Requirement from Section 7) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Filter by Component:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedComponent('All')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  selectedComponent === 'All'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Components ({serviceRecords.length})
              </button>
              {distinctComponents.map((comp: string) => (
                <button
                  key={comp}
                  onClick={() => setSelectedComponent(comp)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedComponent === comp
                      ? 'bg-teal-700 text-white'
                      : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/60'
                  }`}
                >
                  {comp}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline List */}
          {filteredRecords.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
              {filteredRecords.map((record: any) => {
                const isWarrantyActive =
                  record.warranty_duration_months > 0 &&
                  record.warranty_expiry_date &&
                  record.warranty_expiry_date >= today;

                return (
                  <div key={record.id} className="p-6 hover:bg-slate-50/60 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold font-mono bg-slate-100 text-slate-800 border border-slate-200">
                          {record.service_date}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          Inv #{record.invoice_number || 'N/A'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            record.service_type === 'repair'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-sky-50 text-sky-700 border border-sky-200'
                          }`}
                        >
                          {record.service_type === 'repair' ? 'Repair' : 'Routine Servicing'}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-bold text-slate-900">
                          ₹{Number(record.total_amount).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-slate-400 block">{record.payment_mode || 'Paid'}</span>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-teal-900">{record.component}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-600">{record.vendor_name}</span>
                        {record.gstin && (
                          <span className="text-[10px] font-mono text-slate-400">GST: {record.gstin}</span>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">{record.description_of_work}</p>

                      {/* Spare parts itemization */}
                      {record.spare_parts_replaced && record.spare_parts_replaced.length > 0 && (
                        <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Parts Replaced:
                          </span>
                          {record.spare_parts_replaced.map((p: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-slate-600">
                              <span>• {p.name} (Qty: {p.quantity})</span>
                              <span className="font-semibold text-slate-800">
                                ₹{Number(p.total_price || p.unit_price).toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Warranty Status on this repair */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 mt-3 text-xs">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-teal-600" />
                          <span className="text-slate-600">
                            Repair Warranty:{' '}
                            <strong>{record.warranty_duration_months || 0} Months</strong>{' '}
                            {record.warranty_expiry_date ? `(Valid till ${record.warranty_expiry_date})` : ''}
                          </span>
                          {isWarrantyActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Active Coverage
                            </span>
                          )}
                        </div>

                        {record.document_id && (
                          <a
                            href={`/sample-invoices/apex-auto-ac-repair-6000.pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-semibold"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>View Original Invoice PDF</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              No service records found for component "{selectedComponent}".
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Original Documents Vault */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
          <div className="p-4.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Preserved Original Purchase Bills & Service Invoices
            </span>
            <span className="text-xs text-slate-400">Total: {documents.length} Files</span>
          </div>

          {documents.map((doc: any) => (
            <div key={doc.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{doc.file_name}</h4>
                  <p className="text-xs text-slate-500">
                    Uploaded on {doc.created_at?.split('T')[0]} • Size: {(doc.file_size / 1024).toFixed(1)} KB • Type: {doc.document_type}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                    SHA-256: {doc.file_hash?.substring(0, 20)}...
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={doc.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-sm"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-teal-600" />
                  <span>View Original</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Warranties */}
      {activeTab === 'warranties' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
          {warranties.map((w: any) => {
            const isActive = w.claim_status === 'active' && w.expiry_date >= today;
            return (
              <div key={w.id} className="p-6 hover:bg-slate-50/60 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">{w.component}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        w.warranty_type === 'repair_service'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {w.warranty_type === 'repair_service' ? 'Repair Warranty' : 'Manufacturer Warranty'}
                    </span>
                    {isActive ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        Expired
                      </span>
                    )}
                  </div>

                  <a
                    href={`/api/assets/${asset.id}/claim-report?type=claim&warrantyId=${w.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition-all shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Claim Dossier (PDF)</span>
                  </a>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Start Date</span>
                    <span className="font-semibold text-slate-800">{w.start_date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Expiry Date</span>
                    <span className="font-semibold text-slate-800">{w.expiry_date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Provider</span>
                    <span className="font-semibold text-slate-800">{w.provider}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
                    <span className="font-semibold text-slate-800">{w.duration_months} Months</span>
                  </div>
                </div>

                {w.conditions && (
                  <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <strong>Conditions:</strong> {w.conditions}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: Reminders */}
      {activeTab === 'reminders' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
          {reminders.map((r: any) => (
            <div key={r.id} className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{r.title}</h4>
                  <p className="text-xs text-slate-500">{r.activity}</p>
                  <p className="text-[11px] text-teal-600 font-medium mt-0.5">
                    Anchor Service Date: {r.reference_date} • Frequency: {r.frequency}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-900 block">
                  Next Due: {r.next_due_date}
                </span>
                <span className="text-[10px] font-semibold text-amber-600 uppercase">Active Schedule</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Asset Digital QR Label</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  typeof window !== 'undefined' ? `${window.location.origin}/assets/${asset.id}?qr=1` : ''
                )}`}
                alt="Asset QR"
                className="h-44 w-44 rounded-lg shadow-sm"
              />
              <p className="text-xs font-bold text-slate-800 mt-3">{asset.name}</p>
              <p className="text-[11px] font-mono text-slate-500">{asset.qr_code_id}</p>
            </div>

            <p className="text-xs text-slate-500">
              Scanning this QR tag with any camera opens this asset's service & warranty history after secure authentication.
            </p>

            <div className="pt-2">
              <a
                href={`/api/assets/${asset.id}/qr?format=pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span>Download Printable Sticker Label (PDF)</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
