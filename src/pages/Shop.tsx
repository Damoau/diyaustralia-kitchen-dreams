import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Package, Layers, Home, Wrench } from "lucide-react";
import baseCabinetsImage from "@/assets/base-cabinets-hero.jpg";

const Shop = () => {
  const categories = [
    {
      id: 'base-cabinets',
      title: 'Base Cabinets',
      description: 'Foundation cabinets for your kitchen workspace',
      icon: <Home className="h-12 w-12 text-primary" />,
      path: '/shop/base-cabinets',
      image: baseCabinetsImage
    },
    {
      id: 'top-cabinets',
      title: 'Top Cabinets',
      description: 'Wall-mounted storage solutions',
      icon: <Package className="h-12 w-12 text-primary" />,
      path: '/shop/top-cabinets',
      image: '/lovable-uploads/8bf7a8e1-3389-40d8-bd11-5ff1d7de50e8.png' // Placeholder
    },
    {
      id: 'pantry-cabinets',
      title: 'Pantry Cabinets',
      description: 'Tall storage for maximum organization',
      icon: <Layers className="h-12 w-12 text-primary" />,
      path: '/shop/pantry-cabinets',
      image: '/lovable-uploads/b6d88c5d-54f3-4b8d-9ac4-6fdf2711d29e.png' // Placeholder
    },
    {
      id: 'dress-panels',
      title: 'Dress Panels & Fillers',
      description: 'Finishing touches for your kitchen',
      icon: <Wrench className="h-12 w-12 text-primary" />,
      path: '/shop/dress-panels',
      image: '/lovable-uploads/1fa9627e-0972-4137-b95b-ef3bcb26b66c.png' // Placeholder
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
              Cabinet <span className="text-transparent bg-clip-text bg-gradient-primary">Shop</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Browse our complete range of kitchen cabinets. Configure and customize each cabinet to your exact specifications.
            </p>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category) => (
              <Card key={category.id} className="group hover:shadow-elegant transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    <img 
                      src={category.image} 
                      alt={category.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="mb-4">
                    {category.icon}
                  </div>
                  <CardTitle className="text-xl mb-2">{category.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <Button asChild className="w-full" size="lg">
                    <Link to={category.path}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Browse Collection
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features Section */}
          <div className="mt-16 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Custom Configuration</h3>
                <p className="text-muted-foreground">Customize every aspect of your cabinets to fit your exact needs</p>
              </div>
              
              <div className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Quality Materials</h3>
                <p className="text-muted-foreground">Premium materials and finishes for lasting durability</p>
              </div>
              
              <div className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Easy Ordering</h3>
                <p className="text-muted-foreground">Simple configuration process with instant pricing</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Shop;