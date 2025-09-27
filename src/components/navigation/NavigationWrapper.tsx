import React, { ReactNode } from 'react';
import { useNavigationMismatchDetector } from '@/components/navigation/NavigationDebugger';

interface NavigationWrapperProps {
  children: ReactNode;
}

// This component must be rendered inside the BrowserRouter to use navigation hooks
export const NavigationWrapper = ({ children }: NavigationWrapperProps) => {
  const { NavigationDebugger } = useNavigationMismatchDetector();

  return (
    <>
      {children}
      <NavigationDebugger />
    </>
  );
};