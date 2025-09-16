import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAdminSecurity } from '@/hooks/useAdminSecurity';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useAuth } from '@/hooks/useAuth';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Users, 
  Clock, 
  MapPin, 
  Smartphone,
  Key,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SecurityDashboard = () => {
  const { user } = useAuth();
  const { sessions, alerts, loading, revokeSession, revokeAllSessions, refreshData } = useAdminSecurity();
  const { getAuditLogs } = useAuditLog();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    const { data } = await getAuditLogs({ limit: 50 });
    if (data) {
      setAuditLogs(data);
    }
    setAuditLoading(false);
  };

  React.useEffect(() => {
    loadAuditLogs();
  }, []);

  const activeSessions = sessions.filter(s => new Date(s.expires_at) > new Date());
  const highAlerts = alerts.filter(a => a.severity === 'high' && !a.resolved);
  const mediumAlerts = alerts.filter(a => a.severity === 'medium' && !a.resolved);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Security Status</p>
                <p className="text-2xl font-bold text-green-600">Secure</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold">{activeSessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Security Alerts</p>
                <p className="text-2xl font-bold">{highAlerts.length + mediumAlerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Admin Users</p>
                <p className="text-2xl font-bold">
                  {new Set(sessions.map(s => s.user_id)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      {(highAlerts.length > 0 || mediumAlerts.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span>Security Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...highAlerts, ...mediumAlerts].map((alert) => (
                <div 
                  key={alert.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={alert.severity === 'high' ? 'destructive' : 'secondary'}
                    >
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <span>{alert.message}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="sessions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="mfa">Multi-Factor Auth</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Admin Sessions</CardTitle>
                  <CardDescription>
                    Monitor and manage active administrative sessions
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={refreshData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => revokeAllSessions()}
                  >
                    Revoke All Sessions
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeSessions.map((session) => (
                  <div 
                    key={session.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant={session.user_id === user?.id ? 'default' : 'secondary'}>
                          {session.user_id === user?.id ? 'Current Session' : 'Other Session'}
                        </Badge>
                        {session.two_fa_verified && (
                          <Badge variant="outline" className="text-green-600">
                            <Shield className="h-3 w-3 mr-1" />
                            2FA Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{session.ip_address || 'Unknown IP'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            Last active: {session.last_active_at 
                              ? formatDistanceToNow(new Date(session.last_active_at), { addSuffix: true })
                              : 'Unknown'
                            }
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-md">
                        {session.user_agent}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeSession(session.id)}
                      disabled={session.user_id === user?.id}
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
                {activeSessions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No active sessions found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Audit Logs</CardTitle>
                  <CardDescription>
                    Recent administrative activities and system events
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadAuditLogs}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div 
                      key={log.id}
                      className="flex items-start justify-between p-3 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{log.action}</Badge>
                          <span className="font-medium">{log.scope}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Actor: {log.actor_id || 'System'}
                        </p>
                        {log.ip_address && (
                          <p className="text-xs text-muted-foreground">
                            IP: {log.ip_address}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                  {auditLogs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No audit logs found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mfa">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Factor Authentication</CardTitle>
              <CardDescription>
                Enhance your account security with two-factor authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Use an authenticator app to generate verification codes
                  </p>
                </div>
                <Switch 
                  checked={mfaEnabled}
                  onCheckedChange={setMfaEnabled}
                />
              </div>

              {mfaEnabled && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4" />
                    <span className="font-medium">Setup Instructions</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                    <li>Scan the QR code below with your authenticator app</li>
                    <li>Enter the 6-digit verification code to complete setup</li>
                  </ol>
                  <div className="bg-white p-4 rounded-lg border text-center">
                    <div className="w-32 h-32 mx-auto bg-gray-200 rounded border-2 border-dashed flex items-center justify-center">
                      QR Code Placeholder
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Verification Code</Label>
                    <Input 
                      placeholder="Enter 6-digit code"
                      className="w-full max-w-sm"
                    />
                    <Button>Verify and Enable</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security policies and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require 2FA for Admin Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Force all admin users to enable two-factor authentication
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-logout Inactive Sessions</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically revoke sessions after 8 hours of inactivity
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>IP Address Restrictions</Label>
                    <p className="text-sm text-muted-foreground">
                      Restrict admin access to specific IP addresses
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="space-y-2">
                  <Label>Session Timeout (hours)</Label>
                  <Input 
                    type="number" 
                    defaultValue="8"
                    className="w-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Failed Login Attempts Limit</Label>
                  <Input 
                    type="number" 
                    defaultValue="5"
                    className="w-24"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button>Save Security Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;