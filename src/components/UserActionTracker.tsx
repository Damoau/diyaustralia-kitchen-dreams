import React, { useEffect } from 'react';
import { useUserActionTracking, setGlobalTracker } from '@/hooks/useUserActionTracking';

interface UserActionTrackerProps {
  children: React.ReactNode;
}

export const UserActionTracker: React.FC<UserActionTrackerProps> = ({ children }) => {
  const tracker = useUserActionTracking();

  useEffect(() => {
    // Set the global tracker instance for use across the app
    setGlobalTracker(tracker);

    // Setup global error tracking
    const handleGlobalError = (event: ErrorEvent) => {
      tracker.trackError(new Error(event.message), 'global_error');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      tracker.trackError(new Error(String(event.reason)), 'unhandled_promise_rejection');
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [tracker]);

  return <>{children}</>;
};