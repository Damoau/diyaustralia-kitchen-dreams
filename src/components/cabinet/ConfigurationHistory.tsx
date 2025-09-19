import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { History, RotateCcw, Eye, Clock } from 'lucide-react';
import { CabinetConfiguration, CabinetConfigurationService } from '@/services/CabinetConfigurationService';
import { useToast } from '@/hooks/use-toast';

interface ConfigurationHistoryProps {
  configurations: CabinetConfiguration[];
  currentConfiguration: CabinetConfiguration | null;
  onRestore: (configuration: CabinetConfiguration) => void;
}

export function ConfigurationHistory({
  configurations,
  currentConfiguration,
  onRestore
}: ConfigurationHistoryProps) {
  const { toast } = useToast();
  const [selectedConfig, setSelectedConfig] = useState<CabinetConfiguration | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  const handleRestore = (config: CabinetConfiguration) => {
    onRestore(config);
    toast({
      title: "Configuration Restored",
      description: "Previous configuration has been restored",
    });
  };

  const handlePreview = (config: CabinetConfiguration) => {
    setSelectedConfig(config);
    setShowPreviewDialog(true);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    }).format(date);
  };

  const formatDimensions = (config: CabinetConfiguration) => {
    if (config.rightSideWidth && config.leftSideWidth) {
      // Corner cabinet
      return `L: ${config.leftSideWidth}×${config.height}×${config.leftSideDepth}mm, R: ${config.rightSideWidth}×${config.height}×${config.rightSideDepth}mm`;
    }
    return `${config.width}×${config.height}×${config.depth}mm`;
  };

  const getConfigurationChanges = (config: CabinetConfiguration, previousConfig?: CabinetConfiguration) => {
    if (!previousConfig) return [];
    
    const comparison = CabinetConfigurationService.compareConfigurations(previousConfig, config);
    return comparison.differences;
  };

  if (configurations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <History className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Configuration History</h3>
          <p className="text-muted-foreground">
            Make changes to your cabinet configuration to see them here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Configuration History</h3>
        <p className="text-sm text-muted-foreground">
          Review and restore previous configurations
        </p>
      </div>

      <Separator />

      {/* History List */}
      <div className="space-y-4">
        {configurations.map((config, index) => {
          const isCurrentConfig = currentConfiguration && 
            CabinetConfigurationService.compareConfigurations(config, currentConfiguration).identical;
          const previousConfig = configurations[index + 1];
          const changes = getConfigurationChanges(config, previousConfig);

          return (
            <Card key={`${config.updatedAt.getTime()}-${index}`} className={isCurrentConfig ? 'border-primary' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {formatTime(config.updatedAt)}
                    </span>
                    {isCurrentConfig && (
                      <Badge variant="default" className="text-xs">
                        Current
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs capitalize">
                      {config.configurationSource}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(config)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!isCurrentConfig && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(config)}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Dimensions:</span>{' '}
                    <span className="text-muted-foreground">
                      {formatDimensions(config)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Quantity:</span>{' '}
                    <span className="text-muted-foreground">
                      {config.quantity}
                    </span>
                  </div>
                  
                  {/* Show changes from previous configuration */}
                  {changes.length > 0 && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium text-xs text-muted-foreground mb-2">
                        Changes from previous:
                      </p>
                      <ul className="text-xs space-y-1">
                        {changes.slice(0, 3).map((change, idx) => (
                          <li key={idx} className="text-muted-foreground">
                            • {change}
                          </li>
                        ))}
                        {changes.length > 3 && (
                          <li className="text-muted-foreground">
                            • And {changes.length - 3} more changes...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuration Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configuration Preview</DialogTitle>
          </DialogHeader>
          {selectedConfig && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Width:</span>
                  <span className="ml-2">{selectedConfig.width}mm</span>
                </div>
                <div>
                  <span className="font-medium">Height:</span>
                  <span className="ml-2">{selectedConfig.height}mm</span>
                </div>
                <div>
                  <span className="font-medium">Depth:</span>
                  <span className="ml-2">{selectedConfig.depth}mm</span>
                </div>
                <div>
                  <span className="font-medium">Quantity:</span>
                  <span className="ml-2">{selectedConfig.quantity}</span>
                </div>
              </div>

              {/* Corner cabinet dimensions */}
              {selectedConfig.rightSideWidth && selectedConfig.leftSideWidth && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Corner Cabinet Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Left Width:</span>
                      <span className="ml-2">{selectedConfig.leftSideWidth}mm</span>
                    </div>
                    <div>
                      <span className="font-medium">Right Width:</span>
                      <span className="ml-2">{selectedConfig.rightSideWidth}mm</span>
                    </div>
                    <div>
                      <span className="font-medium">Left Depth:</span>
                      <span className="ml-2">{selectedConfig.leftSideDepth}mm</span>
                    </div>
                    <div>
                      <span className="font-medium">Right Depth:</span>
                      <span className="ml-2">{selectedConfig.rightSideDepth}mm</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Style information */}
              {(selectedConfig.doorStyleId || selectedConfig.colorId || selectedConfig.hardwareBrandId) && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Style & Finish</h4>
                  <div className="space-y-2 text-sm">
                    {selectedConfig.doorStyleId && (
                      <div>Door Style: <Badge variant="outline">Selected</Badge></div>
                    )}
                    {selectedConfig.colorId && (
                      <div>Color: <Badge variant="outline">Selected</Badge></div>
                    )}
                    {selectedConfig.hardwareBrandId && (
                      <div>Hardware: <Badge variant="outline">Selected</Badge></div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowPreviewDialog(false)} className="flex-1">
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    handleRestore(selectedConfig);
                    setShowPreviewDialog(false);
                  }} 
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore This
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}