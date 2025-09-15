import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useAdminSettings } from '@/hooks/useAdminSettings';

const AUTH_METHOD_LABELS = {
  password: 'Password Login',
  magic_link: 'Magic Link (Email)',
  otp_email: 'OTP via Email',
  otp_sms: 'OTP via SMS',
  social_google: 'Google OAuth',
  social_apple: 'Apple OAuth',
};

export const AdminIdentitySettings = () => {
  const { settings, isLoading, updateSetting } = useAdminSettings();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Failed to load settings</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Checkout Identity Settings</CardTitle>
          <CardDescription>
            Configure how customers can identify themselves during checkout
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Guest Checkout */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allow_guest_checkout">Allow Guest Checkout</Label>
              <p className="text-sm text-muted-foreground">
                Allow customers to checkout without creating an account
              </p>
            </div>
            <Switch
              id="allow_guest_checkout"
              checked={settings.allow_guest_checkout}
              onCheckedChange={(checked) => updateSetting('allow_guest_checkout', checked)}
            />
          </div>

          {/* Guest with Existing Email */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allow_guest_with_existing_email">Guest with Existing Email</Label>
              <p className="text-sm text-muted-foreground">
                Allow guest checkout even when email already has an account
              </p>
            </div>
            <Switch
              id="allow_guest_with_existing_email"
              checked={settings.allow_guest_with_existing_email}
              onCheckedChange={(checked) => updateSetting('allow_guest_with_existing_email', checked)}
            />
          </div>

          {/* Require Phone */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="require_phone_number">Require Phone Number</Label>
              <p className="text-sm text-muted-foreground">
                Make phone number mandatory during checkout
              </p>
            </div>
            <Switch
              id="require_phone_number"
              checked={settings.require_phone_number}
              onCheckedChange={(checked) => updateSetting('require_phone_number', checked)}
            />
          </div>

          {/* Marketing Opt-in Default */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing_opt_in_default">Marketing Opt-in Default</Label>
              <p className="text-sm text-muted-foreground">
                Default state of marketing consent checkbox
              </p>
            </div>
            <Switch
              id="marketing_opt_in_default"
              checked={settings.marketing_opt_in_default}
              onCheckedChange={(checked) => updateSetting('marketing_opt_in_default', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Authentication Methods</CardTitle>
          <CardDescription>
            Select which authentication methods are available to customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(AUTH_METHOD_LABELS).map(([method, label]) => (
              <div key={method} className="flex items-center space-x-3">
                <Checkbox
                  id={method}
                  checked={settings.auth_methods?.includes(method) || false}
                  onCheckedChange={(checked) => {
                    const currentMethods = settings.auth_methods || [];
                    let newMethods;
                    
                    if (checked) {
                      newMethods = [...currentMethods, method];
                    } else {
                      newMethods = currentMethods.filter(m => m !== method);
                    }
                    
                    updateSetting('auth_methods', newMethods);
                  }}
                />
                <Label htmlFor={method} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {label}
                </Label>
                {['social_google', 'social_apple', 'otp_sms'].includes(method) && (
                  <Badge variant="secondary">Optional</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};