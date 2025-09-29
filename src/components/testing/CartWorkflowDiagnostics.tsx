import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, RefreshCw, Bug } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { runCartDiagnostic, simulateCheckoutWorkflow, fixCartInconsistencies } from '@/utils/cartDiagnosticTool';

export const CartWorkflowDiagnostics = () => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [workflowResults, setWorkflowResults] = useState<any>(null);

  const runFullDiagnostic = async () => {
    setIsRunning(true);
    try {
      console.log('🔧 Running comprehensive cart diagnostics...');
      
      // Get session ID for guest users
      const sessionId = !user?.id ? sessionStorage.getItem('cart_session_id') : undefined;
      
      // Run cart diagnostic
      const cartDiagnostics = await runCartDiagnostic(user?.id, sessionId);
      setDiagnostics(cartDiagnostics);
      
      // Run workflow simulation
      const workflowSim = await simulateCheckoutWorkflow(user?.id);
      setWorkflowResults(workflowSim);
      
      console.log('🔧 Diagnostics complete:', {
        cartDiagnostics,
        workflowSim
      });
      
    } catch (error) {
      console.error('🔧 Diagnostic failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const fixCartIssues = async (cartId: string) => {
    try {
      console.log('🔧 Fixing cart issues for:', cartId);
      const success = await fixCartInconsistencies(cartId);
      if (success) {
        // Re-run diagnostics
        await runFullDiagnostic();
      }
    } catch (error) {
      console.error('🔧 Fix failed:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cart Workflow Diagnostics</h2>
        <Button onClick={runFullDiagnostic} disabled={isRunning}>
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Bug className="w-4 h-4 mr-2" />
              Run Diagnostics
            </>
          )}
        </Button>
      </div>

      {/* Cart State Diagnostics */}
      {diagnostics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cart State Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {diagnostics.map((diagnostic, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{diagnostic.cartId.substring(0, 8)}...</span>
                      <Badge variant={diagnostic.issues.length > 0 ? "destructive" : "default"}>
                        {diagnostic.actualItemCount} items
                      </Badge>
                      <span className="text-sm">${diagnostic.totalAmount}</span>
                    </div>
                    {diagnostic.issues.some(issue => issue.includes('total') && !issue.includes('Empty')) && (
                      <Button size="sm" onClick={() => fixCartIssues(diagnostic.cartId)}>
                        Fix Issues
                      </Button>
                    )}
                  </div>
                  
                  {diagnostic.issues.map((issue, issueIndex) => (
                    <div key={issueIndex} className="flex items-center gap-2 text-sm">
                      {issue.includes('normal') || issue.includes('Empty') ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={issue.includes('normal') || issue.includes('Empty') ? "text-green-600" : "text-red-600"}>
                        {issue}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Simulation Results */}
      {workflowResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Checkout Workflow Simulation
              <Badge variant={workflowResults.success ? "default" : "destructive"}>
                {workflowResults.success ? 'PASS' : 'FAIL'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workflowResults.steps.map((step: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {step.status === 'pass' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{step.step}</div>
                    <div className={`text-sm ${step.status === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                      {step.message}
                    </div>
                    {step.data && (
                      <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                        {JSON.stringify(step.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};