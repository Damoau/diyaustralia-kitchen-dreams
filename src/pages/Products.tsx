import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CabinetType } from '@/types/cabinet';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Filter, Grid, List } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { formatPrice } from '@/lib/pricing';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Products = () => {
  const [products, setProducts] = useState<CabinetType[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<CabinetType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { addToCart, isLoading: cartLoading } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, categoryFilter]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('active', true)
        .gt('stock_quantity', 0)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setProducts((data || []) as CabinetType[]);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    if (categoryFilter === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.category === categoryFilter));
    }
  };

  const handleQuickAdd = async (product: CabinetType) => {
    const configuration = {
      cabinetType: product,
      width: product.default_width_mm,
      height: product.default_height_mm,
      depth: product.default_depth_mm,
      quantity: 1,
    };

    // For quick add, we'll use minimal configuration
    const mockCabinetParts = [];
    const mockSettings = {
      hmrRate: 150,
      hardwareBaseCost: 50,
      gstRate: 0.1,
      wastageFactor: 1.1,
    };

    await addToCart(configuration, mockCabinetParts, mockSettings);
  };

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'base', label: 'Base Cabinets' },
    { value: 'wall', label: 'Wall Cabinets' },
    { value: 'pantry', label: 'Pantry Cabinets' },
    { value: 'dress_panel', label: 'Dress Panels' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading products...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary-glow text-white py-16 pt-36">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Premium Kitchen Cabinets</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Discover our extensive collection of high-quality cabinets for your dream kitchen
          </p>
        </div>
      </section>

      {/* Filters and Controls */}
      <section className="bg-background border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filteredProducts.length} products
              </span>
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <main className="container mx-auto px-4 py-8">
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {filteredProducts.map((product) => (
            <Card key={product.id} className={`group hover:shadow-lg transition-shadow ${
              viewMode === 'list' ? 'flex flex-row' : ''
            }`}>
              <div className={viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}>
                <div className="aspect-square bg-muted rounded-t-lg flex items-center justify-center">
                  {product.product_image_url ? (
                    <img 
                      src={product.product_image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="text-muted-foreground text-center p-4">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">No image</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {product.name}
                    </CardTitle>
                    {product.is_featured && (
                      <Badge variant="secondary">Featured</Badge>
                    )}
                  </div>
                  {product.short_description && (
                    <p className="text-sm text-muted-foreground">
                      {product.short_description}
                    </p>
                  )}
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(product.base_price || 0)}
                      </span>
                      <Badge variant={product.stock_quantity > 10 ? 'default' : 'destructive'}>
                        {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p>Dimensions: {product.default_width_mm}×{product.default_height_mm}×{product.default_depth_mm}mm</p>
                      <p>Category: {product.category.replace('_', ' ')}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        asChild 
                        variant="outline" 
                        className="flex-1"
                      >
                        <Link to={`/products/${product.id}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button
                        onClick={() => handleQuickAdd(product)}
                        disabled={cartLoading || product.stock_quantity === 0}
                        className="flex-1"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or check back later.
            </p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Products;