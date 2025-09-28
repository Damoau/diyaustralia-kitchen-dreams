import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { LucideIcon } from 'lucide-react';

interface MobileOptimizedCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export const MobileOptimizedCard: React.FC<MobileOptimizedCardProps> = ({
  title,
  description,
  icon: Icon,
  children,
  className = ""
}) => {
  const isMobile = useIsMobile();

  return (
    <Card className={`${isMobile ? 'admin-card shadow-sm border-0' : ''} ${className}`}>
      <CardHeader className={isMobile ? 'pb-3' : 'pb-6'}>
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-primary`} />}
          <div className="flex-1 min-w-0">
            <CardTitle className={isMobile ? 'mobile-title' : 'text-xl font-semibold'}>
              {title}
            </CardTitle>
            {description && (
              <CardDescription className={isMobile ? 'mobile-subtitle mt-1' : 'mt-2'}>
                {description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className={isMobile ? 'pt-0 space-y-4' : 'space-y-6'}>
        {children}
      </CardContent>
    </Card>
  );
};