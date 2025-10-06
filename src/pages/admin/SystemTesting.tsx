import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuoteWorkflowSimulator } from '@/components/admin/QuoteWorkflowSimulator';
import { EnhancedCartSystem } from '@/components/admin/EnhancedCartSystem';
import { CartWorkflowTester } from '@/components/testing/CartWorkflowTester';
import { DocuSealSimulationRunner } from '@/components/testing/DocuSealSimulationRunner';
import { TestTube, Database, Play, BarChart3, FileSignature } from 'lucide-react';

const SystemTesting: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>System Testing - Admin Dashboard</title>
        <meta name="description" content="Comprehensive testing suite for cart system and user workflows" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Testing</h1>
          <p className="text-muted-foreground">
            Comprehensive testing and simulation tools for cart system and user workflows
          </p>
        </div>

        <Tabs defaultValue="workflow-simulation" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="workflow-simulation" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Workflow Simulation
            </TabsTrigger>
            <TabsTrigger value="cart-system" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Cart System
            </TabsTrigger>
            <TabsTrigger value="docuseal" className="flex items-center gap-2">
              <FileSignature className="w-4 h-4" />
              DocuSeal
            </TabsTrigger>
            <TabsTrigger value="automated-tests" className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Automated Tests
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workflow-simulation">
            <Card>
              <CardHeader>
                <CardTitle>User Workflow Simulation</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Simulate complete user journeys from admin quote creation to customer interaction and back
                </p>
              </CardHeader>
              <CardContent>
                <QuoteWorkflowSimulator />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cart-system">
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Cart System Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Monitor, manage, and optimize the cart system performance and health
                </p>
              </CardHeader>
              <CardContent>
                <EnhancedCartSystem />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docuseal">
            <Card>
              <CardHeader>
                <CardTitle>DocuSeal Integration Testing</CardTitle>
                <p className="text-sm text-muted-foreground">
                  50 comprehensive tests across edge functions, webhooks, admin dashboard, and customer portal
                </p>
              </CardHeader>
              <CardContent>
                <DocuSealSimulationRunner />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automated-tests">
            <Card>
              <CardHeader>
                <CardTitle>Automated Test Suite</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Run comprehensive tests for cart operations, user flows, and system integrity
                </p>
              </CardHeader>
              <CardContent>
                <CartWorkflowTester />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Monitor system performance, loading times, and resource utilization
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Performance Monitoring</h3>
                  <p className="text-muted-foreground">
                    Performance analytics dashboard coming soon. This will include:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-4 space-y-1">
                    <li>• Real-time cart operation metrics</li>
                    <li>• Database query performance</li>
                    <li>• User experience analytics</li>
                    <li>• System resource utilization</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default SystemTesting;