import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, ArrowDown, Equal } from 'lucide-react';
import { CabinetConfiguration, CabinetConfigurationService } from '@/services/CabinetConfigurationService';

interface ConfigurationComparisonProps {
  configurations: CabinetConfiguration[];
  currentConfiguration: CabinetConfiguration | null;
}

export function ConfigurationComparison({
  configurations,
  currentConfiguration
}: ConfigurationComparisonProps) {
  const [selectedConfig1, setSelectedConfig1] = useState<string>('');
  const [selectedConfig2, setSelectedConfig2] = useState<string>('');

  // Create options list including current configuration
  const allConfigurations = [
    ...(currentConfiguration ? [{ ...currentConfiguration, id: 'current', label: 'Current Configuration' }] : []),
    ...configurations.map((config, index) => ({
      ...config,
      id: `history-${index}`,
      label: `Configuration ${index + 1} (${new Intl.DateTimeFormat('en-AU', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short'
      }).format(config.updatedAt)})`
    }))
  ];

  const config1 = allConfigurations.find(c => c.id === selectedConfig1);
  const config2 = allConfigurations.find(c => c.id === selectedConfig2);

  const comparison = config1 && config2 ? 
    CabinetConfigurationService.compareConfigurations(config1, config2) : 
    null;

  const formatDimensions = (config: CabinetConfiguration) => {
    if (config.rightSideWidth && config.leftSideWidth) {
      return `L: ${config.leftSideWidth}×${config.height}×${config.leftSideDepth}mm, R: ${config.rightSideWidth}×${config.height}×${config.rightSideDepth}mm`;
    }
    return `${config.width}×${config.height}×${config.depth}mm`;
  };

  const ComparisonRow = ({ 
    label, 
    value1, 
    value2, 
    unit = '' 
  }: { 
    label: string; 
    value1: any; 
    value2: any; 
    unit?: string;
  }) => {
    const isDifferent = value1 !== value2;
    
    return (
      <div className="flex items-center justify-between py-2 border-b last:border-b-0">
        <span className="font-medium text-sm">{label}</span>
        <div className="flex items-center gap-2 text-sm">
          <span className={isDifferent ? 'text-destructive' : ''}>{value1}{unit}</span>
          {isDifferent ? (
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Equal className="h-4 w-4 text-muted-foreground" />
          )}
          <span className={isDifferent ? 'text-green-600' : ''}>{value2}{unit}</span>
        </div>
      </div>
    );
  };

  if (allConfigurations.length < 2) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ArrowDown className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Not Enough Configurations</h3>
          <p className="text-muted-foreground">
            You need at least 2 configurations to compare. Make some changes to create more configuration history.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Configuration Comparison</h3>
        <p className="text-sm text-muted-foreground">
          Compare different configurations side by side
        </p>
      </div>

      <Separator />

      {/* Configuration Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">First Configuration</label>
          <Select value={selectedConfig1} onValueChange={setSelectedConfig1}>
            <SelectTrigger>
              <SelectValue placeholder="Choose first configuration" />
            </SelectTrigger>
            <SelectContent>
              {allConfigurations.map((config) => (
                <SelectItem key={config.id} value={config.id}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Second Configuration</label>
          <Select value={selectedConfig2} onValueChange={setSelectedConfig2}>
            <SelectTrigger>
              <SelectValue placeholder="Choose second configuration" />
            </SelectTrigger>
            <SelectContent>
              {allConfigurations.map((config) => (
                <SelectItem key={config.id} value={config.id}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Comparison Results */}
      {comparison && config1 && config2 && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                Comparison Summary
                {comparison.identical ? (
                  <Badge variant="secondary">Identical</Badge>
                ) : (
                  <Badge variant="destructive">{comparison.differences.length} Differences</Badge>
                )}
              </CardTitle>
            </CardHeader>
            {!comparison.identical && (
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Changes:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {comparison.differences.map((diff, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" />
                        {diff}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Detailed Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Dimensions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dimensions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <ComparisonRow label="Width" value1={config1.width} value2={config2.width} unit="mm" />
                  <ComparisonRow label="Height" value1={config1.height} value2={config2.height} unit="mm" />
                  <ComparisonRow label="Depth" value1={config1.depth} value2={config2.depth} unit="mm" />
                  <ComparisonRow label="Quantity" value1={config1.quantity} value2={config2.quantity} />
                </div>
              </CardContent>
            </Card>

            {/* Corner Cabinet Dimensions (if applicable) */}
            {(config1.rightSideWidth || config2.rightSideWidth) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Corner Dimensions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <ComparisonRow 
                      label="Left Width" 
                      value1={config1.leftSideWidth || 'N/A'} 
                      value2={config2.leftSideWidth || 'N/A'} 
                      unit={config1.leftSideWidth || config2.leftSideWidth ? 'mm' : ''}
                    />
                    <ComparisonRow 
                      label="Right Width" 
                      value1={config1.rightSideWidth || 'N/A'} 
                      value2={config2.rightSideWidth || 'N/A'} 
                      unit={config1.rightSideWidth || config2.rightSideWidth ? 'mm' : ''}
                    />
                    <ComparisonRow 
                      label="Left Depth" 
                      value1={config1.leftSideDepth || 'N/A'} 
                      value2={config2.leftSideDepth || 'N/A'} 
                      unit={config1.leftSideDepth || config2.leftSideDepth ? 'mm' : ''}
                    />
                    <ComparisonRow 
                      label="Right Depth" 
                      value1={config1.rightSideDepth || 'N/A'} 
                      value2={config2.rightSideDepth || 'N/A'} 
                      unit={config1.rightSideDepth || config2.rightSideDepth ? 'mm' : ''}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Style & Finish */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Style & Finish</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <ComparisonRow 
                    label="Door Style" 
                    value1={config1.doorStyleId ? 'Selected' : 'None'} 
                    value2={config2.doorStyleId ? 'Selected' : 'None'} 
                  />
                  <ComparisonRow 
                    label="Color" 
                    value1={config1.colorId ? 'Selected' : 'None'} 
                    value2={config2.colorId ? 'Selected' : 'None'} 
                  />
                  <ComparisonRow 
                    label="Hardware" 
                    value1={config1.hardwareBrandId ? 'Selected' : 'None'} 
                    value2={config2.hardwareBrandId ? 'Selected' : 'None'} 
                  />
                </div>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <ComparisonRow 
                    label="Source" 
                    value1={config1.configurationSource} 
                    value2={config2.configurationSource} 
                  />
                  <ComparisonRow 
                    label="Updated" 
                    value1={new Intl.DateTimeFormat('en-AU', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: 'short'
                    }).format(config1.updatedAt)} 
                    value2={new Intl.DateTimeFormat('en-AU', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: 'short'
                    }).format(config2.updatedAt)} 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}