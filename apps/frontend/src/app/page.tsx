"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 text-center max-w-3xl px-4"
      >
        <h1 className="text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          Financial Infrastructure for the Next Generation
        </h1>
        <p className="text-xl text-gray-400 mb-10">
          PayFlow provides enterprise-grade payment processing, wallet management, and fraud detection.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link href="/dashboard" className="px-8 py-4 bg-primary hover:bg-primary/90 rounded-full font-medium transition-all shadow-[0_0_30px_-5px_rgba(99,102,241,0.5)]">
            Go to Dashboard
          </Link>
          <Link href="/auth/login" className="px-8 py-4 glass-panel rounded-full font-medium hover:bg-white/5 transition-all">
            Sign In
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
