'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Users,
  Layers,
  Receipt,
  ShieldAlert,
  HardDrive,
  FileText,
  Activity,
  PlusCircle,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Lock
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'categories' | 'storage' | 'audit' | 'failed_ocr'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddCatModal, setShowAddCatModal] = useState(false);

  // New User Form
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'user',
    phone: '',
  });

  // New Category Form
  const [newCat, setNewCat] = useState({
    name: '',
    section: 'Household',
    description: '',
  });

  const loadAdminData = () => {
    Promise.all([
      fetch('/api/admin/users').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/admin/stats').then((r) => r.json()),
    ])
      .then(([usersRes, catRes, statsRes]) => {
        if (usersRes.error) throw new Error(usersRes.error);
        setUsers(usersRes.users || []);
        setCategories(catRes.categories || []);
        setStatsData(statsRes);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleUserActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentStatus }),
      });
      if (res.ok) loadAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) loadAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        setShowAddUserModal(false);
        setNewUser({ username: '', email: '', password: '', full_name: '', role: 'user', phone: '' });
        loadAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCat),
      });
      if (res.ok) {
        setShowAddCatModal(false);
        setNewCat({ name: '', section: 'Household', description: '' });
        loadAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to remove this category?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) loadAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
        <p className="text-xs text-slate-500 mt-2">Checking administrative permissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-4 max-w-lg mx-auto my-12">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Administrator Access Required</h2>
        <p className="text-xs text-slate-500">{error}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-wider border border-teal-500/30 mb-2">
            System Administration
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Administrator Command Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage users, edit/delete corrected bills, review audit logs, monitor disk storage, and manage categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddUserModal(true)}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add User</span>
          </button>
          <button
            onClick={() => setShowAddCatModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all border border-slate-700 flex items-center gap-1.5"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="border-b border-slate-200 flex items-center space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'users' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>User Accounts ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'categories' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Category Directory ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'storage' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HardDrive className="h-4 w-4" />
          <span>Storage & Health</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'audit' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Security & Audit Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('failed_ocr')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'failed_ocr' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Failed OCR Queue ({statsData?.failedOCRRecords?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: User Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Registered Users</span>
            <span className="text-xs text-slate-500">Total Accounts: {users.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Security</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{u.full_name}</span>
                      <span className="text-slate-400 text-[11px]">@{u.username} • {u.email}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{u.phone || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      {u.is_active ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="text-rose-600 font-semibold flex items-center gap-1">
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Deactivated</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.must_change_password ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                          Password Change Pending
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Verified</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleUserActive(u.id, u.is_active)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Category Directory */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Category Directory</span>
            <span className="text-xs text-slate-500">Total Categories: {categories.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Type</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {c.section}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{c.description || 'N/A'}</td>
                    <td className="py-3 px-4 text-center">
                      {c.is_default ? (
                        <span className="text-[10px] text-slate-400">System Default</span>
                      ) : (
                        <span className="text-[10px] font-bold text-teal-600">Custom</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!c.is_default && (
                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Storage & Health */}
      {activeTab === 'storage' && statsData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Preserved Disk Size</span>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {statsData.storageBreakdown.formattedSize}
              </div>
              <span className="text-xs text-slate-400 mt-0.5 block">Stored in local & Supabase vault</span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Secured Documents</span>
              <div className="text-2xl font-bold text-teal-700 mt-2">
                {statsData.storageBreakdown.totalFiles} Files
              </div>
              <span className="text-xs text-slate-400 mt-0.5 block">
                PDFs: {statsData.storageBreakdown.byType.pdf} • Images: {statsData.storageBreakdown.byType.image}
              </span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Database Engine</span>
              <div className="text-2xl font-bold text-slate-900 mt-2">PostgreSQL Ready</div>
              <span className="text-xs text-emerald-600 font-semibold mt-0.5 block">RLS Security Enforced</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Audit Logs */}
      {activeTab === 'audit' && statsData && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Security & Operational Audit Logs</span>
            <span className="text-xs text-slate-500">Immutable Audit Trail</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-auto">
            {statsData.auditLogs?.map((log: any) => (
              <div key={log.id} className="p-4 hover:bg-slate-50/60 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      by {log.username || 'System'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">{log.created_at}</span>
                </div>
                <p className="text-slate-600 font-mono text-[11px]">
                  {JSON.stringify(log.details || {})}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Failed OCR Review Queue */}
      {activeTab === 'failed_ocr' && statsData && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 text-center">
          {statsData.failedOCRRecords?.length > 0 ? (
            <div className="space-y-3">
              {statsData.failedOCRRecords.map((r: any) => (
                <div key={r.id} className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-left text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-rose-900 block">OCR Record #{r.id}</span>
                    <span className="text-rose-700">{r.error_message}</span>
                  </div>
                  <button
                    onClick={() => router.push(`/bills/verify/${r.document_id}?ocrId=${r.id}`)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold text-xs"
                  >
                    Manual Verify
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Failed OCR Jobs</h3>
              <p className="text-xs text-slate-500">All uploaded invoices have been recognized and processed successfully.</p>
            </div>
          )}
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Add New User Account</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="user">Regular User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-500">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Add New Asset Category</h3>
              <button onClick={() => setShowAddCatModal(false)} className="text-slate-400 text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCat.name}
                  onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                  placeholder="e.g. Electric Vehicle Charger"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Section</label>
                <select
                  value={newCat.section}
                  onChange={(e) => setNewCat({ ...newCat, section: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Household">Household</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Vehicles">Vehicles</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newCat.description}
                  onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
                  placeholder="Brief description"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-500">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
