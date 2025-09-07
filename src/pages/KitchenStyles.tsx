import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const KitchenStyles = () => {
  const styles = [
    {
      name: "Shadowline",
      description: "The Shadowline's classic look has a high-end feel. You can customize the doors to any colour to personalise your kitchen design. You'll love spending time in this kitchen for many years to come.",
      features: ["High-end classic look", "Customizable colours", "Matt, Satin, Gloss finishes"],
      image: "/lovable-uploads/b6d88c5d-54f3-4b8d-9ac4-6fdf2711d29e.png"
    },
    {
      name: "Shaker",
      description: "Our most popular kitchen style is a modern take on a classic kitchen design that will stand the test of time. Available in Poly, Laminate and Ultra Glaze door finishes.",
      features: ["Modern classic design", "Timeless appeal", "Multiple finish options"],
      image: "/lovable-uploads/1fa9627e-0972-4137-b95b-ef3bcb26b66c.png"
    },
    {
      name: "Poly",
      description: "Another popular kitchen style. With its classic modern look, it's a versatile design. The premium 2 pack paint on the doors can be done in any colour. You can choose from matt, satin or high gloss finishes.",
      features: ["Classic modern look", "Versatile design", "Premium 2 pack paint", "Any colour available"],
      image: "/api/placeholder/600/400"
    },
    {
      name: "Ultra Glaze",
      description: "Ultra Glaze is fast becoming one of our most popular kitchen finishes. It creates a modern-looking kitchen design with a high-shine mirror finish. Doors are available in a wide selection of colours, in a range of plain, metallic & matt finishes.",
      features: ["High-shine mirror finish", "Modern design", "Wide colour selection", "Plain, metallic & matt options"],
      image: "/api/placeholder/600/400"
    },
    {
      name: "Laminex Impressions",
      description: "Impressions is a 3D textured board. The finish gives a natural timber look. Available in a wide range of colours.",
      features: ["3D textured surface", "Natural timber appearance", "Wide colour range"],
      image: "/api/placeholder/600/400"
    },
    {
      name: "Polytec Ravine",
      description: "This is a 3D textured wood finish that gives a realistic wood look at an affordable price. The range consists of light and dark finishes.",
      features: ["3D textured wood finish", "Realistic wood appearance", "Affordable pricing", "Light and dark options"],
      image: "/api/placeholder/600/400"
    },
    {
      name: "Outdoor Kitchens",
      description: "We offer a wide range of materials for outdoor conditions, such as Poly finished doors and the Stylelite outdoor range. If you prefer a more industrial look, we have glass with aluminium frames.",
      features: ["Weather-resistant materials", "Poly finished doors", "Stylelite outdoor range", "Glass with aluminium frames"],
      image: "/api/placeholder/600/400"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Kitchen <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Styles</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Discover our range of premium kitchen styles designed to transform your space. From classic elegance to modern sophistication, find the perfect style for your home.
            </p>
            <Button variant="hero" size="lg" className="px-8 py-6 text-lg">
              Get Free Consultation
            </Button>
          </div>
        </div>
      </section>

      {/* Styles Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {styles.map((style, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-500 border-0 shadow-lg">
                <CardContent className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img 
                      src={style.image} 
                      alt={style.name}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-foreground mb-4 capitalize">
                      {style.name}
                    </h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {style.description}
                    </p>
                    
                    <div className="mb-6">
                      <h4 className="font-semibold text-foreground mb-3">Key Features:</h4>
                      <ul className="space-y-2">
                        {style.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center text-muted-foreground">
                            <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button variant="hero" className="flex-1">
                        View Designs
                      </Button>
                      <Button variant="outline" className="flex-1">
                        Get Quote
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Transform Your Kitchen?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Our expert team will help you choose the perfect style for your space. Get a free consultation today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" className="px-8">
              Book Free Consultation
            </Button>
            <Button variant="outline" size="lg" className="px-8">
              View Cabinet Prices
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default KitchenStyles;