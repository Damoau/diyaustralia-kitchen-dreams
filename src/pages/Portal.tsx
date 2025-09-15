import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { PortalDashboard } from "@/components/portal/PortalDashboard";
import { Skeleton } from "@/components/ui/skeleton";

const Portal = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <PortalLayout>
      <PortalDashboard />
    </PortalLayout>
  );
};

export default Portal;