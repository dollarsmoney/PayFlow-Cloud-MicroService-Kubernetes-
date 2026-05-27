'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/authStore';
import { paymentsApi, walletsApi } from '@/lib/api';
import { Send, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

const fadeUp = (d = 0) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: d } });

export default function PaymentsPage() {
  const { user } = useAuthStore();
  const [wallets, setWallets]     = useState<any[]>([]);
  const [form, setForm]           = useState({ walletId: '', recipientId: '', amount: '', description: '' });
  const [busy, setBusy]           = useState(false);
  const [result, setResult]       = useState<any>(null);
  const [lookupId, setLookupId]   = useState('');
  const [statusRes, setStatusRes] = useState<any>(null);

  useEffect(() => {
    if (user?.id) walletsApi.getByUser(user.id).then(r => setWallets(r.data));
  }, [user?.id]);

  const submit = async (e: any) => {
    e.preventDefault(); setBusy(true); setResult(null);
    try {
      const res = await paymentsApi.process({
        walletId:    form.walletId,
        recipientId: form.recipientId,
        amount:      Number(form.amount),
        description: form.description,
      });
      setResult({ success: true, data: res.data });
    } catch (err: any) {
      setResult({ success: false, msg: err.response?.data?.error || 'Payment failed' });
    } finally { setBusy(false); }
  };

  const lookupStatus = async () => {
    if (!lookupId) return;
    try {
      const r = await paymentsApi.getStatus(lookupId);
      setStatusRes(r.data);
    } catch { setStatusRes({ error: 'Not found' }); }
  };

  const statusIcon = (s: string) =>
    s === 'COMPLETED' ? <CheckCircle size={16} className="text-emerald-400" /> :
    s === 'FAILED'    ? <XCircle size={16} className="text-red-400" /> :
                        <Clock size={16} className="text-yellow-400" />;

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div {...fadeUp(0)} className="mb-8">
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-gray-400 text-sm mt-1">payment-service (Go) · <span className="text-gray-600">:8080</span></p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Process Payment */}
        <motion.div {...fadeUp(0.05)} className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-5">
            <Send size={16} className="text-primary" />
            <h2 className="font-bold">Process Payment</h2>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Source Wallet</label>
              <select
                id="select-wallet"
                className="input"
                value={form.walletId}
                onChange={e => setForm(f => ({ ...f, walletId: e.target.value }))}
                required
              >
                <option value="">Select wallet…</option>
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.currency} — ${Number(w.balance).toFixed(2)} ({w.id.slice(0,8)}…)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Recipient User ID</label>
              <input id="input-recipient" className="input" placeholder="user-uuid"
                value={form.recipientId} onChange={e => setForm(f => ({ ...f, recipientId: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Amount</label>
              <input id="input-payment-amount" className="input" type="number" min="0.01" step="0.01"
                placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <input id="input-description" className="input" placeholder="Payment for…"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            {result && (
              <div className={`rounded-xl p-3 text-sm ${result.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {result.success
                  ? `✅ Payment ${result.data?.paymentId} — ${result.data?.status}`
                  : `❌ ${result.msg}`}
              </div>
            )}
            <button id="btn-process-payment" type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? 'Processing…' : 'Send Payment'}
            </button>
          </form>
        </motion.div>

        {/* Status Lookup */}
        <motion.div {...fadeUp(0.1)} className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-5">
            <RefreshCw size={16} className="text-accent" />
            <h2 className="font-bold">Check Payment Status</h2>
          </div>
          <label className="label">Payment ID</label>
          <div className="flex gap-2 mb-4">
            <input id="input-lookup-id" className="input flex-1" placeholder="payment-uuid"
              value={lookupId} onChange={e => setLookupId(e.target.value)} />
            <button id="btn-lookup-status" onClick={lookupStatus} className="btn-primary px-4">
              Check
            </button>
          </div>
          {statusRes && (
            <div className="glass rounded-xl p-4 space-y-2">
              {statusRes.error ? (
                <p className="text-red-400 text-sm">{statusRes.error}</p>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    {statusIcon(statusRes.status)}
                    <span className="font-semibold">{statusRes.status}</span>
                  </div>
                  <p className="text-xs text-gray-400">ID: <span className="font-mono">{statusRes.id}</span></p>
                  {statusRes.amount && (
                    <p className="text-xs text-gray-400">Amount: <span className="font-semibold text-white">${statusRes.amount}</span></p>
                  )}
                  {statusRes.createdAt && (
                    <p className="text-xs text-gray-400">{new Date(statusRes.createdAt).toLocaleString()}</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Info box */}
          <div className="mt-6 glass rounded-xl p-4">
            <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">How it works</p>
            <ul className="text-xs text-gray-400 space-y-1.5">
              <li>1. Payment request hits <code className="text-primary">api-gateway:3000</code></li>
              <li>2. Proxied to <code className="text-primary">payment-service:8080</code> (Go)</li>
              <li>3. Kafka event published → <code className="text-primary">payment.completed</code></li>
              <li>4. Fraud + Notification services consume event</li>
              <li>5. Transaction recorded by history service</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
