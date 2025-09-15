import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingBag, Calendar, DollarSign, Clock } from "lucide-react";

export const OrdersList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock data - in real app this would come from API
  const orders = [
    {
      id: "ORD-2024-001",
      quoteId: "QT-2023-045",
      label: "Kitchen Renovation",
      status: "in_production",
      amount: 15800,
      paidAmount: 3200,
      nextPaymentDue: "2024-01-20",
      nextPaymentAmount: 6300,
      createdAt: "2024-01-05",
      estimatedCompletion: "2024-02-15"
    },
    {
      id: "ORD-2023-089",
      quoteId: "QT-2023-032",
      label: "Office Storage",
      status: "shipped",
      amount: 4200,
      paidAmount: 4200,
      nextPaymentDue: null,
      nextPaymentAmount: 0,
      createdAt: "2023-11-15",
      estimatedCompletion: "2024-01-10"
    },
    {
      id: "ORD-2023-076",
      quoteId: "QT-2023-021",
      label: "Laundry Cabinets",
      status: "completed",
      amount: 3200,
      paidAmount: 3200,
      nextPaymentDue: null,
      nextPaymentAmount: 0,
      createdAt: "2023-10-20",
      estimatedCompletion: "2023-12-15"
    }
  ];

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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.quoteId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground mt-2">
          Track your orders and manage payments.
        </p>
      </div>

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
                  <CardTitle className="text-lg">{order.id}</CardTitle>
                  <p className="text-sm text-muted-foreground">{order.label}</p>
                  <p className="text-xs text-muted-foreground">From {order.quoteId}</p>
                </div>
                {getStatusBadge(order.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span>
                    ${order.paidAmount.toLocaleString()} of ${order.amount.toLocaleString()} paid
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
                    <span>{Math.round((order.paidAmount / order.amount) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(order.paidAmount / order.amount) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button asChild className="w-full">
                    <Link to={`/portal/orders/${order.id}`}>
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