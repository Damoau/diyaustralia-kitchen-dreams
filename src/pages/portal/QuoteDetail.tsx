import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { QuoteDetail } from "@/components/portal/QuoteDetail";
import { Skeleton } from "@/components/ui/skeleton";

const PortalQuoteDetail = () => {
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
    return <Navigate to="/portal/quotes" replace />;
  }

  return (
    <PortalLayout>
      <QuoteDetail quoteId={id} />
    </PortalLayout>
  );
};

export default PortalQuoteDetail;