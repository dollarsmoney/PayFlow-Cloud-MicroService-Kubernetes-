const fs = require('fs');
const path = require('path');

const write = (relPath, content) => {
  const fullPath = path.join(__dirname, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n');
};

write('apps/frontend/package.json', JSON.stringify({
  name: "frontend",
  version: "1.0.0",
  private: true,
  scripts: {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  dependencies: {
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "framer-motion": "^11.0.3",
    "axios": "^1.6.7",
    "@tanstack/react-query": "^5.20.1",
    "zustand": "^4.5.0",
    "lucide-react": "^0.323.0"
  },
  devDependencies: {
    "@types/node": "^20.11.16",
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.18",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3"
  }
}, null, 2));

write('apps/frontend/tsconfig.json', JSON.stringify({
  compilerOptions: {
    target: "es5",
    lib: ["dom", "dom.iterable", "esnext"],
    allowJs: true,
    skipLibCheck: true,
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    module: "esnext",
    moduleResolution: "bundler",
    resolveJsonModule: true,
    isolatedModules: true,
    jsx: "preserve",
    incremental: true,
    plugins: [{ name: "next" }],
    paths: {
      "@/*": ["./src/*"]
    }
  },
  include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  exclude: ["node_modules"]
}, null, 2));

write('apps/frontend/postcss.config.js', `
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`);

write('apps/frontend/tailwind.config.ts', `
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0D17',
        surface: '#1A1D2D',
        primary: '#6366F1',
        secondary: '#10B981',
        accent: '#8B5CF6'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
export default config
`);

write('apps/frontend/next.config.mjs', `
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@payflow/db', '@payflow/events'],
};

export default nextConfig;
`);

write('apps/frontend/src/app/globals.css', `
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-background text-white antialiased selection:bg-primary/30;
  }
}

.glass-panel {
  @apply bg-gradient-glass backdrop-blur-xl border border-white/10 shadow-2xl;
}
`);

write('apps/frontend/src/app/layout.tsx', `
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PayFlow - Global Financial Infrastructure',
  description: 'Production-grade fintech payment platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
`);

write('apps/frontend/src/app/page.tsx', `
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
`);

write('apps/frontend/src/app/dashboard/page.tsx', `
"use client";

import { motion } from 'framer-motion';
import { Activity, CreditCard, DollarSign, Send } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background p-8">
      <header className="mb-12 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Overview</h1>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent" />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard title="Total Balance" value="$124,500.00" icon={<DollarSign className="text-primary" />} />
        <StatCard title="Monthly Volume" value="$45,230.50" icon={<Activity className="text-secondary" />} />
        <StatCard title="Active Cards" value="3" icon={<CreditCard className="text-accent" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel p-6 rounded-2xl"
        >
          <h2 className="text-xl font-semibold mb-6">Recent Transactions</h2>
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="flex justify-between items-center p-4 hover:bg-white/5 rounded-xl transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Send size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Transfer to Bank</p>
                    <p className="text-sm text-gray-400">Today, 2:45 PM</p>
                  </div>
                </div>
                <span className="font-semibold text-red-400">-$2,500.00</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-panel p-6 rounded-2xl relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
        {icon}
      </div>
      <h3 className="text-gray-400 text-sm font-medium mb-2">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </motion.div>
  );
}
`);

console.log('Frontend generated.');
