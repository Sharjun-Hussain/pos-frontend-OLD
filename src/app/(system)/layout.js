'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { CustomSidebar } from "@/components/custom-sidebar";
import { DashboardLayoutSkeleton } from '../skeletons/dashboard/dashboard-skeleton';
import { SystemBreadcrumb } from '@/components/general/breadcrumb/Breadcrumb';

export default function AppLayout({ children }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isPosScreen = pathname === '/pos';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <DashboardLayoutSkeleton />
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  // POS Screen - Full width, optimized for touch/speed
  if (isPosScreen) {
    return (
      <div className="min-h-screen w-full bg-background font-sans selection:bg-[#10b981] selection:text-white">
        {children}
      </div>
    );
  }

  // Standard Dashboard Screens
  return (
    <div className="flex h-screen w-full bg-background text-foreground font-sans selection:bg-[#10b981] selection:text-white transition-colors duration-500 overflow-hidden">
      <CustomSidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <SystemBreadcrumb />
        <main className="flex-1 overflow-y-auto scroll-smooth thin-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}