import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Trash2, AlertTriangle, CheckCircle, ShoppingCart, RefreshCw, BarChart3 } from 'lucide-react';
import { useCartConsolidationManager } from '@/hooks/useCartConsolidationManager';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export const EnhancedCartConsolidation = () => {
  const { user } = useAuth();
  const [displayDetails, setDisplayDetails] = useState(false);
  
  const {
    consolidateCarts,
    isConsolidating,
    consolidationResult,
    cartHealth,
    isLoadingHealth,
    refreshHealth
  } = useCartConsolidationManager();

  const isLoading = isConsolidating || isLoadingHealth;

  const handleConsolidate = async () => {
    try {
      await consolidateCarts();
      await refreshHealth();
    } catch (error) {
      console.error('Consolidation failed:', error);
    }
  };

  if (!user) return null;

  const needsCleanup = cartHealth && (
    cartHealth.empty_carts > 0 || 
    cartHealth.archived_carts > 5
  );

  const cleanupScore = cartHealth?.health_score || 100;

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
              onClick={() => setDisplayDetails(!displayDetails)}
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Details
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Health Metrics Overview */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Cart Overview</span>
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {cartHealth?.active_carts || 0} Active
            </Badge>
          </div>
          
          {displayDetails && cartHealth && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-muted-foreground">Active</div>
                <div className="text-2xl font-bold">{cartHealth?.active_carts || 0}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Empty</div>
                <div className="text-2xl font-bold text-amber-600">{cartHealth?.empty_carts || 0}</div>
              </div>
            </div>
          )}
          
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center text-sm">
              <span>Health Score</span>
              <span className="font-semibold">{cartHealth?.health_score || 100}%</span>
            </div>
          </div>

          {displayDetails && cartHealth && (
            <div className="mt-4 pt-4 border-t space-y-2 text-sm text-muted-foreground">
              <div>Total Carts: {cartHealth?.total_carts || 0}</div>
              <div>Archived: {cartHealth?.archived_carts || 0}</div>
              <div className="text-xs">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>

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
        {consolidationResult && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-800">
              <div className="font-medium">Consolidation Complete!</div>
              <div className="mt-1">
                {consolidationResult?.actions?.length ? 
                  `Actions taken: ${consolidationResult.actions.join(', ')}` :
                  'No actions needed - carts are already optimized'
                }
              </div>
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
                    Clean Up Carts ({cartHealth?.empty_carts || 0})
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
            onClick={() => refreshHealth()}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};