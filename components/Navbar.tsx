'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Layers, 
  Receipt, 
  FileText, 
  Clock, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  PlusCircle,
  AlertTriangle,
  User as UserIcon
} from 'lucide-react';

interface NavbarProps {
  user: any;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertsCount, setAlertsCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetch('/api/reminders/check')
        .then((res) => res.json())
        .then((data) => {
          if (data?.urgentCount !== undefined) {
            setAlertsCount(data.urgentCount);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/assets', label: 'Assets', icon: Layers },
    { href: '/bills', label: 'Bill Vault', icon: Receipt },
    { href: '/warranties', label: 'Warranties', icon: ShieldCheck },
    { href: '/reminders', label: 'Reminders', icon: Clock, badge: alertsCount > 0 ? alertsCount : null },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  if (user?.role === 'admin') {
    navLinks.push({ href: '/admin', label: 'Admin Center', icon: Settings, badge: null });
  }

  const isActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href !== '/dashboard' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push(user ? '/dashboard' : '/login')}>
            <div className="h-10 w-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <ShieldCheck className="h-6 w-6 text-teal-400" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Asset<span className="text-teal-400">Care</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400 tracking-wider uppercase font-medium">
                Vault & Maintenance
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <button
                    key={link.href}
                    onClick={() => router.push(link.href)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
                        {link.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Action buttons & User profile */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <button
                  onClick={() => router.push('/bills/upload')}
                  className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all shadow-sm"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Scan Bill</span>
                </button>

                <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-semibold text-slate-200 leading-tight">{user.full_name || user.username}</p>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>

                {/* Mobile Hamburger */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => router.push('/login')}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-3 pb-5 space-y-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
            <div>
              <p className="text-sm font-semibold text-white">{user.full_name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
              {user.role}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pb-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                router.push('/bills/upload');
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-teal-500 text-slate-950"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Scan Bill</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                router.push('/assets/new');
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 text-white border border-slate-700"
            >
              <Layers className="h-4 w-4" />
              <span>New Asset</span>
            </button>
          </div>

          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <button
                key={link.href}
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push(link.href);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                  active ? 'bg-teal-500/20 text-teal-300' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </header>
  );
}
