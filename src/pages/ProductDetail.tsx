import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CabinetType } from '@/types/cabinet';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ShoppingCart, Ruler, Package, Info } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/pricing';
import { ConfiguratorDialog } from '@/components/cabinet/ConfiguratorDialog';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<CabinetType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfigurator, setShowConfigurator] = useState(false);
  const { addToCart, isLoading: cartLoading } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('id', id)
        .eq('active', true)
        .single();

      if (error) throw error;
      setProduct(data as CabinetType);
    } catch (error) {
      console.error('Error loading product:', error);
      toast({
        title: 'Error',
        description: 'Failed to load product details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdd = async () => {
    if (!product) return;

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

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading product...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Product not found</h2>
            <Link to="/products">
              <Button>Back to Products</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/products" className="flex items-center text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              {product.product_image_url ? (
                <img 
                  src={product.product_image_url} 
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-muted-foreground text-center p-8">
                  <Package className="h-24 w-24 mx-auto mb-4" />
                  <p>No image available</p>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold">{product.name}</h1>
                {product.is_featured && (
                  <Badge variant="secondary" className="text-sm">Featured</Badge>
                )}
              </div>
              
              {product.short_description && (
                <p className="text-lg text-muted-foreground">{product.short_description}</p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-primary">
                {formatPrice(product.base_price || 0)}
              </span>
              <Badge variant={product.stock_quantity > 10 ? 'default' : 'destructive'}>
                {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
              </Badge>
            </div>

            <Separator />

            {/* Product Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Ruler className="h-5 w-5 mr-2" />
                  Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium">Category:</span>
                    <p className="capitalize">{product.category.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Dimensions:</span>
                    <p>{product.default_width_mm} × {product.default_height_mm} × {product.default_depth_mm} mm</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Doors:</span>
                    <p>{product.door_count}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Drawers:</span>
                    <p>{product.drawer_count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {product.long_description && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Info className="h-5 w-5 mr-2" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {product.long_description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={() => setShowConfigurator(true)}
                  variant="outline"
                  size="lg"
                  disabled={product.stock_quantity === 0}
                  className="w-full"
                >
                  <Ruler className="h-4 w-4 mr-2" />
                  Customize & Configure
                </Button>
                
                <Button
                  onClick={handleQuickAdd}
                  disabled={cartLoading || product.stock_quantity === 0}
                  size="lg"
                  className="w-full"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
              
              {product.stock_quantity === 0 && (
                <p className="text-sm text-destructive text-center">
                  This product is currently out of stock
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Configurator Dialog */}
      {showConfigurator && (
        <ConfiguratorDialog
          cabinetType={product}
          open={showConfigurator}
          onOpenChange={setShowConfigurator}
        />
      )}

      <Footer />
    </div>
  );
};

export default ProductDetail;