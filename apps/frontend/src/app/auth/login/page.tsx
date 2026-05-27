'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';
import { Zap, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [busy, setBusy]     = useState(false);
  const [showPw, setShowPw] = useState(false);

  const submit = async (e: any) => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const res = await authApi.login(form.email, form.password);
      const { accessToken, token, userId } = res.data;
      const jwt = accessToken || token;
      setAuth(jwt, { id: userId, email: form.email });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_30px_-4px_rgba(99,102,241,0.8)]">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold">PayFlow</p>
            <p className="text-xs text-gray-500">Production Platform</p>
          </div>
        </div>

        <div className="glass p-8 rounded-2xl">
          <h1 className="text-2xl font-bold mb-1">Sign in</h1>
          <p className="text-gray-400 text-sm mb-7">Enter your credentials to continue</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input id="input-email" className="input" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input id="input-password" className="input pr-10" type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                <button type="button" id="btn-toggle-pw" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <button id="btn-login" type="submit" disabled={busy} className="btn-primary w-full mt-2">
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            No account?{' '}
            <Link href="/auth/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          Secured by <span className="text-gray-500">auth-service</span> · JWT + Redis blacklist
        </p>
      </motion.div>
    </div>
  );
}
