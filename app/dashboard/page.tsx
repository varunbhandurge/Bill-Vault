'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Layers,
  Receipt,
  Wrench,
  ShieldCheck,
  Clock,
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  ArrowRight,
  FileText,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Car,
  ChevronRight,
  Download
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [recentAssets, setRecentAssets] = useState<any[]>([]);
  const [recentBills, setRecentBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics').then((r) => r.json()),
      fetch('/api/reminders/check').then((r) => r.json()),
      fetch('/api/assets').then((r) => r.json()),
      fetch('/api/bills').then((r) => r.json()),
    ])
      .then(([analyticsData, alertsData, assetsData, billsData]) => {
        setAnalytics(analyticsData);
        setAlerts(alertsData?.alerts || []);
        setRecentAssets(assetsData?.assets?.slice(0, 4) || []);
        setRecentBills(billsData?.documents?.slice(0, 5) || []);
      })
      .catch((err) => console.error('Dashboard load error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
          <p className="text-sm font-medium text-slate-500">Loading your AssetCare Dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = analytics?.stats || {};
  const monthlyTrends = analytics?.monthlyTrends || [];
  const categoryBreakdown = analytics?.categoryBreakdown || [];

  const COLORS = ['#0d9488', '#0284c7', '#6366f1', '#e11d48', '#d97706', '#10b981'];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Personal Asset & Warranty Vault</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Permanent, searchable digital records of appliances, vehicles, bills, and maintenance schedules.
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => router.push('/bills/upload')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-all shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Scan New Bill</span>
          </button>
          <button
            onClick={() => router.push('/assets/new')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-sm"
          >
            <Layers className="h-4 w-4" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* Urgent Maintenance & Active Warranty Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
                alert.severity === 'urgent'
                  ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                  : 'bg-amber-50/80 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={`h-5 w-5 shrink-0 mt-0.5 ${
                    alert.severity === 'urgent' ? 'text-rose-600' : 'text-amber-600'
                  }`}
                />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    {alert.severity === 'urgent' ? 'Action Required' : 'Upcoming Maintenance Notice'}
                  </h4>
                  <p className="text-sm font-medium mt-0.5">{alert.message}</p>
                </div>
              </div>
              <button
                onClick={() => router.push(`/assets/${alert.assetId}`)}
                className="shrink-0 text-xs font-semibold underline hover:opacity-80 flex items-center gap-1 mt-1"
              >
                <span>View Asset</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assets */}
        <div
          onClick={() => router.push('/assets')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Registered Assets</span>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{stats.totalAssets || 0}</div>
            <div className="text-xs text-slate-500 mt-0.5">Vehicles & Appliances</div>
          </div>
        </div>

        {/* Digital Invoices */}
        <div
          onClick={() => router.push('/bills')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Secured Bills</span>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{stats.totalDocuments || 0}</div>
            <div className="text-xs text-slate-500 mt-0.5">OCR Scanned & Verified</div>
          </div>
        </div>

        {/* Total Maintenance Expenditure */}
        <div
          onClick={() => router.push('/analytics')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Maintenance</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Wrench className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              ₹{((stats.totalRepairExpense || 0) + (stats.totalServiceExpense || 0)).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Repairs: ₹{(stats.totalRepairExpense || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Active Warranties */}
        <div
          onClick={() => router.push('/warranties')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Warranties</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{stats.activeWarrantiesCount || 0}</div>
            <div className="text-xs text-emerald-600 font-medium mt-0.5">
              {stats.expiringWarrantiesCount || 0} expiring in 30 days
            </div>
          </div>
        </div>
      </div>

      {/* Featured Highlight: The 16-Year-Old Car Use Case Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-teal-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold uppercase tracking-wider border border-teal-500/30 mb-1">
              Active Warranty Protection
            </div>
            <h3 className="text-base font-bold">Honda City: AC Compressor Repaired Today (₹6,000)</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Warranty valid for 3 Months until <strong>06-Feb-2027</strong> by Apex Auto Cooling Works. If AC issues reoccur, click below to open the complete digital dossier and present the original invoice.
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push('/assets/asset-car-001')}
          className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 shrink-0 shadow-sm"
        >
          <span>Open Car AC History</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Spending Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Monthly Maintenance & Repair Trend</h3>
              <p className="text-xs text-slate-500">Expenditure over time in INR (₹)</p>
            </div>
            <button
              onClick={() => router.push('/analytics')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="h-64">
            {monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="repair" name="Repairs" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="service" name="Routine Servicing" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No spending data logged yet.
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Spending by Category</h3>
            <p className="text-xs text-slate-500">Distribution across asset types</p>
          </div>
          <div className="h-52 my-auto">
            {categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
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
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No categorical spending yet.
              </div>
            )}
          </div>
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {categoryBreakdown.slice(0, 3).map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-slate-600">{c.name}</span>
                </div>
                <span className="font-semibold text-slate-900">₹{Number(c.value).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Registered Assets & Recent Verified Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Your Registered Assets</h3>
              <p className="text-xs text-slate-500">Instant access to complete service timelines</p>
            </div>
            <button
              onClick={() => router.push('/assets')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>View All ({stats.totalAssets || 0})</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentAssets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => router.push(`/assets/${asset.id}`)}
                className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 overflow-hidden shrink-0 border border-slate-200">
                    {asset.photos && asset.photos[0] ? (
                      <img src={asset.photos[0]} alt={asset.name} className="h-full w-full object-cover" />
                    ) : (
                      <Layers className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                      {asset.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {asset.brand} • {asset.category_name} {asset.registration_number ? `(${asset.registration_number})` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 block">
                    ₹{Number(asset.purchase_price).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-teal-600 font-medium">History Available</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Invoices Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Bill Vault Invoices</h3>
              <p className="text-xs text-slate-500">Original documents & verified service charges</p>
            </div>
            <button
              onClick={() => router.push('/bills')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>All Documents</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentBills.map((doc) => (
              <div
                key={doc.id}
                onClick={() => router.push(`/assets/${doc.asset_id}`)}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 truncate max-w-[200px] sm:max-w-xs group-hover:text-teal-600 transition-colors">
                      {doc.file_name}
                    </h4>
                    <p className="text-[11px] text-slate-500">{doc.asset_name || 'Vehicle / Appliance'}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
