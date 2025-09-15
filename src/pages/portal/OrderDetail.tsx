import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { OrderDetail } from "@/components/portal/OrderDetail";
import { Skeleton } from "@/components/ui/skeleton";

const PortalOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
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

  if (!id) {
    return <Navigate to="/portal/orders" replace />;
  }

  return (
    <PortalLayout>
      <OrderDetail orderId={id} />
    </PortalLayout>
  );
};

export default PortalOrderDetail;