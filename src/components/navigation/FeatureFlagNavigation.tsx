import React from 'react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Settings,
  TestTube,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';

interface FeatureNavItem {
  flagKey: string;
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
  beta?: boolean;
  experimental?: boolean;
}

const featureNavItems: FeatureNavItem[] = [
  {
    flagKey: 'unified_configurator',
    title: 'Unified Configurator',
    description: 'New streamlined product configuration experience',
    path: '/shop?configurator=unified',
    icon: Settings,
    beta: true
  },
  {
    flagKey: 'configuration_migration',
    title: 'Configuration Migration',
    description: 'Migrate and analyze cabinet configurations',
    path: '/admin/configuration-migration',
    icon: ArrowRight,
    experimental: true
  },
  {
    flagKey: 'enhanced_analytics',
    title: 'Enhanced Analytics',
    description: 'Advanced reporting and insights dashboard',
    path: '/admin/reports?enhanced=true',
    icon: TestTube,
    beta: true
  },
  {
    flagKey: 'mobile_app_integration',
    title: 'Mobile App Features',
    description: 'Mobile-optimized features and capabilities',
    path: '/portal?mobile=true',
    icon: Zap,
    experimental: true
  }
];

export const FeatureFlagNavigation = () => {
  const { isEnabled, loading } = useFeatureFlags();
  const navigate = useNavigate();

  if (loading) return null;

  // Filter items that are enabled
  const enabledFeatures = featureNavItems.filter(item => isEnabled(item.flagKey));
  const disabledFeatures = featureNavItems.filter(item => !isEnabled(item.flagKey));

  if (enabledFeatures.length === 0 && disabledFeatures.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Enabled Features */}
      {enabledFeatures.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-primary" />
              <span>Beta Features Available</span>
            </CardTitle>
            <CardDescription>
              New features currently enabled for testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enabledFeatures.map((item) => (
                <Button
                  key={item.flagKey}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start space-y-2 hover:bg-primary/10 border-primary/30"
                  onClick={() => navigate(item.path)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      <item.icon className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">{item.title}</span>
                    </div>
                    <div className="flex space-x-1">
                      {item.beta && (
                        <Badge variant="default" className="text-xs">
                          Beta
                        </Badge>
                      )}
                      {item.experimental && (
                        <Badge variant="secondary" className="text-xs">
                          Experimental
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    {item.description}
                  </p>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disabled Features (for admins only) */}
      {disabledFeatures.length > 0 && (
        <Card className="border-muted bg-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <EyeOff className="w-5 h-5 text-muted-foreground" />
              <span>Upcoming Features</span>
            </CardTitle>
            <CardDescription>
              Features in development (not yet available)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {disabledFeatures.map((item) => (
                <div
                  key={item.flagKey}
                  className="p-4 border border-dashed border-muted-foreground/30 rounded-lg opacity-60"
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="flex items-center space-x-2">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm text-muted-foreground">{item.title}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Coming Soon
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};