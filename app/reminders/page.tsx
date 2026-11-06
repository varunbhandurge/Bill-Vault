'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
  Bell,
  RefreshCw,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function RemindersPage() {
  const router = useRouter();
  const [reminders, setReminders] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Reminder Form
  const [newReminder, setNewReminder] = useState<any>({
    asset_id: '',
    title: '',
    activity: '',
    reference_date: new Date().toISOString().split('T')[0],
    frequency: 'every_6_months',
    advance_notice_days: [7, 15],
    repeat_enabled: true,
  });

  const loadData = () => {
    Promise.all([
      fetch('/api/reminders').then((r) => r.json()),
      fetch('/api/assets').then((r) => r.json()),
    ])
      .then(([remRes, assetsRes]) => {
        setReminders(remRes.reminders || []);
        const aList = assetsRes.assets || [];
        setAssets(aList);
        if (aList.length > 0 && !newReminder.asset_id) {
          setNewReminder((prev: any) => ({ ...prev, asset_id: aList[0].id }));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkComplete = async (id: string) => {
    try {
      const res = await fetch(`/api/reminders/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedDate: new Date().toISOString().split('T')[0] }),
      });

      if (res.ok) {
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        } catch (e) {}
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReminder),
      });

      if (res.ok) {
        setShowAddModal(false);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Maintenance Reminder Engine</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Service-date linked schedules for car servicing, AC filter cleaning, RO membrane changes, and vehicle inspection.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-all shadow-sm shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Maintenance Reminder</span>
        </button>
      </div>

      {/* Reminders List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
          <p className="text-xs text-slate-500 mt-2">Loading schedules...</p>
        </div>
      ) : reminders.length > 0 ? (
        <div className="space-y-4">
          {reminders.map((r) => {
            const isOverdue = r.next_due_date < today;
            const diffDays = Math.ceil(
              (new Date(r.next_due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={r.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isOverdue ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200/80 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                      isOverdue
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-teal-50 text-teal-700 border border-teal-100'
                    }`}
                  >
                    <Clock className="h-5 w-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{r.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                        {r.frequency.replace(/_/g, ' ')}
                      </span>
                      {isOverdue ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          Overdue by {Math.abs(diffDays)} Days
                        </span>
                      ) : diffDays <= 15 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Due in {diffDays} Days
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs text-slate-600 font-medium">{r.activity}</p>
                    <p className="text-xs text-teal-700 font-semibold">{r.asset_name}</p>

                    <div className="pt-1 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                      <span>Anchor Service Date: <strong>{r.reference_date}</strong></span>
                      <span>Next Due Date: <strong>{r.next_due_date}</strong></span>
                      <span>Auto-Repeats: <strong>{r.repeat_enabled ? 'Enabled' : 'No'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <button
                    onClick={() => handleMarkComplete(r.id)}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Mark Done & Advance</span>
                  </button>

                  <button
                    onClick={() => router.push(`/assets/${r.asset_id}`)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <span>Asset Details</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Clock className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No active maintenance reminders</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Configure reminders for periodic car servicing, home AC jet washing, or water purifier filter replacements.
          </p>
        </div>
      )}

      {/* New Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Add Maintenance Reminder</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 text-xs font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Asset *</label>
                <select
                  required
                  value={newReminder.asset_id}
                  onChange={(e) => setNewReminder({ ...newReminder, asset_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500/30"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.brand})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reminder Title *</label>
                <input
                  type="text"
                  required
                  value={newReminder.title}
                  onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                  placeholder="e.g. Periodic Servicing & Oil Change"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work / Maintenance Activity *</label>
                <input
                  type="text"
                  required
                  value={newReminder.activity}
                  onChange={(e) => setNewReminder({ ...newReminder, activity: e.target.value })}
                  placeholder="e.g. Engine oil, filter replacement, AC gas inspection"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reference Service Date *</label>
                  <input
                    type="date"
                    required
                    value={newReminder.reference_date}
                    onChange={(e) => setNewReminder({ ...newReminder, reference_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frequency *</label>
                  <select
                    value={newReminder.frequency}
                    onChange={(e) => setNewReminder({ ...newReminder, frequency: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500/30"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="every_3_months">Every 3 Months</option>
                    <option value="every_6_months">Every 6 Months</option>
                    <option value="annually">Annually (12 Months)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-500"
                >
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
