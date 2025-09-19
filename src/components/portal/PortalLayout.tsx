import { ReactNode } from "react";
import { EnhancedPortalNavigation } from "./EnhancedPortalNavigation";
import { PortalBreadcrumbs } from "./PortalBreadcrumbs";
import { PortalAlerts } from "./PortalAlerts";
import { CrossSystemNavigation } from "@/components/navigation/CrossSystemNavigation";
import { FeatureFlagNavigation } from "@/components/navigation/FeatureFlagNavigation";
import { NavigationPerformanceOptimizer } from "@/components/navigation/NavigationPerformanceOptimizer";

interface PortalLayoutProps {
  children: ReactNode;
}

export const PortalLayout = ({ children }: PortalLayoutProps) => {
  return (
    <NavigationPerformanceOptimizer>
      <div className="min-h-screen bg-background">
        <EnhancedPortalNavigation />
        <div className="container mx-auto px-4 py-6 pt-26">
          <PortalBreadcrumbs />
          <PortalAlerts />
          
          {/* Feature Flag Navigation */}
          <div className="mb-6">
            <FeatureFlagNavigation />
          </div>
          
          <main className="mt-6 space-y-6">
            {children}
            
            {/* Cross-system navigation */}
            <div className="mt-8">
              <CrossSystemNavigation />
            </div>
          </main>
        </div>
      </div>
    </NavigationPerformanceOptimizer>
  );
};