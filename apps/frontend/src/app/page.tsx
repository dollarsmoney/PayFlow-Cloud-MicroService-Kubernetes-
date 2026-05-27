'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Zap, Shield, Wallet, Activity, ArrowRight, Server } from 'lucide-react';

const SERVICES = [
  { name: 'auth-service',                port: 3001, desc: 'JWT auth + refresh tokens',      color: 'from-indigo-500/20 to-indigo-500/5' },
  { name: 'user-service',                port: 3002, desc: 'Profiles, KYC management',       color: 'from-blue-500/20 to-blue-500/5' },
  { name: 'wallet-service',              port: 3003, desc: 'Balances, deposit, withdraw',    color: 'from-emerald-500/20 to-emerald-500/5' },
  { name: 'notification-service',        port: 3004, desc: 'Kafka-driven alerts',            color: 'from-violet-500/20 to-violet-500/5' },
  { name: 'fraud-detection-service',     port: 3005, desc: 'Risk scoring + alerts',          color: 'from-red-500/20 to-red-500/5' },
  { name: 'transaction-history-service', port: 3006, desc: 'Paginated ledger',               color: 'from-yellow-500/20 to-yellow-500/5' },
  { name: 'payment-service (Go)',        port: 8080, desc: 'High-perf payment processor',    color: 'from-cyan-500/20 to-cyan-500/5' },
  { name: 'api-gateway',                 port: 3000, desc: 'JWT auth + rate limiting proxy', color: 'from-orange-500/20 to-orange-500/5' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center min-h-screen px-4 pb-24">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            8 microservices · Kafka · Postgres · Redis
          </div>

          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-none">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/50">
              Financial Infrastructure
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              for Production.
            </span>
          </h1>

          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10">
            PayFlow is a full-stack cloud-native payment platform built on microservices,
            Kafka event streaming, and Kubernetes-ready containers.
          </p>

          <div className="flex items-center gap-4 justify-center">
            <Link id="link-get-started" href="/auth/signup"
              className="btn-primary flex items-center gap-2 text-base px-8 py-3.5">
              Get Started <ArrowRight size={16} />
            </Link>
            <Link id="link-sign-in" href="/auth/login"
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-6 py-3.5 rounded-xl border border-white/[0.08] hover:border-white/20">
              Sign In
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Services grid */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <Server size={14} className="text-gray-500" />
              <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Architecture</span>
            </div>
            <h2 className="text-3xl font-bold">8 Microservices, One Platform</h2>
            <p className="text-gray-400 mt-2">Every service is independently deployable and containerized</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SERVICES.map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                className={`glass rounded-2xl p-5 bg-gradient-to-b ${s.color} cursor-default`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="badge badge-blue">:{s.port}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="font-semibold text-sm mb-1">{s.name}</p>
                <p className="text-xs text-gray-400">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Feature strip */}
      <section className="pb-24 px-6 max-w-6xl mx-auto">
        <div className="glass rounded-2xl p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Shield size={20} className="text-primary" />, title: 'JWT + Redis Auth', desc: 'Token blacklisting, refresh tokens, per-route rate limiting via the API gateway.' },
            { icon: <Wallet size={20} className="text-emerald-400" />, title: 'Multi-currency Wallets', desc: 'Deposit, withdraw, and transfer with full ledger audit trail per wallet.' },
            { icon: <Activity size={20} className="text-violet-400" />, title: 'Kafka Event Bus', desc: 'Real-time fraud detection and notifications driven by event streaming.' },
          ].map((f, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">{f.title}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
