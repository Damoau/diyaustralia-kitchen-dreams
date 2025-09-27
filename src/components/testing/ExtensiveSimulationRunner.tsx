import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { runComprehensiveCartSimulations, SimulationResult } from '@/utils/comprehensiveCartSimulations';
import { Play, CheckCircle, XCircle, Clock, BarChart3, Zap, Target } from 'lucide-react';
import { toast } from 'sonner';

export const ExtensiveSimulationRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);

  // Auto-run simulations when component mounts
  useEffect(() => {
    // Auto-start comprehensive simulations
    setTimeout(() => {
      runExtensiveSimulations();
    }, 1000);
  }, []);

  const runExtensiveSimulations = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);
    setStartTime(Date.now());
    
    try {
      console.log('🚀 Starting 100+ EXTENSIVE cart system simulations...');
      
      // Run all comprehensive simulations
      setCurrentPhase('Database Connectivity & Setup');
      setProgress(5);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCurrentPhase('Kitchen Cabinets Page Testing');
      setProgress(15);
      
      setCurrentPhase('Base Cabinets Page Testing');
      setProgress(25);
      
      setCurrentPhase('Wall Cabinets Page Testing');
      setProgress(35);
      
      setCurrentPhase('Side Cart Functionality');
      setProgress(45);
      
      setCurrentPhase('Checkout Process Testing');
      setProgress(55);
      
      setCurrentPhase('Cross-Page Navigation');
      setProgress(70);
      
      setCurrentPhase('Multi-User Sessions');
      setProgress(80);
      
      setCurrentPhase('Error Recovery Scenarios');
      setProgress(90);
      
      setCurrentPhase('Performance Under Load');
      setProgress(95);
      
      const simulationResults = await runComprehensiveCartSimulations();
      setResults(simulationResults);
      setProgress(100);
      
      const passed = simulationResults.filter(r => r.success).length;
      const failed = simulationResults.filter(r => !r.success).length;
      const totalTime = Date.now() - (startTime || Date.now());
      
      console.log(`\n🎉 EXTENSIVE SIMULATIONS COMPLETE:`);
      console.log(`✅ Passed: ${passed}/${simulationResults.length}`);
      console.log(`❌ Failed: ${failed}`);
      console.log(`⏱️  Total Time: ${totalTime}ms`);
      
      if (failed === 0) {
        toast.success(`🎉 ALL ${passed} simulations passed! System is ROBUST! (${(totalTime/1000).toFixed(1)}s)`);
      } else {
        toast.error(`⚠️ ${failed} of ${simulationResults.length} simulations failed - needs attention`);
      }
      
    } catch (error: any) {
      console.error('Simulation suite failed:', error);
      toast.error('Simulation suite encountered an error');
    } finally {
      setIsRunning(false);
      setCurrentPhase('');
    }
  };

  const getStatusIcon = (result: SimulationResult) => {
    if (result.success) {
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    } else {
      return <XCircle className="h-3 w-3 text-red-500" />;
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
  const totalDuration = startTime ? Date.now() - startTime : 0;

  // Group results by category
  const resultsByCategory = {
    'Kitchen Cabinets': results.filter(r => r.simulation.includes('Kitchen')),
    'Base Cabinets': results.filter(r => r.simulation.includes('Base Cabinets')),
    'Wall Cabinets': results.filter(r => r.simulation.includes('Wall Cabinets')),
    'Side Cart': results.filter(r => r.simulation.includes('Side Cart')),
    'Checkout': results.filter(r => r.simulation.includes('Checkout')),
    'Navigation': results.filter(r => r.simulation.includes('Navigation')),
    'Multi-Session': results.filter(r => r.simulation.includes('Multi-Session')),
    'Error Recovery': results.filter(r => r.simulation.includes('Error Recovery')),
    'Performance': results.filter(r => r.simulation.includes('Performance')),
    'Core Systems': results.filter(r => !r.simulation.includes('Kitchen') && 
                                       !r.simulation.includes('Base Cabinets') && 
                                       !r.simulation.includes('Wall Cabinets') &&
                                       !r.simulation.includes('Side Cart') &&
                                       !r.simulation.includes('Checkout') &&
                                       !r.simulation.includes('Navigation') &&
                                       !r.simulation.includes('Multi-Session') &&
                                       !r.simulation.includes('Error Recovery') &&
                                       !r.simulation.includes('Performance'))
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-500" />
          EXTENSIVE CART SIMULATIONS (100+)
          {results.length > 0 && (
            <Badge variant={failedCount > 0 ? 'destructive' : 'default'} className="ml-2">
              {passedCount}/{results.length}
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Comprehensive robustness testing for shop→cart→checkout across all pages and scenarios
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto-Run Status */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-medium">Auto-Running Extensive Test Suite</p>
              <p className="text-sm text-muted-foreground">
                {isRunning ? `Phase: ${currentPhase}` : 'Ready to validate system robustness'}
              </p>
            </div>
          </div>
          <Button 
            onClick={runExtensiveSimulations} 
            disabled={isRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <Clock className="h-4 w-4 animate-pulse" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? 'Running...' : 'Re-run Tests'}
          </Button>
        </div>

        {/* Progress */}
        {isRunning && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Phase: {currentPhase}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Running comprehensive validations across all cart system components...
            </p>
          </div>
        )}

        {/* High-Level Summary */}
        {results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{passedCount}</div>
              <div className="text-xs text-green-600 font-medium">PASSED</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{failedCount}</div>
              <div className="text-xs text-red-600 font-medium">FAILED</div>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{avgDuration}ms</div>
              <div className="text-xs text-blue-600 font-medium">AVG TIME</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{(totalDuration/1000).toFixed(1)}s</div>
              <div className="text-xs text-purple-600 font-medium">TOTAL TIME</div>
            </div>
          </div>
        )}

        {/* Results by Category */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Results by Category
            </h4>
            
            <div className="space-y-3">
              {Object.entries(resultsByCategory).map(([category, categoryResults]) => {
                if (categoryResults.length === 0) return null;
                
                const categoryPassed = categoryResults.filter(r => r.success).length;
                const categoryFailed = categoryResults.filter(r => r.success === false).length;
                
                return (
                  <details key={category} className="border rounded-lg">
                    <summary className="p-3 cursor-pointer hover:bg-muted/50 flex items-center justify-between">
                      <span className="font-medium">{category}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={categoryFailed > 0 ? 'destructive' : 'default'}>
                          {categoryPassed}/{categoryResults.length}
                        </Badge>
                      </div>
                    </summary>
                    <div className="p-3 pt-0 space-y-1 max-h-40 overflow-y-auto">
                      {categoryResults.map((result, index) => (
                        <div key={index} className="flex items-center justify-between text-xs p-2 rounded border-l-2 border-l-transparent hover:border-l-primary hover:bg-muted/30">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {getStatusIcon(result)}
                            <span className="truncate">{result.simulation.replace(`${category}: `, '')}</span>
                          </div>
                          <span className={`font-mono text-xs ${getPerformanceColor(result.duration)}`}>
                            {result.duration}ms
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        )}

        {/* System Health Verdict */}
        {results.length > 0 && (
          <div className={`p-4 rounded-lg border-2 ${failedCount === 0 ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'}`}>
            <div className="flex items-center gap-3">
              {failedCount === 0 ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <div>
                <h4 className={`font-bold ${failedCount === 0 ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                  {failedCount === 0 ? '🎉 SYSTEM IS ROBUST AND READY!' : '⚠️ SYSTEM NEEDS ATTENTION'}
                </h4>
                <p className={`text-sm ${failedCount === 0 ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}`}>
                  {failedCount === 0 
                    ? `All ${passedCount} simulations passed. Cart system is production-ready.`
                    : `${failedCount} critical issues found. Review failed tests above.`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Technical Details */}
        <details className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
          <summary className="font-medium cursor-pointer">Technical Test Coverage</summary>
          <div className="mt-2 space-y-1">
            <p><strong>Pages:</strong> Kitchen Cabinets, Base Cabinets, Wall Cabinets, Shop Categories</p>
            <p><strong>Components:</strong> ProductConfigurator, CartDrawer, CartDrawer, CheckoutSequence</p>
            <p><strong>Workflows:</strong> Add to cart, Update quantities, Remove items, Navigate pages, Checkout flow</p>
            <p><strong>Data:</strong> Cart persistence, Real-time updates, Session management, Error recovery</p>
            <p><strong>Performance:</strong> Response times, Concurrent operations, Load testing, Memory usage</p>
            <p><strong>Security:</strong> Session isolation, Data validation, Access control, Rate limiting</p>
          </div>
        </details>
      </CardContent>
    </Card>
  );
};