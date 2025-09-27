import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingBag, Calendar, DollarSign, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const OrdersList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          subtotal_amount,
          created_at,
          user_id,
          payment_schedules (
            id,
            schedule_type,
            percentage,
            amount,
            due_date,
            status,
            paid_at
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Orders fetch error:', ordersError);
        throw ordersError;
      }

      if (!ordersData || ordersData.length === 0) {
        // Create sample data for development/testing
        const sampleOrders = [
          {
            id: "sample-001",
            order_number: "ORD-2024-001", 
            status: "in_production",
            total_amount: 15800,
            subtotal_amount: 14364,
            created_at: "2024-01-05T00:00:00Z",
            user_id: null,
            payment_schedules: [
              { schedule_type: "deposit", percentage: 20, amount: 3160, status: "paid", paid_at: "2024-01-05T00:00:00Z" },
              { schedule_type: "progress", percentage: 30, amount: 4740, status: "pending", due_date: "2024-01-20" }
            ]
          },
          {
            id: "sample-089",
            order_number: "ORD-2023-089",
            status: "shipped", 
            total_amount: 4200,
            subtotal_amount: 3818,
            created_at: "2023-11-15T00:00:00Z",
            user_id: null,
            payment_schedules: [
              { schedule_type: "deposit", percentage: 20, amount: 840, status: "paid" },
              { schedule_type: "final", percentage: 80, amount: 3360, status: "paid" }
            ]
          }
        ];
        
        setOrders(sampleOrders);
        setError("development_mode");
      } else {
        setOrders(ordersData);
      }
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error instanceof Error ? error.message : "Failed to load orders");
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      in_production: { variant: "secondary" as const, text: "In Production" },
      ready_to_ship: { variant: "default" as const, text: "Ready to Ship" },
      shipped: { variant: "default" as const, text: "Shipped" },
      completed: { variant: "default" as const, text: "Completed" },
      cancelled: { variant: "destructive" as const, text: "Cancelled" }
    };
    
    const config = variants[status as keyof typeof variants] || variants.in_production;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const processOrderData = (order: any) => {
    const paidSchedules = order.payment_schedules?.filter((ps: any) => ps.status === 'paid') || [];
    const pendingSchedule = order.payment_schedules?.find((ps: any) => ps.status === 'pending');
    const paidAmount = paidSchedules.reduce((sum: number, ps: any) => sum + (ps.amount || 0), 0);
    
    return {
      ...order,
      paidAmount,
      nextPaymentDue: pendingSchedule?.due_date,
      nextPaymentAmount: pendingSchedule?.amount || 0,
      estimatedCompletion: "TBD" // This would come from production schedules
    };
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = (order.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).map(processOrderData);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground mt-2">
          Track your orders and manage payments.
        </p>
      </div>

      {error === "development_mode" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Development Mode:</strong> No real orders found in database. Showing sample data for development. 
            Real order functionality will work once orders are created.
          </AlertDescription>
        </Alert>
      )}

      {error && error !== "development_mode" && (
        <Alert className="border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search orders by ID, quote ID, or label..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="in_production">In Production</SelectItem>
            <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{order.order_number}</CardTitle>
                  <p className="text-sm text-muted-foreground">Order ID: {order.id}</p>
                  <p className="text-xs text-muted-foreground">Created: {new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                {getStatusBadge(order.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span>
                    ${order.paidAmount?.toLocaleString() || 0} of ${order.total_amount?.toLocaleString() || 0} paid
                  </span>
                </div>
                
                {order.nextPaymentDue && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      Next payment: ${order.nextPaymentAmount.toLocaleString()} due {order.nextPaymentDue}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {order.status === "completed" ? "Completed" : "Est. completion"}: {order.estimatedCompletion}
                  </span>
                </div>

                {/* Payment Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Payment Progress</span>
                    <span>{Math.round(((order.paidAmount || 0) / (order.total_amount || 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${((order.paidAmount || 0) / (order.total_amount || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button asChild className="w-full">
                    <Link to={`/portal/orders/${order.order_number || order.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "You don't have any orders yet."
              }
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button asChild>
                <Link to="/portal/quotes">View Quotes</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};