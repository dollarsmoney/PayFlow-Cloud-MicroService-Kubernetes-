'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/authStore';
import { historyApi } from '@/lib/api';
import { ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight } from 'lucide-react';

const fadeUp = (d = 0) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: d } });

export default function HistoryPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const LIMIT = 20;

  const load = (p: number) => {
    if (!user?.id) return;
    setLoading(true);
    historyApi.getByUser(user.id, p, LIMIT)
      .then(r => { setEntries(r.data.entries || []); setTotal(r.data.total || 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(page); }, [user?.id, page]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div {...fadeUp(0)} className="mb-8">
        <h1 className="text-2xl font-bold">Transaction History</h1>
        <p className="text-gray-400 text-sm mt-1">transaction-history-service · <span className="text-gray-600">:3006</span></p>
      </motion.div>

      <motion.div {...fadeUp(0.05)} className="glass rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="w-8" />
          <div className="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</div>
          <div className="w-32 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</div>
          <div className="w-36 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Date</div>
          <div className="w-20 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Type</div>
        </div>

        {loading ? (
          <div className="space-y-1 p-2">
            {[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-white/[0.03] rounded-xl animate-pulse" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No transaction history yet.</div>
        ) : (
          <div>
            {entries.map((tx: any) => (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] border-b border-white/[0.04] last:border-0 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type === 'CREDIT' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  {tx.type === 'CREDIT'
                    ? <ArrowDownLeft size={14} className="text-emerald-400" />
                    : <ArrowUpRight  size={14} className="text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.description || tx.type}</p>
                  <p className="text-xs text-gray-500 font-mono truncate">{tx.walletId?.slice(0, 12)}…</p>
                </div>
                <div className={`w-32 text-right font-bold text-sm ${tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.type === 'CREDIT' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                  {tx.wallet?.currency && <span className="text-xs text-gray-500 ml-1">{tx.wallet.currency}</span>}
                </div>
                <div className="w-36 text-right text-xs text-gray-500">
                  {new Date(tx.createdAt).toLocaleString()}
                </div>
                <div className="w-20 text-right">
                  <span className={`badge ${tx.type === 'CREDIT' ? 'badge-green' : 'badge-red'}`}>{tx.type}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06] bg-white/[0.02]">
            <p className="text-xs text-gray-500">
              {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total} transactions
            </p>
            <div className="flex items-center gap-2">
              <button id="btn-prev-page" onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-ghost p-1.5 disabled:opacity-30">
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
              <button id="btn-next-page" onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="btn-ghost p-1.5 disabled:opacity-30">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
