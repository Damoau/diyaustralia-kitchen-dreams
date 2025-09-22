import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  ShoppingBag, 
  Files, 
  MessageSquare,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  ShoppingCart
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSavedCarts } from "@/hooks/useSavedCarts";

export const PortalDashboard = () => {
  const { getSavedCartsCount } = useSavedCarts();
  
  // Mock data - in real app this would come from API
  const stats = {
    activeQuotes: 2,
    activeOrders: 1, 
    pendingPayments: 1,
    unreadMessages: 3,
    savedCarts: getSavedCartsCount()
  };

  const recentQuotes = [
    {
      id: "QT-2024-001",
      label: "Kitchen Renovation",
      status: "pending_approval",
      amount: 12500,
      createdAt: "2024-01-15"
    },
    {
      id: "QT-2024-002", 
      label: "Laundry Cabinets",
      status: "draft",
      amount: 3200,
      createdAt: "2024-01-10"
    }
  ];

  const recentOrders = [
    {
      id: "ORD-2024-001",
      quoteId: "QT-2023-045",
      status: "in_production",
      amount: 15800,
      createdAt: "2024-01-05",
      nextPaymentDue: "2024-01-20"
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      pending_approval: { variant: "secondary" as const, text: "Pending Approval" },
      draft: { variant: "outline" as const, text: "Draft" },
      in_production: { variant: "default" as const, text: "In Production" },
      completed: { variant: "default" as const, text: "Completed" }
    };
    
    const config = variants[status as keyof typeof variants] || variants.draft;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's an overview of your quotes and orders.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeQuotes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unreadMessages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Carts</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.savedCarts}</div>
            <div className="text-xs text-muted-foreground mt-1">
              <Link to="/portal/saved-carts" className="hover:underline">
                View saved carts
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotes */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Quotes</CardTitle>
            <CardDescription>Your latest quote requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentQuotes.map((quote) => (
                <div key={quote.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{quote.id}</span>
                      {getStatusBadge(quote.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{quote.label}</p>
                    <p className="text-sm font-medium">${quote.amount.toLocaleString()}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/portal/quotes/${quote.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              ))}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/portal/quotes">View All Quotes</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Track your order progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{order.id}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      From Quote {order.quoteId}
                    </p>
                    <p className="text-sm font-medium">${order.amount.toLocaleString()}</p>
                    {order.nextPaymentDue && (
                      <p className="text-xs text-orange-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Next payment due {order.nextPaymentDue}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/portal/orders/${order.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              ))}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/portal/orders">View All Orders</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};