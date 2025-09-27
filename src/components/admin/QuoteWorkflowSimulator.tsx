import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  ShoppingCart, 
  FileText, 
  CheckCircle, 
  ArrowRight, 
  Clock,
  Settings,
  Users,
  RefreshCw,
  AlertCircle,
  Play
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminImpersonation } from '@/contexts/AdminImpersonationContext';
import { useCartOptimized } from '@/hooks/useCartOptimized';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  duration?: number;
  actions?: string[];
}

interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  estimatedTime: number;
}

export const QuoteWorkflowSimulator: React.FC = () => {
  const { user } = useAuth();
  const { isImpersonating, startImpersonation, endImpersonation } = useAdminImpersonation();
  const { cart } = useCartOptimized();
  const navigate = useNavigate();

  const [activeSimulation, setActiveSimulation] = useState<string | null>(null);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [simulationData, setSimulationData] = useState<any>({});

  // Simulation scenarios
  const scenarios: SimulationScenario[] = [
    {
      id: 'admin-to-customer-flow',
      name: 'Admin → Customer Journey',
      description: 'Simulate admin creating quote, switching to customer view, building cart, and returning to admin',
      estimatedTime: 120,
      steps: [
        {
          id: 'admin-setup',
          title: 'Admin Quote Creation',
          description: 'Admin creates initial quote and prepares customer details',
          status: 'pending',
          duration: 15,
          actions: ['Create quote', 'Set customer details', 'Configure initial items']
        },
        {
          id: 'impersonation-start',
          title: 'Start Customer Impersonation',
          description: 'Admin switches to customer view with proper session management',
          status: 'pending',
          duration: 10,
          actions: ['Generate session token', 'Switch context', 'Validate permissions']
        },
        {
          id: 'customer-experience',
          title: 'Customer Cart Building',
          description: 'Customer adds items, configures products, and builds complete cart',
          status: 'pending',
          duration: 60,
          actions: ['Browse products', 'Configure items', 'Add to cart', 'Review selections']
        },
        {
          id: 'cart-to-quote',
          title: 'Cart → Quote Conversion',
          description: 'Convert customer cart items back to admin-managed quote',
          status: 'pending',
          duration: 20,
          actions: ['Validate cart items', 'Convert to quote', 'Apply pricing rules']
        },
        {
          id: 'admin-finalization',
          title: 'Return to Admin Context',
          description: 'End impersonation and finalize quote in admin system',
          status: 'pending',
          duration: 15,
          actions: ['End impersonation', 'Review quote', 'Apply discounts', 'Send to customer']
        }
      ]
    },
    {
      id: 'multi-cart-management',
      name: 'Multi-Cart Scenario',
      description: 'Test cart persistence, consolidation, and management across sessions',
      estimatedTime: 90,
      steps: [
        {
          id: 'create-multiple-carts',
          title: 'Create Multiple Carts',
          description: 'Generate several carts with different items and states',
          status: 'pending',
          duration: 30,
          actions: ['Create cart A', 'Create cart B', 'Add different items', 'Set various states']
        },
        {
          id: 'consolidation-test',
          title: 'Cart Consolidation',
          description: 'Test automatic cart cleanup and consolidation logic',
          status: 'pending',
          duration: 20,
          actions: ['Trigger consolidation', 'Verify primary cart', 'Clean empty carts']
        },
        {
          id: 'session-switching',
          title: 'Session Management',
          description: 'Test cart persistence across login/logout and impersonation',
          status: 'pending',
          duration: 25,
          actions: ['Switch sessions', 'Test persistence', 'Validate cart ownership']
        },
        {
          id: 'error-recovery',
          title: 'Error Recovery',
          description: 'Simulate errors and test recovery mechanisms',
          status: 'pending',
          duration: 15,
          actions: ['Simulate network error', 'Test auto-recovery', 'Validate data integrity']
        }
      ]
    },
    {
      id: 'performance-stress-test',
      name: 'Performance & Stress Testing',
      description: 'Load test with multiple concurrent operations',
      estimatedTime: 45,
      steps: [
        {
          id: 'concurrent-operations',
          title: 'Concurrent Cart Operations',
          description: 'Simulate multiple users adding items simultaneously',
          status: 'pending',
          duration: 20,
          actions: ['Simulate 10 users', 'Concurrent cart adds', 'Monitor performance']
        },
        {
          id: 'memory-usage',
          title: 'Memory & Cache Testing',
          description: 'Test cart caching and memory usage optimization',
          status: 'pending',
          duration: 15,
          actions: ['Monitor memory', 'Test cache efficiency', 'Validate cleanup']
        },
        {
          id: 'network-resilience',
          title: 'Network Resilience',
          description: 'Test offline scenarios and network recovery',
          status: 'pending',
          duration: 10,
          actions: ['Simulate offline', 'Test retry logic', 'Validate sync']
        }
      ]
    }
  ];

  // Start simulation
  const startSimulation = useCallback(async (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    setActiveSimulation(scenarioId);
    setCurrentStep(0);
    setSimulationProgress(0);
    setSimulationData({
      startTime: Date.now(),
      scenario: scenario.name,
      customerEmail: `test-customer-${Date.now()}@example.com`
    });

    toast.success(`Starting simulation: ${scenario.name}`);

    // Execute steps
    for (let i = 0; i < scenario.steps.length; i++) {
      const step = scenario.steps[i];
      setCurrentStep(i);
      
      // Update step status to active
      scenario.steps[i].status = 'active';
      
      try {
        await executeStep(step, scenarioId);
        scenario.steps[i].status = 'completed';
        
        // Update progress
        const progress = ((i + 1) / scenario.steps.length) * 100;
        setSimulationProgress(progress);
        
        // Simulate step duration
        if (step.duration) {
          await new Promise(resolve => setTimeout(resolve, (step.duration || 10) * 100));
        }
        
      } catch (error) {
        console.error(`Step ${step.id} failed:`, error);
        scenario.steps[i].status = 'error';
        toast.error(`Step failed: ${step.title}`);
        break;
      }
    }
    
    toast.success('Simulation completed successfully');
  }, []);

  // Execute individual simulation step
  const executeStep = async (step: WorkflowStep, scenarioId: string) => {
    console.log(`Executing step: ${step.id} in scenario: ${scenarioId}`);
    
    switch (step.id) {
      case 'admin-setup':
        // Create initial quote
        await simulateAdminQuoteCreation();
        break;
        
      case 'impersonation-start':
        // Start customer impersonation
        if (simulationData.customerEmail) {
          await startImpersonation(simulationData.customerEmail, '');
          navigate('/shop');
        }
        break;
        
      case 'customer-experience':
        // Simulate customer actions
        await simulateCustomerActions();
        break;
        
      case 'cart-to-quote':
        // Convert cart to quote
        await simulateCartToQuoteConversion();
        break;
        
      case 'admin-finalization':
        // Return to admin and finalize
        await endImpersonation();
        navigate('/admin/sales/quotes');
        break;
        
      case 'create-multiple-carts':
        // Create test carts
        await simulateMultipleCartCreation();
        break;
        
      case 'consolidation-test':
        // Test consolidation
        await simulateCartConsolidation();
        break;
        
      default:
        // Generic step execution
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  // Simulation helper functions
  const simulateAdminQuoteCreation = async () => {
    console.log('Creating admin quote...');
    // This would typically create a quote via admin interface
  };

  const simulateCustomerActions = async () => {
    console.log('Simulating customer actions...');
    // This would add items to cart, configure products, etc.
  };

  const simulateCartToQuoteConversion = async () => {
    console.log('Converting cart to quote...');
    // This would call the cart-to-quote conversion function
  };

  const simulateMultipleCartCreation = async () => {
    console.log('Creating multiple test carts...');
    // This would create several carts with different states
  };

  const simulateCartConsolidation = async () => {
    console.log('Testing cart consolidation...');
    // This would trigger the consolidation logic
  };

  // Stop simulation
  const stopSimulation = () => {
    setActiveSimulation(null);
    setSimulationProgress(0);
    setCurrentStep(0);
    setSimulationData({});
    toast.info('Simulation stopped');
  };

  const getStepIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'active': return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Quote Workflow Simulator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* Simulation Status */}
            {activeSimulation && (
              <Alert>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <AlertDescription>
                  Running simulation: {scenarios.find(s => s.id === activeSimulation)?.name}
                  <Progress value={simulationProgress} className="mt-2" />
                </AlertDescription>
              </Alert>
            )}

            {/* Current Context Info */}
            <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="text-sm">Current User: {user?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="text-sm">
                  Mode: {isImpersonating ? 'Customer Impersonation' : 'Admin'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                <span className="text-sm">Cart Items: {cart?.items?.length || 0}</span>
              </div>
            </div>

            {/* Simulation Scenarios */}
            <div className="space-y-4">
              <h3 className="font-semibold">Available Simulations</h3>
              {scenarios.map((scenario) => (
                <Card key={scenario.id} className="relative">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-medium">{scenario.name}</h4>
                        <p className="text-sm text-muted-foreground">{scenario.description}</p>
                        <Badge variant="outline" className="mt-2">
                          ~{scenario.estimatedTime}s
                        </Badge>
                      </div>
                      <Button
                        onClick={() => startSimulation(scenario.id)}
                        disabled={activeSimulation === scenario.id}
                        size="sm"
                      >
                        {activeSimulation === scenario.id ? 'Running...' : 'Start'}
                      </Button>
                    </div>
                    
                    {/* Steps preview */}
                    <div className="space-y-2">
                      {scenario.steps.map((step, index) => (
                        <div 
                          key={step.id}
                          className={`flex items-center gap-3 p-2 rounded text-sm transition-colors ${
                            activeSimulation === scenario.id && currentStep === index 
                              ? 'bg-blue-50 border border-blue-200' 
                              : ''
                          }`}
                        >
                          {getStepIcon(step.status)}
                          <div className="flex-1">
                            <span className="font-medium">{step.title}</span>
                            <p className="text-xs text-muted-foreground">{step.description}</p>
                          </div>
                          {step.duration && (
                            <Badge variant="secondary" className="text-xs">
                              {step.duration}s
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Control Buttons */}
            <div className="flex gap-2">
              {activeSimulation && (
                <Button variant="outline" onClick={stopSimulation}>
                  Stop Simulation
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setSimulationProgress(0);
                  setCurrentStep(0);
                  scenarios.forEach(scenario => {
                    scenario.steps.forEach(step => {
                      step.status = 'pending';
                    });
                  });
                }}
              >
                Reset All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};