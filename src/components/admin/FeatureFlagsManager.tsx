import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  description?: string;
  is_enabled: boolean;
  environment: string;
  config: Record<string, any>;
}

export const FeatureFlagsManager = () => {
  const { toast } = useToast();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFeatureFlags();
  }, []);

  const loadFeatureFlags = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('flag_key');

      if (error) throw error;
      setFlags(data?.map(flag => ({
        ...flag,
        config: flag.config as Record<string, any> || {}
      })) || []);
      setChanges(new Set());
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load feature flags.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (flagId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
        .eq('id', flagId);

      if (error) throw error;

      setFlags(prev => prev.map(flag => 
        flag.id === flagId ? { ...flag, is_enabled: enabled } : flag
      ));

      const flag = flags.find(f => f.id === flagId);
      toast({
        title: 'Feature Flag Updated',
        description: `${flag?.flag_name} is now ${enabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update feature flag.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (enabled: boolean) => {
    return (
      <Badge variant={enabled ? 'default' : 'secondary'}>
        {enabled ? 'Enabled' : 'Disabled'}
      </Badge>
    );
  };

  const getCategoryColor = (flagKey: string) => {
    if (flagKey.startsWith('payments.')) return 'border-l-green-500';
    if (flagKey.startsWith('accounting.')) return 'border-l-blue-500';
    if (flagKey.startsWith('freight.')) return 'border-l-orange-500';
    if (flagKey.startsWith('notify.')) return 'border-l-purple-500';
    return 'border-l-gray-500';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Feature Flags</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadFeatureFlags}
            disabled={loading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Feature flags control which integrations and features are active in your application.
          Changes take effect immediately.
        </div>
        
        <div className="space-y-4">
          {flags.map((flag) => (
            <div
              key={flag.id}
              className={`p-4 border-l-4 bg-card rounded-lg ${getCategoryColor(flag.flag_key)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{flag.flag_name}</h4>
                    {getStatusBadge(flag.is_enabled)}
                  </div>
                  {flag.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {flag.description}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Key: <code className="bg-muted px-1 rounded">{flag.flag_key}</code>
                    {flag.environment !== 'production' && (
                      <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                        {flag.environment}
                      </span>
                    )}
                  </div>
                </div>
                
                <Switch
                  checked={flag.is_enabled}
                  onCheckedChange={(checked) => toggleFlag(flag.id, checked)}
                />
              </div>
            </div>
          ))}
        </div>

        {flags.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No feature flags found.
          </div>
        )}

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2">Integration Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">PayPal:</span>{' '}
              {flags.find(f => f.flag_key === 'payments.paypal')?.is_enabled ? '✅' : '❌'}
            </div>
            <div>
              <span className="font-medium">Xero:</span>{' '}
              {flags.find(f => f.flag_key === 'accounting.xero')?.is_enabled ? '✅' : '❌'}
            </div>
            <div>
              <span className="font-medium">Email:</span>{' '}
              {flags.find(f => f.flag_key === 'notify.email')?.is_enabled ? '✅' : '❌'}
            </div>
            <div>
              <span className="font-medium">Freight:</span>{' '}
              {(flags.find(f => f.flag_key === 'freight.bigpost')?.is_enabled || 
                flags.find(f => f.flag_key === 'freight.transdirect')?.is_enabled) ? '✅' : '❌'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};