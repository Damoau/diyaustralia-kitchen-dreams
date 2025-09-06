import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import cabinetsDetail from "@/assets/cabinets-detail.jpg";
import benchtopDetail from "@/assets/benchtop-detail.jpg";

const Services = () => {
  return (
    <section id="services" className="py-20 bg-gradient-to-b from-background to-cream">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Our Expert Services
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We specialize in creating beautiful, functional kitchens with premium materials 
            and exceptional craftsmanship that stands the test of time.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="aspect-video overflow-hidden">
              <img
                src={cabinetsDetail}
                alt="Custom kitchen cabinets with detailed woodwork"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Custom Kitchen Cabinets</CardTitle>
              <CardDescription className="text-lg">
                Handcrafted cabinets tailored to your space and style preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6 text-muted-foreground">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Premium Australian timber and materials
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Soft-close hinges and drawer systems
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Custom sizes and configurations
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Modern and traditional styles available
                </li>
              </ul>
              <Button variant="outline" className="w-full">
                Learn More About Cabinets
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="aspect-video overflow-hidden">
              <img
                src={benchtopDetail}
                alt="Beautiful marble benchtop installation"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Premium Benchtops</CardTitle>
              <CardDescription className="text-lg">
                Stunning stone and engineered surfaces for lasting beauty
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6 text-muted-foreground">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Natural stone, quartz, and granite options
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Professional templating and installation
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Seamless joins and perfect finishes
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Heat and scratch resistant surfaces
                </li>
              </ul>
              <Button variant="outline" className="w-full">
                Explore Benchtop Options
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <Button variant="hero" size="lg">
            Get Your Free Quote Today
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Services;