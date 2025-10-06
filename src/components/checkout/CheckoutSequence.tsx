import React from 'react';
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
        return <CheckCircle className="h-5 w-5" />;
      case 'current':
        return <Clock className="h-5 w-5" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Desktop: Horizontal layout */}
        <div className="hidden md:flex items-center justify-between gap-4">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
                  step.status === 'completed' ? 'bg-green-100 text-green-700' :
                  step.status === 'current' ? 'bg-blue-100 text-blue-700' :
                  step.status === 'error' ? 'bg-red-100 text-red-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {getStepIcon(step.status)}
                </div>
                <h4 className="text-sm font-medium text-center">{step.title}</h4>
                <p className="text-xs text-muted-foreground text-center mt-1">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-[-40px]" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile: Vertical layout */}
        <div className="md:hidden space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start space-x-4">
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step.status === 'completed' ? 'bg-green-100 text-green-700' :
                  step.status === 'current' ? 'bg-blue-100 text-blue-700' :
                  step.status === 'error' ? 'bg-red-100 text-red-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {getStepIcon(step.status)}
                </div>
                {index < steps.length - 1 && (
                  <div className="w-px h-8 bg-border mt-2" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium leading-none">{step.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};