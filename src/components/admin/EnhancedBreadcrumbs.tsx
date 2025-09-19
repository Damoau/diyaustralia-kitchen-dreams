import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home, ChevronRight } from 'lucide-react';

// Enhanced breadcrumb mapping with better labels and context
const breadcrumbMap: Record<string, { label: string; context?: string }> = {
  // Main sections
  admin: { label: 'Admin Dashboard', context: 'Management Portal' },
  overview: { label: 'Overview', context: 'Dashboard' },
  
  // Sales
  sales: { label: 'Sales', context: 'Customer Management' },
  carts: { label: 'Shopping Carts', context: 'Active Sessions' },
  quotes: { label: 'Quotes', context: 'Customer Requests' },
  
  // Operations
  orders: { label: 'Orders', context: 'Order Management' },
  production: { label: 'Production', context: 'Manufacturing Queue' },
  shipping: { label: 'Shipping', context: 'Fulfillment' },
  assembly: { label: 'Assembly', context: 'Final Assembly' },
  
  // Configuration
  cabinets: { label: 'Cabinet Management', context: 'Product Configuration' },
  'configuration-migration': { label: 'Configuration Migration', context: 'System Migration' },
  pricing: { label: 'Pricing', context: 'Price Management' },
  discounts: { label: 'Discounts', context: 'Promotional Pricing' },
  users: { label: 'Users', context: 'User Management' },
  roles: { label: 'Roles', context: 'Access Control' },
  
  // Analytics
  reports: { label: 'Reports', context: 'Business Intelligence' },
  exports: { label: 'Exports', context: 'Data Export' },
  
  // System
  security: { label: 'Security', context: 'System Security' },
  notifications: { label: 'Notifications', context: 'System Alerts' },
  settings: { label: 'Settings', context: 'System Configuration' },
};

export const EnhancedBreadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // Build breadcrumb items with enhanced labels
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const breadcrumbInfo = breadcrumbMap[segment] || { label: segment.charAt(0).toUpperCase() + segment.slice(1) };
    
    return {
      path,
      label: breadcrumbInfo.label,
      context: breadcrumbInfo.context,
      isLast: index === pathSegments.length - 1
    };
  });

  // Don't show breadcrumbs for root admin path
  if (pathSegments.length <= 1) return null;

  return (
    <div className="flex flex-col space-y-1">
      <Breadcrumb>
        <BreadcrumbList className="flex items-center space-x-2">
          {/* Home icon for admin root */}
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/admin" className="flex items-center hover:text-primary transition-colors">
                <Home className="w-4 h-4" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.path}>
              <BreadcrumbSeparator>
                <ChevronRight className="w-4 h-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage className="font-medium text-foreground">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link 
                      to={crumb.path} 
                      className="hover:text-primary transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      
      {/* Context information */}
      {breadcrumbs.length > 0 && breadcrumbs[breadcrumbs.length - 1].context && (
        <p className="text-xs text-muted-foreground ml-1">
          {breadcrumbs[breadcrumbs.length - 1].context}
        </p>
      )}
    </div>
  );
};