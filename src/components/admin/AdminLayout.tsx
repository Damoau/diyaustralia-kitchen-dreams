import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full">
        {!isMobile && <AdminSidebar />}
        <SidebarInset className="flex-1">
          <AdminTopBar />
          <main className={`flex-1 ${isMobile ? 'p-3 pt-4' : 'p-6'}`}>
            <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};