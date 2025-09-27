import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Trash2, AlertTriangle, CheckCircle, ShoppingCart, Clock, BarChart3 } from 'lucide-react';
import { useEnhancedCartManager } from '@/hooks/useEnhancedCartManager';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';

export const EnhancedCartConsolidation = () => {
  const { user } = useAuth();
  const { 
    cartInfo,
    consolidationStatus,
    isLoading,
    consolidateCarts,
    getCartHealth,
    refreshCartInfo
  } = useEnhancedCartManager();
  
  const [healthMetrics, setHealthMetrics] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Load health metrics
  useEffect(() => {
    if (user?.id) {
      getCartHealth().then(setHealthMetrics);
    }
  }, [user?.id, getCartHealth]);

  const handleConsolidate = async () => {
    try {
      await consolidateCarts();
      // Refresh health metrics after consolidation
      const newMetrics = await getCartHealth();
      setHealthMetrics(newMetrics);
    } catch (error) {
      console.error('Consolidation failed:', error);
    }
  };

  if (!user) return null;

  const needsCleanup = healthMetrics && (
    healthMetrics.oldEmpty > 0 || 
    healthMetrics.primary > 1 || 
    healthMetrics.empty > 3
  );

  const cleanupScore = healthMetrics ? 
    Math.max(0, 100 - (healthMetrics.oldEmpty * 10) - (Math.max(0, healthMetrics.primary - 1) * 20) - (Math.max(0, healthMetrics.empty - 2) * 5)) 
    : 100;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Cart Management
            </CardTitle>
            <CardDescription>
              Manage your shopping cart lifecycle and cleanup old carts
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={cleanupScore > 80 ? "default" : cleanupScore > 60 ? "secondary" : "destructive"}>
              Health: {cleanupScore}%
            </Badge>
            
            <Button
              variant={needsCleanup ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Details
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Cart Status */}
        {cartInfo && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Primary Cart</span>
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Active
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {cartInfo.item_count} items • ${cartInfo.total_amount.toFixed(2)} • 
              Last activity: {new Date(cartInfo.last_activity_at).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* Health Metrics */}
        {showDetails && healthMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-background border rounded-lg">
              <div className="text-2xl font-bold text-primary">{healthMetrics.total}</div>
              <div className="text-xs text-muted-foreground">Total Carts</div>
            </div>
            <div className="text-center p-3 bg-background border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{healthMetrics.active}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div className="text-center p-3 bg-background border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{healthMetrics.empty}</div>
              <div className="text-xs text-muted-foreground">Empty</div>
            </div>
            <div className="text-center p-3 bg-background border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{healthMetrics.oldEmpty}</div>
              <div className="text-xs text-muted-foreground">Old Empty</div>
            </div>
          </div>
        )}

        {/* Health Score Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Cart Health Score</span>
            <span className="font-mono">{cleanupScore}%</span>
          </div>
          <Progress value={cleanupScore} className="h-2" />
          {cleanupScore < 80 && (
            <div className="text-xs text-muted-foreground">
              Recommendation: Clean up old and duplicate carts to improve performance
            </div>
          )}
        </div>

        {/* Consolidation Status */}
        {consolidationStatus && (
          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-200">
                Cleanup Completed
              </span>
            </div>
            <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
              {consolidationStatus.actions.map((action, index) => (
                <div key={index}>• {action}</div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant={needsCleanup ? "default" : "outline"}
                size="sm"
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cleaning...
                  </>
                ) : needsCleanup ? (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    Clean Up Carts ({healthMetrics?.oldEmpty || 0})
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Optimize Carts
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clean Up Shopping Carts?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Archive empty carts older than 1 day</li>
                    <li>Archive old carts with items (30+ days)</li>
                    <li>Ensure you have only one primary cart</li>
                    <li>Fix any cart total discrepancies</li>
                  </ul>
                  <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/20 rounded text-amber-800 dark:text-amber-200 text-sm">
                    Your cart items and data will be preserved. Only unused carts will be archived.
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConsolidate}>
                  Clean Up Carts
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshCartInfo}
            disabled={isLoading}
          >
            <Clock className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};