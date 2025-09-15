import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalytics } from '@/hooks/useAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export const AnalyticsDashboard = () => {
  const { getEvents } = useAnalytics();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const storedEvents = getEvents();
    setEvents(storedEvents);
  }, [getEvents]);

  // 6.8 Telemetry & Analytics - Process events for KPI calculations
  const processEvents = () => {
    const checkoutEvents = events.filter(e => 
      ['CheckoutStarted', 'IdentifyViewed', 'IdentifyCompleted', 'IdentifyFailed'].includes(e.event)
    );

    const funnelData = {
      started: checkoutEvents.filter(e => e.event === 'CheckoutStarted').length,
      identify_viewed: checkoutEvents.filter(e => e.event === 'IdentifyViewed').length,
      identify_completed: checkoutEvents.filter(e => e.event === 'IdentifyCompleted').length,
      identify_failed: checkoutEvents.filter(e => e.event === 'IdentifyFailed').length,
    };

    const guestVsLogin = checkoutEvents
      .filter(e => e.event === 'IdentifyCompleted')
      .reduce((acc, e) => {
        const mode = e.properties?.mode || 'unknown';
        acc[mode] = (acc[mode] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const failureReasons = checkoutEvents
      .filter(e => e.event === 'IdentifyFailed')
      .reduce((acc, e) => {
        const reason = e.properties?.reason || 'unknown';
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return { funnelData, guestVsLogin, failureReasons };
  };

  const { funnelData, guestVsLogin, failureReasons } = processEvents();

  const conversionRate = funnelData.started > 0 
    ? ((funnelData.identify_completed / funnelData.started) * 100).toFixed(1)
    : '0';

  const failureRate = (funnelData.identify_viewed > 0)
    ? ((funnelData.identify_failed / funnelData.identify_viewed) * 100).toFixed(1)
    : '0';

  const chartData = [
    { name: 'Started', value: funnelData.started },
    { name: 'Viewed Identity', value: funnelData.identify_viewed },
    { name: 'Completed', value: funnelData.identify_completed },
    { name: 'Failed', value: funnelData.identify_failed },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
        <p className="text-muted-foreground">
          6.8 Telemetry & Analytics - Checkout funnel and identity metrics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checkout Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funnelData.started}</div>
            <p className="text-xs text-muted-foreground">Total checkouts initiated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Started → Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failure Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failureRate}%</div>
            <p className="text-xs text-muted-foreground">Login failures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">All tracked events</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funnel">Checkout Funnel</TabsTrigger>
          <TabsTrigger value="methods">Auth Methods</TabsTrigger>
          <TabsTrigger value="failures">Failure Analysis</TabsTrigger>
          <TabsTrigger value="events">Event Log</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Checkout Funnel</CardTitle>
              <CardDescription>
                Identify → Shipping completion rate analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guest vs Login Ratio</CardTitle>
              <CardDescription>
                How customers choose to identify themselves
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(guestVsLogin).map(([method, count]) => (
                  <div key={method} className="flex items-center justify-between">
                    <span className="font-medium capitalize">{method}</span>
                    <Badge variant="secondary">{String(count)}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Failure Reasons</CardTitle>
              <CardDescription>
                Analysis of identity verification failures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(failureReasons).map(([reason, count]) => (
                  <div key={reason} className="flex items-center justify-between">
                    <span className="font-medium">{reason}</span>
                    <Badge variant="destructive">{String(count)}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>
                Latest analytics events (stored locally)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Properties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.slice(-10).reverse().map((event, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant="outline">{event.event}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(event.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {typeof event.properties === 'object' 
                            ? JSON.stringify(event.properties).slice(0, 100) + '...'
                            : String(event.properties || '').slice(0, 100)
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};