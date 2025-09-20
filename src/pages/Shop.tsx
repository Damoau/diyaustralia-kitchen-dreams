import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Package, Layers, RectangleHorizontal, Wrench, Settings, ArrowRight, MessageSquare, FileText } from "lucide-react";
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
  
  // Specialty form state
  const [specialtyForm, setSpecialtyForm] = useState({
    name: '',
    email: '',
    phone: '',
    description: ''
  });
  const [specialtyFormLoading, setSpecialtyFormLoading] = useState(false);

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

  const handleSpecialtyFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!specialtyForm.name || !specialtyForm.email || !specialtyForm.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSpecialtyFormLoading(true);
    
    try {
      // Submit specialty quote request with all required fields
      const { error } = await supabase
        .from('quote_requests')
        .insert({
          name: specialtyForm.name,
          email: specialtyForm.email,
          phone: specialtyForm.phone || '',
          suburb: 'Not specified',
          project_type: 'specialty_cabinet',
          timeframe: 'flexible',
          kitchen_style: 'specialty',
          approximate_budget: 'to-be-determined',
          additional_notes: `SPECIALTY CABINET REQUEST\n\nDescription: ${specialtyForm.description}\n\nSubmitted via: Shop Specialty Form`
        });

      if (error) throw error;

      toast.success("Specialty quote request submitted successfully! We'll contact you within 24 hours.");
      
      // Reset form
      setSpecialtyForm({
        name: '',
        email: '',
        phone: '',
        description: ''
      });
    } catch (error) {
      console.error('Error submitting specialty quote:', error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setSpecialtyFormLoading(false);
    }
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

          {/* Cabinet Types Grid or Specialty Landing */}
          {!loading && selectedCategory === 'specialty' ? (
            // Specialty Category Landing Page
            <div className="max-w-4xl mx-auto">
              <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="bg-gradient-to-r from-primary/10 to-blue-600/10 p-8 text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wrench className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    Custom Cabinet Design Service
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Can't find the perfect cabinet online? We specialize in creating custom cabinet solutions 
                    tailored to your unique space and requirements. From corner units to specialized storage, 
                    we can quote on any cabinet design you need.
                  </p>
                </div>

                <div className="p-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Quick Quote Form */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-semibold">Quick Quote Request</h3>
                      </div>
                      <p className="text-muted-foreground mb-6">
                        Tell us about your custom cabinet needs and we'll get back to you within 24 hours.
                      </p>
                      
                      <form onSubmit={handleSpecialtyFormSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="specialty-name">Name *</Label>
                          <Input
                            id="specialty-name"
                            value={specialtyForm.name}
                            onChange={(e) => setSpecialtyForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Your full name"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="specialty-email">Email *</Label>
                          <Input
                            id="specialty-email"
                            type="email"
                            value={specialtyForm.email}
                            onChange={(e) => setSpecialtyForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="your@email.com"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="specialty-phone">Phone (Optional)</Label>
                          <Input
                            id="specialty-phone"
                            type="tel"
                            value={specialtyForm.phone}
                            onChange={(e) => setSpecialtyForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Your phone number"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="specialty-description">Describe Your Cabinet Needs *</Label>
                          <Textarea
                            id="specialty-description"
                            value={specialtyForm.description}
                            onChange={(e) => setSpecialtyForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Tell us about your custom cabinet requirements, dimensions, special features, etc."
                            className="min-h-[100px]"
                            required
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={specialtyFormLoading}
                        >
                          {specialtyFormLoading ? 'Submitting...' : 'Submit Quick Quote Request'}
                        </Button>
                      </form>
                    </div>

                    {/* Full Quote Option */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-semibold">Detailed Quote</h3>
                      </div>
                      <p className="text-muted-foreground mb-6">
                        For complex projects or if you have detailed plans, sketches, or specific requirements, 
                        use our comprehensive quote form.
                      </p>
                      
                      <div className="bg-muted/50 rounded-lg p-6 mb-6">
                        <h4 className="font-medium mb-3">Perfect for:</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Complete kitchen renovations</li>
                          <li>• Complex corner cabinet solutions</li>
                          <li>• Custom storage requirements</li>
                          <li>• Projects with architectural drawings</li>
                          <li>• Multiple cabinet types</li>
                        </ul>
                      </div>
                      
                      <Link to="/get-quote">
                        <Button variant="outline" className="w-full group">
                          Go to Full Quote Form
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mt-12 pt-8 border-t border-border/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                        </div>
                        <h4 className="font-medium mb-1">Expert Design</h4>
                        <p className="text-sm text-muted-foreground">Professional cabinet designers with 20+ years experience</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <span className="text-blue-600 dark:text-blue-400 text-xl">⚡</span>
                        </div>
                        <h4 className="font-medium mb-1">Quick Turnaround</h4>
                        <p className="text-sm text-muted-foreground">Most quotes delivered within 24-48 hours</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <span className="text-purple-600 dark:text-purple-400 text-xl">💰</span>
                        </div>
                        <h4 className="font-medium mb-1">Competitive Pricing</h4>
                        <p className="text-sm text-muted-foreground">Direct from manufacturer pricing, no markup</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ) : !loading && (
            // Regular Cabinet Types Grid
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

          {/* Empty State - only show for non-specialty categories */}
          {!loading && filteredCabinetTypes.length === 0 && selectedCategory !== 'specialty' && (
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