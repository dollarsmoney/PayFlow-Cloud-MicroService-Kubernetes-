'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import { authApi } from '@/lib/api';
import {
  LayoutDashboard, Wallet, Send, History, Bell,
  ShieldAlert, Users, LogOut, Zap, ChevronRight,
} from 'lucide-react';

const NAV = [
  { label: 'Overview',     href: '/dashboard',               icon: LayoutDashboard },
  { label: 'Wallets',      href: '/dashboard/wallets',        icon: Wallet },
  { label: 'Payments',     href: '/dashboard/payments',       icon: Send },
  { label: 'History',      href: '/dashboard/history',        icon: History },
  { label: 'Notifications',href: '/dashboard/notifications',  icon: Bell },
  { label: 'Fraud Alerts', href: '/dashboard/fraud',          icon: ShieldAlert },
  { label: 'Users',        href: '/dashboard/users',          icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    router.push('/auth/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 glass border-r border-white/[0.06] rounded-none
                      flex flex-col z-40 bg-background/80 backdrop-blur-2xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent
                        flex items-center justify-center shadow-[0_0_20px_-4px_rgba(99,102,241,0.8)]">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-sm leading-none">PayFlow</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Production Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 mb-3">
          Services
        </p>
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <button
              key={href}
              id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => router.push(href)}
              className={`sidebar-link w-full text-left ${active ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={12} className="text-primary/60" />}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <div className="glass rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent
                          flex items-center justify-center text-xs font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            id="btn-logout"
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-400 transition-colors p-1"
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
