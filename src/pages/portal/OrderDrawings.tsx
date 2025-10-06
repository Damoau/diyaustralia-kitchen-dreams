import { DocumentViewer } from '@/components/portal/DocumentViewer';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function OrderDrawings() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  if (!orderId) {
    return <div>Order not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Button
        variant="ghost"
        onClick={() => navigate(`/portal/orders/${orderId}`)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Order
      </Button>
      
      <h1 className="text-2xl font-bold mb-6">Review Kitchen Drawings</h1>
      
      <DocumentViewer 
        orderId={orderId} 
        onApproved={() => navigate(`/portal/orders/${orderId}`)}
      />
    </div>
  );
}