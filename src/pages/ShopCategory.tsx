import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import DynamicHeader from "@/components/DynamicHeader";
import Footer from "@/components/Footer";
import { ImpersonationLayout } from "@/components/layout/ImpersonationLayout";
import { StickyShopNav } from "@/components/navigation/StickyShopNav";
import { ProductConfigurator } from "@/components/product/ProductConfigurator";
import { ProductCard } from "@/components/product/ProductCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

interface Subcategory {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  sort_order: number;
  active: boolean;
}

interface MainCategory {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  sort_order: number;
  active: boolean;
}

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
  const { room, category } = useParams<{ room: string; category: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [cabinetTypes, setCabinetTypes] = useState<CabinetType[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [activeSubcategory, setActiveSubcategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [selectedCabinet, setSelectedCabinet] = useState<CabinetType | null>(null);
  const [roomCategory, setRoomCategory] = useState<any>(null);
  const [showStickyFilter, setShowStickyFilter] = useState(false);
  const filterSectionRef = useRef<HTMLDivElement>(null);

  // Category display names
  const getCategoryDisplayName = (cat: string) => {
    return cat?.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || 'Cabinets';
  };

  const displayCategory = getCategoryDisplayName(category);

  
  // Always show sticky filter for better UX
  useEffect(() => {
    // Always show the sticky filter on category pages
    setShowStickyFilter(true);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!room || !category) {
        navigate('/shop');
        return;
      }

      try {
        // Decode and clean URL parameters
        const decodedRoom = decodeURIComponent(room).trim();
        const decodedCategory = decodeURIComponent(category).trim();
        
        console.log('Loading data for:', { 
          originalRoom: room, 
          originalCategory: category,
          decodedRoom, 
          decodedCategory 
        });

        // Load room category from unified_categories (Level 1)
        const { data: roomData, error: roomError } = await supabase
          .from('unified_categories')
          .select('*')
          .eq('name', decodedRoom)
          .eq('level', 1)
          .eq('active', true)
          .single();

        if (roomError) {
          console.error('Room not found:', roomError);
          throw roomError;
        }
        setRoomCategory(roomData);

        // Load all Level 2 categories for this room (for main category dropdown)
        const { data: mainCatsData, error: mainCatsError } = await supabase
          .from('unified_categories')
          .select('*')
          .eq('level', 2)
          .eq('parent_id', roomData.id)
          .eq('active', true)
          .order('sort_order', { ascending: true });

        if (mainCatsError) {
          console.error('Error loading main categories:', mainCatsError);
          setMainCategories([]);
        } else {
          setMainCategories(mainCatsData || []);
          console.log('Loaded main categories:', mainCatsData);
        }

        // Load Level 3 subcategories for this specific room/category combination
        // First get the Level 2 category ID that belongs to this room
        // Try multiple lookup strategies for better matching
        let level2Data = null;
        
        // Strategy 1: Exact match with decoded category
        const { data: level2Exact, error: level2ExactError } = await supabase
          .from('unified_categories')
          .select('id, name, display_name')
          .eq('level', 2)
          .eq('name', decodedCategory)
          .eq('parent_id', roomData.id)
          .eq('active', true)
          .maybeSingle();
          
        if (level2Exact) {
          level2Data = level2Exact;
          console.log('Found exact match for category:', level2Data);
        } else {
          // Strategy 2: Fuzzy match by display_name or partial name
          const { data: allLevel2, error: allLevel2Error } = await supabase
            .from('unified_categories')
            .select('id, name, display_name')
            .eq('level', 2)
            .eq('parent_id', roomData.id)
            .eq('active', true);
            
          if (allLevel2) {
            level2Data = allLevel2.find(cat => 
              cat.name.toLowerCase().trim() === decodedCategory.toLowerCase().trim() ||
              cat.display_name.toLowerCase().trim() === decodedCategory.toLowerCase().trim() ||
              cat.name.toLowerCase().includes(decodedCategory.toLowerCase().trim()) ||
              cat.display_name.toLowerCase().includes(decodedCategory.toLowerCase().trim())
            );
            console.log('Fuzzy match result:', { decodedCategory, allLevel2, found: level2Data });
          }
        }

        if (level2Data) {
          console.log('Found level 2 category:', level2Data);
          // Now get Level 3 subcategories for this specific room/category
          const { data: subcatsData, error: subcatsError } = await supabase
            .from('unified_categories')
            .select('*')
            .eq('level', 3)
            .eq('active', true)
            .eq('parent_id', level2Data.id)
            .order('sort_order', { ascending: true });

          if (subcatsError) {
            console.error('Error loading subcategories:', subcatsError);
            setSubcategories([]);
          } else {
            setSubcategories(subcatsData || []);
            console.log('Loaded subcategories for', level2Data.name, ':', subcatsData);
          }
        } else {
          console.error('Level 2 category not found for:', decodedCategory, 'in room:', decodedRoom);
          setSubcategories([]);
        }

        // Load cabinet types for this room and category
        // Map unified category names to cabinet_types category values
        const categoryMap: Record<string, string> = {
          'Base Cabinets': 'base',
          'Wall Cabinets': 'wall', 
          'Pantry Cabinets': 'tall',
          'Specialty Cabinets': 'specialty',
          'Broom Cabinets': 'broom',
          'Mirror Cabinets': 'mirrors',
          'Storage Cabinets': 'storage',
          'Storage Solutions': 'storage',
          'Weather Resistant': 'weatherproof',
          'Specialty Units': 'specialty',
          'Hanging Systems': 'hanging',
          'Dress Panels & Fillers': 'dress_panels' // New category mapping
        };
        
        const mappedCategory = categoryMap[decodedCategory] || decodedCategory.toLowerCase().replace(/\s+/g, '_');
        console.log('Category mapping:', { decodedCategory, mappedCategory });
        
        const { data, error } = await supabase
          .from('cabinet_types')
          .select('*')
          .eq('active', true)
          .eq('category', mappedCategory)
          .eq('room_category_id', roomData.id)
          .order('display_order', { ascending: true });

        if (error) {
          console.error('Error loading cabinet types:', error);
          setCabinetTypes([]);
        } else {
          setCabinetTypes(data || []);
          console.log('Loaded cabinet types for', decodedCategory, ':', data?.map(ct => ({ name: ct.name, subcategory: ct.subcategory })));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Reset state on error to prevent stale data
        setCabinetTypes([]);
        setSubcategories([]);
        setMainCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [room, category, navigate]);

  // Handle auto-opening configurator from URL parameter
  useEffect(() => {
    const cabinetId = searchParams.get('cabinet');
    if (cabinetId && cabinetTypes.length > 0) {
      const cabinet = cabinetTypes.find(c => c.id === cabinetId);
      if (cabinet) {
        setSelectedCabinet(cabinet);
        setConfiguratorOpen(true);
        // Remove the parameter from URL without affecting browser history
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('cabinet');
        const newURL = newSearchParams.toString() 
          ? `/shop/${room}/${category}?${newSearchParams.toString()}` 
          : `/shop/${room}/${category}`;
        navigate(newURL, { replace: true });
      }
    }
  }, [searchParams, cabinetTypes, room, category, navigate]);

  // Filter cabinet types by active subcategory
  const filteredCabinetTypes = useMemo(() => {
    if (activeSubcategory === "all") {
      return cabinetTypes;
    }
    
    // Handle subcategory filtering with flexible matching
    return cabinetTypes.filter(cabinet => {
      if (!cabinet.subcategory) return false;
      
      // Find matching subcategory with flexible matching
      const selectedSubcat = subcategories.find(s => s.name === activeSubcategory);
      if (!selectedSubcat) return false;
      
      const cabinetSubcat = cabinet.subcategory.toLowerCase().trim();
      const subcatName = selectedSubcat.name.toLowerCase().trim();
      const subcatDisplay = selectedSubcat.display_name.toLowerCase().trim();
      
      // Multiple matching strategies
      return cabinetSubcat === subcatName || 
             cabinetSubcat === subcatDisplay ||
             cabinetSubcat.includes(subcatDisplay) ||
             subcatDisplay.includes(cabinetSubcat) ||
             // Handle variations like "Base Doors" vs "doors" 
             (subcatDisplay === "doors" && cabinetSubcat.includes("door")) ||
             (subcatDisplay === "drawers" && cabinetSubcat.includes("drawer")) ||
             (subcatDisplay === "corners" && cabinetSubcat.includes("corner"));
    });
  }, [cabinetTypes, activeSubcategory, subcategories]);

  // Handle main category change
  const handleMainCategoryChange = (newCategory: string) => {
    // Clear current state to prevent cross-contamination
    setCabinetTypes([]);
    setSubcategories([]);
    setActiveSubcategory("all");
    
    // Navigate to new category
    navigate(`/shop/${room}/${encodeURIComponent(newCategory)}`);
  };

  // Handle filter change and scroll to products
  const handleFilterChange = (subcategory: string) => {
    setActiveSubcategory(subcategory);
    
    // Scroll to products grid when sticky filter is active
    if (showStickyFilter) {
      setTimeout(() => {
        const productsGrid = document.getElementById('products-grid');
        if (productsGrid) {
          const headerHeight = 120; // Account for sticky filter height
          const targetPosition = productsGrid.offsetTop - headerHeight;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  const handleConfigureProduct = (cabinet: CabinetType) => {
    setSelectedCabinet(cabinet);
    setConfiguratorOpen(true);
  };

  const handleViewProduct = (cabinet: CabinetType) => {
    const slug = cabinet.url_slug || cabinet.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/shop/${room}/${category}/${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <DynamicHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <ImpersonationLayout>
      <Helmet>
        <title>{displayCategory} {roomCategory?.display_name || ''} | Premium Cabinet Solutions</title>
        <meta 
          name="description" 
          content={`Browse our collection of ${displayCategory.toLowerCase()} for ${roomCategory?.display_name?.toLowerCase() || 'your space'}. High-quality, customizable cabinets with professional installation.`} 
        />
        <meta 
          name="keywords" 
          content={`${displayCategory.toLowerCase()}, ${roomCategory?.name || ''} cabinets, custom cabinets`} 
        />
        <link rel="canonical" href={`${window.location.origin}/shop/${room}/${category}`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <DynamicHeader />
        <StickyShopNav 
          showStickyFilter={showStickyFilter}
          subcategories={subcategories}
          activeSubcategory={activeSubcategory}
          onFilterChange={handleFilterChange}
          displayCategory={displayCategory}
          mainCategories={mainCategories}
          activeMainCategory={category}
          onMainCategoryChange={handleMainCategoryChange}
          room={room}
        />
        
        
          <main className="w-full px-6 mobile-safe-bottom py-8">
          {/* SEO-Hidden Breadcrumbs - Always present for search engines */}
          <Breadcrumb className="seo-hidden" aria-hidden="true">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/shop">Shop</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/shop/${room}`}>{roomCategory?.display_name}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{displayCategory}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Category Header - Hide when sticky filter is active */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">{displayCategory} {roomCategory?.display_name}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover our premium {displayCategory.toLowerCase()} designed for {roomCategory?.display_name?.toLowerCase() || 'your space'}. 
              Each cabinet is crafted with precision and can be customized to your exact specifications.
            </p>
          </div>

          {/* Hide original filter buttons since we now have sticky filter */}
          <div className="sr-only">
            {subcategories.length > 0 && (
              <div ref={filterSectionRef} className="mb-8">
                <div className="flex flex-wrap gap-3 justify-center">
                   <Button
                     variant={activeSubcategory === "all" ? "default" : "outline"}
                     onClick={() => handleFilterChange("all")}
                     className="px-6 py-2"
                   >
                     All {displayCategory}
                   </Button>
                   {subcategories.map((subcat) => (
                     <Button
                       key={subcat.id}
                       variant={activeSubcategory === subcat.name ? "default" : "outline"}
                       onClick={() => handleFilterChange(subcat.name)}
                       className="px-6 py-2"
                     >
                       {subcat.display_name}
                     </Button>
                   ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Hidden ref element for scroll detection when sticky filter is active */}
          {showStickyFilter && <div ref={filterSectionRef} className="absolute top-0" />}

          {/* Products Grid */}
          <div id="products-grid">
            {filteredCabinetTypes.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-2">No cabinets available</h3>
                <p className="text-muted-foreground">Check back later for new products.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
                {filteredCabinetTypes.map((cabinet) => (
                  <ProductCard
                    key={cabinet.id}
                    cabinet={cabinet}
                    room={room}
                    displayCategory={displayCategory}
                    roomCategory={roomCategory}
                    onViewProduct={handleViewProduct}
                    onConfigureProduct={handleConfigureProduct}
                  />
                ))}
              </div>
            )}
          </div>
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
    </ImpersonationLayout>
  );
};

export default CategoryPage;