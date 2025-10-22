import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { formatPrice } from '@/lib/formatPrice';
import { ColorServiceFee } from '@/hooks/useColorServiceFees';

interface ColorServiceFeeAlertProps {
  fees: ColorServiceFee[];
  totalServiceFees: number;
}

export const ColorServiceFeeAlert = ({ fees, totalServiceFees }: ColorServiceFeeAlertProps) => {
  if (!fees.length) return null;

  return (
    <div className="space-y-2">
      {fees.map((fee) => (
        <Alert key={fee.colorId} variant="default" className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-700 dark:text-amber-400">
            {fee.colorName} Service Fee: {formatPrice(fee.serviceFee)}
          </AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            Current order: {formatPrice(fee.colorTotal)} • 
            Minimum required: {formatPrice(fee.minimumRequired)} • 
            Add {formatPrice(fee.minimumRequired - fee.colorTotal)} more to avoid this fee
          </AlertDescription>
        </Alert>
      ))}
      
      {totalServiceFees > 0 && (
        <div className="flex justify-between items-center p-3 bg-amber-500/5 rounded-md border border-amber-500/20">
          <span className="font-medium text-sm">Total Service Fees</span>
          <span className="font-semibold text-amber-700 dark:text-amber-400">
            {formatPrice(totalServiceFees)}
          </span>
        </div>
      )}
    </div>
  );
};
