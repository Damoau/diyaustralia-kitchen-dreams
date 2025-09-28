import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RefreshCw, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ErrorEntry {
  id: string;
  timestamp: string;
  message: string;
  code?: string;
  source: string;
  details?: any;
  severity: 'error' | 'warning' | 'info';
}

export const ErrorCheckLog: React.FC = () => {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(true);
  const { toast } = useToast();

  // Capture console errors
  useEffect(() => {
    if (!isCapturing) return;

    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      originalError.apply(console, args);
      addError({
        message: args.join(' '),
        severity: 'error',
        source: 'console.error'
      });
    };

    console.warn = (...args) => {
      originalWarn.apply(console, args);
      addError({
        message: args.join(' '),
        severity: 'warning',
        source: 'console.warn'
      });
    };

    // Capture unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        severity: 'error',
        source: 'promise_rejection',
        details: event.reason
      });
    };

    // Capture global errors
    const handleGlobalError = (event: ErrorEvent) => {
      addError({
        message: event.message,
        severity: 'error',
        source: 'global_error',
        details: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, [isCapturing]);

  const addError = (errorData: Omit<ErrorEntry, 'id' | 'timestamp'>) => {
    const newError: ErrorEntry = {
      ...errorData,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString()
    };

    setErrors(prev => [newError, ...prev.slice(0, 49)]); // Keep last 50 errors
  };

  const clearErrors = () => {
    setErrors([]);
    toast({
      title: "Error log cleared",
      description: "All logged errors have been removed"
    });
  };

  const toggleCapturing = () => {
    setIsCapturing(!isCapturing);
    toast({
      title: isCapturing ? "Error capturing stopped" : "Error capturing started",
      description: isCapturing ? "No longer capturing new errors" : "Now capturing console errors and warnings"
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      default: return 'outline';
    }
  };

  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg">Error Check Log</CardTitle>
            <div className="flex gap-2">
              {errorCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {errorCount} errors
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {warningCount} warnings
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCapturing}
              className={isCapturing ? "text-green-600" : "text-red-600"}
            >
              <RefreshCw className={`h-4 w-4 ${isCapturing ? 'animate-spin' : ''}`} />
              {isCapturing ? 'Capturing' : 'Paused'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={clearErrors}>
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {errors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No errors logged yet
              </div>
            ) : (
              errors.map((error) => (
                <div
                  key={error.id}
                  className="border rounded-lg p-3 bg-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getSeverityColor(error.severity)} className="text-xs">
                          {error.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {error.timestamp}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {error.source}
                        </span>
                      </div>
                      <p className="text-sm break-words">{error.message}</p>
                      {error.code && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Code: {error.code}
                        </p>
                      )}
                      {error.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer">
                            Show details
                          </summary>
                          <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-x-auto">
                            {JSON.stringify(error.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};