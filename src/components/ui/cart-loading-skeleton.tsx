import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart } from "lucide-react";

export const CartLoadingSkeleton = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <ShoppingCart className="h-5 w-5" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-5 w-16" />
      </div>

      {/* Cart Items */}
      <div className="flex-1 space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-start space-x-4 py-4 border-b">
            {/* Product Image */}
            <Skeleton className="w-16 h-16 rounded" />
            
            {/* Product Details */}
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-4 w-20" />
            </div>
            
            {/* Actions */}
            <div className="flex flex-col items-end space-y-2">
              <Skeleton className="h-6 w-6" />
              <div className="flex items-center space-x-1">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-6 w-6" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t pt-4 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-20" />
        </div>
        
        <div className="flex justify-center">
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
};