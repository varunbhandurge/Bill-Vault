'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Receipt,
  Search,
  PlusCircle,
  FileText,
  Calendar,
  Layers,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function BillVaultPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bills')
      .then((r) => r.json())
      .then((data) => {
        setDocuments(data?.documents || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const docTypes = [
    { id: 'all', label: 'All Invoices' },
    { id: 'repair_invoice', label: 'Repair Invoices' },
    { id: 'service_invoice', label: 'Service Invoices' },
    { id: 'purchase_invoice', label: 'Purchase Bills' },
    { id: 'warranty_certificate', label: 'Warranty Cards' },
  ];

  const filteredDocs = documents.filter((d) => {
    if (selectedType !== 'all' && d.document_type !== selectedType) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = d.file_name.toLowerCase().includes(q);
      const matchAsset = d.asset_name && d.asset_name.toLowerCase().includes(q);
      return matchName || matchAsset;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Digital Bill & Document Vault</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Original, immutable purchase bills, repair receipts, and warranty cards linked to your assets.
          </p>
        </div>
        <button
          onClick={() => router.push('/bills/upload')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-all shadow-sm shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Upload / Scan New Bill</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by file name, invoice number, or asset name..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/30 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {docTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedType === t.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
          <p className="text-xs text-slate-500 mt-2">Loading documents from vault...</p>
        </div>
      ) : filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                    {doc.document_type.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1" title={doc.file_name}>
                    {doc.file_name}
                  </h3>
                  <p className="text-xs text-teal-700 font-semibold mt-0.5">
                    {doc.asset_name}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Uploaded: {doc.created_at?.split('T')[0]} • {(doc.file_size / 1024).toFixed(1)} KB
                  </p>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-mono text-slate-400 truncate">
                  SHA-256: {doc.file_hash}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={doc.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-teal-600" />
                  <span>Preview File</span>
                </a>

                <button
                  onClick={() => router.push(`/assets/${doc.asset_id}`)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
                >
                  <span>Asset History</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Receipt className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No documents found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Scan and upload purchase bills or service invoices to populate your secure vault.
          </p>
          <button
            onClick={() => router.push('/bills/upload')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold text-xs hover:bg-teal-500 shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Upload Invoice</span>
          </button>
        </div>
      )}
    </div>
  );
}
