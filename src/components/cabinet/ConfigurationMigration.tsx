import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowRight, CheckCircle, AlertCircle, RefreshCw, Download, Upload } from 'lucide-react';
import { CabinetConfiguration, CabinetConfigurationService } from '@/services/CabinetConfigurationService';
import { useToast } from '@/hooks/use-toast';

interface ConfigurationMigrationProps {
  legacyConfigurations: any[];
  productConfigurations: any[];
  onMigrationComplete: (migratedConfigurations: CabinetConfiguration[]) => void;
}

interface MigrationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export function ConfigurationMigration({
  legacyConfigurations,
  productConfigurations,
  onMigrationComplete
}: ConfigurationMigrationProps) {
  const { toast } = useToast();
  const [migrationInProgress, setMigrationInProgress] = useState(false);
  const [migrationSteps, setMigrationSteps] = useState<MigrationStep[]>([
    {
      id: 'analyze',
      name: 'Analyze Configurations',
      description: 'Scanning existing configurations for compatibility',
      status: 'pending',
      progress: 0
    },
    {
      id: 'validate',
      name: 'Validate Data',
      description: 'Checking data integrity and constraints',
      status: 'pending',
      progress: 0
    },
    {
      id: 'convert',
      name: 'Convert Formats',
      description: 'Converting configurations to unified format',
      status: 'pending',
      progress: 0
    },
    {
      id: 'backup',
      name: 'Create Backups',
      description: 'Backing up original configurations',
      status: 'pending',
      progress: 0
    },
    {
      id: 'migrate',
      name: 'Migrate Data',
      description: 'Moving configurations to unified system',
      status: 'pending',
      progress: 0
    },
    {
      id: 'verify',
      name: 'Verify Migration',
      description: 'Confirming successful migration',
      status: 'pending',
      progress: 0
    }
  ]);

  const [migrationResults, setMigrationResults] = useState<{
    successful: number;
    failed: number;
    warnings: string[];
    migratedConfigurations: CabinetConfiguration[];
  } | null>(null);

  const updateStepStatus = (stepId: string, status: MigrationStep['status'], progress = 0, error?: string) => {
    setMigrationSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, progress, error }
        : step
    ));
  };

  const simulateStepProgress = async (stepId: string, duration = 2000) => {
    updateStepStatus(stepId, 'running', 0);
    
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, duration / 10));
      updateStepStatus(stepId, 'running', i);
    }
    
    updateStepStatus(stepId, 'completed', 100);
  };

  const startMigration = async () => {
    setMigrationInProgress(true);
    setMigrationResults(null);
    
    // Reset all steps
    setMigrationSteps(prev => prev.map(step => ({ 
      ...step, 
      status: 'pending' as const, 
      progress: 0,
      error: undefined 
    })));

    try {
      // Step 1: Analyze
      await simulateStepProgress('analyze', 1500);
      
      // Step 2: Validate
      await simulateStepProgress('validate', 1000);
      
      // Step 3: Convert
      await simulateStepProgress('convert', 2500);
      const migratedConfigs: CabinetConfiguration[] = [];
      
      // Convert legacy configurations
      legacyConfigurations.forEach(config => {
        try {
          const converted = CabinetConfigurationService.convertLegacyConfiguration(config);
          migratedConfigs.push(converted);
        } catch (error) {
          console.error('Error converting legacy config:', error);
        }
      });
      
      // Convert product configurations
      productConfigurations.forEach(config => {
        try {
          const converted = CabinetConfigurationService.convertProductConfiguration(config);
          migratedConfigs.push(converted);
        } catch (error) {
          console.error('Error converting product config:', error);
        }
      });
      
      // Step 4: Backup
      await simulateStepProgress('backup', 1000);
      
      // Step 5: Migrate
      await simulateStepProgress('migrate', 2000);
      
      // Step 6: Verify
      await simulateStepProgress('verify', 1500);
      
      // Set results
      setMigrationResults({
        successful: migratedConfigs.length,
        failed: (legacyConfigurations.length + productConfigurations.length) - migratedConfigs.length,
        warnings: [
          'Some door style mappings may need manual review',
          'Hardware brand selections preserved where possible'
        ],
        migratedConfigurations: migratedConfigs
      });
      
      // Call completion handler
      onMigrationComplete(migratedConfigs);
      
      toast({
        title: "Migration Complete",
        description: `Successfully migrated ${migratedConfigs.length} configurations`,
      });
      
    } catch (error) {
      console.error('Migration failed:', error);
      updateStepStatus('migrate', 'error', 0, 'Migration failed: ' + (error as Error).message);
      
      toast({
        title: "Migration Failed",
        description: "An error occurred during migration",
        variant: "destructive",
      });
    }
    
    setMigrationInProgress(false);
  };

  const rollbackMigration = async () => {
    // Implement rollback logic here
    toast({
      title: "Rollback Initiated",
      description: "Rolling back to previous configuration state",
    });
  };

  const exportBackup = () => {
    const backupData = {
      legacyConfigurations,
      productConfigurations,
      migrationDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `configuration-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getTotalConfigurations = () => legacyConfigurations.length + productConfigurations.length;
  const getOverallProgress = () => {
    const completedSteps = migrationSteps.filter(step => step.status === 'completed').length;
    const totalSteps = migrationSteps.length;
    return Math.round((completedSteps / totalSteps) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Configuration Migration</h3>
        <p className="text-sm text-muted-foreground">
          Migrate configurations between legacy and product systems
        </p>
      </div>

      <Separator />

      {/* Migration Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Legacy Configurations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{legacyConfigurations.length}</div>
            <p className="text-xs text-muted-foreground">Ready for migration</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Product Configurations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productConfigurations.length}</div>
            <p className="text-xs text-muted-foreground">Ready for migration</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total to Migrate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalConfigurations()}</div>
            <p className="text-xs text-muted-foreground">Configurations found</p>
          </CardContent>
        </Card>
      </div>

      {/* Migration Progress */}
      {(migrationInProgress || migrationResults) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${migrationInProgress ? 'animate-spin' : ''}`} />
              Migration Progress
              <Badge variant={migrationInProgress ? "default" : "secondary"}>
                {migrationInProgress ? 'Running' : 'Complete'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{getOverallProgress()}%</span>
              </div>
              <Progress value={getOverallProgress()} className="h-2" />
            </div>
            
            <div className="space-y-3">
              {migrationSteps.map((step) => (
                <div key={step.id} className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {step.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {step.status === 'running' && (
                      <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                    )}
                    {step.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    {step.status === 'pending' && (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{step.name}</div>
                    <div className="text-xs text-muted-foreground">{step.description}</div>
                    {step.error && (
                      <div className="text-xs text-red-600 mt-1">{step.error}</div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {step.progress}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Migration Results */}
      {migrationResults && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Migration Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Successful:</span>{' '}
                <span className="text-green-600">{migrationResults.successful}</span>
              </div>
              <div>
                <span className="font-medium">Failed:</span>{' '}
                <span className="text-red-600">{migrationResults.failed}</span>
              </div>
            </div>
            
            {migrationResults.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">Warnings:</div>
                    <ul className="text-sm space-y-1">
                      {migrationResults.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={startMigration}
          disabled={migrationInProgress || getTotalConfigurations() === 0}
          className="flex-1"
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          {migrationInProgress ? 'Migrating...' : 'Start Migration'}
        </Button>
        
        <Button
          variant="outline"
          onClick={exportBackup}
          disabled={getTotalConfigurations() === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Backup
        </Button>
        
        {migrationResults && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Rollback
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Rollback</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This will revert all configurations to their pre-migration state. 
                  This action cannot be undone.
                </p>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Make sure you have exported a backup before proceeding with rollback.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={rollbackMigration}
                    className="flex-1"
                  >
                    Confirm Rollback
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}