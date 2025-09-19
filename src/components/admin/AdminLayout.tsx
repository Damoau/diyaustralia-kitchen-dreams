import React from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';
import { Toaster } from '@/components/ui/sonner';
import { SidebarProvider } from '@/components/ui/sidebar';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { NavigationPerformanceOptimizer } from '@/components/navigation/NavigationPerformanceOptimizer';
import { CrossSystemNavigation } from '@/components/navigation/CrossSystemNavigation';
import { FeatureFlagNavigation } from '@/components/navigation/FeatureFlagNavigation';

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <NavigationProvider>
      <NavigationPerformanceOptimizer>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background">
            <div className="hidden lg:flex">
              <AdminSidebar />
            </div>
            
            <div className="flex-1 flex flex-col">
              <AdminTopBar />
              
              <main className="flex-1 p-6 space-y-6">
                {children}
                
                {/* Feature Flag Navigation for Admin */}
                <div className="mt-8">
                  <FeatureFlagNavigation />
                </div>
                
                {/* Cross-system navigation */}
                <div className="mt-6">
                  <CrossSystemNavigation />
                </div>
              </main>
            </div>
            
            <Toaster />
          </div>
        </SidebarProvider>
      </NavigationPerformanceOptimizer>
    </NavigationProvider>
  );
};

export default AdminLayout;