import React from 'react';
import { AlertTriangle, Shield, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface SecurityAlertProps {
  type: 'rate_limit' | 'suspicious_activity' | 'account_locked' | 'security_notice';
  message: string;
  details?: string;
  onDismiss?: () => void;
  onContactSupport?: () => void;
}

export const SecurityAlert: React.FC<SecurityAlertProps> = ({
  type,
  message,
  details,
  onDismiss,
  onContactSupport
}) => {
  const getIcon = () => {
    switch (type) {
      case 'rate_limit':
        return <Shield className="h-4 w-4" />;
      case 'account_locked':
        return <Lock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getVariant = () => {
    switch (type) {
      case 'rate_limit':
      case 'account_locked':
        return 'destructive' as const;
      case 'suspicious_activity':
        return 'destructive' as const;
      default:
        return 'default' as const;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'rate_limit':
        return 'Rate Limit Exceeded';
      case 'account_locked':
        return 'Account Temporarily Locked';
      case 'suspicious_activity':
        return 'Suspicious Activity Detected';
      default:
        return 'Security Notice';
    }
  };

  return (
    <Alert variant={getVariant()} className="mb-6">
      {getIcon()}
      <AlertTitle>{getTitle()}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">{message}</p>
        {details && (
          <p className="text-sm text-muted-foreground mb-3">{details}</p>
        )}
        <div className="flex gap-2 mt-3">
          {onDismiss && (
            <Button variant="outline" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
          {onContactSupport && (
            <Button variant="outline" size="sm" onClick={onContactSupport}>
              Contact Support
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};