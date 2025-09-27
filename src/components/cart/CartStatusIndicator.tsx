import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Archive, Save, AlertCircle } from "lucide-react";

interface CartStatusIndicatorProps {
  status: string;
  source?: string;
  itemCount?: number;
  className?: string;
}

export const CartStatusIndicator = ({ 
  status, 
  source, 
  itemCount = 0,
  className = ""
}: CartStatusIndicatorProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          variant: 'default' as const,
          icon: ShoppingCart,
          label: 'Active Cart',
          color: 'text-green-600'
        };
      case 'saved':
        return {
          variant: 'secondary' as const,
          icon: Save,
          label: 'Saved Cart',
          color: 'text-blue-600'
        };
      case 'abandoned':
        return {
          variant: 'outline' as const,
          icon: Archive,
          label: 'Abandoned',
          color: 'text-gray-500'
        };
      case 'converted_to_quote':
        return {
          variant: 'outline' as const,
          icon: Archive,
          label: 'Converted to Quote',
          color: 'text-purple-600'
        };
      default:
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          label: 'Unknown Status',
          color: 'text-red-600'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const getSourceLabel = () => {
    if (!source) return '';
    
    switch (source) {
      case 'quote_conversion':
        return ' • From Quote';
      case 'manual':
        return ' • Manual Entry';
      case 'product_configurator':
        return ' • Product Builder';
      default:
        return '';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
        {itemCount > 0 && ` (${itemCount})`}
      </Badge>
      {source && (
        <span className="text-xs text-muted-foreground">
          {getSourceLabel()}
        </span>
      )}
    </div>
  );
};