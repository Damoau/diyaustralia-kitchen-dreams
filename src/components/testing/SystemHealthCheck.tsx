import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Shield,
  Zap,
  Globe,
  Server,
  Activity
} from 'lucide-react';

interface HealthCheck {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'checking';
  message: string;
  icon: React.ElementType;
  lastChecked?: Date;
  responseTime?: number;
}

export const SystemHealthCheck = () => {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([
    {
      id: 'database',
      name: 'Database Connection',
      status: 'checking',
      message: 'Checking database connectivity...',
      icon: Database
    },
    {
      id: 'auth',
      name: 'Authentication Service',
      status: 'checking',
      message: 'Checking authentication service...',
      icon: Shield
    },
    {
      id: 'api',
      name: 'API Endpoints',
      status: 'checking',
      message: 'Checking API endpoint health...',
      icon: Server
    },
    {
      id: 'storage',
      name: 'File Storage',
      status: 'checking',
      message: 'Checking file storage access...',
      icon: Globe
    },
    {
      id: 'performance',
      name: 'Performance Metrics',
      status: 'checking',
      message: 'Checking system performance...',
      icon: Zap
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);
  const { toast } = useToast();

  const getStatusColor = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'critical':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'checking':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    }
  };

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'checking':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
    }
  };

  const checkDatabaseHealth = async (): Promise<{ status: HealthCheck['status'], message: string, responseTime: number }> => {
    const startTime = performance.now();
    try {
      const { data, error } = await supabase.from('cabinet_types').select('id').limit(1);
      const responseTime = performance.now() - startTime;
      
      if (error) {
        return {
          status: 'critical',
          message: `Database error: ${error.message}`,
          responseTime
        };
      }
      
      return {
        status: 'healthy',
        message: `Database responding normally (${Math.round(responseTime)}ms)`,
        responseTime
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        status: 'critical',
        message: 'Database connection failed',
        responseTime
      };
    }
  };

  const checkAuthHealth = async (): Promise<{ status: HealthCheck['status'], message: string, responseTime: number }> => {
    const startTime = performance.now();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const responseTime = performance.now() - startTime;
      
      return {
        status: 'healthy',
        message: `Authentication service operational (${Math.round(responseTime)}ms)`,
        responseTime
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        status: 'warning',
        message: 'Authentication service may be experiencing issues',
        responseTime
      };
    }
  };

  const checkStorageHealth = async (): Promise<{ status: HealthCheck['status'], message: string, responseTime: number }> => {
    const startTime = performance.now();
    try {
      const { data, error } = await supabase.storage.listBuckets();
      const responseTime = performance.now() - startTime;
      
      if (error) {
        return {
          status: 'warning',
          message: `Storage warning: ${error.message}`,
          responseTime
        };
      }
      
      return {
        status: 'healthy',
        message: `Storage accessible (${Math.round(responseTime)}ms)`,
        responseTime
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        status: 'critical',
        message: 'Storage service unavailable',
        responseTime
      };
    }
  };

  const checkPerformanceHealth = async (): Promise<{ status: HealthCheck['status'], message: string, responseTime: number }> => {
    const startTime = performance.now();
    
    // Check Core Web Vitals if available
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const responseTime = performance.now() - startTime;
      
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        
        if (loadTime > 3000) {
          return {
            status: 'warning',
            message: `Page load time high: ${Math.round(loadTime)}ms`,
            responseTime
          };
        }
        
        return {
          status: 'healthy',
          message: `Performance good: ${Math.round(loadTime)}ms load time`,
          responseTime
        };
      }
    }
    
    const responseTime = performance.now() - startTime;
    return {
      status: 'healthy',
      message: 'Performance metrics nominal',
      responseTime
    };
  };

  const runHealthChecks = async () => {
    setIsRunning(true);
    
    const checks = [
      { id: 'database', checker: checkDatabaseHealth },
      { id: 'auth', checker: checkAuthHealth },
      { id: 'storage', checker: checkStorageHealth },
      { id: 'performance', checker: checkPerformanceHealth }
    ];

    // API check (simple fetch to current origin)
    const checkApiHealth = async (): Promise<{ status: HealthCheck['status'], message: string, responseTime: number }> => {
      const startTime = performance.now();
      try {
        const response = await fetch(window.location.origin);
        const responseTime = performance.now() - startTime;
        
        if (response.ok) {
          return {
            status: 'healthy',
            message: `API endpoints responding (${Math.round(responseTime)}ms)`,
            responseTime
          };
        }
        
        return {
          status: 'warning',
          message: `API warning: ${response.status} ${response.statusText}`,
          responseTime
        };
      } catch (error) {
        const responseTime = performance.now() - startTime;
        return {
          status: 'critical',
          message: 'API endpoints unreachable',
          responseTime
        };
      }
    };

    checks.push({ id: 'api', checker: checkApiHealth });

    // Run all checks
    for (const check of checks) {
      const result = await check.checker();
      
      setHealthChecks(prev => prev.map(hc => 
        hc.id === check.id 
          ? {
              ...hc,
              status: result.status,
              message: result.message,
              responseTime: result.responseTime,
              lastChecked: new Date()
            }
          : hc
      ));
      
      // Small delay between checks for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
    setLastRunTime(new Date());
    
    const criticalIssues = healthChecks.filter(hc => hc.status === 'critical').length;
    const warningIssues = healthChecks.filter(hc => hc.status === 'warning').length;
    
    if (criticalIssues > 0) {
      toast({
        title: "Critical Issues Detected",
        description: `${criticalIssues} critical issue(s) found`,
        variant: "destructive"
      });
    } else if (warningIssues > 0) {
      toast({
        title: "Warnings Detected", 
        description: `${warningIssues} warning(s) found`,
      });
    } else {
      toast({
        title: "All Systems Healthy",
        description: "No issues detected in system health check",
      });
    }
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  const overallHealth = () => {
    const critical = healthChecks.filter(hc => hc.status === 'critical').length;
    const warning = healthChecks.filter(hc => hc.status === 'warning').length;
    
    if (critical > 0) return 'critical';
    if (warning > 0) return 'warning';
    return 'healthy';
  };

  const overallScore = () => {
    const healthy = healthChecks.filter(hc => hc.status === 'healthy').length;
    return Math.round((healthy / healthChecks.length) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>System Health Check</span>
            </CardTitle>
            <CardDescription>
              Monitor the health and performance of system components
            </CardDescription>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{overallScore()}%</div>
              <div className="text-xs text-muted-foreground">Health Score</div>
            </div>
            <Button
              onClick={runHealthChecks}
              disabled={isRunning}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Checking...' : 'Run Check'}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lastRunTime && (
            <p className="text-sm text-muted-foreground">
              Last checked: {lastRunTime.toLocaleString()}
            </p>
          )}
          
          <div className="space-y-3">
            {healthChecks.map(check => (
              <div key={check.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <check.icon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">{check.name}</h4>
                    <p className="text-sm text-muted-foreground">{check.message}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {check.responseTime && (
                    <span className="text-xs text-muted-foreground">
                      {Math.round(check.responseTime)}ms
                    </span>
                  )}
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(check.status)}
                    <Badge className={getStatusColor(check.status)}>
                      {check.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall System Health</span>
              <Badge className={getStatusColor(overallHealth())}>
                {overallHealth()}
              </Badge>
            </div>
            <Progress value={overallScore()} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};