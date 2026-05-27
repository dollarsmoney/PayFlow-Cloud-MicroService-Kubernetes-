'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fraudApi } from '@/lib/api';
import { ShieldAlert, ShieldCheck, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

const fadeUp = (d = 0) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: d } });

const RISK_COLOR = (score: number) =>
  score >= 0.8 ? 'text-red-400' : score >= 0.5 ? 'text-yellow-400' : 'text-emerald-400';
const RISK_BG    = (score: number) =>
  score >= 0.8 ? 'bg-red-500/10'    : score >= 0.5 ? 'bg-yellow-500/10'    : 'bg-emerald-500/10';

export default function FraudPage() {
  const [alerts, setAlerts]   = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const LIMIT = 20;

  const load = (p: number) => {
    setLoading(true);
    fraudApi.listAlerts(p, LIMIT)
      .then(r => { setAlerts(r.data.alerts || []); setTotal(r.data.total || 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(page); }, [page]);

  const resolve = async (id: string) => {
    setResolving(id);
    try {
      await fraudApi.resolveAlert(id);
      load(page);
    } finally { setResolving(null); }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const openAlerts = alerts.filter(a => a.status !== 'RESOLVED').length;

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div {...fadeUp(0)} className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Fraud Alerts</h1>
          <p className="text-gray-400 text-sm mt-1">fraud-detection-service · <span className="text-gray-600">:3005</span></p>
        </div>
        {openAlerts > 0 && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
            <AlertTriangle size={14} className="text-red-400" />
            <span className="text-red-400 text-sm font-semibold">{openAlerts} open alert{openAlerts !== 1 ? 's' : ''}</span>
          </div>
        )}
      </motion.div>

      <motion.div {...fadeUp(0.05)} className="glass rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_120px_100px_100px_100px] gap-4 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          {['Transaction', 'User', 'Risk Score', 'Status', 'Action'].map(h => (
            <div key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</div>
          ))}
        </div>

        {loading ? (
          <div className="space-y-1 p-2">
            {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-white/[0.03] rounded-xl animate-pulse" />)}
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
            <ShieldCheck size={32} className="text-emerald-400/40" />
            <p>No fraud alerts detected. System is clean.</p>
          </div>
        ) : (
          <div>
            {alerts.map((a: any, i: number) => (
              <div key={a.id} className="grid grid-cols-[1fr_120px_100px_100px_100px] gap-4 items-center px-5 py-3.5 hover:bg-white/[0.02] border-b border-white/[0.04] last:border-0 transition-colors">
                <div>
                  <p className="text-sm font-mono text-gray-300 truncate">{a.transactionId}</p>
                  <p className="text-xs text-gray-600">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
                <p className="text-xs font-mono text-gray-400 truncate">{a.userId?.slice(0, 12)}…</p>
                <div>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${RISK_BG(a.riskScore)}`}>
                    <ShieldAlert size={12} className={RISK_COLOR(a.riskScore)} />
                    <span className={`text-xs font-bold ${RISK_COLOR(a.riskScore)}`}>
                      {(a.riskScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <span className={`badge ${a.status === 'RESOLVED' ? 'badge-green' : a.status === 'OPEN' ? 'badge-red' : 'badge-yellow'}`}>
                  {a.status}
                </span>
                {a.status !== 'RESOLVED' ? (
                  <button
                    id={`btn-resolve-${i}`}
                    onClick={() => resolve(a.id)}
                    disabled={resolving === a.id}
                    className="btn-ghost text-xs border border-white/[0.08] flex items-center gap-1"
                  >
                    <ShieldCheck size={12} />
                    {resolving === a.id ? '…' : 'Resolve'}
                  </button>
                ) : (
                  <span className="text-xs text-gray-600">—</span>
                )}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
            <p className="text-xs text-gray-500">{total} total alerts</p>
            <div className="flex items-center gap-2">
              <button id="btn-fraud-prev" onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-ghost p-1.5 disabled:opacity-30">
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-gray-400">{page} / {totalPages}</span>
              <button id="btn-fraud-next" onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="btn-ghost p-1.5 disabled:opacity-30">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
