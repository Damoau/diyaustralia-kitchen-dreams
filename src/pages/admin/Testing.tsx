import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { TestingSuite } from '@/components/testing/TestingSuite';
import { PerformanceMonitor } from '@/components/testing/PerformanceMonitor';
import { RolloutManager } from '@/components/testing/RolloutManager';
import { SystemHealthCheck } from '@/components/testing/SystemHealthCheck';
import { UserGuide } from '@/components/documentation/UserGuide';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TestTube,
  Activity,
  Rocket,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';

export default function Testing() {
  const testingOverview = {
    totalTests: 24,
    passedTests: 21,
    failedTests: 1,
    pendingTests: 2,
    performanceScore: 94,
    securityScore: 98,
    rolloutProgress: 67
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Testing & Rollout Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive testing suite and feature rollout management
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>Test Results</span>
                <TestTube className="w-4 h-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{testingOverview.passedTests}/{testingOverview.totalTests}</div>
                <Badge variant={testingOverview.passedTests === testingOverview.totalTests ? 'default' : 'secondary'}>
                  {Math.round((testingOverview.passedTests / testingOverview.totalTests) * 100)}%
                </Badge>
              </div>
              <div className="flex items-center space-x-4 mt-2 text-sm">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-green-600">{testingOverview.passedTests}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span className="text-red-600">{testingOverview.failedTests}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{testingOverview.pendingTests}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>Performance</span>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{testingOverview.performanceScore}/100</div>
                <Badge variant={testingOverview.performanceScore >= 90 ? 'default' : 'secondary'}>
                  {testingOverview.performanceScore >= 90 ? 'Excellent' : 'Good'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Core Web Vitals & Loading Performance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>Security</span>
                <Shield className="w-4 h-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{testingOverview.securityScore}/100</div>
                <Badge variant="default">Secure</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Authentication & Data Protection
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>Rollout</span>
                <Rocket className="w-4 h-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{testingOverview.rolloutProgress}%</div>
                <Badge variant="secondary">In Progress</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Feature Deployment Progress
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Testing Interface */}
        <Tabs defaultValue="testing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="testing" className="flex items-center space-x-2">
              <TestTube className="w-4 h-4" />
              <span>Testing Suite</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Performance</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Health Check</span>
            </TabsTrigger>
            <TabsTrigger value="rollout" className="flex items-center space-x-2">
              <Rocket className="w-4 h-4" />
              <span>Rollout</span>
            </TabsTrigger>
            <TabsTrigger value="documentation" className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Documentation</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="testing">
            <TestingSuite />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceMonitor />
          </TabsContent>

          <TabsContent value="health">
            <SystemHealthCheck />
          </TabsContent>

          <TabsContent value="rollout">
            <RolloutManager />
          </TabsContent>

          <TabsContent value="documentation">
            <UserGuide />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}