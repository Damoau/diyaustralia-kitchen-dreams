import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { runCartSystemSimulations, SimulationResult } from '@/utils/cartSystemSimulations';
import { Play, CheckCircle, XCircle, Clock, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export const SimulationRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [progress, setProgress] = useState(0);

  const runSimulations = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);
    
    try {
      const simulationResults = await runCartSystemSimulations();
      setResults(simulationResults);
      setProgress(100);
      
      const passed = simulationResults.filter(r => r.success).length;
      const failed = simulationResults.filter(r => !r.success).length;
      
      if (failed === 0) {
        toast.success(`🎉 All ${passed} simulations passed successfully!`);
      } else {
        toast.error(`⚠️ ${failed} of ${simulationResults.length} simulations failed`);
      }
    } catch (error: any) {
      console.error('Simulation suite failed:', error);
      toast.error('Simulation suite encountered an error');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (result: SimulationResult) => {
    if (result.success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getPerformanceColor = (duration: number) => {
    if (duration < 500) return 'text-green-600';
    if (duration < 1000) return 'text-yellow-600';
    return 'text-red-600';
  };

  const passedCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;
  const avgDuration = results.length > 0 
    ? Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Cart System Simulations
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Run comprehensive end-to-end simulations to validate the complete cart system
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Run Controls */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={runSimulations} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <Clock className="h-4 w-4 animate-pulse" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? 'Running Simulations...' : 'Run All Simulations'}
          </Button>

          {results.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant={failedCount > 0 ? 'destructive' : 'default'}>
                {passedCount}/{results.length} Passed
              </Badge>
              {failedCount > 0 && (
                <Badge variant="destructive">{failedCount} Failed</Badge>
              )}
              <Badge variant="outline">Avg: {avgDuration}ms</Badge>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Running simulations...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Simulation Results</h4>
            
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded border">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result)}
                    <div>
                      <div className="font-medium text-sm">{result.simulation}</div>
                      <div className="text-xs text-muted-foreground">{result.message}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-mono ${getPerformanceColor(result.duration)}`}>
                      {result.duration}ms
                    </div>
                    {result.data && (
                      <div className="text-xs text-muted-foreground">
                        {typeof result.data === 'object' ? 
                          `${Object.keys(result.data).length} metrics` : 
                          'Data available'
                        }
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="pt-4 border-t">
              <h5 className="font-medium mb-2">Summary</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Simulations:</span>
                  <span className="ml-2 font-medium">{results.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Success Rate:</span>
                  <span className="ml-2 font-medium">
                    {results.length > 0 ? Math.round((passedCount / results.length) * 100) : 0}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Average Duration:</span>
                  <span className="ml-2 font-medium">{avgDuration}ms</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Duration:</span>
                  <span className="ml-2 font-medium">
                    {results.reduce((sum, r) => sum + r.duration, 0)}ms
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Coverage Info */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
          <strong>Coverage:</strong> Database connectivity, cart creation, item addition, persistence, 
          multi-item workflow, shop→cart→checkout flow, cleanup, error handling, and performance validation.
        </div>
      </CardContent>
    </Card>
  );
};