import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWebVitals } from '@/hooks/usePerformanceMonitor';
import { Activity, Zap, Clock, TrendingUp, RefreshCw, Minimize2, Maximize2 } from 'lucide-react';

// Performance dashboard for development
export const PerformanceDashboard = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [performanceLog, setPerformanceLog] = useState<any[]>([]);
  const webVitals = useWebVitals();

  // Only show in development
  useEffect(() => {
    setIsVisible(process.env.NODE_ENV === 'development');
  }, []);

  // Capture performance logs
  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;

    console.log = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('[Performance]')) {
        setPerformanceLog(prev => [...prev.slice(-9), {
          timestamp: Date.now(),
          level: 'info',
          message: args.join(' ')
        }]);
      }
      originalLog.apply(console, args);
    };

    console.warn = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('[Slow Render]')) {
        setPerformanceLog(prev => [...prev.slice(-9), {
          timestamp: Date.now(),
          level: 'warn',
          message: args.join(' ')
        }]);
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
    };
  }, []);

  const clearLogs = () => {
    setPerformanceLog([]);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 bg-background border rounded-lg shadow-lg transition-all duration-200 ${
      isMinimized ? 'w-48 h-10' : 'w-96 max-h-96'
    }`}>
      <Card className="h-full">
        <CardHeader className={`${isMinimized ? 'pb-0 pt-2 px-3' : 'pb-3'}`}>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4" />
            {!isMinimized && "Performance Monitor"}
            {isMinimized && "Perf"}
            
            <div className="ml-auto flex items-center gap-1">
              {!isMinimized && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearLogs}
                  className="h-6 px-2"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 px-2"
              >
                {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="space-y-3">
            {/* Web Vitals */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {webVitals.lcp && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>LCP: {webVitals.lcp.toFixed(0)}ms</span>
                  <Badge variant={webVitals.lcp > 2500 ? "destructive" : "secondary"} className="text-xs">
                    {webVitals.lcp > 2500 ? 'Poor' : 'Good'}
                  </Badge>
                </div>
              )}
              
              {webVitals.fcp && (
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>FCP: {webVitals.fcp.toFixed(0)}ms</span>
                </div>
              )}
              
              {webVitals.cls && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>CLS: {webVitals.cls.toFixed(3)}</span>
                </div>
              )}
            </div>

            {/* Performance Logs */}
            <div className="max-h-32 overflow-y-auto space-y-1">
              <h4 className="text-xs font-medium text-muted-foreground">Recent Activity:</h4>
              {performanceLog.length === 0 ? (
                <p className="text-xs text-muted-foreground">No performance data yet...</p>
              ) : (
                performanceLog.map((log, index) => (
                  <div 
                    key={index}
                    className={`text-xs p-2 rounded ${
                      log.level === 'warn' 
                        ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' 
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="flex-1 break-all">{log.message}</span>
                      <span className="text-xs opacity-70 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default PerformanceDashboard;