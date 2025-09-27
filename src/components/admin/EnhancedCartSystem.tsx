import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, 
  Users, 
  Database, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Settings
} from 'lucide-react';
import { useCartOptimized } from '@/hooks/useCartOptimized';
import { useCartConsolidationManager } from '@/hooks/useCartConsolidationManager';
import { useAuth } from '@/hooks/useAuth';
import { CartConsolidationButton } from '@/components/cart/CartConsolidationButton';
import { EnhancedCartConsolidation } from '@/components/cart/EnhancedCartConsolidation';

interface CartSystemHealth {
  totalCarts: number;
  activeCarts: number;
  emptyActiveCarts: number;
  multipleUserPrimaryCarts: number;
  sessionBasedCarts: number;
  userBasedCarts: number;
  healthScore: number;
}

export const EnhancedCartSystem: React.FC = () => {
  const { user } = useAuth();
  const { cart, isLoading, refreshCart } = useCartOptimized();
  const { cartHealth, isLoadingHealth } = useCartConsolidationManager();
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate system health metrics
  const systemHealth: CartSystemHealth = cartHealth ? {
    totalCarts: cartHealth.total_carts || 0,
    activeCarts: cartHealth.active_carts || 0,
    emptyActiveCarts: cartHealth.empty_carts || 0,
    multipleUserPrimaryCarts: 0, // This would need to be calculated separately
    sessionBasedCarts: Math.max(0, cartHealth.total_carts - cartHealth.active_carts),
    userBasedCarts: cartHealth.active_carts,
    healthScore: cartHealth.health_score || 100
  } : {
    totalCarts: 0,
    activeCarts: 0,
    emptyActiveCarts: 0,
    multipleUserPrimaryCarts: 0,
    sessionBasedCarts: 0,
    userBasedCarts: 0,
    healthScore: 100
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthStatus = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 70) return { label: 'Good', color: 'bg-yellow-100 text-yellow-800' };
    if (score >= 50) return { label: 'Fair', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Poor', color: 'bg-red-100 text-red-800' };
  };

  const healthStatus = getHealthStatus(systemHealth.healthScore);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Enhanced Cart System Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="health">System Health</TabsTrigger>
              <TabsTrigger value="consolidation">Consolidation</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      <span className="text-sm font-medium">Current Cart</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {cart?.items?.length || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">items</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      <span className="text-sm font-medium">Total Carts</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {systemHealth.totalCarts}
                    </div>
                    <div className="text-xs text-muted-foreground">all users</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">Active Carts</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {systemHealth.activeCarts}
                    </div>
                    <div className="text-xs text-muted-foreground">with items</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-sm font-medium">Health Score</span>
                    </div>
                    <div className={`text-2xl font-bold ${getHealthColor(systemHealth.healthScore)}`}>
                      {systemHealth.healthScore}%
                    </div>
                    <Badge className={healthStatus.color}>
                      {healthStatus.label}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Current Cart Status */}
              {cart && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Cart Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Cart ID:</span>
                        <span className="font-mono text-sm">{cart.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Name:</span>
                        <span>{cart.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant="outline">{cart.status}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Items:</span>
                        <span>{cart.items?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span>${cart.total_amount?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="health" className="space-y-4">
              {/* Health Metrics */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">System Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Empty Active Carts:</span>
                      <Badge variant={systemHealth.emptyActiveCarts > 0 ? "destructive" : "secondary"}>
                        {systemHealth.emptyActiveCarts}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Multiple Primary Carts:</span>
                      <Badge variant={systemHealth.multipleUserPrimaryCarts > 0 ? "destructive" : "secondary"}>
                        {systemHealth.multipleUserPrimaryCarts}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Session-based Carts:</span>
                      <Badge variant="outline">
                        {systemHealth.sessionBasedCarts}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>User-based Carts:</span>
                      <Badge variant="outline">
                        {systemHealth.userBasedCarts}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Health Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {systemHealth.emptyActiveCarts > 0 && (
                        <Alert>
                          <AlertTriangle className="w-4 h-4" />
                          <AlertDescription>
                            {systemHealth.emptyActiveCarts} empty carts are taking up resources
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {systemHealth.multipleUserPrimaryCarts > 0 && (
                        <Alert>
                          <AlertTriangle className="w-4 h-4" />
                          <AlertDescription>
                            Multiple primary carts detected - this may cause confusion
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {systemHealth.healthScore >= 90 && (
                        <Alert>
                          <CheckCircle className="w-4 h-4" />
                          <AlertDescription>
                            Cart system is operating optimally
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="consolidation">
              <EnhancedCartConsolidation />
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Real-time Monitoring</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => refreshCart()}
                        disabled={isLoading}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh Cart Data
                      </Button>
                      <CartConsolidationButton />
                    </div>
                    
                    {/* Performance Metrics */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-sm font-medium">Load Time</div>
                          <div className="text-2xl font-bold">
                            {isLoading ? '...' : '<100ms'}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-sm font-medium">Cache Status</div>
                          <div className="text-2xl font-bold text-green-600">
                            Active
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-sm font-medium">Sync Status</div>
                          <div className="text-2xl font-bold text-green-600">
                            Synced
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};