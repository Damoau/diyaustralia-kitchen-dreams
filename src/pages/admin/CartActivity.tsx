import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAdminCarts } from '@/hooks/useAdminCarts';
import { useCartToQuote } from '@/hooks/useCartToQuote';
import { ShoppingCart, Mail, Phone, Clock, DollarSign, User, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CartActivity = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();
  const { carts, isLoading, fetchCarts, sendFollowUpEmail } = useAdminCarts();
  const { convertCartToQuote, isLoading: isConverting } = useCartToQuote();

  useEffect(() => {
    fetchCarts();
  }, []);

  const handleConvertToQuote = async (cart: any) => {
    const result = await convertCartToQuote(
      cart.id,
      cart.customer_email,
      `Quote converted from abandoned cart by admin`
    );
    
    if (result.success) {
      toast({
        title: "Success",
        description: `Cart converted to quote ${result.quoteNumber}`,
      });
      fetchCarts(); // Refresh the list
    }
  };

  const handleSendFollowUp = async (cart: any) => {
    const result = await sendFollowUpEmail(
      cart.id, 
      cart.customer_email, 
      `Hi ${cart.customer_name || 'there'}, you have items waiting in your cart. Complete your kitchen cabinet quote today!`
    );
    if (result) {
      toast({
        title: "Success",
        description: "Follow-up email sent to customer",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, label: 'Active' },
      abandoned: { variant: 'destructive' as const, label: 'Abandoned' },
      saved: { variant: 'secondary' as const, label: 'Saved' },
      converted_to_quote: { variant: 'outline' as const, label: 'Converted' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredCarts = carts.filter(cart => {
    const matchesSearch = !searchTerm || 
      cart.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cart.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || cart.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cart Activity Dashboard</h1>
          <p className="text-muted-foreground">Monitor customer cart activity and abandoned carts</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Carts</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {carts.filter(c => c.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abandoned Carts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {carts.filter(c => c.status === 'abandoned').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Carts</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {carts.filter(c => c.status === 'saved').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cart Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${carts.reduce((sum, cart) => sum + (cart.total_amount || 0), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by customer email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="abandoned">Abandoned</SelectItem>
            <SelectItem value="saved">Saved</SelectItem>
            <SelectItem value="converted_to_quote">Converted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cart Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cart Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCarts.map((cart) => (
                <TableRow key={cart.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {cart.customer_name || cart.customer_email || 'Anonymous'}
                      </div>
                      {cart.customer_email && (
                        <div className="text-sm text-muted-foreground">
                          {cart.customer_email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(cart.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      {cart.items_count} items
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      ${(cart.total_amount || 0).toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDistanceToNow(new Date(cart.updated_at), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {cart.customer_email && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendFollowUp(cart)}
                          disabled={isLoading}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Button>
                      )}
                      
                      {cart.status !== 'converted_to_quote' && (
                        <Button
                          size="sm"
                          onClick={() => handleConvertToQuote(cart)}
                          disabled={isConverting}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Convert to Quote
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredCarts.length === 0 && (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No carts found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CartActivity;