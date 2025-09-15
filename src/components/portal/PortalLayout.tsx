import { ReactNode } from "react";
import { PortalNavigation } from "./PortalNavigation";
import { PortalBreadcrumbs } from "./PortalBreadcrumbs";
import { PortalAlerts } from "./PortalAlerts";

interface PortalLayoutProps {
  children: ReactNode;
}

export const PortalLayout = ({ children }: PortalLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <PortalNavigation />
      <div className="container mx-auto px-4 py-6">
        <PortalBreadcrumbs />
        <PortalAlerts />
        <main className="mt-6">
          {children}
        </main>
      </div>
    </div>
  );
};