import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, Layers, RectangleHorizontal, Wrench, Settings } from "lucide-react";
import { ProductConfigurator } from "@/components/product/ProductConfigurator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import baseCabinetsImage from "@/assets/base-cabinets-hero.jpg";
import topCabinetsImage from "@/assets/top-cabinets-hero.jpg";

interface CabinetType {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  short_description?: string;
  product_image_url?: string;
  default_width_mm: number;
  default_height_mm: number;
  default_depth_mm: number;
  door_count: number;
  drawer_count: number;
  is_featured: boolean;
}

const Shop = () => {
  const [cabinetTypes, setCabinetTypes] = useState<CabinetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [selectedCabinetTypeId, setSelectedCabinetTypeId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    {
      id: 'all',
      title: 'All Cabinets',
      description: 'Browse all cabinet types',
      icon: <Package className="h-12 w-12 text-primary" />,
    },
    {
      id: 'base',
      title: 'Base Cabinets',
      description: 'Foundation cabinets for your kitchen workspace',
      icon: <RectangleHorizontal className="h-12 w-12 text-primary" />,
      image: baseCabinetsImage
    },
    {
      id: 'wall',
      title: 'Wall Cabinets',
      description: 'Wall-mounted storage solutions',
      icon: <Package className="h-12 w-12 text-primary" />,
      image: topCabinetsImage
    },
    {
      id: 'tall',
      title: 'Tall Cabinets',
      description: 'Tall storage for maximum organization',
      icon: <Layers className="h-12 w-12 text-primary" />,
      image: '/lovable-uploads/b6d88c5d-54f3-4b8d-9ac4-6fdf2711d29e.png'
    },
    {
      id: 'specialty',
      title: 'Specialty',
      description: 'Unique and specialized cabinet types',
      icon: <Wrench className="h-12 w-12 text-primary" />,
      image: '/lovable-uploads/1fa9627e-0972-4137-b95b-ef3bcb26b66c.png'
    }
  ];

  useEffect(() => {
    loadCabinetTypes();
  }, []);

  const loadCabinetTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('active', true)
        .order('is_featured', { ascending: false })
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setCabinetTypes(data || []);
    } catch (error) {
      console.error('Error loading cabinet types:', error);
      toast.error('Failed to load cabinet types');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureProduct = (cabinetTypeId: string) => {
    setSelectedCabinetTypeId(cabinetTypeId);
    setConfiguratorOpen(true);
  };

  const handleGetQuote = (cabinetType: CabinetType) => {
    console.log("Getting quote for:", cabinetType);
    toast.success(`Quote requested for ${cabinetType.name}`);
  };

  const filteredCabinetTypes = selectedCategory === 'all' 
    ? cabinetTypes 
    : cabinetTypes.filter(ct => ct.category.toLowerCase().includes(selectedCategory));

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Cabinet <span className="text-blue-600">Shop</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Browse our complete range of kitchen cabinets. Configure and customize each cabinet to your exact specifications.
            </p>

            {/* Category Filter Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-12">
              {categories.map((category) => (
                <Button 
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className="h-12 text-xs md:text-sm font-medium"
                >
                  {category.title}
                </Button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading cabinet types...</p>
            </div>
          )}

          {/* Cabinet Types Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {filteredCabinetTypes.map((cabinetType) => (
                <Card key={cabinetType.id} className="h-full hover:shadow-elegant transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
                  {/* Product Image */}
                  <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden relative">
                    {cabinetType.product_image_url ? (
                      <img 
                        src={cabinetType.product_image_url} 
                        alt={cabinetType.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
                        <Package className="h-16 w-16 text-muted-foreground/50" />
                      </div>
                    )}
                    
                    {/* Category Badge */}
                    <Badge className="absolute top-2 left-2 bg-primary/80 text-primary-foreground">
                      {cabinetType.category}
                    </Badge>
                    
                    {/* Featured Badge */}
                    {cabinetType.is_featured && (
                      <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">
                        Featured
                      </Badge>
                    )}
                  </div>
                  
                  <CardHeader className="flex-grow">
                    <CardTitle className="text-lg line-clamp-2">{cabinetType.name}</CardTitle>
                    {cabinetType.subcategory && (
                      <div className="text-sm text-muted-foreground">{cabinetType.subcategory}</div>
                    )}
                    <CardDescription className="text-sm line-clamp-2">
                      {cabinetType.short_description || 'Professional cabinet solution'}
                    </CardDescription>
                    
                    {/* Specifications */}
                    <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                      <div>Default: {cabinetType.default_width_mm}×{cabinetType.default_height_mm}×{cabinetType.default_depth_mm}mm</div>
                      <div className="flex gap-3">
                        {cabinetType.door_count > 0 && (
                          <span>{cabinetType.door_count} Door{cabinetType.door_count > 1 ? 's' : ''}</span>
                        )}
                        {cabinetType.drawer_count > 0 && (
                          <span>{cabinetType.drawer_count} Drawer{cabinetType.drawer_count > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 mt-auto">
                    <div className="space-y-2">
                      <Button 
                        onClick={() => handleConfigureProduct(cabinetType.id)}
                        className="w-full"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configure & Price
                      </Button>
                      <Button 
                        onClick={() => handleGetQuote(cabinetType)}
                        variant="outline"
                        className="w-full"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Get Quote
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredCabinetTypes.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No cabinets found</h3>
              <p className="text-muted-foreground">
                {selectedCategory === 'all' 
                  ? 'No cabinet types are currently available.' 
                  : `No cabinets found in the ${categories.find(c => c.id === selectedCategory)?.title.toLowerCase()} category.`
                }
              </p>
            </div>
          )}

          {/* Features Section */}
          <div className="mt-16 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Smart Configuration</h3>
                <p className="text-muted-foreground">Advanced configurator with real-time calculations and formula-based pricing</p>
              </div>
              
              <div className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Parts Breakdown</h3>
                <p className="text-muted-foreground">Detailed parts calculation with hardware requirements and material lists</p>
              </div>
              
              <div className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Instant Pricing</h3>
                <p className="text-muted-foreground">Real-time pricing based on dimensions, finishes, and door styles</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      
      <ProductConfigurator
        open={configuratorOpen}
        onOpenChange={setConfiguratorOpen}
        cabinetTypeId={selectedCabinetTypeId}
      />
    </div>
  );
};

export default Shop;