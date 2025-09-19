import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Activity,
  Clock,
  Database,
  Globe,
  Smartphone,
  Zap,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'good' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  description: string;
}

interface PerformanceCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  metrics: PerformanceMetric[];
}

const performanceCategories: PerformanceCategory[] = [
  {
    id: 'core-vitals',
    name: 'Core Web Vitals',
    icon: Zap,
    metrics: [
      {
        id: 'lcp',
        name: 'Largest Contentful Paint',
        value: 1.2,
        unit: 's',
        threshold: 2.5,
        status: 'good',
        trend: 'stable',
        description: 'Time until the largest content element is rendered'
      },
      {
        id: 'fid',
        name: 'First Input Delay',
        value: 45,
        unit: 'ms',
        threshold: 100,
        status: 'good',
        trend: 'down',
        description: 'Time from first user interaction to browser response'
      },
      {
        id: 'cls',
        name: 'Cumulative Layout Shift',
        value: 0.08,
        unit: '',
        threshold: 0.1,
        status: 'good',
        trend: 'stable',
        description: 'Visual stability of page elements during loading'
      }
    ]
  },
  {
    id: 'loading',
    name: 'Loading Performance',
    icon: Clock,
    metrics: [
      {
        id: 'ttfb',
        name: 'Time to First Byte',
        value: 320,
        unit: 'ms',
        threshold: 600,
        status: 'good',
        trend: 'down',
        description: 'Server response time for the initial request'
      },
      {
        id: 'fcp',
        name: 'First Contentful Paint',
        value: 890,
        unit: 'ms',
        threshold: 1800,
        status: 'good',
        trend: 'stable',
        description: 'Time until first text or image is painted'
      },
      {
        id: 'dom-ready',
        name: 'DOM Content Loaded',
        value: 1.1,
        unit: 's',
        threshold: 2.0,
        status: 'good',
        trend: 'up',
        description: 'Time until DOM is fully constructed'
      }
    ]
  },
  {
    id: 'api',
    name: 'API Performance',
    icon: Database,
    metrics: [
      {
        id: 'api-response',
        name: 'Average API Response',
        value: 245,
        unit: 'ms',
        threshold: 500,
        status: 'good',
        trend: 'stable',
        description: 'Average response time for API calls'
      },
      {
        id: 'db-query',
        name: 'Database Query Time',
        value: 125,
        unit: 'ms',
        threshold: 300,
        status: 'good',
        trend: 'down',
        description: 'Average database query execution time'
      },
      {
        id: 'cache-hit',
        name: 'Cache Hit Rate',
        value: 94,
        unit: '%',
        threshold: 80,
        status: 'good',
        trend: 'up',
        description: 'Percentage of requests served from cache'
      }
    ]
  },
  {
    id: 'bundle',
    name: 'Bundle Analysis',
    icon: Globe,
    metrics: [
      {
        id: 'bundle-size',
        name: 'Total Bundle Size',
        value: 2.1,
        unit: 'MB',
        threshold: 4.0,
        status: 'good',
        trend: 'stable',
        description: 'Total size of JavaScript bundles'
      },
      {
        id: 'lazy-loaded',
        name: 'Lazy Loaded Components',
        value: 85,
        unit: '%',
        threshold: 70,
        status: 'good',
        trend: 'up',
        description: 'Percentage of components loaded on demand'
      },
      {
        id: 'compression',
        name: 'Gzip Compression',
        value: 76,
        unit: '%',
        threshold: 60,
        status: 'good',
        trend: 'stable',
        description: 'Compression ratio for static assets'
      }
    ]
  }
];

export const PerformanceMonitor = () => {
  const [categories, setCategories] = useState<PerformanceCategory[]>(performanceCategories);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { toast } = useToast();

  const getStatusColor = (status: PerformanceMetric['status']) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'critical':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    }
  };

  const getStatusIcon = (status: PerformanceMetric['status']) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
  };

  const getTrendIcon = (trend?: PerformanceMetric['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-red-500" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-green-500" />;
      default:
        return <Activity className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const calculateScore = (metric: PerformanceMetric): number => {
    const ratio = metric.value / metric.threshold;
    if (metric.id === 'cache-hit' || metric.id === 'lazy-loaded' || metric.id === 'compression') {
      // Higher is better for these metrics
      return Math.min(100, (metric.value / metric.threshold) * 100);
    }
    // Lower is better for most metrics
    return Math.max(0, 100 - (ratio * 50));
  };

  const getOverallScore = (): number => {
    const allMetrics = categories.flatMap(cat => cat.metrics);
    const totalScore = allMetrics.reduce((sum, metric) => sum + calculateScore(metric), 0);
    return Math.round(totalScore / allMetrics.length);
  };

  const runPerformanceTest = async () => {
    setIsMonitoring(true);
    
    try {
      // Simulate performance monitoring
      toast({
        title: "Performance Monitoring Started",
        description: "Collecting performance metrics...",
      });

      // Simulate collecting real metrics (in production, this would use Performance API)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Update metrics with slight variations
      setCategories(prev => prev.map(category => ({
        ...category,
        metrics: category.metrics.map(metric => ({
          ...metric,
          value: metric.value + (Math.random() - 0.5) * 0.1 * metric.value,
          trend: Math.random() > 0.5 ? 'stable' : (Math.random() > 0.5 ? 'up' : 'down')
        }))
      })));

      setLastUpdate(new Date());
      
      toast({
        title: "Performance Test Complete",
        description: `Overall Performance Score: ${getOverallScore()}/100`,
      });
    } catch (error) {
      toast({
        title: "Performance Test Failed",
        description: "Could not collect performance metrics",
        variant: "destructive"
      });
    } finally {
      setIsMonitoring(false);
    }
  };

  const overallScore = getOverallScore();

  return (
    <div className="space-y-6">
      {/* Overall Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Performance Overview</span>
            </div>
            <Button
              onClick={runPerformanceTest}
              disabled={isMonitoring}
              className="flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>{isMonitoring ? 'Monitoring...' : 'Run Test'}</span>
            </Button>
          </CardTitle>
          <CardDescription>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Performance Score</span>
                <span className="text-2xl font-bold">{overallScore}/100</span>
              </div>
              <Progress value={overallScore} className="h-3" />
            </div>
            <div className="text-center">
              <Badge 
                variant={overallScore >= 90 ? 'default' : overallScore >= 70 ? 'secondary' : 'destructive'}
                className="text-lg px-4 py-2"
              >
                {overallScore >= 90 ? 'Excellent' : overallScore >= 70 ? 'Good' : 'Needs Work'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categories.map(category => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <category.icon className="w-5 h-5" />
                <span>{category.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {category.metrics.map(metric => (
                  <div key={metric.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{metric.name}</span>
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(metric.trend)}
                          <span className="font-mono text-sm">
                            {typeof metric.value === 'number' && metric.value < 1 && metric.unit !== '%' 
                              ? metric.value.toFixed(2) 
                              : Math.round(metric.value * 100) / 100
                            }{metric.unit}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {metric.description}
                        </p>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(metric.status)}
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(metric.status)}`}>
                            {calculateScore(metric).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};