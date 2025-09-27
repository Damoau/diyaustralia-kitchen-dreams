import React, { useState, useEffect } from 'react';
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Activity, 
  Users, 
  MousePointer, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Calendar,
  Download,
  Play,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export default function UserBehaviorAnalytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);

  // Fetch simulation reports
  const { data: simulationReports, isLoading: reportsLoading, refetch: refetchReports } = useQuery({
    queryKey: ['simulation-reports', selectedTimeframe],
    queryFn: async () => {
      const daysBack = selectedTimeframe === '24h' ? 1 : selectedTimeframe === '7d' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data, error } = await supabase
        .from('simulation_reports')
        .select('*')
        .gte('report_date', startDate.toISOString().split('T')[0])
        .order('report_date', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Fetch user sessions
  const { data: userSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['user-sessions', selectedTimeframe],
    queryFn: async () => {
      const daysBack = selectedTimeframe === '24h' ? 1 : selectedTimeframe === '7d' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          *,
          user_interactions (count)
        `)
        .gte('started_at', startDate.toISOString())
        .order('started_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    }
  });

  // Fetch user interactions
  const { data: recentInteractions, isLoading: interactionsLoading } = useQuery({
    queryKey: ['user-interactions', selectedTimeframe],
    queryFn: async () => {
      const hoursBack = selectedTimeframe === '24h' ? 24 : selectedTimeframe === '7d' ? 168 : 720;
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - hoursBack);

      const { data, error } = await supabase
        .from('user_interactions')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data;
    }
  });

  // Run daily simulation
  const runDailySimulation = async () => {
    setIsRunningSimulation(true);
    try {
      const { data, error } = await supabase.functions.invoke('daily-simulation-runner');
      
      if (error) throw error;
      
      toast.success(`Simulation completed! Pass rate: ${data.report.passRate}%`);
      refetchReports();
    } catch (error) {
      console.error('Simulation error:', error);
      toast.error('Failed to run simulation');
    } finally {
      setIsRunningSimulation(false);
    }
  };

  // Calculate summary stats
  const summaryStats = {
    totalSessions: userSessions?.length || 0,
    totalInteractions: recentInteractions?.length || 0,
    averageSessionDuration: userSessions?.reduce((sum, s) => sum + (s.session_duration_ms || 0), 0) / (userSessions?.length || 1) / 1000 / 60,
    latestSimulationPassRate: simulationReports?.[0]?.pass_rate || 0
  };

  // Analyze interaction patterns
  const interactionPatterns = recentInteractions?.reduce((acc, interaction) => {
    acc[interaction.action_type] = (acc[interaction.action_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              User Behavior Analytics
            </h1>
            <p className="text-muted-foreground text-lg mt-2">
              Real-time user action tracking and automated system testing
            </p>
          </div>
          <div className="flex gap-4">
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={runDailySimulation} 
              disabled={isRunningSimulation}
              size="lg"
            >
              {isRunningSimulation ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Simulation
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                Active sessions tracked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Actions</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.totalInteractions}</div>
              <p className="text-xs text-muted-foreground">
                Interactions recorded
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(summaryStats.averageSessionDuration)}m
              </div>
              <p className="text-xs text-muted-foreground">
                Average duration
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(summaryStats.latestSimulationPassRate)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Latest simulation pass rate
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="simulation-reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="simulation-reports">Simulation Reports</TabsTrigger>
            <TabsTrigger value="user-sessions">User Sessions</TabsTrigger>
            <TabsTrigger value="interactions">Live Interactions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="simulation-reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Daily Simulation Reports
                </CardTitle>
                <CardDescription>
                  Automated testing results including 1000+ cart simulations and user behavior replays
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="text-center py-8">Loading reports...</div>
                ) : simulationReports?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No simulation reports found. Run your first simulation to see results.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {simulationReports?.map((report) => (
                      <div key={report.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">
                              {format(new Date(report.report_date), 'MMMM d, yyyy')}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {report.total_simulations} total simulations completed
                            </p>
                          </div>
                          <Badge 
                            variant={report.pass_rate >= 95 ? "default" : report.pass_rate >= 85 ? "secondary" : "destructive"}
                          >
                            {report.pass_rate}% Pass Rate
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>{report.passed_simulations} Passed</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span>{report.failed_simulations} Failed</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span>{report.average_duration_ms}ms Avg</span>
                          </div>
                        </div>

                        {report.failure_patterns && Array.isArray(report.failure_patterns) && report.failure_patterns.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">Top Failure Patterns:</h4>
                            <div className="space-y-1">
                              {(report.failure_patterns as any[]).slice(0, 3).map((pattern: any, idx: number) => (
                                <div key={idx} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                                  {pattern.pattern}: {pattern.count} failures
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user-sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Sessions
                </CardTitle>
                <CardDescription>
                  Real user sessions being tracked for behavior analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionsLoading ? (
                  <div className="text-center py-8">Loading sessions...</div>
                ) : (
                  <div className="space-y-3">
                    {userSessions?.map((session) => (
                      <div key={session.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Session {session.session_id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">
                              {session.user_id ? 'Authenticated User' : 'Anonymous'} • {session.device_type}
                            </p>
                          </div>
                          <div className="text-right text-sm">
                            <p>{format(new Date(session.started_at), 'MMM d, HH:mm')}</p>
                            {session.session_duration_ms && (
                              <p className="text-muted-foreground">
                                {Math.round(session.session_duration_ms / 1000 / 60)}m duration
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-4 text-xs">
                          <span>{session.pages_visited?.length || 0} pages</span>
                          <span>{session.total_actions || 0} actions</span>
                        </div>

                        {session.pages_visited && session.pages_visited.length > 0 && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Pages: </span>
                            {session.pages_visited.slice(0, 3).join(' → ')}
                            {session.pages_visited.length > 3 && '...'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Live User Interactions
                </CardTitle>
                <CardDescription>
                  Real-time stream of user actions being recorded
                </CardDescription>
              </CardHeader>
              <CardContent>
                {interactionsLoading ? (
                  <div className="text-center py-8">Loading interactions...</div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {recentInteractions?.map((interaction) => (
                      <div key={interaction.id} className="flex justify-between items-center text-sm border-b pb-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            {interaction.action_type}
                          </Badge>
                          <span className="font-medium">{interaction.target_element}</span>
                          <span className="text-muted-foreground">{interaction.page_url}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(interaction.timestamp), 'HH:mm:ss')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Action Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(interactionPatterns)
                      .sort(([,a], [,b]) => b - a)
                      .map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center">
                          <span className="capitalize">{type.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-muted rounded-full h-2">
                              <div 
                                className="h-2 bg-primary rounded-full" 
                                style={{ 
                                  width: `${(count / Math.max(...Object.values(interactionPatterns))) * 100}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8">{count}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {simulationReports?.slice(0, 7).reverse().map((report) => (
                      <div key={report.id} className="flex justify-between items-center">
                        <span className="text-sm">
                          {format(new Date(report.report_date), 'MMM d')}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                report.pass_rate >= 95 ? 'bg-green-600' :
                                report.pass_rate >= 85 ? 'bg-yellow-600' : 'bg-red-600'
                              }`}
                              style={{ width: `${report.pass_rate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12">{report.pass_rate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}