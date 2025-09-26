import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingCart, Clock, DollarSign, TrendingUp, Users, Eye, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface CartActivity {
  id: string;
  user_id: string;
  customer_email: string;
  customer_name?: string;
  status: 'active' | 'saved' | 'converted_to_quote' | 'abandoned';
  total_amount: number;
  item_count: number;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  items: Array<{
    id: string;
    cabinet_type: {
      name: string;
      category: string;
    };
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  quote_id?: string;
  quote_number?: string;
}

interface CartMetrics {
  totalCarts: number;
  activeCarts: number;
  savedCarts: number;
  convertedCarts: number;
  abandonedCarts: number;
  totalValue: number;
  averageValue: number;
  conversionRate: number;
}

export const CartActivityDashboard = () => {
  const [carts, setCarts] = useState<CartActivity[]>([]);
  const [metrics, setMetrics] = useState<CartMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updated_at');
  const { toast } = useToast();

  useEffect(() => {
    loadCartActivity();
    loadMetrics();
  }, []);

  const loadCartActivity = async () => {
    try {
      setLoading(true);
      
      const { data: cartsData, error } = await supabase
        .from('carts')
        .select(`
          *,
          cart_items(
            id,
            quantity,
            unit_price,
            total_price,
            cabinet_type:cabinet_type_id(name, category)
          )
        `)
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedCarts: CartActivity[] = cartsData?.map(cart => ({
        id: cart.id,
        user_id: cart.user_id,
        customer_email: 'Unknown', // Will need to join with proper customer table
        customer_name: undefined,
        status: cart.status as 'active' | 'saved' | 'converted_to_quote' | 'abandoned',
        total_amount: cart.total_amount || 0,
        item_count: cart.cart_items?.length || 0,
        created_at: cart.created_at,
        updated_at: cart.updated_at,
        last_activity_at: cart.updated_at,
        items: cart.cart_items?.map((item: any) => ({
          id: item.id,
          cabinet_type: {
            name: item.cabinet_type?.name || 'Unknown',
            category: item.cabinet_type?.category || 'Unknown'
          },
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        })) || []
      })) || [];

      setCarts(formattedCarts);
    } catch (error) {
      console.error('Error loading cart activity:', error);
      toast({
        title: "Error",
        description: "Failed to load cart activity",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const { data: cartsData, error } = await supabase
        .from('carts')
        .select('status, total_amount')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (error) throw error;

      const totalCarts = cartsData?.length || 0;
      const activeCarts = cartsData?.filter(c => c.status === 'active').length || 0;
      const savedCarts = cartsData?.filter(c => c.status === 'saved').length || 0;
      const convertedCarts = cartsData?.filter(c => c.status === 'converted_to_quote').length || 0;
      const abandonedCarts = cartsData?.filter(c => c.status === 'abandoned').length || 0;
      
      const totalValue = cartsData?.reduce((sum, cart) => sum + (cart.total_amount || 0), 0) || 0;
      const averageValue = totalCarts > 0 ? totalValue / totalCarts : 0;
      const conversionRate = totalCarts > 0 ? (convertedCarts / totalCarts) * 100 : 0;

      setMetrics({
        totalCarts,
        activeCarts,
        savedCarts,
        convertedCarts,
        abandonedCarts,
        totalValue,
        averageValue,
        conversionRate
      });
    } catch (error) {
      console.error('Error loading cart metrics:', error);
    }
  };

  const handleConvertToQuote = async (cartId: string, customerEmail: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('portal-cart-to-quote', {
        body: {
          cart_id: cartId,
          customer_email: customerEmail,
          notes: 'Admin converted cart to quote'
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Success",
          description: `Cart converted to quote ${data.quote_number}`,
        });
        loadCartActivity();
        loadMetrics();
      }
    } catch (error) {
      console.error('Error converting cart to quote:', error);
      toast({
        title: "Error",
        description: "Failed to convert cart to quote",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, label: 'Active' },
      saved: { variant: 'secondary' as const, label: 'Saved' },
      converted_to_quote: { variant: 'outline' as const, label: 'Converted' },
      abandoned: { variant: 'destructive' as const, label: 'Abandoned' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredCarts = carts.filter(cart => {
    const matchesSearch = cart.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (cart.customer_name && cart.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || cart.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="p-6">Loading cart activity...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Cart Activity Dashboard</h2>
        <Button onClick={() => { loadCartActivity(); loadMetrics(); }}>
          Refresh
        </Button>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Carts</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalCarts}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.activeCarts} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Avg: ${metrics.averageValue.toFixed(0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {metrics.convertedCarts} converted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saved Carts</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.savedCarts}</div>
              <p className="text-xs text-muted-foreground">
                Potential leads
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search by customer email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="saved">Saved</SelectItem>
                <SelectItem value="converted_to_quote">Converted</SelectItem>
                <SelectItem value="abandoned">Abandoned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_at">Last Activity</SelectItem>
                <SelectItem value="created_at">Created Date</SelectItem>
                <SelectItem value="total_amount">Cart Value</SelectItem>
                <SelectItem value="item_count">Item Count</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cart Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Cart Activity</CardTitle>
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
                      <p className="font-medium">{cart.customer_name || cart.customer_email}</p>
                      {cart.customer_name && (
                        <p className="text-sm text-muted-foreground">{cart.customer_email}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(cart.status)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{cart.item_count} items</p>
                      <p className="text-sm text-muted-foreground">
                        {cart.items.slice(0, 2).map(item => item.cabinet_type.name).join(', ')}
                        {cart.items.length > 2 && '...'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">${cart.total_amount.toFixed(2)}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">
                      {formatDistanceToNow(new Date(cart.last_activity_at), { addSuffix: true })}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      {cart.status === 'saved' && (
                        <Button 
                          size="sm"
                          onClick={() => handleConvertToQuote(cart.id, cart.customer_email)}
                        >
                          Convert to Quote
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Contact
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};