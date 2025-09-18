import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Clock, Ban } from 'lucide-react';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { useToast } from '@/hooks/use-toast';

export const SecurityDashboardPanel = () => {
  const { metrics, isLoading, refreshMetrics, blockIP } = useSecurityMonitoring();
  const { toast } = useToast();

  const handleBlockIP = async (ipAddress: string) => {
    try {
      await blockIP(ipAddress, 'Suspicious activity detected');
      toast({
        title: "IP Blocked",
        description: `IP address ${ipAddress} has been blocked successfully.`,
      });
      await refreshMetrics();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to block IP address.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEvents}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.failedLogins}</div>
            <p className="text-xs text-muted-foreground">Authentication failures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Suspicious IPs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.suspiciousIPs.length}</div>
            <p className="text-xs text-muted-foreground">High activity addresses</p>
          </CardContent>
        </Card>
      </div>

      {/* Suspicious IPs Alert */}
      {metrics.suspiciousIPs.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {metrics.suspiciousIPs.length} suspicious IP address(es) detected with high activity.
          </AlertDescription>
        </Alert>
      )}

      {/* Suspicious IPs List */}
      {metrics.suspiciousIPs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Suspicious IP Addresses
            </CardTitle>
            <CardDescription>
              IP addresses with unusually high activity that may require attention.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.suspiciousIPs.map((ip) => (
                <div key={ip} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="destructive">{ip}</Badge>
                    <span className="text-sm text-muted-foreground">High activity detected</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBlockIP(ip)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Block IP
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Security Events
          </CardTitle>
          <CardDescription>
            Latest security-related activities and events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {metrics.recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No recent security events found.
              </p>
            ) : (
              metrics.recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={event.table_name === 'auth_failed' ? 'destructive' : 'secondary'}>
                        {event.table_name}
                      </Badge>
                      <span className="text-sm font-medium">{event.action}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{new Date(event.created_at).toLocaleString()}</span>
                      {event.ip_address && <span>IP: {event.ip_address}</span>}
                      {event.actor_id && <span>User: {event.actor_id.substring(0, 8)}...</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={refreshMetrics} variant="outline">
          Refresh Data
        </Button>
      </div>
    </div>
  );
};