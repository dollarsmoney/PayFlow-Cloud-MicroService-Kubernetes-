'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hydrate } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      const stored = localStorage.getItem('pf_token');
      if (!stored) router.push('/auth/login');
    }
  }, [isAuthenticated]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-60 flex-1 min-h-screen p-8">
        {children}
      </main>
    </div>
  );
}
