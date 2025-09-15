import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface SequenceStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending' | 'error';
}

interface CheckoutSequenceProps {
  currentStep: string;
  steps: SequenceStep[];
}

export const CheckoutSequence = ({ currentStep, steps }: CheckoutSequenceProps) => {
  const getStepIcon = (status: SequenceStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'current':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  const getStepBadge = (status: SequenceStep['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="text-green-700 border-green-200">Complete</Badge>;
      case 'current':
        return <Badge variant="outline" className="text-blue-700 border-blue-200">Current</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checkout Process</CardTitle>
        <CardDescription>
          Follow these steps to complete your order
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start space-x-4">
              <div className="flex flex-col items-center">
                {getStepIcon(step.status)}
                {index < steps.length - 1 && (
                  <div className="w-px h-8 bg-border mt-2" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium leading-none">{step.title}</h4>
                  {getStepBadge(step.status)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
              </div>
              {step.status === 'completed' && index < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground mt-1" />
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">6.7 Checkout Flow:</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>1. Client → POST /api/checkout/start with cart_id → checkout_id</p>
            <p>2. Client shows Identify step</p>
            <p>3. User submits to POST /api/checkout/{`{id}`}/identify</p>
            <p>4. Server validates, authenticates/creates user, links checkout</p>
            <p>5. Server merges carts and flags available quotes</p>
            <p>6. Server → Client {`{ next_step: "shipping", has_quotes: true|false }`}</p>
            <p>7. Client navigates to Shipping/Delivery step</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};