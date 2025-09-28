import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

interface MobileFormLayoutProps {
  children: React.ReactNode;
  actions?: React.ReactNode;
  title?: string;
  className?: string;
}

export const MobileFormLayout: React.FC<MobileFormLayoutProps> = ({
  children,
  actions,
  title,
  className = ""
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={`${isMobile ? 'mobile-form-spacing' : 'space-y-6'} ${className}`}>
      {title && (
        <div className={isMobile ? 'mb-4' : 'mb-6'}>
          <h2 className={isMobile ? 'mobile-title' : 'text-2xl font-semibold'}>
            {title}
          </h2>
        </div>
      )}
      
      <div className={isMobile ? 'space-y-4' : 'space-y-6'}>
        {children}
      </div>
      
      {actions && (
        <div className={`${isMobile ? 'admin-button-group mt-6 pt-4 border-t' : 'flex justify-end space-x-4 mt-8'}`}>
          {actions}
        </div>
      )}
    </div>
  );
};

interface MobileFormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  children: React.ReactNode;
}

export const MobileFormField: React.FC<MobileFormFieldProps> = ({
  label,
  required,
  error,
  help,
  children
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={isMobile ? 'admin-form-field' : 'space-y-2'}>
      <label className={`block text-sm font-medium ${error ? 'text-destructive' : 'text-foreground'}`}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      
      {children}
      
      {help && !error && (
        <p className="text-xs text-muted-foreground mt-1">{help}</p>
      )}
      
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
};

interface MobileActionButtonsProps {
  primaryLabel?: string;
  primaryAction?: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  secondaryAction?: () => void;
  secondaryVariant?: "default" | "outline" | "ghost";
}

export const MobileActionButtons: React.FC<MobileActionButtonsProps> = ({
  primaryLabel = "Save",
  primaryAction,
  primaryDisabled,
  primaryLoading,
  secondaryLabel = "Cancel",
  secondaryAction,
  secondaryVariant = "outline"
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="admin-button-group">
        {primaryAction && (
          <Button 
            onClick={primaryAction}
            disabled={primaryDisabled}
            className="admin-button mobile-touch-target"
            size="lg"
          >
            {primaryLoading ? "Saving..." : primaryLabel}
          </Button>
        )}
        {secondaryAction && (
          <Button 
            variant={secondaryVariant}
            onClick={secondaryAction}
            className="admin-button mobile-touch-target"
            size="lg"
          >
            {secondaryLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex justify-end space-x-4">
      {secondaryAction && (
        <Button variant={secondaryVariant} onClick={secondaryAction}>
          {secondaryLabel}
        </Button>
      )}
      {primaryAction && (
        <Button 
          onClick={primaryAction}
          disabled={primaryDisabled}
        >
          {primaryLoading ? "Saving..." : primaryLabel}
        </Button>
      )}
    </div>
  );
};