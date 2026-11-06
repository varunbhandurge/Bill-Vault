'use client';

import './globals.css';
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useRouter, usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user);
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  return (
    <html lang="en">
      <head>
        <title>AssetCare | Digital Vault, Warranty & Maintenance System</title>
        <meta
          name="description"
          content="Personal Asset, Appliance, Vehicle, Bill, Warranty & Maintenance Management System"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-teal-500 selection:text-white">
        <div className="min-h-screen flex flex-col">
          <Navbar user={user} onLogout={handleLogout} />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </main>
          <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>© 2026 AssetCare System. Permanent Digital Asset & Invoice History Vault.</p>
              <p className="text-slate-400">Powered by Local OCR & Supabase/PostgreSQL Architecture</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
