import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { AddressBook } from "@/components/portal/AddressBook";
import { Skeleton } from "@/components/ui/skeleton";

const PortalAddresses = () => {
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
      <AddressBook />
    </PortalLayout>
  );
};

export default PortalAddresses;