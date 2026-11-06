'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Layers,
  Search,
  PlusCircle,
  Car,
  Tv,
  Smartphone,
  Package,
  QrCode,
  ArrowRight,
  Filter,
  Calendar,
  ShieldCheck,
  Wrench
} from 'lucide-react';

export default function AssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/assets').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
    ])
      .then(([assetsData, categoriesData]) => {
        setAssets(assetsData?.assets || []);
        setCategories(categoriesData?.categories || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const sections = ['All', 'Vehicles', 'Household', 'Electronics', 'Other'];

  const filteredAssets = assets.filter((a) => {
    // Section filter
    if (selectedSection !== 'All' && a.category_section !== selectedSection) {
      return false;
    }
    // Specific category filter
    if (selectedCategoryId !== 'All' && a.category_id !== selectedCategoryId) {
      return false;
    }
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = a.name.toLowerCase().includes(q);
      const matchBrand = a.brand.toLowerCase().includes(q);
      const matchModel = a.model.toLowerCase().includes(q);
      const matchReg = a.registration_number && a.registration_number.toLowerCase().includes(q);
      const matchSerial = a.serial_number && a.serial_number.toLowerCase().includes(q);
      return matchName || matchBrand || matchModel || matchReg || matchSerial;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Your Registered Assets</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Every appliance, vehicle, and electronic device with its permanent chronological digital record.
          </p>
        </div>
        <button
          onClick={() => router.push('/assets/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-all shadow-sm shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Register New Asset</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by asset name, brand, model, registration #, or serial..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/30 focus:outline-none"
            />
          </div>

          {/* Section Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {sections.map((sec) => (
              <button
                key={sec}
                onClick={() => {
                  setSelectedSection(sec);
                  setSelectedCategoryId('All');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedSection === sec
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
          <p className="text-xs text-slate-500 mt-2">Loading asset vault...</p>
        </div>
      ) : filteredAssets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => router.push(`/assets/${asset.id}`)}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group cursor-pointer"
            >
              <div>
                {/* Photo / Graphic Banner */}
                <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                  {asset.photos && asset.photos[0] ? (
                    <img
                      src={asset.photos[0]}
                      alt={asset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                      <Layers className="h-10 w-10 text-slate-300" />
                      <span className="text-[11px] font-medium mt-1">AssetCare Vault</span>
                    </div>
                  )}

                  {/* Section Badge */}
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-900/80 backdrop-blur-md text-white border border-white/10">
                    {asset.category_section || 'Asset'}
                  </span>

                  {/* Vehicle Registration Badge */}
                  {asset.registration_number && (
                    <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-400 text-slate-950 shadow-sm">
                      {asset.registration_number}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-5 space-y-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-600 transition-colors line-clamp-1">
                      {asset.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {asset.brand} • {asset.model}
                    </p>
                  </div>

                  <div className="pt-2 grid grid-cols-2 gap-2 text-xs text-slate-600 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Purchase Price</span>
                      <span className="font-semibold text-slate-800">
                        ₹{Number(asset.purchase_price).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Location</span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {asset.location || 'Home'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-teal-600 flex items-center gap-1">
                  <span>Open History</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                  {asset.category_name}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No assets found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords or section filters, or click below to register a new appliance or vehicle.
          </p>
          <button
            onClick={() => router.push('/assets/new')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold text-xs hover:bg-teal-500 shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Register First Asset</span>
          </button>
        </div>
      )}
    </div>
  );
}
