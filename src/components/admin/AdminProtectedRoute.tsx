import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: ('admin' | 'sales_rep' | 'fulfilment')[];
}

export const AdminProtectedRoute = ({ 
  children, 
  requiredRoles = ['admin'] 
}: AdminProtectedRouteProps) => {
  const { user, isLoading, userRoles } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user has any of the required roles
  const hasRequiredRole = requiredRoles.some(role => 
    userRoles?.includes(role)
  );

  if (!hasRequiredRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this area.
          </p>
          <p className="text-sm text-muted-foreground">
            Required roles: {requiredRoles.join(', ')}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};