import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, Database, CheckCircle } from 'lucide-react';
import { useCartConsolidationManager } from '@/hooks/useCartConsolidationManager';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const CartConsolidationManager = () => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const { consolidateCarts, cartHealth, isLoadingHealth, refreshHealth } = useCartConsolidationManager();

  const handleRunConsolidation = async () => {
    if (!user) {
      toast.error('Please log in to consolidate carts');
      return;
    }

    setIsRunning(true);
    try {
      await consolidateCarts();
      await refreshHealth();
      toast.success('Cart consolidation completed successfully');
    } catch (error) {
      console.error('Cart consolidation failed:', error);
      toast.error('Cart consolidation failed');
    } finally {
      setIsRunning(false);
    }
  };

  if (!user) return null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Cart Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cartHealth && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Carts:</span>
              <Badge variant="outline">{cartHealth.total_carts}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Active:</span>
              <Badge variant="default">{cartHealth.active_carts}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Empty:</span>
              <Badge variant="destructive">{cartHealth.empty_carts}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Health Score:</span>
              <Badge variant={cartHealth.health_score > 80 ? "default" : "secondary"}>
                {cartHealth.health_score}%
              </Badge>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleRunConsolidation}
            disabled={isRunning || isLoadingHealth}
            size="sm"
            className="flex-1"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Consolidating...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Clean Up Carts
              </>
            )}
          </Button>
          
          <Button
            onClick={() => refreshHealth()}
            disabled={isLoadingHealth}
            variant="outline"
            size="sm"
          >
            {isLoadingHealth ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};