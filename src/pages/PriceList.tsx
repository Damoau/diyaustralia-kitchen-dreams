import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Calculator, Package, Home, Archive, Grid3X3 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PriceList = () => {
  const navigate = useNavigate();

  const categories = [
    {
      id: 'base',
      title: 'Base Cabinets',
      description: 'Floor-standing cabinets for kitchen bases',
      icon: Package,
      path: '/price-list/base-cabinets',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'top',
      title: 'Top Cabinets', 
      description: 'Wall-mounted upper cabinets',
      icon: Home,
      path: '/price-list/top-cabinets',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'pantry',
      title: 'Pantry Cabinets',
      description: 'Full-height storage solutions',
      icon: Archive,
      path: '/price-list/pantry-cabinets', 
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'dress',
      title: 'Dress Panels',
      description: 'Finishing panels and fillers',
      icon: Grid3X3,
      path: '/price-list/dress-panels',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Cabinet <span className="text-primary">Pricing</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Browse our comprehensive pricing for all cabinet categories. 
              All prices include materials and are calculated based on your selected configurations.
            </p>

            {/* Quick Navigation Buttons - All Screen Sizes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
              {categories.map((category) => (
                <Button 
                  key={category.id}
                  onClick={() => navigate(category.path)}
                  variant="outline" 
                  className="h-12 text-xs md:text-sm font-medium"
                >
                  {category.title}
                </Button>
              ))}
            </div>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Card 
                  key={category.id} 
                  className="group hover:shadow-elegant transition-all duration-300 cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden h-full flex flex-col"
                  onClick={() => navigate(category.path)}
                >
                  {/* Icon section instead of image */}
                  <div className="aspect-video md:aspect-square flex items-center justify-center">
                    <div className={`w-20 h-20 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  
                  <CardHeader className="text-center flex-grow">
                    <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                      {category.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0 mt-auto">
                    <Button 
                      className="w-full" 
                      size="lg"
                      variant="outline"
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      View Pricing
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Features Section */}
          <div className="mt-16 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calculator className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Live Pricing</h3>
                <p className="text-muted-foreground">All prices are calculated in real-time based on current material costs and configurations</p>
              </div>
              
              <div className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">All Inclusive</h3>
                <p className="text-muted-foreground">Prices include all materials, hardware, and finishes for complete cabinet solutions</p>
              </div>
              
              <div className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Grid3X3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Custom Sizes</h3>
                <p className="text-muted-foreground">Browse standard sizes or contact us for custom dimensions and configurations</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PriceList;