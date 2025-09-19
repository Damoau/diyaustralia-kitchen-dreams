import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Settings, History, Template } from 'lucide-react';
import { CabinetType } from '@/types/cabinet';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { CabinetConfigurationService, CabinetConfiguration } from '@/services/CabinetConfigurationService';
import { ConfiguratorDialog } from './ConfiguratorDialog';
import { ProductConfiguratorDialog } from './ProductConfiguratorDialog';
import { ConfigurationTemplates } from './ConfigurationTemplates';
import { ConfigurationHistory } from './ConfigurationHistory';
import { ConfigurationComparison } from './ConfigurationComparison';

interface UnifiedConfiguratorDialogProps {
  cabinetType: CabinetType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialWidth?: number;
  initialConfiguration?: CabinetConfiguration;
}

export function UnifiedConfiguratorDialog({
  cabinetType,
  open,
  onOpenChange,
  initialWidth,
  initialConfiguration
}: UnifiedConfiguratorDialogProps) {
  const { getFeatureFlag } = useFeatureFlags();
  
  // Feature flags for system selection
  const useProductSystem = getFeatureFlag('use_product_configurator');
  const showUnifiedInterface = getFeatureFlag('show_unified_configurator');
  const enableMigrationMode = getFeatureFlag('enable_configuration_migration');
  
  // State for unified interface
  const [activeTab, setActiveTab] = useState('configure');
  const [currentConfiguration, setCurrentConfiguration] = useState<CabinetConfiguration | null>(
    initialConfiguration || CabinetConfigurationService.createDefaultConfiguration(cabinetType)
  );
  const [configurationHistory, setConfigurationHistory] = useState<CabinetConfiguration[]>([]);
  
  // If unified interface is not enabled, fall back to appropriate system
  if (!showUnifiedInterface) {
    if (useProductSystem) {
      return (
        <ProductConfiguratorDialog
          cabinetType={cabinetType}
          open={open}
          onOpenChange={onOpenChange}
          initialWidth={initialWidth}
        />
      );
    } else {
      return (
        <ConfiguratorDialog
          cabinetType={cabinetType}
          open={open}
          onOpenChange={onOpenChange}
          initialWidth={initialWidth}
        />
      );
    }
  }

  // Save configuration to history when it changes
  useEffect(() => {
    if (currentConfiguration) {
      setConfigurationHistory(prev => {
        // Don't add duplicate configurations
        const isDuplicate = prev.some(config => 
          CabinetConfigurationService.compareConfigurations(config, currentConfiguration).identical
        );
        
        if (isDuplicate) return prev;
        
        // Keep only last 10 configurations
        const newHistory = [currentConfiguration, ...prev].slice(0, 10);
        return newHistory;
      });
    }
  }, [currentConfiguration]);

  const handleConfigurationChange = (newConfig: CabinetConfiguration) => {
    setCurrentConfiguration(newConfig);
  };

  const handleTemplateApply = (template: CabinetConfiguration) => {
    setCurrentConfiguration(template);
    setActiveTab('configure');
  };

  const handleHistoryRestore = (historicConfig: CabinetConfiguration) => {
    setCurrentConfiguration(historicConfig);
    setActiveTab('configure');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md md:max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg text-primary">
            <ShoppingCart className="h-5 w-5" />
            {cabinetType.name}
            <Badge variant="outline" className="ml-2">
              {enableMigrationMode ? 'Migration Mode' : 'Unified'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Advanced cabinet configuration with templates, history, and migration tools
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="configure" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configure
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Template className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Compare
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto" style={{ height: 'calc(90vh - 140px)' }}>
            <TabsContent value="configure" className="mt-0">
              <div className="space-y-4">
                {/* Configuration Source Selection */}
                {enableMigrationMode && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Configuration System</h3>
                    <div className="flex gap-2">
                      <Button
                        variant={!useProductSystem ? "default" : "outline"}
                        size="sm"
                        onClick={() => {/* Switch to legacy */}}
                      >
                        Legacy System
                      </Button>
                      <Button
                        variant={useProductSystem ? "default" : "outline"}
                        size="sm"
                        onClick={() => {/* Switch to product */}}
                      >
                        Product System
                      </Button>
                    </div>
                  </div>
                )}

                {/* Render appropriate configurator based on system */}
                {useProductSystem ? (
                  <ProductConfiguratorDialog
                    cabinetType={cabinetType}
                    open={true}
                    onOpenChange={() => {}}
                    initialWidth={initialWidth}
                  />
                ) : (
                  <ConfiguratorDialog
                    cabinetType={cabinetType}
                    open={true}
                    onOpenChange={() => {}}
                    initialWidth={initialWidth}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="mt-0">
              <ConfigurationTemplates
                cabinetType={cabinetType}
                currentConfiguration={currentConfiguration}
                onTemplateApply={handleTemplateApply}
                onConfigurationSave={handleConfigurationChange}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <ConfigurationHistory
                configurations={configurationHistory}
                currentConfiguration={currentConfiguration}
                onRestore={handleHistoryRestore}
              />
            </TabsContent>

            <TabsContent value="compare" className="mt-0">
              <ConfigurationComparison
                configurations={configurationHistory}
                currentConfiguration={currentConfiguration}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
