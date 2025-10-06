import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { runDocuSealSimulations, saveSimulationReport, SimulationReport } from '@/utils/docusealWorkflowSimulations';
import { toast } from 'sonner';

export function DocuSealSimulationRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<SimulationReport | null>(null);
  const [progress, setProgress] = useState(0);

  const handleRunSimulations = async () => {
    setIsRunning(true);
    setProgress(0);
    setReport(null);

    try {
      toast.info('Starting DocuSeal workflow simulations...', {
        description: 'Running 50 comprehensive test scenarios'
      });

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 2, 95));
      }, 100);

      const simulationReport = await runDocuSealSimulations();
      
      clearInterval(progressInterval);
      setProgress(100);
      setReport(simulationReport);

      // Save report to database
      await saveSimulationReport(simulationReport);

      const passRate = Math.round((simulationReport.passed / simulationReport.totalTests) * 100);
      
      if (passRate >= 90) {
        toast.success('Simulations completed successfully!', {
          description: `${simulationReport.passed}/${simulationReport.totalTests} tests passed (${passRate}%)`
        });
      } else if (passRate >= 70) {
        toast.warning('Simulations completed with warnings', {
          description: `${simulationReport.passed}/${simulationReport.totalTests} tests passed (${passRate}%)`
        });
      } else {
        toast.error('Simulations revealed critical issues', {
          description: `Only ${simulationReport.passed}/${simulationReport.totalTests} tests passed (${passRate}%)`
        });
      }
    } catch (error: any) {
      console.error('Simulation error:', error);
      toast.error('Simulation failed', {
        description: error.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getPhaseIcon = (phaseName: string) => {
    switch (phaseName) {
      case 'edge-function':
        return '🚀';
      case 'webhook':
        return '🔗';
      case 'admin-dashboard':
        return '👨‍💼';
      case 'customer-portal':
        return '👤';
      default:
        return '📋';
    }
  };

  const getPhaseLabel = (phaseName: string) => {
    switch (phaseName) {
      case 'edge-function':
        return 'Edge Functions';
      case 'webhook':
        return 'Webhooks';
      case 'admin-dashboard':
        return 'Admin Dashboard';
      case 'customer-portal':
        return 'Customer Portal';
      default:
        return phaseName;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">DocuSeal Workflow Simulations</h2>
              <p className="text-muted-foreground">
                Run 50 comprehensive tests across 4 phases to verify the DocuSeal integration
              </p>
            </div>
            <Button 
              onClick={handleRunSimulations} 
              disabled={isRunning}
              size="lg"
            >
              {isRunning ? (
                <>
                  <Clock className="mr-2 h-5 w-5 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Run Simulations
                </>
              )}
            </Button>
          </div>

          {isRunning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Running simulations...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      </Card>

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Tests</p>
                <p className="text-3xl font-bold">{report.totalTests}</p>
              </div>
            </Card>
            <Card className="p-4 border-green-200 bg-green-50">
              <div className="space-y-2">
                <p className="text-sm text-green-700">Passed</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-green-700">{report.passed}</p>
                  <p className="text-sm text-green-600">
                    ({Math.round((report.passed / report.totalTests) * 100)}%)
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-red-200 bg-red-50">
              <div className="space-y-2">
                <p className="text-sm text-red-700">Failed</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-red-700">{report.failed}</p>
                  <p className="text-sm text-red-600">
                    ({Math.round((report.failed / report.totalTests) * 100)}%)
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Avg Duration</p>
                <p className="text-3xl font-bold">{report.averageDuration}ms</p>
              </div>
            </Card>
          </div>

          {/* Phase Results */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Results by Phase</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(report.phaseResults).map(([phase, stats]) => (
                <Card key={phase} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{getPhaseIcon(phase)}</span>
                    <div>
                      <h4 className="font-semibold">{getPhaseLabel(phase)}</h4>
                      <p className="text-sm text-muted-foreground">
                        {stats.passed + stats.failed} tests
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Passed
                      </span>
                      <span className="font-semibold text-green-600">{stats.passed}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-1">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Failed
                      </span>
                      <span className="font-semibold text-red-600">{stats.failed}</span>
                    </div>
                    <Progress 
                      value={(stats.passed / (stats.passed + stats.failed)) * 100} 
                      className="h-2"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Recommendations
              </h3>
              <div className="space-y-3">
                {report.recommendations.map((rec, index) => {
                  const isCritical = rec.includes('CRITICAL');
                  const isHigh = rec.includes('HIGH');
                  const isWarning = rec.includes('PERFORMANCE') || rec.includes('⚠️');
                  
                  return (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border-l-4 ${
                        isCritical ? 'bg-red-50 border-red-500' :
                        isHigh ? 'bg-orange-50 border-orange-500' :
                        isWarning ? 'bg-yellow-50 border-yellow-500' :
                        'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <p className="text-sm">{rec}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Failure Patterns */}
          {report.failurePatterns.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Failure Patterns</h3>
              <div className="space-y-2">
                {report.failurePatterns.slice(0, 10).map((pattern, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                    <span className="text-sm">{pattern.pattern}</span>
                    <Badge variant="destructive">{pattern.count}x</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Detailed Results */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Detailed Test Results</h3>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {report.results.map((result, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 hover:bg-muted/50 rounded text-sm"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {result.passed ? (
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    )}
                    <span className="flex-1">{result.scenario}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {getPhaseLabel(result.phase)}
                    </Badge>
                    <span className="text-muted-foreground text-xs w-16 text-right">
                      {result.duration}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
