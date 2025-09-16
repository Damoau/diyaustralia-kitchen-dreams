import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DataTable } from '@/components/admin/shared/DataTable';
import { StatusChip } from '@/components/admin/shared/StatusChip'; 
import { Bell, Mail, MessageSquare, Settings, Send, Users } from 'lucide-react';

const Notifications = () => {
  const mockNotifications = [
    {
      id: '1',
      title: 'Order Confirmation',
      message: 'Thank you for your order! We\'ll notify you when it\'s ready.',
      type: 'email',
      status: 'sent',
      recipients: 1,
      sent_at: '2024-01-15 14:30',
      template: 'order_confirmation',
    },
    {
      id: '2',
      title: 'Production Update',
      message: 'Your cabinet order is now in production.',
      type: 'sms',
      status: 'pending',
      recipients: 1,
      sent_at: null,
      template: 'production_update',
    },
    {
      id: '3',
      title: 'Weekly Newsletter',
      message: 'Kitchen Design Trends for 2024',
      type: 'email',
      status: 'sent',
      recipients: 1245,
      sent_at: '2024-01-14 09:00',
      template: 'newsletter',
    }
  ];

  const columns = [
    { key: 'title' as keyof typeof mockNotifications[0], label: 'Title' },
    { 
      key: 'type' as keyof typeof mockNotifications[0], 
      label: 'Type',
      render: (value: string) => {
        const colors = { email: 'default', sms: 'secondary', push: 'outline' };
        return <Badge variant={colors[value as keyof typeof colors] as any}>{value}</Badge>
      }
    },
    { 
      key: 'status' as keyof typeof mockNotifications[0], 
      label: 'Status',
      render: (value: string) => <StatusChip status={value} />
    },
    { 
      key: 'recipients' as keyof typeof mockNotifications[0], 
      label: 'Recipients',
      render: (value: number) => value.toLocaleString()
    },
    { 
      key: 'sent_at' as keyof typeof mockNotifications[0], 
      label: 'Sent At',
      render: (value: string | null) => value || '-'
    },
  ];

  const notificationSettings = [
    { label: 'Order Confirmations', description: 'Send confirmation emails for new orders', enabled: true },
    { label: 'Production Updates', description: 'Notify customers of production status changes', enabled: true },
    { label: 'Shipping Notifications', description: 'Send tracking information when orders ship', enabled: true },
    { label: 'Marketing Emails', description: 'Send promotional content and newsletters', enabled: false },
    { label: 'SMS Notifications', description: 'Send important updates via SMS', enabled: true },
    { label: 'Push Notifications', description: 'Send browser push notifications', enabled: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notification Management</h1>
          <p className="text-muted-foreground">Manage customer communications and notification preferences</p>
        </div>
        <Button>
          <Send className="mr-2 h-4 w-4" />
          Send Notification
        </Button>
      </div>
      
      {/* Notification Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent Today</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">+8% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Delivery</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.2%</div>
            <p className="text-xs text-muted-foreground">Success rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,456</div>
            <p className="text-xs text-muted-foreground">Active subscribers</p>
          </CardContent>
        </Card>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Notification Settings
          </CardTitle>
          <p className="text-sm text-muted-foreground">Configure automatic notification preferences</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationSettings.map((setting, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">{setting.label}</p>
                <p className="text-sm text-muted-foreground">{setting.description}</p>
              </div>
              <Switch checked={setting.enabled} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Notifications</h2>
        <DataTable
          data={mockNotifications}
          columns={columns}
          selectable
          emptyState={<div>No notifications found</div>}
        />
      </div>
    </div>
  );
};

export default Notifications;