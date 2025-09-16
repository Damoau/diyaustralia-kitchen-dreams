import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Settings as SettingsIcon, 
  Building, 
  Globe, 
  Mail, 
  Phone, 
  DollarSign,
  Shield,
  Bell,
  Palette,
  Database
} from 'lucide-react';

const Settings = () => {
  const settingsSections = [
    {
      icon: Building,
      title: 'Company Information',
      description: 'Update your business details and contact information'
    },
    {
      icon: Globe,
      title: 'Website Settings',
      description: 'Configure website appearance and functionality'
    },
    {
      icon: Mail,
      title: 'Email Configuration',
      description: 'Set up email templates and SMTP settings'
    },
    {
      icon: DollarSign,
      title: 'Payment Settings',
      description: 'Configure payment methods and pricing rules'
    },
    {
      icon: Shield,
      title: 'Security Settings',
      description: 'Manage authentication and security policies'
    },
    {
      icon: Bell,
      title: 'Notification Preferences',
      description: 'Configure system alerts and user notifications'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">Manage application configuration and preferences</p>
      </div>
      
      {/* Quick Settings Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {settingsSections.map((section, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <section.icon className="mr-2 h-5 w-5" />
                {section.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm">Configure</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Company Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="mr-2 h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="company-name">Company Name</Label>
              <Input id="company-name" placeholder="DIY Australia" />
            </div>
            <div>
              <Label htmlFor="abn">ABN</Label>
              <Input id="abn" placeholder="12 345 678 901" />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Business Address</Label>
            <Textarea id="address" placeholder="123 Business Street, Melbourne VIC 3000" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="1300 DIY AUS" />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" placeholder="info@diyaustralia.com" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <SettingsIcon className="mr-2 h-5 w-5" />
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-muted-foreground">Enable to restrict access during updates</p>
            </div>
            <Switch />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New User Registration</p>
              <p className="text-sm text-muted-foreground">Allow new customers to create accounts</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Order Approval Required</p>
              <p className="text-sm text-muted-foreground">Require admin approval for new orders</p>
            </div>
            <Switch />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Inventory Tracking</p>
              <p className="text-sm text-muted-foreground">Track stock levels and low inventory alerts</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Pricing Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Pricing Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="default-markup">Default Markup %</Label>
              <Input id="default-markup" placeholder="25" type="number" />
            </div>
            <div>
              <Label htmlFor="tax-rate">Tax Rate %</Label>
              <Input id="tax-rate" placeholder="10" type="number" />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" placeholder="AUD" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show Prices Including Tax</p>
              <p className="text-sm text-muted-foreground">Display prices with GST included</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="backup-frequency">Backup Frequency</Label>
              <Input id="backup-frequency" placeholder="Daily" />
            </div>
            <div>
              <Label htmlFor="data-retention">Data Retention (days)</Label>
              <Input id="data-retention" placeholder="2555" type="number" />
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">Backup Now</Button>
            <Button variant="outline">Export Data</Button>
            <Button variant="destructive">Clear Cache</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button variant="outline">Reset to Defaults</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  );
};

export default Settings;