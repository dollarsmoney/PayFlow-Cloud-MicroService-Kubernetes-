'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/authStore';
import { walletsApi, historyApi, fraudApi, notificationsApi } from '@/lib/api';
import {
  Wallet, ArrowUpRight, ArrowDownLeft, ShieldAlert,
  Bell, TrendingUp, Activity, Zap,
} from 'lucide-react';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

function StatCard({ title, value, sub, icon, color, delay = 0 }: any) {
  return (
    <motion.div {...fadeUp(delay)} className="stat-card">
      <div className={`absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 font-medium mb-2">{title}</p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [wallets, setWallets]             = useState<any[]>([]);
  const [history, setHistory]             = useState<any[]>([]);
  const [fraudCount, setFraudCount]       = useState(0);
  const [notifCount, setNotifCount]       = useState(0);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.allSettled([
      walletsApi.getByUser(user.id).then(r => setWallets(r.data)),
      historyApi.getByUser(user.id, 1, 5).then(r => setHistory(r.data.entries || [])),
      fraudApi.getAlertsByUser(user.id).then(r => setFraudCount(r.data.length)),
      notificationsApi.getByUser(user.id).then(r => setNotifCount(r.data.length)),
    ]).finally(() => setLoading(false));
  }, [user?.id]);

  const totalBalance = wallets.reduce((s: number, w: any) => s + (w.balance || 0), 0);

  const txIcon = (type: string) =>
    type === 'CREDIT'
      ? <ArrowDownLeft size={14} className="text-emerald-400" />
      : <ArrowUpRight  size={14} className="text-red-400" />;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="mb-8">
        <h1 className="text-3xl font-bold">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            {user?.name || user?.email?.split('@')[0] || 'there'}
          </span>
          .
        </h1>
        <p className="text-gray-400 text-sm mt-1">Here's what's happening across your PayFlow services.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Balance"
          value={loading ? '—' : `$${totalBalance.toLocaleString('en', { minimumFractionDigits: 2 })}`}
          sub={`${wallets.length} wallet${wallets.length !== 1 ? 's' : ''}`}
          icon={<Wallet size={18} className="text-primary" />}
          color="bg-primary/15"
          delay={0.05}
        />
        <StatCard
          title="Recent Transactions"
          value={loading ? '—' : history.length}
          sub="Last 5 entries"
          icon={<Activity size={18} className="text-emerald-400" />}
          color="bg-emerald-500/15"
          delay={0.1}
        />
        <StatCard
          title="Fraud Alerts"
          value={loading ? '—' : fraudCount}
          sub={fraudCount > 0 ? 'Needs attention' : 'All clear'}
          icon={<ShieldAlert size={18} className="text-red-400" />}
          color="bg-red-500/15"
          delay={0.15}
        />
        <StatCard
          title="Notifications"
          value={loading ? '—' : notifCount}
          sub="Unread messages"
          icon={<Bell size={18} className="text-violet-400" />}
          color="bg-violet-500/15"
          delay={0.2}
        />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Transactions */}
        <motion.div {...fadeUp(0.25)} className="lg:col-span-2 glass p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold">Recent Transactions</h2>
              <p className="text-xs text-gray-500">Via transaction-history-service</p>
            </div>
            <span className="badge badge-blue">Live</span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-white/[0.04] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-10">No transactions yet</p>
          ) : (
            <div>
              {history.map((tx: any) => (
                <div key={tx.id} className="table-row">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                    {txIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description || tx.type}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`text-sm font-bold ${tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.type === 'CREDIT' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Wallets */}
        <motion.div {...fadeUp(0.3)} className="glass p-6 rounded-2xl">
          <div className="mb-5">
            <h2 className="font-bold">My Wallets</h2>
            <p className="text-xs text-gray-500">Via wallet-service</p>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-20 bg-white/[0.04] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : wallets.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-10">No wallets yet</p>
          ) : (
            <div className="space-y-3">
              {wallets.map((w: any) => (
                <div key={w.id} className="glass-hover p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="badge badge-blue">{w.currency}</span>
                    <span className={`badge ${w.status === 'ACTIVE' ? 'badge-green' : 'badge-yellow'}`}>
                      {w.status}
                    </span>
                  </div>
                  <p className="text-xl font-bold mt-2">
                    ${Number(w.balance).toLocaleString('en', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-1 font-mono truncate">{w.id}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </div>

      {/* Service health strip */}
      <motion.div {...fadeUp(0.35)} className="mt-6 glass p-4 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-primary" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Microservices</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { name: 'api-gateway',                port: 3000, color: 'badge-blue'   },
            { name: 'auth-service',               port: 3001, color: 'badge-green'  },
            { name: 'user-service',               port: 3002, color: 'badge-green'  },
            { name: 'wallet-service',             port: 3003, color: 'badge-green'  },
            { name: 'notification-service',       port: 3004, color: 'badge-purple' },
            { name: 'fraud-detection-service',    port: 3005, color: 'badge-red'    },
            { name: 'transaction-history-service',port: 3006, color: 'badge-green'  },
            { name: 'payment-service (Go)',       port: 8080, color: 'badge-blue'   },
          ].map(s => (
            <div key={s.name} className={`badge ${s.color} flex items-center gap-1.5`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {s.name}:{s.port}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
