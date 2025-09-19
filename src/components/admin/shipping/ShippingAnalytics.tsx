import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useShipping } from '@/hooks/useShipping';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Package, 
  AlertTriangle,
  Truck,
  MapPin 
} from 'lucide-react';

interface ShippingMetrics {
  totalShipments: number;
  totalRevenue: number;
  avgDeliveryTime: number;
  onTimeDeliveryRate: number;
  exceptionsCount: number;
  costPerShipment: number;
  carrierPerformance: Array<{
    carrier: string;
    shipments: number;
    onTimeRate: number;
    avgCost: number;
  }>;
  zonePerformance: Array<{
    zone: string;
    shipments: number;
    avgDeliveryTime: number;
  }>;
}

const ShippingAnalytics = () => {
  const { toast } = useToast();
  const { getShippingStats, getExceptions, loading } = useShipping();
  
  const [metrics, setMetrics] = useState<ShippingMetrics>({
    totalShipments: 0,
    totalRevenue: 0,
    avgDeliveryTime: 0,
    onTimeDeliveryRate: 0,
    exceptionsCount: 0,
    costPerShipment: 0,
    carrierPerformance: [],
    zonePerformance: []
  });
  
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [exceptions, setExceptions] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
    loadExceptions();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      // Load basic stats
      const stats = await getShippingStats();
      
      // Mock enhanced analytics data - in production, this would come from proper analytics
      setMetrics({
        totalShipments: stats.totalShipments || 156,
        totalRevenue: stats.totalRevenue || 15420,
        avgDeliveryTime: 3.2,
        onTimeDeliveryRate: 94.5,
        exceptionsCount: 8,
        costPerShipment: stats.totalRevenue && stats.totalShipments 
          ? stats.totalRevenue / stats.totalShipments 
          : 98.85,
        carrierPerformance: [
          { carrier: 'StarTrack', shipments: 89, onTimeRate: 96.2, avgCost: 95.40 },
          { carrier: 'Australia Post', shipments: 45, onTimeRate: 91.1, avgCost: 78.90 },
          { carrier: 'TNT', shipments: 22, onTimeRate: 98.5, avgCost: 125.60 }
        ],
        zonePerformance: [
          { zone: 'MELB', shipments: 67, avgDeliveryTime: 2.1 },
          { zone: 'SYDN', shipments: 54, avgDeliveryTime: 2.8 },
          { zone: 'REG1', shipments: 35, avgDeliveryTime: 4.2 }
        ]
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load shipping analytics",
        variant: "destructive",
      });
    }
  };

  const loadExceptions = async () => {
    try {
      const data = await getExceptions();
      setExceptions(data || []);
    } catch (error) {
      console.error('Error loading exceptions:', error);
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendValue,
    format = 'number' 
  }: {
    title: string;
    value: number | string;
    icon: any;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: number;
    format?: 'number' | 'currency' | 'percentage' | 'days';
  }) => {
    const formatValue = (val: number | string) => {
      if (typeof val === 'string') return val;
      
      switch (format) {
        case 'currency':
          return `$${val.toLocaleString()}`;
        case 'percentage':
          return `${val}%`;
        case 'days':
          return `${val} days`;
        default:
          return val.toLocaleString();
      }
    };

    const getTrendColor = () => {
      switch (trend) {
        case 'up':
          return 'text-green-600';
        case 'down':
          return 'text-red-600';
        default:
          return 'text-gray-600';
      }
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold">{formatValue(value)}</span>
                {trend && trendValue && (
                  <Badge variant="outline" className={getTrendColor()}>
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {trendValue > 0 ? '+' : ''}{trendValue}%
                  </Badge>
                )}
              </div>
            </div>
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Shipping Analytics</h2>
          <p className="text-muted-foreground">Performance metrics and delivery insights</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Shipments"
          value={metrics.totalShipments}
          icon={Package}
          trend="up"
          trendValue={12}
        />
        <MetricCard
          title="Shipping Revenue"
          value={metrics.totalRevenue}
          icon={DollarSign}
          format="currency"
          trend="up"
          trendValue={8}
        />
        <MetricCard
          title="Avg Delivery Time"
          value={metrics.avgDeliveryTime}
          icon={Clock}
          format="days"
          trend="down"
          trendValue={-5}
        />
        <MetricCard
          title="On-Time Delivery"
          value={metrics.onTimeDeliveryRate}
          icon={Truck}
          format="percentage"
          trend="up"
          trendValue={2}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carrier Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Carrier Performance</CardTitle>
            <CardDescription>Performance metrics by shipping carrier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.carrierPerformance.map((carrier, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{carrier.carrier}</p>
                    <p className="text-sm text-muted-foreground">{carrier.shipments} shipments</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${carrier.avgCost}</p>
                    <p className="text-sm text-muted-foreground">{carrier.onTimeRate}% on-time</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Zone Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Zone Performance</CardTitle>
            <CardDescription>Delivery performance by zone</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.zonePerformance.map((zone, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{zone.zone}</p>
                      <p className="text-sm text-muted-foreground">{zone.shipments} shipments</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{zone.avgDeliveryTime} days</p>
                    <p className="text-sm text-muted-foreground">avg delivery</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Exceptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span>Active Exceptions ({exceptions.length})</span>
          </CardTitle>
          <CardDescription>Shipments requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          {exceptions.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active exceptions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exceptions.slice(0, 5).map((exception) => (
                <div key={exception.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{exception.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {exception.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={exception.severity === 'high' ? 'destructive' : 
                               exception.severity === 'medium' ? 'default' : 'secondary'}
                    >
                      {exception.severity}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(exception.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Analysis</CardTitle>
          <CardDescription>Shipping cost breakdown and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cost per Shipment</p>
                  <p className="text-xl font-bold">${metrics.costPerShipment}</p>
                </div>
                <DollarSign className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Exception Cost</p>
                  <p className="text-xl font-bold">$2,340</p>
                </div>
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Savings Opportunity</p>
                  <p className="text-xl font-bold">$1,890</p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShippingAnalytics;