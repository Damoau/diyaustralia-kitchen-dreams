import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusChipProps {
  status: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  // Cart statuses
  active: { variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  converted: { variant: 'default', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  abandoned: { variant: 'secondary', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
  
  // Order statuses
  pending: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  confirmed: { variant: 'default', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  in_production: { variant: 'default', className: 'bg-purple-100 text-purple-800 hover:bg-purple-100' },
  ready_to_ship: { variant: 'default', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
  shipped: { variant: 'default', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  delivered: { variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  completed: { variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  cancelled: { variant: 'destructive' },
  
  // Payment statuses
  paid: { variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  unpaid: { variant: 'destructive' },
  partial: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  overdue: { variant: 'destructive' },
  
  // Quote statuses
  draft: { variant: 'secondary' },
  sent: { variant: 'default', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  viewed: { variant: 'default', className: 'bg-purple-100 text-purple-800 hover:bg-purple-100' },
  accepted: { variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  rejected: { variant: 'destructive' },
  expired: { variant: 'secondary', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
  
  // Production statuses
  queued: { variant: 'secondary', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
  cutting: { variant: 'default', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  assembly: { variant: 'default', className: 'bg-purple-100 text-purple-800 hover:bg-purple-100' },
  finishing: { variant: 'default', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
  quality_check: { variant: 'default', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  packaging: { variant: 'default', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
};

export const StatusChip = ({ status, variant, className }: StatusChipProps) => {
  const config = statusConfig[status.toLowerCase()] || { variant: 'outline' };
  const displayText = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return (
    <Badge 
      variant={variant || config.variant}
      className={cn(config.className, className)}
    >
      {displayText}
    </Badge>
  );
};