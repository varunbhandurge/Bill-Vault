'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Download,
  Calendar,
  Layers,
  Wrench,
  TrendingUp,
  Receipt,
  PieChart as PieIcon,
  ChevronRight,
  ArrowRight,
  FileSpreadsheet
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
        <p className="text-xs text-slate-500 mt-2">Aggregating expenditure records...</p>
      </div>
    );
  }

  const stats = data?.stats || {};
  const monthlyTrends = data?.monthlyTrends || [];
  const categoryBreakdown = data?.categoryBreakdown || [];
  const assetCosts = data?.assetCosts || [];
  const vendorBreakdown = data?.vendorBreakdown || [];

  const COLORS = ['#0d9488', '#0284c7', '#6366f1', '#e11d48', '#d97706', '#10b981'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Expense Analytics & Financial Intelligence</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Breakdown of appliance & vehicle purchases, repairs versus routine maintenance, and vendor rankings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export CSV */}
          <a
            href="/api/analytics?format=csv"
            download="AssetCare_Expenses_Full.csv"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs shadow-sm transition-all"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export CSV Report</span>
          </a>
        </div>
      </div>

      {/* Metric Highlights Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Purchase Capital</span>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            ₹{Number(stats.totalPurchaseExpense || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">Original Assets Acquired</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Repair Expenditure</span>
          <div className="text-2xl font-bold text-rose-600 mt-2">
            ₹{Number(stats.totalRepairExpense || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-rose-600/80 mt-0.5 block">Breakdown & Component Fixes</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Routine Servicing</span>
          <div className="text-2xl font-bold text-sky-600 mt-2">
            ₹{Number(stats.totalServiceExpense || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-sky-600/80 mt-0.5 block">Preventive Maintenance</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Ownership Cost</span>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            ₹{(
              (stats.totalPurchaseExpense || 0) +
              (stats.totalRepairExpense || 0) +
              (stats.totalServiceExpense || 0)
            ).toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">Assets + Maintenance</span>
        </div>
      </div>

      {/* Main Charts Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Trend (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Monthly Expenditure: Repairs vs Routine Servicing</h3>
            <p className="text-xs text-slate-500">Visual comparison of breakdown repairs vs preventive maintenance</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Expenditure']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="repair" name="Unscheduled Repairs" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="service" name="Scheduled Servicing" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Category Distribution</h3>
            <p className="text-xs text-slate-500">Share of maintenance costs by asset class</p>
          </div>
          <div className="h-56 my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryBreakdown.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Spent']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 pt-2 border-t border-slate-100">
            {categoryBreakdown.map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-slate-600">{c.name}</span>
                </div>
                <span className="font-semibold text-slate-900">₹{Number(c.value).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Asset-Wise Lifetime Cost of Ownership Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Asset-Wise Total Cost of Ownership</h3>
          <p className="text-xs text-slate-500">Complete capital and cumulative maintenance expenses per asset</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Asset Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Purchase Price</th>
                <th className="py-3 px-4 text-right">Lifetime Maintenance</th>
                <th className="py-3 px-4 text-right">Total Ownership Cost</th>
                <th className="py-3 px-4 text-center">Service Records</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {assetCosts.map((a: any) => (
                <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{a.name}</td>
                  <td className="py-3.5 px-4">{a.category}</td>
                  <td className="py-3.5 px-4 text-right">₹{a.purchasePrice.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-indigo-600">
                    ₹{a.totalMaintenance.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    ₹{a.totalCostOfOwnership.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-center">{a.serviceCount} Invoices</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => router.push(`/assets/${a.id}`)}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                    >
                      View History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Vendors Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-900 mb-1">Top Service Centres & Vendors by Spend</h3>
        <p className="text-xs text-slate-500 mb-4">Garages, workshops, and authorized brand centers</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {vendorBreakdown.map((v: any, idx: number) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-slate-900 block">{v.vendor}</span>
                <span className="text-[10px] text-slate-400">Rank #{idx + 1}</span>
              </div>
              <span className="text-sm font-bold text-teal-800">
                ₹{Number(v.total).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
