'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/authStore';
import { notificationsApi } from '@/lib/api';
import { Bell, CheckCircle, AlertTriangle, CreditCard, Sparkles } from 'lucide-react';

const fadeUp = (d = 0) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: d } });

const TYPE_ICON: Record<string, any> = {
  WELCOME:         { icon: Sparkles,     color: 'text-violet-400', bg: 'bg-violet-500/10' },
  PAYMENT_SUCCESS: { icon: CheckCircle,  color: 'text-emerald-400',bg: 'bg-emerald-500/10' },
  PAYMENT_FAILED:  { icon: CreditCard,   color: 'text-red-400',    bg: 'bg-red-500/10' },
  FRAUD_ALERT:     { icon: AlertTriangle,color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  DEFAULT:         { icon: Bell,         color: 'text-blue-400',   bg: 'bg-blue-500/10' },
};

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const [notifs, setNotifs]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    notificationsApi.getByUser(user.id)
      .then(r => setNotifs(r.data || []))
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div {...fadeUp(0)} className="mb-8">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-gray-400 text-sm mt-1">notification-service · <span className="text-gray-600">:3004</span> via Kafka consumers</p>
      </motion.div>

      {/* Info */}
      <motion.div {...fadeUp(0.03)} className="glass rounded-2xl p-4 mb-6 flex items-start gap-3">
        <Bell size={14} className="text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-400">
          Notifications are generated automatically by the <strong className="text-white">notification-service</strong> Kafka consumer
          listening on <code className="text-primary">user.created</code>, <code className="text-primary">payment.completed</code>,{' '}
          <code className="text-primary">payment.failed</code>, and <code className="text-primary">fraud.detected</code> topics.
        </p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 glass animate-pulse rounded-2xl" />)}
        </div>
      ) : notifs.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center text-gray-500">
          No notifications yet. Make a payment or trigger a fraud event to see messages here.
        </div>
      ) : (
        <div className="space-y-3">
          {notifs.map((n: any, i: number) => {
            const { icon: Icon, color, bg } = TYPE_ICON[n.type] || TYPE_ICON.DEFAULT;
            return (
              <motion.div key={n.id} {...fadeUp(i * 0.04)} className="glass-hover p-4 rounded-2xl flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={18} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm">{n.title}</p>
                    <span className="badge badge-purple text-[10px]">{n.type}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-gray-600 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
