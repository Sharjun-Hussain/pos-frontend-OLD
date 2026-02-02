
'use client';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { AppSidebar } from "@/components/app-sidebar"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { DashboardLayoutSkeleton } from '../skeletons/Dashboard-skeleton';
import { SystemBreadcrumb } from '@/components/general/breadcrumb/Breadcrumb';

export default function AppLayout({ children }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Check if current route is POS
  const isPosScreen = pathname === '/pos';

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <DashboardLayoutSkeleton />
      </div>
    );
  }

  // If unauthenticated, don't render anything (redirect will handle it)
  if (status === 'unauthenticated') {
    return null;
  }

  // POS Screen - No sidebar, no breadcrumb
  if (isPosScreen) {
    return (
      <div className="min-h-screen w-full">
        {children}
      </div>
    );
  }

  // Regular screens - With sidebar and breadcrumb
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full">
        <AppSidebar variant="sidebar" />
        <div className="flex-1 flex flex-col min-w-0">
          <SidebarInset>
            <div className='flex flex-col min-h-screen bg-slate-50/50 border-l border-slate-200'>
              <SystemBreadcrumb />
              <main className='flex-1 p-4'>
                {children}
              </main>
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}