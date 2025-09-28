import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ImpersonationLayout } from "@/components/layout/ImpersonationLayout";
import { StickyKitchenNav } from "@/components/navigation/StickyKitchenNav";
import { ProductConfigurator } from "@/components/product/ProductConfigurator";
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

interface RoomCategory {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  hero_image_url?: string;
}

const ProductPage = () => {
  const { room, category, productSlug } = useParams<{ room: string; category: string; productSlug: string }>();
  const navigate = useNavigate();
  const [cabinet, setCabinet] = useState<CabinetType | null>(null);
  const [roomCategory, setRoomCategory] = useState<RoomCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [configuratorOpen, setConfiguratorOpen] = useState(false);

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
    const loadData = async () => {
      if (!dbCategory || !productSlug || !room) {
        navigate('/shop');
        return;
      }

      try {
        // Load room category data
        const { data: roomData, error: roomError } = await supabase
          .from('room_categories')
          .select('*')
          .eq('name', room)
          .single();

        if (roomError) throw roomError;
        setRoomCategory(roomData);

        // Try to find cabinet by url_slug first, then fallback to name-based slug
        let { data, error } = await supabase
          .from('cabinet_types')
          .select('*')
          .eq('active', true)
          .eq('category', dbCategory)
          .eq('url_slug', productSlug)
          .single();

        // If not found by url_slug, try to match by name
        if (!data) {
          const nameSlug = productSlug.replace(/-/g, ' ');
          ({ data, error } = await supabase
            .from('cabinet_types')
            .select('*')
            .eq('active', true)
            .eq('category', dbCategory)
            .ilike('name', `%${nameSlug}%`)
            .single());
        }

        if (error && error.code !== 'PGRST116') throw error;
        
        if (!data) {
          navigate(`/shop/${room}/${category}`);
          return;
        }

        setCabinet(data);
      } catch (error) {
        console.error('Error loading data:', error);
        navigate(`/shop/${room}/${category}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [room, category, productSlug, dbCategory, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <Header />
        <StickyKitchenNav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!cabinet) {
    return null; // Will redirect in useEffect
  }

  const pageTitle = cabinet.meta_title || `${cabinet.name} - ${roomCategory?.display_name || 'Cabinet'} ${displayCategory} | Your Company`;
  const pageDescription = cabinet.meta_description || cabinet.long_description || cabinet.short_description || `${cabinet.name} - Premium ${roomCategory?.display_name?.toLowerCase() || 'kitchen'} cabinet with customizable dimensions and finishes.`;
  const pageKeywords = cabinet.meta_keywords || `${cabinet.name}, ${displayCategory.toLowerCase()}, ${roomCategory?.display_name?.toLowerCase() || 'kitchen'} cabinets, custom cabinets`;

  return (
    <ImpersonationLayout>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={pageKeywords} />
        <link rel="canonical" href={`${window.location.origin}/shop/${room}/${category}/${productSlug}`} />
        
        {/* Structured Data for Product */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": cabinet.name,
            "description": pageDescription,
            "category": displayCategory,
            "image": cabinet.product_image_url,
            "brand": {
              "@type": "Brand",
              "name": "Your Company"
            },
            "offers": {
              "@type": "Offer",
              "availability": "https://schema.org/InStock",
              "priceCurrency": "AUD"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <Header />
        <StickyKitchenNav />
        
        <main className="container mx-auto px-4 py-8 mobile-safe-bottom">
          {/* Breadcrumbs */}
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/shop">Shop</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/shop/${room}`}>{roomCategory?.display_name || room}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/shop/${room}/${category}`}>{displayCategory}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{cabinet.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Room Category Subheading */}
          {roomCategory && (
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-primary mb-2">{roomCategory.display_name}</h2>
              {roomCategory.description && (
                <p className="text-lg text-muted-foreground">{roomCategory.description}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            {/* Product Image */}
            <div className="space-y-4">
              <div className="aspect-square relative overflow-hidden rounded-lg bg-secondary/20">
                {cabinet.product_image_url ? (
                  <img
                    src={cabinet.product_image_url}
                    alt={`${cabinet.name} - ${displayCategory}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-muted-foreground text-lg">No image available</span>
                  </div>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <div className="flex gap-2 mb-2">
                  {cabinet.door_count > 0 && (
                    <Badge variant="secondary">
                      {cabinet.door_count} Door{cabinet.door_count !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {cabinet.drawer_count > 0 && (
                    <Badge variant="secondary">
                      {cabinet.drawer_count} Drawer{cabinet.drawer_count !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <h1 className="text-4xl font-bold mb-4">{cabinet.name}</h1>
                {cabinet.short_description && (
                  <p className="text-xl text-muted-foreground mb-4">
                    {cabinet.short_description}
                  </p>
                )}
              </div>

              {/* Specifications */}
              <div className="bg-card p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Default Specifications</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-secondary/50 rounded">
                    <div className="text-2xl font-bold">{cabinet.default_width_mm}mm</div>
                    <div className="text-sm text-muted-foreground">Width</div>
                    {(cabinet.min_width_mm || cabinet.max_width_mm) && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {cabinet.min_width_mm}-{cabinet.max_width_mm}mm
                      </div>
                    )}
                  </div>
                  <div className="text-center p-4 bg-secondary/50 rounded">
                    <div className="text-2xl font-bold">{cabinet.default_height_mm}mm</div>
                    <div className="text-sm text-muted-foreground">Height</div>
                    {(cabinet.min_height_mm || cabinet.max_height_mm) && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {cabinet.min_height_mm}-{cabinet.max_height_mm}mm
                      </div>
                    )}
                  </div>
                  <div className="text-center p-4 bg-secondary/50 rounded">
                    <div className="text-2xl font-bold">{cabinet.default_depth_mm}mm</div>
                    <div className="text-sm text-muted-foreground">Depth</div>
                    {(cabinet.min_depth_mm || cabinet.max_depth_mm) && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {cabinet.min_depth_mm}-{cabinet.max_depth_mm}mm
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={() => setConfiguratorOpen(true)}
                  size="lg"
                  className="w-full"
                >
                  Configure & Get Quote
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate(`/shop/${room}/${category}`)}
                >
                  Back to {displayCategory}
                </Button>
              </div>
            </div>
          </div>

          {/* Long Description */}
          {cabinet.long_description && (
            <div className="bg-card p-8 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">Product Details</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  {cabinet.long_description}
                </p>
              </div>
            </div>
          )}
        </main>

        <Footer />

        {/* Product Configurator Modal */}
        {configuratorOpen && (
          <ProductConfigurator
            open={configuratorOpen}
            onOpenChange={setConfiguratorOpen}
            cabinetTypeId={cabinet.id}
          />
        )}
      </div>
    </ImpersonationLayout>
  );
};

export default ProductPage;