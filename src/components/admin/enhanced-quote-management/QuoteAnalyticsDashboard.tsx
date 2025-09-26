import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, TrendingUp, TrendingDown, DollarSign, FileText, Users, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuoteAnalytics {
  totalQuotes: number;
  pendingQuotes: number;
  acceptedQuotes: number;
  rejectedQuotes: number;
  totalValue: number;
  averageValue: number;
  conversionRate: number;
  timeToAcceptance: number;
  monthlyData: Array<{
    month: string;
    quotes: number;
    value: number;
    accepted: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
    value: number;
  }>;
  topSources: Array<{
    source: string;
    count: number;
    value: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const QuoteAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<QuoteAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      // Fetch quotes data
      const { data: quotes, error } = await supabase
        .from('quotes')
        .select(`
          *,
          customer:customer_id(email, full_name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate analytics
      const totalQuotes = quotes?.length || 0;
      const pendingQuotes = quotes?.filter(q => q.status === 'pending').length || 0;
      const acceptedQuotes = quotes?.filter(q => q.status === 'accepted').length || 0;
      const rejectedQuotes = quotes?.filter(q => q.status === 'rejected').length || 0;
      
      const totalValue = quotes?.reduce((sum, q) => sum + (q.total_amount || 0), 0) || 0;
      const averageValue = totalQuotes > 0 ? totalValue / totalQuotes : 0;
      const conversionRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;

      // Calculate average time to acceptance
      const acceptedQuotesWithTime = quotes?.filter(q => 
        q.status === 'accepted' && q.updated_at && q.created_at
      ) || [];
      
      const timeToAcceptance = acceptedQuotesWithTime.length > 0 
        ? acceptedQuotesWithTime.reduce((sum, q) => {
            const created = new Date(q.created_at);
            const updated = new Date(q.updated_at);
            return sum + (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
          }, 0) / acceptedQuotesWithTime.length
        : 0;

      // Group by month for trend data
      const monthlyData = quotes?.reduce((acc: any[], quote) => {
        const month = new Date(quote.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const existing = acc.find(item => item.month === month);
        
        if (existing) {
          existing.quotes += 1;
          existing.value += quote.total_amount || 0;
          if (quote.status === 'accepted') existing.accepted += 1;
        } else {
          acc.push({
            month,
            quotes: 1,
            value: quote.total_amount || 0,
            accepted: quote.status === 'accepted' ? 1 : 0
          });
        }
        
        return acc;
      }, []) || [];

      // Status breakdown
      const statusBreakdown = [
        { status: 'Pending', count: pendingQuotes, value: quotes?.filter(q => q.status === 'pending').reduce((sum, q) => sum + (q.total_amount || 0), 0) || 0 },
        { status: 'Accepted', count: acceptedQuotes, value: quotes?.filter(q => q.status === 'accepted').reduce((sum, q) => sum + (q.total_amount || 0), 0) || 0 },
        { status: 'Rejected', count: rejectedQuotes, value: quotes?.filter(q => q.status === 'rejected').reduce((sum, q) => sum + (q.total_amount || 0), 0) || 0 },
      ];

      // Top sources (placeholder - would need to track source in quotes table)
      const topSources = [
        { source: 'Website', count: Math.floor(totalQuotes * 0.6), value: totalValue * 0.6 },
        { source: 'Referral', count: Math.floor(totalQuotes * 0.3), value: totalValue * 0.3 },
        { source: 'Admin Created', count: Math.floor(totalQuotes * 0.1), value: totalValue * 0.1 },
      ];

      setAnalytics({
        totalQuotes,
        pendingQuotes,
        acceptedQuotes,
        rejectedQuotes,
        totalValue,
        averageValue,
        conversionRate,
        timeToAcceptance,
        monthlyData: monthlyData.slice(-6), // Last 6 months
        statusBreakdown,
        topSources
      });

    } catch (error) {
      console.error('Error loading quote analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load quote analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="p-6">No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quote Analytics Dashboard</h2>
        <div className="flex gap-2">
          <Button
            variant={dateRange === '7' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('7')}
          >
            7 Days
          </Button>
          <Button
            variant={dateRange === '30' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('30')}
          >
            30 Days
          </Button>
          <Button
            variant={dateRange === '90' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('90')}
          >
            90 Days
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalQuotes}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.pendingQuotes} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>  
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg: ${analytics.averageValue.toFixed(0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.acceptedQuotes} accepted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.timeToAcceptance.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="status">Status Breakdown</TabsTrigger>
          <TabsTrigger value="sources">Quote Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quote Volume & Value Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analytics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="quotes" fill="#8884d8" name="Quote Count" />
                  <Line yAxisId="right" type="monotone" dataKey="value" stroke="#82ca9d" name="Total Value ($)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Quote Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.statusBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.statusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Value by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.statusBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Value']} />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quote Sources Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topSources.map((source, index) => (
                  <div key={source.source} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium">{source.source}</p>
                        <p className="text-sm text-muted-foreground">{source.count} quotes</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${source.value.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        ${(source.value / source.count).toFixed(0)} avg
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};