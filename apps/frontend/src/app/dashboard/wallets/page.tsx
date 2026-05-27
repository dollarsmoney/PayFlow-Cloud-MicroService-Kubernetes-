'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/authStore';
import { walletsApi } from '@/lib/api';
import { Plus, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, RefreshCw } from 'lucide-react';

const fadeUp = (d = 0) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: d } });

type ModalType = 'deposit' | 'withdraw' | 'transfer' | null;

export default function WalletsPage() {
  const { user } = useAuthStore();
  const [wallets, setWallets]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<ModalType>(null);
  const [selected, setSelected] = useState<any>(null);
  const [amount, setAmount]     = useState('');
  const [toWallet, setToWallet] = useState('');
  const [busy, setBusy]         = useState(false);
  const [msg, setMsg]           = useState('');

  const load = () => {
    if (!user?.id) return;
    setLoading(true);
    walletsApi.getByUser(user.id).then(r => setWallets(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user?.id]);

  const openModal = (type: ModalType, wallet: any) => {
    setSelected(wallet); setModal(type); setAmount(''); setToWallet(''); setMsg('');
  };

  const submit = async () => {
    if (!amount || !selected) return;
    setBusy(true); setMsg('');
    try {
      if (modal === 'deposit')   await walletsApi.deposit(selected.id, { amount: Number(amount) });
      if (modal === 'withdraw')  await walletsApi.withdraw(selected.id, { amount: Number(amount) });
      if (modal === 'transfer')  await walletsApi.transfer({ fromWalletId: selected.id, toWalletId: toWallet, amount: Number(amount) });
      setMsg('✅ Success!');
      setTimeout(() => { setModal(null); load(); }, 1000);
    } catch (e: any) {
      setMsg(`❌ ${e.response?.data?.error || 'Failed'}`);
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div {...fadeUp(0)} className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Wallets</h1>
          <p className="text-gray-400 text-sm mt-1">wallet-service · <span className="text-gray-600">:3003</span></p>
        </div>
        <div className="flex gap-2">
          <button id="btn-refresh-wallets" onClick={load} className="btn-ghost flex items-center gap-2">
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            id="btn-create-wallet"
            onClick={async () => {
              try {
                await walletsApi.create({ userId: user?.id, currency: 'USD' });
                load();
              } catch {}
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={14} /> New Wallet
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <div key={i} className="h-48 glass animate-pulse rounded-2xl" />)}
        </div>
      ) : wallets.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <p className="text-gray-400 mb-4">No wallets yet. Create your first wallet to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wallets.map((w: any, i: number) => (
            <motion.div key={w.id} {...fadeUp(i * 0.05)} className="glass p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="badge badge-blue">{w.currency}</span>
                  <span className={`badge ${w.status === 'ACTIVE' ? 'badge-green' : 'badge-yellow'}`}>{w.status}</span>
                </div>
                <p className="text-[10px] text-gray-600 font-mono">{w.id.slice(0,8)}…</p>
              </div>
              <p className="text-3xl font-bold mb-1">
                ${Number(w.balance).toLocaleString('en', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mb-5">
                Created {new Date(w.createdAt).toLocaleDateString()}
              </p>
              <div className="flex gap-2">
                <button id={`btn-deposit-${i}`}  onClick={() => openModal('deposit', w)}  className="flex-1 btn-ghost text-xs flex items-center justify-center gap-1.5 border border-white/[0.08]">
                  <ArrowDownLeft size={12} className="text-emerald-400" /> Deposit
                </button>
                <button id={`btn-withdraw-${i}`} onClick={() => openModal('withdraw', w)} className="flex-1 btn-ghost text-xs flex items-center justify-center gap-1.5 border border-white/[0.08]">
                  <ArrowUpRight size={12} className="text-red-400" /> Withdraw
                </button>
                <button id={`btn-transfer-${i}`} onClick={() => openModal('transfer', w)} className="flex-1 btn-ghost text-xs flex items-center justify-center gap-1.5 border border-white/[0.08]">
                  <ArrowLeftRight size={12} className="text-blue-400" /> Transfer
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-2xl p-6 w-full max-w-sm"
          >
            <h3 className="font-bold mb-4 capitalize">{modal} — {selected?.currency}</h3>
            <label className="label">Amount (USD)</label>
            <input id="input-amount" className="input mb-3" type="number" min="0.01" step="0.01"
              placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
            {modal === 'transfer' && (
              <>
                <label className="label">Destination Wallet ID</label>
                <input id="input-to-wallet" className="input mb-3" placeholder="wallet-uuid"
                  value={toWallet} onChange={e => setToWallet(e.target.value)} />
              </>
            )}
            {msg && <p className="text-sm mb-3">{msg}</p>}
            <div className="flex gap-2 mt-2">
              <button id="btn-modal-cancel" onClick={() => setModal(null)} className="btn-ghost flex-1">Cancel</button>
              <button id="btn-modal-submit" onClick={submit} disabled={busy} className="btn-primary flex-1">
                {busy ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
