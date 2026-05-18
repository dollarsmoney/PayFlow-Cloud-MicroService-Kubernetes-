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
