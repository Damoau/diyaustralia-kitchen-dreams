import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Calculator, Package, Home, Archive, Grid3X3 } from "lucide-react";
import Header from "@/components/Header";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Header />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Calculator className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Price List</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse our comprehensive pricing for all cabinet categories. 
            All prices include materials and are calculated based on your selected configurations.
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card 
                key={category.id} 
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                onClick={() => navigate(category.path)}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <p className="text-muted-foreground mb-4">{category.description}</p>
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    View Pricing
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Section */}
        <Card className="max-w-4xl mx-auto border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Calculator className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Live Pricing</h3>
                <p className="text-sm text-muted-foreground">
                  All prices are calculated in real-time based on current material costs and configurations
                </p>
              </div>
              <div>
                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">All Inclusive</h3>
                <p className="text-sm text-muted-foreground">
                  Prices include all materials, hardware, and finishes for complete cabinet solutions
                </p>
              </div>
              <div>
                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Grid3X3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Custom Sizes</h3>
                <p className="text-sm text-muted-foreground">
                  Browse standard sizes or contact us for custom dimensions and configurations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default PriceList;