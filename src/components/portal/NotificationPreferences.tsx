import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  order_updates: boolean;
  quote_updates: boolean;
  payment_reminders: boolean;
  marketing_emails: boolean;
  digest_frequency: string;
}

export const NotificationPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_enabled: true,
    sms_enabled: false,
    order_updates: true,
    quote_updates: true,
    payment_reminders: true,
    marketing_emails: false,
    digest_frequency: 'weekly'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences(data);
      }
    } catch (error: any) {
      console.error('Error loading preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification preferences',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Notification preferences updated successfully',
      });
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notification preferences',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean | string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="p-4">Loading preferences...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Manage how and when you receive email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Email notifications</p>
              <p className="text-sm text-muted-foreground">
                Enable or disable all email notifications
              </p>
            </div>
            <Switch
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => updatePreference('email_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Order updates</p>
              <p className="text-sm text-muted-foreground">
                Notifications about order status changes and shipping updates
              </p>
            </div>
            <Switch
              checked={preferences.order_updates}
              onCheckedChange={(checked) => updatePreference('order_updates', checked)}
              disabled={!preferences.email_enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Quote updates</p>
              <p className="text-sm text-muted-foreground">
                Notifications when quotes are updated or require approval
              </p>
            </div>
            <Switch
              checked={preferences.quote_updates}
              onCheckedChange={(checked) => updatePreference('quote_updates', checked)}
              disabled={!preferences.email_enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Payment reminders</p>
              <p className="text-sm text-muted-foreground">
                Reminders for upcoming and overdue payments
              </p>
            </div>
            <Switch
              checked={preferences.payment_reminders}
              onCheckedChange={(checked) => updatePreference('payment_reminders', checked)}
              disabled={!preferences.email_enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Marketing emails</p>
              <p className="text-sm text-muted-foreground">
                Promotional emails about new products and offers
              </p>
            </div>
            <Switch
              checked={preferences.marketing_emails}
              onCheckedChange={(checked) => updatePreference('marketing_emails', checked)}
              disabled={!preferences.email_enabled}
            />
          </div>

          <div className="space-y-2">
            <p className="font-medium">Email digest frequency</p>
            <p className="text-sm text-muted-foreground">
              How often to receive summary emails
            </p>
            <Select
              value={preferences.digest_frequency}
              onValueChange={(value) => updatePreference('digest_frequency', value)}
              disabled={!preferences.email_enabled}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SMS Notifications</CardTitle>
          <CardDescription>
            Receive urgent notifications via SMS (coming soon)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">SMS notifications</p>
              <p className="text-sm text-muted-foreground">
                Urgent order and payment notifications via SMS
              </p>
            </div>
            <Switch
              checked={preferences.sms_enabled}
              onCheckedChange={(checked) => updatePreference('sms_enabled', checked)}
              disabled={true} // Disabled for now
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
};