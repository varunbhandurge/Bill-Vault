'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Search,
  Download,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  PlusCircle,
  FileText
} from 'lucide-react';

export default function WarrantiesPage() {
  const router = useRouter();
  const [warranties, setWarranties] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/warranties')
      .then((r) => r.json())
      .then((data) => {
        setWarranties(data?.warranties || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const filteredWarranties = warranties.filter((w) => {
    if (selectedType === 'active') {
      if (w.claim_status !== 'active' || w.expiry_date < today) return false;
    } else if (selectedType === 'repair_service') {
      if (w.warranty_type !== 'repair_service') return false;
    } else if (selectedType === 'manufacturer') {
      if (w.warranty_type !== 'manufacturer') return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchComp = w.component.toLowerCase().includes(q);
      const matchAsset = w.asset_name && w.asset_name.toLowerCase().includes(q);
      const matchProvider = w.provider.toLowerCase().includes(q);
      return matchComp || matchAsset || matchProvider;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Warranty & Claim Tracker</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Active manufacturer guarantees and service/repair warranty protection records.
          </p>
        </div>
        <button
          onClick={() => router.push('/bills/upload')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-all shadow-sm shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Upload Warranty Certificate</span>
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
              placeholder="Search by component, asset name, or warranty provider..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/30 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Warranties' },
              { id: 'active', label: 'Active Coverage Only' },
              { id: 'repair_service', label: 'Service / Repair Warranties' },
              { id: 'manufacturer', label: 'Manufacturer Warranties' },
            ].map((t) => (
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

      {/* Warranties Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
          <p className="text-xs text-slate-500 mt-2">Loading warranty records...</p>
        </div>
      ) : filteredWarranties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredWarranties.map((w) => {
            const isActive = w.claim_status === 'active' && w.expiry_date >= today;

            return (
              <div
                key={w.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            w.warranty_type === 'repair_service'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {w.warranty_type === 'repair_service' ? 'Repair Warranty' : 'Manufacturer Guarantee'}
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
                      <h3 className="text-base font-bold text-slate-900 mt-1.5">{w.component}</h3>
                      <p className="text-xs font-semibold text-teal-700">{w.asset_name}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-900 block">{w.duration_months} Months</span>
                      <span className="text-[10px] text-slate-400 block">Coverage Duration</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Start Date</span>
                      <span className="font-semibold text-slate-800">{w.start_date}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Expiry Date</span>
                      <span className={`font-semibold ${isActive ? 'text-emerald-700 font-bold' : 'text-slate-800'}`}>
                        {w.expiry_date}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Provider</span>
                      <span className="font-semibold text-slate-800">{w.provider}</span>
                    </div>
                  </div>

                  {w.conditions && (
                    <p className="text-xs text-slate-500 bg-slate-50/50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                      <strong>Conditions:</strong> {w.conditions}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={`/api/assets/${w.asset_id}/claim-report?type=claim&warrantyId=${w.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Claim Dossier (PDF)</span>
                  </a>

                  <button
                    onClick={() => router.push(`/assets/${w.asset_id}`)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    <span>View Asset</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <ShieldCheck className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No warranty records found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you scan repair bills or purchase invoices with warranty terms, they are automatically logged here.
          </p>
        </div>
      )}
    </div>
  );
}
