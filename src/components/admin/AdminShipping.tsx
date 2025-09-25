import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useShipping } from '@/hooks/useShipping';
import { 
  Truck, 
  Package, 
  MapPin, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  Edit,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import CarrierManagementComponent from './shipping/CarrierManagement';
import ZoneManagementComponent from './shipping/ZoneManagement';
import ShippingAnalyticsComponent from './shipping/ShippingAnalytics';

interface ShippingStats {
  totalShipments: number;
  pendingShipments: number;
  deliveredToday: number;
  activeExceptions: number;
  totalRevenue: number;
  avgDeliveryTime: number;
}

const AdminShipping = () => {
  const { toast } = useToast();
  const { 
    getShippingQuote, 
    loadPostcodeZones, 
    getOrderShipments,
    loading 
  } = useShipping();
  
  const [activeTab, setActiveTab] = useState('shipping');
  const [stats, setStats] = useState<ShippingStats>({
    totalShipments: 0,
    pendingShipments: 0,
    deliveredToday: 0,
    activeExceptions: 0,
    totalRevenue: 0,
    avgDeliveryTime: 0
  });

  useEffect(() => {
    loadShippingStats();
    loadPostcodeZones();
  }, []);

  const loadShippingStats = async () => {
    try {
      // This will be implemented with real data fetching
      setStats({
        totalShipments: 156,
        pendingShipments: 23,
        deliveredToday: 8,
        activeExceptions: 2,
        totalRevenue: 15420,
        avgDeliveryTime: 3.2
      });
    } catch (error) {
      console.error('Error loading shipping stats:', error);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    trend = null 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    description: string; 
    trend?: number | null;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">{value}</span>
              {trend !== null && (
                <Badge variant={trend >= 0 ? "default" : "destructive"}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {trend > 0 ? '+' : ''}{trend}%
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">Shipping Management</h1>
        <p className="text-muted-foreground">Manage shipping operations, carriers, and logistics</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="shipping">Shipping Overview</TabsTrigger>
          <TabsTrigger value="carriers">Carriers & Rates</TabsTrigger>
          <TabsTrigger value="zones">Zones & Assembly</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

          <TabsContent value="shipping" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Shipments"
                value="156"
                icon={Package}
                description="This month"
                trend={12}
              />
              <StatCard 
                title="Pending Shipments"
                value="23"
                icon={Clock}
                description="Awaiting dispatch"
              />
              <StatCard 
                title="Delivered Today"
                value="8"
                icon={Truck}
                description="Successful deliveries"
              />
              <StatCard 
                title="Active Exceptions"
                value="2"
                icon={AlertTriangle}
                description="Require attention"
              />
            </div>

            {/* Shipping Zones & Postcodes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Postcode Zones
                </CardTitle>
                <CardDescription>
                  Manage delivery zones and assembly availability by postcode
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium">Postcode: 3000</h3>
                        <p className="text-sm text-muted-foreground">VIC • Zone: MEL_METRO</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge variant="secondary" className="text-xs">Metro</Badge>
                          <Badge variant="default" className="text-xs">Assembly</Badge>
                          <Badge variant="outline" className="text-xs">Delivery</Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium">Postcode: 4000</h3>
                        <p className="text-sm text-muted-foreground">QLD • Zone: BNE_METRO</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge variant="secondary" className="text-xs">Metro</Badge>
                          <Badge variant="default" className="text-xs">Assembly</Badge>
                          <Badge variant="outline" className="text-xs">Delivery</Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium">Postcode: 2000</h3>
                        <p className="text-sm text-muted-foreground">NSW • Zone: SYD_METRO</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge variant="secondary" className="text-xs">Metro</Badge>
                          <Badge variant="default" className="text-xs">Assembly</Badge>
                          <Badge variant="outline" className="text-xs">Delivery</Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        <TabsContent value="carriers" className="space-y-6">
          <CarrierManagementComponent />
        </TabsContent>

        <TabsContent value="zones" className="space-y-6">
          <ZoneManagementComponent />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <ShippingAnalyticsComponent />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminShipping;