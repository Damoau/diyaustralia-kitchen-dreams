import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ChefHat, Home, Package, Settings, Info } from "lucide-react";

const PricingOverview = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Cabinet <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Pricing</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Explore our complete range of cabinet solutions with transparent pricing.
            </p>
            
            {/* Standard Dimensions Info */}
            <div className="bg-muted/30 rounded-lg p-6 mb-12 max-w-3xl mx-auto">
              <div className="flex items-center justify-center mb-4">
                <Info className="h-5 w-5 mr-2 text-primary" />
                <h3 className="text-lg font-semibold">Standard Dimensions & Pricing</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div className="text-left">
                  <p className="font-medium text-foreground mb-2">Standard Height: 720mm</p>
                  <p className="text-muted-foreground mb-2">(excludes legs)</p>
                  <p className="text-primary font-medium">25% extra for custom height up to 1000mm</p>
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground mb-2">Standard Depth: 560mm</p>
                  <p className="text-muted-foreground mb-2">(plus door thickness)</p>
                  <p className="text-primary font-medium">25% extra for custom depth up to 900mm</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Base Cabinets */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit group-hover:bg-primary/20 transition-colors">
                  <Home className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Base Cabinets</CardTitle>
                <CardDescription>
                  Foundation cabinets for your kitchen workspace
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Standard height 720mm (excludes legs). Perfect for countertop installation.
                </p>
                <Link to="/pricing/base-cabinets">
                  <Button className="w-full">View Base Cabinet Prices</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Top Cabinets */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit group-hover:bg-primary/20 transition-colors">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Top Cabinets</CardTitle>
                <CardDescription>
                  Wall-mounted storage solutions
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Standard height 720mm with 350mm depth. Ideal for upper kitchen storage.
                </p>
                <Link to="/pricing/top-cabinets">
                  <Button className="w-full">View Top Cabinet Prices</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pantry */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit group-hover:bg-primary/20 transition-colors">
                  <ChefHat className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Pantry</CardTitle>
                <CardDescription>
                  Full-height storage solutions
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Standard height 2100mm. Maximum storage capacity for your kitchen.
                </p>
                <Link to="/pricing/pantry">
                  <Button className="w-full">View Pantry Prices</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Dress Panels & Fillers */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit group-hover:bg-primary/20 transition-colors">
                  <Settings className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Dress Panels & Fillers</CardTitle>
                <CardDescription>
                  Finishing accessories
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Complete your kitchen with matching panels and gap fillers.
                </p>
                <Link to="/pricing/panels-fillers">
                  <Button className="w-full">View Accessory Prices</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Cabinets?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Quality craftsmanship with transparent pricing and flexible customization options.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Custom Dimensions</h3>
              <p className="text-sm text-muted-foreground">
                Standard sizes with affordable custom options up to specified limits.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Quality Materials</h3>
              <p className="text-sm text-muted-foreground">
                Premium materials and finishes for long-lasting durability.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Professional Installation</h3>
              <p className="text-sm text-muted-foreground">
                Expert installation services available for all cabinet types.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PricingOverview;