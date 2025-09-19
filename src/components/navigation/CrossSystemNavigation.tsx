import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import {
  ArrowRight,
  Shield,
  ShoppingCart,
  User,
  Settings,
  BarChart3,
  Package,
  FileText
} from 'lucide-react';

interface CrossSystemLink {
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  featureFlag?: string;
}

const systemLinks: CrossSystemLink[] = [
  {
    title: 'Admin Dashboard',
    description: 'Manage orders, inventory, and system settings',
    path: '/admin',
    icon: Shield,
    requiresAdmin: true,
    badge: 'Admin Only'
  },
  {
    title: 'Customer Portal',
    description: 'View your orders, quotes, and account details',
    path: '/portal',
    icon: User,
    requiresAuth: true
  },
  {
    title: 'Shop Products',
    description: 'Browse and configure kitchen cabinets',
    path: '/shop',
    icon: ShoppingCart
  },
  {
    title: 'Get Quote',
    description: 'Request a custom quote for your project',
    path: '/get-quote',
    icon: FileText
  },
  {
    title: 'Price List',
    description: 'View current pricing for all products',
    path: '/price-list',
    icon: BarChart3
  },
  {
    title: 'Products Catalog',
    description: 'Browse our complete product range',
    path: '/products',
    icon: Package
  }
];

export const CrossSystemNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { isEnabled } = useFeatureFlags();

  // Filter links based on user permissions and current location
  const availableLinks = systemLinks.filter(link => {
    // Don't show current page
    if (location.pathname === link.path || location.pathname.startsWith(link.path + '/')) {
      return false;
    }

    // Check authentication requirements
    if (link.requiresAuth && !isAuthenticated) {
      return false;
    }

    // Check admin requirements
    if (link.requiresAdmin && !user?.user_metadata?.is_admin) {
      return false;
    }

    // Check feature flags
    if (link.featureFlag && !isEnabled(link.featureFlag)) {
      return false;
    }

    return true;
  });

  if (availableLinks.length === 0) return null;

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ArrowRight className="w-5 h-5" />
          <span>Quick Navigation</span>
        </CardTitle>
        <CardDescription>
          Navigate to other parts of the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableLinks.map((link) => (
            <Button
              key={link.path}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start space-y-2 hover:bg-muted/50 transition-colors"
              onClick={() => navigate(link.path)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <link.icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{link.title}</span>
                </div>
                {link.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {link.badge}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-left">
                {link.description}
              </p>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};