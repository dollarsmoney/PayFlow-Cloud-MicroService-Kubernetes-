'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { usersApi } from '@/lib/api';
import { Users, UserCheck, UserX, RefreshCw } from 'lucide-react';

const fadeUp = (d = 0) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: d } });

export default function UsersPage() {
  const [users, setUsers]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  const load = () => {
    setLoading(true);
    usersApi.list().then(r => setUsers(r.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u =>
    !search ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div {...fadeUp(0)} className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-gray-400 text-sm mt-1">user-service · <span className="text-gray-600">:3002</span></p>
        </div>
        <button id="btn-refresh-users" onClick={load} className="btn-ghost flex items-center gap-2">
          <RefreshCw size={14} /> Refresh
        </button>
      </motion.div>

      {/* Search */}
      <motion.div {...fadeUp(0.05)} className="mb-4">
        <input id="input-user-search" className="input max-w-sm" placeholder="Search by name or email…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </motion.div>

      <motion.div {...fadeUp(0.08)} className="glass rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_150px_120px_100px] gap-4 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          {['', 'User', 'Email', 'KYC Status', 'Role'].map((h, i) => (
            <div key={i} className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</div>
          ))}
        </div>

        {loading ? (
          <div className="space-y-1 p-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white/[0.03] rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            {search ? 'No users match your search.' : 'No users found.'}
          </div>
        ) : (
          <div>
            {filtered.map((u: any, i: number) => (
              <div key={u.id} className="grid grid-cols-[auto_1fr_150px_120px_100px] gap-4 items-center px-5 py-3.5 hover:bg-white/[0.02] border-b border-white/[0.04] last:border-0 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center text-sm font-bold">
                  {u.name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium">{u.name || '—'}</p>
                  <p className="text-xs text-gray-500 font-mono">{u.id?.slice(0,12)}…</p>
                </div>
                <p className="text-sm text-gray-400 truncate">{u.email}</p>
                <div className="flex items-center gap-1.5">
                  {u.kycStatus === 'VERIFIED'
                    ? <UserCheck size={12} className="text-emerald-400" />
                    : <UserX    size={12} className="text-yellow-400" />}
                  <span className={`badge ${u.kycStatus === 'VERIFIED' ? 'badge-green' : 'badge-yellow'}`}>
                    {u.kycStatus || 'PENDING'}
                  </span>
                </div>
                <span className={`badge ${u.role === 'ADMIN' ? 'badge-purple' : 'badge-blue'}`}>
                  {u.role || 'USER'}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="px-5 py-3 border-t border-white/[0.06] bg-white/[0.02]">
          <p className="text-xs text-gray-500">{filtered.length} user{filtered.length !== 1 ? 's' : ''}{search ? ' matching' : ' total'}</p>
        </div>
      </motion.div>
    </div>
  );
}
