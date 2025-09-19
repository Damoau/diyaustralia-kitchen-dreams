import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  FileText, 
  Package, 
  Factory, 
  Truck, 
  Plus,
  ArrowRight,
  Settings
} from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

export const QuickActionsBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isEnabled } = useFeatureFlags();
  
  // Get contextual quick actions based on current route
  const getContextualActions = () => {
    const path = location.pathname;
    
    if (path.includes('/admin/sales/carts')) {
      return [
        { 
          label: 'New Cart', 
          icon: ShoppingCart, 
          action: () => navigate('/shop'), 
          variant: 'default' as const 
        },
        { 
          label: 'View Orders', 
          icon: ArrowRight, 
          action: () => navigate('/admin/orders'), 
          variant: 'outline' as const 
        }
      ];
    }
    
    if (path.includes('/admin/orders')) {
      return [
        { 
          label: 'New Order', 
          icon: Package, 
          action: () => navigate('/shop'), 
          variant: 'default' as const 
        },
        { 
          label: 'Production Queue', 
          icon: ArrowRight, 
          action: () => navigate('/admin/production'), 
          variant: 'outline' as const 
        }
      ];
    }
    
    if (path.includes('/admin/production')) {
      return [
        { 
          label: 'View Orders', 
          icon: Package, 
          action: () => navigate('/admin/orders'), 
          variant: 'outline' as const 
        },
        { 
          label: 'Shipping', 
          icon: ArrowRight, 
          action: () => navigate('/admin/shipping'), 
          variant: 'outline' as const 
        }
      ];
    }
    
    if (path.includes('/admin/cabinets')) {
      return [
        { 
          label: 'Configuration Migration', 
          icon: Settings, 
          action: () => navigate('/admin/configuration-migration'), 
          variant: 'outline' as const 
        },
        { 
          label: 'View Products', 
          icon: ArrowRight, 
          action: () => navigate('/products'), 
          variant: 'outline' as const 
        }
      ];
    }

    if (path.includes('/admin/configuration-migration')) {
      return [
        { 
          label: 'Cabinet Management', 
          icon: Package, 
          action: () => navigate('/admin/cabinets'), 
          variant: 'outline' as const 
        },
        { 
          label: 'Test Shop', 
          icon: ArrowRight, 
          action: () => navigate('/shop'), 
          variant: 'outline' as const 
        }
      ];
    }
    
    // Default actions for other routes
    return [
      { 
        label: 'New Cart', 
        icon: ShoppingCart, 
        action: () => navigate('/shop'), 
        variant: 'outline' as const 
      },
      { 
        label: 'New Quote', 
        icon: FileText, 
        action: () => navigate('/get-quote'), 
        variant: 'outline' as const 
      }
    ];
  };

  const actions = getContextualActions();

  return (
    <div className="flex items-center space-x-2">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant}
          size="sm"
          onClick={action.action}
          className="flex items-center space-x-2"
        >
          <action.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{action.label}</span>
        </Button>
      ))}
    </div>
  );
};