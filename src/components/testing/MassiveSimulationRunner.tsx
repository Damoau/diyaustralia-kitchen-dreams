import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertTriangle, CheckCircle, XCircle, Clock, Play, RefreshCw, ChevronDown, Zap, Target } from "lucide-react";
import { runMassiveCartSimulations, SimulationResult } from "@/utils/massiveCartSimulations";
import { toast } from "sonner";

export const MassiveSimulationRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Auto-run simulations after component mount (delayed)
  useEffect(() => {
    const timer = setTimeout(() => {
      runMassiveSimulations();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const runMassiveSimulations = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setResults([]);
    setProgress(0);
    setCurrentPhase('Initializing massive simulation suite...');
    setStartTime(Date.now());
    
    try {
      console.log('🚀 Starting MASSIVE cart simulations (1000+ tests)...');
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 5, 95);
          
          // Update phase based on progress
          if (newProgress < 20) {
            setCurrentPhase('Phase 1: Base & Comprehensive Tests (110)');
          } else if (newProgress < 40) {
            setCurrentPhase('Phase 2: Frontend Shopping Scenarios (200)');
          } else if (newProgress < 60) {
            setCurrentPhase('Phase 3: Quote Integration Tests (200)');
          } else if (newProgress < 80) {
            setCurrentPhase('Phase 4: Cart Operations Deep Dive (300)');
          } else {
            setCurrentPhase('Phase 5: Edge Cases & Performance (200)');
          }
          
          return newProgress;
        });
      }, 200);
      
      const simulationResults = await runMassiveCartSimulations();
      
      clearInterval(progressInterval);
      setProgress(100);
      setCurrentPhase('Simulations completed!');
      setResults(simulationResults);
      
      const passed = simulationResults.filter(r => r.success).length;
      const failed = simulationResults.filter(r => !r.success).length;
      const passRate = ((passed / simulationResults.length) * 100).toFixed(1);
      
      console.log(`✅ MASSIVE SIMULATIONS COMPLETE: ${passed}/${simulationResults.length} passed (${passRate}%)`);
      
      if (passRate >= '95.0') {
        toast.success(`🎯 Excellent! ${passed}/${simulationResults.length} tests passed (${passRate}%)`, {
          description: 'Cart system is production-ready!'
        });
      } else if (passRate >= '90.0') {
        toast.success(`✅ Good! ${passed}/${simulationResults.length} tests passed (${passRate}%)`, {
          description: 'Cart system is stable with minor issues'
        });
      } else {
        toast.error(`⚠️ Issues detected: ${failed} failed tests (${(100 - parseFloat(passRate)).toFixed(1)}% failure rate)`, {
          description: 'Cart system needs attention'
        });
      }
      
    } catch (error) {
      console.error('❌ Massive simulations failed:', error);
      toast.error('Massive simulations failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      setCurrentPhase('Simulations failed');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getPerformanceColor = (duration: number) => {
    if (duration < 100) return "text-green-600";
    if (duration < 500) return "text-yellow-600";
    return "text-red-600";
  };

  const passedCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;
  const avgDuration = results.length > 0 ? 
    (results.reduce((sum, r) => sum + r.duration, 0) / results.length).toFixed(1) : '0';
  const totalDuration = startTime ? ((Date.now() - startTime) / 1000).toFixed(1) : '0';

  // Group results by category for better organization  
  const groupedResults = results.reduce((groups: Record<string, SimulationResult[]>, result) => {
    const category = result.simulation.split(':')[0] || 'Unknown';
    if (!groups[category]) groups[category] = [];
    groups[category].push(result);
    return groups;
  }, {});

  // System health verdict
  const passRate = results.length > 0 ? (passedCount / results.length) * 100 : 0;
  const getHealthVerdict = () => {
    if (passRate >= 95) return { text: "EXCELLENT", color: "text-green-600", bg: "bg-green-50" };
    if (passRate >= 90) return { text: "GOOD", color: "text-blue-600", bg: "bg-blue-50" };
    if (passRate >= 75) return { text: "FAIR", color: "text-yellow-600", bg: "bg-yellow-50" };
    return { text: "NEEDS ATTENTION", color: "text-red-600", bg: "bg-red-50" };
  };

  const healthVerdict = getHealthVerdict();

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Massive Cart Simulations
              </CardTitle>
              <p className="text-sm text-muted-foreground">1000+ comprehensive test scenarios</p>
            </div>
          </div>
          <Badge variant={passedCount > failedCount ? "default" : "destructive"} className="text-sm">
            {passedCount}/{results.length} Passed
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Control Button */}
        <Button 
          onClick={runMassiveSimulations}
          disabled={isRunning}
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          size="lg"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Running Massive Tests...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Run 1000+ Simulations
            </>
          )}
        </Button>

        {/* Progress Section */}
        {isRunning && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{currentPhase}</span>
              <span className="text-muted-foreground">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Results Summary */}
        {results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-bold text-primary">{results.length}</div>
              <div className="text-xs text-muted-foreground">Total Tests</div>
            </div>
            <div className="p-4 rounded-lg bg-green-50 text-center">
              <div className="text-2xl font-bold text-green-600">{passedCount}</div>
              <div className="text-xs text-muted-foreground">Passed</div>
            </div>
            <div className="p-4 rounded-lg bg-red-50 text-center">
              <div className="text-2xl font-bold text-red-600">{failedCount}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 text-center">
              <div className="text-2xl font-bold text-blue-600">{avgDuration}ms</div>
              <div className="text-xs text-muted-foreground">Avg Time</div>
            </div>
          </div>
        )}

        {/* System Health Verdict */}
        {results.length > 0 && (
          <div className={`p-4 rounded-lg border-2 ${healthVerdict.bg} border-current`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className={`w-6 h-6 ${healthVerdict.color}`} />
                <div>
                  <div className={`text-lg font-bold ${healthVerdict.color}`}>
                    System Health: {healthVerdict.text}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Pass Rate: {passRate.toFixed(1)}% • Total Time: {totalDuration}s
                  </div>
                </div>
              </div>
              <div className={`text-3xl font-bold ${healthVerdict.color}`}>
                {passRate.toFixed(0)}%
              </div>
            </div>
          </div>
        )}

        {/* Detailed Results */}
        {results.length > 0 && (
          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full">
                <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                {showDetails ? 'Hide' : 'Show'} Detailed Results
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <ScrollArea className="h-96 border rounded-lg p-4">
                <div className="space-y-6">
                  {Object.entries(groupedResults).map(([category, categoryResults]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{category}</h4>
                        <Badge variant="outline" className="text-xs">
                          {(categoryResults as SimulationResult[]).length} tests
                        </Badge>
                      </div>
                      <div className="space-y-1 pl-4">
                        {(categoryResults as SimulationResult[]).slice(0, 10).map((result, index) => (
                          <div key={index} className="flex items-center justify-between py-1 text-sm">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {getStatusIcon(result.success)}
                              <span className="truncate">{result.simulation}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Clock className="w-3 h-3" />
                              <span className={getPerformanceColor(result.duration)}>
                                {result.duration}ms
                              </span>
                            </div>
                          </div>
                        ))}
                        {(categoryResults as SimulationResult[]).length > 10 && (
                          <div className="text-xs text-muted-foreground pl-6">
                            ... and {(categoryResults as SimulationResult[]).length - 10} more tests
                          </div>
                        )}
                      </div>
                      <Separator className="my-2" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Technical Coverage Details */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full text-left">
              <ChevronDown className="w-4 h-4 mr-2" />
              Technical Test Coverage (1000+ Scenarios)
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 text-sm text-muted-foreground space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <h5 className="font-semibold mb-2">Frontend Shopping (200)</h5>
                <ul className="space-y-1 text-xs">
                  <li>• Kitchen cabinets: 50 configurations</li>
                  <li>• Base cabinets: 50 size variations</li>
                  <li>• Wall cabinets: 50 height tests</li>
                  <li>• Shop navigation: 50 category tests</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold mb-2">Quote Integration (200)</h5>
                <ul className="space-y-1 text-xs">
                  <li>• Cart to quote: 50 conversion tests</li>
                  <li>• Quote to cart: 50 import tests</li>
                  <li>• Update quotes: 50 replacement tests</li>
                  <li>• Selection UI: 50 interface tests</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold mb-2">Cart Operations (300)</h5>
                <ul className="space-y-1 text-xs">
                  <li>• Add items: 100 stress tests</li>
                  <li>• Update quantities: 50 tests</li>
                  <li>• Delete items: 50 tests</li>
                  <li>• Clear cart: 50 tests</li>
                  <li>• Persistence: 50 recovery tests</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold mb-2">Edge Cases (200)</h5>
                <ul className="space-y-1 text-xs">
                  <li>• Concurrent ops: 50 race tests</li>
                  <li>• Performance: 50 benchmark tests</li>
                  <li>• Error handling: 50 failure tests</li>
                  <li>• Data validation: 50 input tests</li>
                </ul>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};