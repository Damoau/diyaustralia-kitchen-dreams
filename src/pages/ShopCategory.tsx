import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ProductConfigurator } from "@/components/product/ProductConfigurator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

interface CabinetType {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  short_description?: string;
  long_description?: string;
  product_image_url?: string;
  default_width_mm: number;
  default_height_mm: number;
  default_depth_mm: number;
  min_width_mm?: number;
  max_width_mm?: number;
  min_height_mm?: number;
  max_height_mm?: number;
  min_depth_mm?: number;
  max_depth_mm?: number;
  door_count: number;
  drawer_count: number;
  url_slug?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
}

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [cabinetTypes, setCabinetTypes] = useState<CabinetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [selectedCabinet, setSelectedCabinet] = useState<CabinetType | null>(null);

  // Category display mapping
  const categoryDisplayNames: Record<string, string> = {
    'base-cabinets': 'Base Cabinets',
    'wall-cabinets': 'Wall Cabinets', 
    'pantry-cabinets': 'Pantry Cabinets',
    'tall-cabinets': 'Tall Cabinets'
  };

  // Map URL category to database category
  const categoryMapping: Record<string, string> = {
    'base-cabinets': 'base',
    'wall-cabinets': 'wall',
    'pantry-cabinets': 'pantry', 
    'tall-cabinets': 'tall'
  };

  const displayCategory = categoryDisplayNames[category || ''] || 'Cabinets';
  const dbCategory = categoryMapping[category || ''];

  useEffect(() => {
    const loadCabinetTypes = async () => {
      if (!dbCategory) {
        navigate('/shop');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('cabinet_types')
          .select('*')
          .eq('active', true)
          .eq('category', dbCategory)
          .order('display_order', { ascending: true });

        if (error) throw error;
        setCabinetTypes(data || []);
      } catch (error) {
        console.error('Error loading cabinet types:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCabinetTypes();
  }, [category, dbCategory, navigate]);

  const handleConfigureProduct = (cabinet: CabinetType) => {
    setSelectedCabinet(cabinet);
    setConfiguratorOpen(true);
  };

  const handleViewProduct = (cabinet: CabinetType) => {
    const slug = cabinet.url_slug || cabinet.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/shop/${category}/${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{displayCategory} - Premium Kitchen Cabinets | Your Company</title>
        <meta 
          name="description" 
          content={`Browse our collection of ${displayCategory.toLowerCase()}. High-quality, customizable kitchen cabinets with professional installation.`} 
        />
        <meta 
          name="keywords" 
          content={`${displayCategory.toLowerCase()}, kitchen cabinets, custom cabinets, cabinet installation`} 
        />
        <link rel="canonical" href={`${window.location.origin}/shop/${category}`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/shop">Shop</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{displayCategory}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Category Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">{displayCategory}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover our premium {displayCategory.toLowerCase()} designed for modern kitchens. 
              Each cabinet is crafted with precision and can be customized to your exact specifications.
            </p>
          </div>

          {/* Products Grid */}
          {cabinetTypes.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No cabinets available</h3>
              <p className="text-muted-foreground">Check back later for new products.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cabinetTypes.map((cabinet) => (
                <Card key={cabinet.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="aspect-square relative overflow-hidden">
                    {cabinet.product_image_url ? (
                      <img
                        src={cabinet.product_image_url}
                        alt={`${cabinet.name} - ${displayCategory}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary/50 flex items-center justify-center">
                        <span className="text-muted-foreground">No image available</span>
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg leading-tight">{cabinet.name}</CardTitle>
                      {(cabinet.door_count > 0 || cabinet.drawer_count > 0) && (
                        <div className="flex gap-1 shrink-0">
                          {cabinet.door_count > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {cabinet.door_count} Door{cabinet.door_count !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          {cabinet.drawer_count > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {cabinet.drawer_count} Drawer{cabinet.drawer_count !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    {cabinet.short_description && (
                      <p className="text-sm text-muted-foreground">
                        {cabinet.short_description}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                      <div className="text-center p-2 bg-secondary/50 rounded">
                        <div className="font-medium">{cabinet.default_width_mm}mm</div>
                        <div className="text-xs text-muted-foreground">Width</div>
                      </div>
                      <div className="text-center p-2 bg-secondary/50 rounded">
                        <div className="font-medium">{cabinet.default_height_mm}mm</div>
                        <div className="text-xs text-muted-foreground">Height</div>
                      </div>
                      <div className="text-center p-2 bg-secondary/50 rounded">
                        <div className="font-medium">{cabinet.default_depth_mm}mm</div>
                        <div className="text-xs text-muted-foreground">Depth</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleViewProduct(cabinet)}
                        variant="outline"
                        className="flex-1"
                      >
                        View Details
                      </Button>
                      <Button 
                        onClick={() => handleConfigureProduct(cabinet)}
                        className="flex-1"
                      >
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        <Footer />

        {/* Product Configurator Modal */}
        {configuratorOpen && selectedCabinet && (
          <ProductConfigurator
            open={configuratorOpen}
            onOpenChange={setConfiguratorOpen}
            cabinetTypeId={selectedCabinet.id}
          />
        )}
      </div>
    </>
  );
};

export default CategoryPage;