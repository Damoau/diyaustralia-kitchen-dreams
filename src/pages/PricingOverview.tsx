import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  ChefHat, 
  Home, 
  Package, 
  Settings, 
  Shield, 
  Award, 
  Truck, 
  Ruler, 
  Palette,
  MapPin,
  CheckCircle,
  Factory
} from "lucide-react";

const PricingOverview = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-background via-muted/10 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-8">
              Cabinet <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Pricing</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed">
              Premium Australian-made cabinets with transparent pricing and exceptional quality
            </p>
            
            {/* Key Features Badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Factory className="h-4 w-4 mr-2" />
                Australian Made
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Shield className="h-4 w-4 mr-2" />
                HMR Materials
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Palette className="h-4 w-4 mr-2" />
                2-Pack Finishes
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Ruler className="h-4 w-4 mr-2" />
                Custom Sizes
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Cabinet Categories - Inline Layout */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Choose Your Cabinet Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Base Cabinets */}
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary/20">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full w-fit group-hover:scale-110 transition-transform">
                  <Home className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl">Base Cabinets</CardTitle>
                <CardDescription className="text-center">
                  Foundation cabinets for your kitchen workspace
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link to="/pricing/base-cabinets">
                  <Button className="w-full">View Base Cabinet Prices</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Top Cabinets */}
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary/20">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full w-fit group-hover:scale-110 transition-transform">
                  <Package className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl">Top Cabinets</CardTitle>
                <CardDescription className="text-center">
                  Wall-mounted storage solutions
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link to="/pricing/top-cabinets">
                  <Button className="w-full">View Top Cabinet Prices</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pantry */}
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary/20">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full w-fit group-hover:scale-110 transition-transform">
                  <ChefHat className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl">Pantry</CardTitle>
                <CardDescription className="text-center">
                  Full-height storage solutions
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link to="/pricing/pantry">
                  <Button className="w-full">View Pantry Prices</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Dress Panels & Fillers */}
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary/20">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full w-fit group-hover:scale-110 transition-transform">
                  <Settings className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl">Dress Panels & Fillers</CardTitle>
                <CardDescription className="text-center">
                  Finishing accessories
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link to="/pricing/panels-fillers">
                  <Button className="w-full">View Accessory Prices</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Materials & Quality Section */}
      <section className="py-20 bg-gradient-to-br from-muted/30 to-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Premium Australian Materials</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Every cabinet is crafted using the finest Australian-made High Moisture Resistant (HMR) materials, 
              ensuring exceptional durability and longevity in your kitchen.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 border-muted hover:border-primary/30 transition-colors">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                  <Factory className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Australian Made HMR</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  High Moisture Resistant particle board manufactured locally in Australia, 
                  meeting strict quality standards for kitchen environments.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Moisture resistant core
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Australian manufacturing
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Premium grade materials
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-muted hover:border-primary/30 transition-colors">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                  <Palette className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Quality 2-Pack Finishes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Professional 2-pack polyurethane finishes provide superior durability 
                  and a flawless, long-lasting appearance.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Scratch resistant surface
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Easy to clean & maintain
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Professional grade finish
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-muted hover:border-primary/30 transition-colors">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Shadowline & Shaker Styles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Choose from our premium door styles including modern Shadowline 
                  and classic Shaker profiles for any kitchen aesthetic.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Shadowline modern profile
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Classic Shaker design
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Multiple color options
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Custom Sizes Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Custom Sizes Available</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Standard dimensions with flexible customization options to fit your exact requirements.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <Card className="p-6">
                  <div className="text-center">
                    <Ruler className="h-8 w-8 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Height Options</h3>
                    <p className="text-sm text-muted-foreground mb-2">Standard: 720mm</p>
                    <p className="text-xs text-primary font-medium">Custom up to 1000mm</p>
                    <p className="text-xs text-muted-foreground">(25% surcharge)</p>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <div className="text-center">
                    <Ruler className="h-8 w-8 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Depth Options</h3>
                    <p className="text-sm text-muted-foreground mb-2">Standard: 560mm</p>
                    <p className="text-xs text-primary font-medium">Custom up to 900mm</p>
                    <p className="text-xs text-muted-foreground">(25% surcharge)</p>
                  </div>
                </Card>
              </div>
            </div>
            
            <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10">
              <h3 className="text-2xl font-bold mb-6">Why Choose Custom?</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Perfect Fit:</strong> Maximize your space utilization with exact measurements
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Design Flexibility:</strong> Create unique layouts that match your vision
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Affordable Upgrades:</strong> Only 25% surcharge for custom dimensions
                  </div>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Delivery Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6">Delivery to Major Depots</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We deliver across Australia's major states with convenient depot pickup locations 
              for easy collection and installation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center p-6 border-2 hover:border-primary/30 transition-colors">
              <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">New South Wales</h3>
              <p className="text-muted-foreground">Multiple depot locations across NSW for convenient pickup</p>
            </Card>
            
            <Card className="text-center p-6 border-2 hover:border-primary/30 transition-colors">
              <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                <MapPin className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Queensland</h3>
              <p className="text-muted-foreground">Strategic depot locations throughout QLD for easy access</p>
            </Card>
            
            <Card className="text-center p-6 border-2 hover:border-primary/30 transition-colors">
              <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
                <Truck className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Fast Delivery</h3>
              <p className="text-muted-foreground">Efficient logistics ensure your cabinets arrive on schedule</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="p-12 text-center bg-gradient-to-r from-primary/5 to-primary/10 border-2 border-primary/20">
            <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Explore our cabinet categories above to see detailed pricing and configure your perfect kitchen solution.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/pricing/base-cabinets">
                <Button size="lg" className="px-8 py-3">
                  Start with Base Cabinets
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="px-8 py-3">
                  Contact Us
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PricingOverview;