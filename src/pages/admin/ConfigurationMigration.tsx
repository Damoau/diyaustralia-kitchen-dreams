import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowRight, 
  Settings, 
  Database, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { ConfigurationMigration } from '@/components/cabinet/ConfigurationMigration';
import { useConfigurationMigration } from '@/hooks/useConfigurationMigration';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useToast } from '@/hooks/use-toast';

export default function ConfigurationMigrationPage() {
  const { toast } = useToast();
  const { isEnabled } = useFeatureFlags();
  const {
    migrationStats,
    isAnalyzing,
    analyzeConfigurations,
    getSavedConfigurations
  } = useConfigurationMigration();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [migrationStarted, setMigrationStarted] = useState(false);

  const handleMigrationComplete = (migratedConfigurations: any[]) => {
    toast({
      title: "Migration Complete",
      description: `Successfully migrated ${migratedConfigurations.length} configurations`,
    });
    setMigrationStarted(false);
    analyzeConfigurations();
  };

  const getMigrationStatus = () => {
    if (migrationStats.totalCount === 0) return 'no-data';
    if (migrationStats.unifiedCount === migrationStats.totalCount) return 'complete';
    if (migrationStats.unifiedCount > 0) return 'partial';
    return 'pending';
  };

  const getStatusBadge = () => {
    const status = getMigrationStatus();
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />Complete</Badge>;
      case 'partial':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Partial</Badge>;
      case 'pending':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">No Data</Badge>;
    }
  };

  const savedConfigurations = getSavedConfigurations();

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configuration Migration</h1>
          <p className="text-muted-foreground">
            Migrate cabinet configurations to the unified system with 100% backward compatibility
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Feature Flag Status */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>
              Migration mode is {isEnabled('enable_configuration_migration') ? 'enabled' : 'disabled'}. 
              Unified configurator is {isEnabled('use_unified_configurator') ? 'enabled' : 'disabled'}.
            </span>
            <Button variant="outline" size="sm" onClick={analyzeConfigurations}>
              Refresh Analysis
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Migration Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Legacy System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {migrationStats.legacyCount}
            </div>
            <p className="text-xs text-muted-foreground">Configurations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Product System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {migrationStats.productCount}
            </div>
            <p className="text-xs text-muted-foreground">Configurations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unified System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {migrationStats.unifiedCount}
            </div>
            <p className="text-xs text-muted-foreground">Configurations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {migrationStats.totalCount}
            </div>
            <p className="text-xs text-muted-foreground">All configurations</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Migration Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="migration" className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Migration
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Migration Status Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current System Distribution */}
                <div>
                  <h3 className="font-medium mb-3">System Distribution</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Legacy System</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500"
                            style={{ 
                              width: `${migrationStats.totalCount > 0 ? (migrationStats.legacyCount / migrationStats.totalCount) * 100 : 0}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {migrationStats.legacyCount}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Product System</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500"
                            style={{ 
                              width: `${migrationStats.totalCount > 0 ? (migrationStats.productCount / migrationStats.totalCount) * 100 : 0}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {migrationStats.productCount}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Unified System</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500"
                            style={{ 
                              width: `${migrationStats.totalCount > 0 ? (migrationStats.unifiedCount / migrationStats.totalCount) * 100 : 0}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {migrationStats.unifiedCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Migration Recommendations */}
                <div>
                  <h3 className="font-medium mb-3">Recommendations</h3>
                  <div className="space-y-2 text-sm">
                    {getMigrationStatus() === 'complete' ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        All configurations are migrated
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {migrationStats.legacyCount > 0 && (
                          <div className="flex items-center gap-2 text-orange-600">
                            <AlertTriangle className="h-4 w-4" />
                            {migrationStats.legacyCount} legacy configurations need migration
                          </div>
                        )}
                        {migrationStats.productCount > 0 && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <AlertTriangle className="h-4 w-4" />
                            {migrationStats.productCount} product configurations need migration
                          </div>
                        )}
                        <div className="pt-2">
                          <Button 
                            onClick={() => setActiveTab('migration')}
                            size="sm"
                          >
                            Start Migration
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Compatibility */}
          <Card>
            <CardHeader>
              <CardTitle>System Compatibility</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Legacy System</h4>
                  <div className="space-y-1 text-muted-foreground">
                    <p>✓ Full backward compatibility</p>
                    <p>✓ All existing features preserved</p>
                    <p>✓ No breaking changes</p>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Product System</h4>
                  <div className="space-y-1 text-muted-foreground">
                    <p>✓ Variant-based configuration</p>
                    <p>✓ Enhanced options support</p>
                    <p>✓ Integrated pricing</p>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Unified System</h4>
                  <div className="space-y-1 text-muted-foreground">
                    <p>✓ Templates and history</p>
                    <p>✓ Configuration comparison</p>
                    <p>✓ Migration tools</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migration" className="space-y-6">
          <ConfigurationMigration
            legacyConfigurations={savedConfigurations.legacy}
            productConfigurations={savedConfigurations.product}
            onMigrationComplete={handleMigrationComplete}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Migration Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Migration settings are controlled by feature flags. Contact your system administrator 
                  to enable or disable specific migration features.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Enable Configuration Migration</p>
                    <p className="text-sm text-muted-foreground">Allow migration between systems</p>
                  </div>
                  <Badge variant={isEnabled('enable_configuration_migration') ? 'default' : 'secondary'}>
                    {isEnabled('enable_configuration_migration') ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Use Unified Configurator</p>
                    <p className="text-sm text-muted-foreground">Enable the unified configuration interface</p>
                  </div>
                  <Badge variant={isEnabled('use_unified_configurator') ? 'default' : 'secondary'}>
                    {isEnabled('use_unified_configurator') ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Use Product Configurator</p>
                    <p className="text-sm text-muted-foreground">Enable product-based configuration</p>
                  </div>
                  <Badge variant={isEnabled('use_product_configurator') ? 'default' : 'secondary'}>
                    {isEnabled('use_product_configurator') ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}