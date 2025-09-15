import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { ProfileSettings } from "@/components/portal/ProfileSettings";
import { Skeleton } from "@/components/ui/skeleton";

const PortalProfile = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <PortalLayout>
      <ProfileSettings />
    </PortalLayout>
  );
};

export default PortalProfile;