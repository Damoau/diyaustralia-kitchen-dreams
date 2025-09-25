import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrdersList } from './OrdersList';
import { QuotesList } from './QuotesList';
import { ProfileSettings } from './ProfileSettings';
import { AddressBook } from './AddressBook';
import { MessagesList } from './MessagesList';
import { ShippingTracker } from './ShippingTracker';
import { PaymentScheduleWidget } from './PaymentScheduleWidget';
import { User, Package, FileText, MapPin, MessageSquare, Truck, CreditCard } from 'lucide-react';

export const CustomerPortal = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Please log in to access your customer portal.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Customer Portal</h1>
        <p className="text-muted-foreground">Welcome back, {user.email}</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="quotes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Quotes
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="shipping" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Shipping
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  2 in production, 1 ready for delivery
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting your approval
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$2,450</div>
                <p className="text-xs text-muted-foreground">
                  Next payment due in 5 days
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Order ORD-20250101-0001 in production</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Quote QTE-20250101-0002 sent</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Payment reminder sent</p>
                      <p className="text-xs text-muted-foreground">3 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <button className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors">
                    <div className="font-medium">View Order Status</div>
                    <div className="text-sm text-muted-foreground">Check your order progress</div>
                  </button>
                  <button className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors">
                    <div className="font-medium">Review Quotes</div>
                    <div className="text-sm text-muted-foreground">Approve or request changes</div>
                  </button>
                  <button className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors">
                    <div className="font-medium">Make Payment</div>
                    <div className="text-sm text-muted-foreground">Pay outstanding invoices</div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <OrdersList />
        </TabsContent>

        <TabsContent value="quotes">
          <QuotesList />
        </TabsContent>

        <TabsContent value="payments">
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Select an order to view payment details</p>
          </div>
        </TabsContent>

        <TabsContent value="shipping">
          <div className="text-center py-8">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Select an order to view shipping details</p>
          </div>
        </TabsContent>

        <TabsContent value="messages">
          <MessagesList />
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ProfileSettings />
            <AddressBook />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};