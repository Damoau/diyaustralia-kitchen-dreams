import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import cabinetsDetail from "@/assets/cabinets-detail.jpg";
import benchtopDetail from "@/assets/benchtop-detail.jpg";

const Services = () => {
  return (
    <section id="services" className="py-24 bg-gray-light/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Our <span className="bg-gradient-to-r from-primary to-blue-dark bg-clip-text text-transparent">Expert</span> Services
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium">
            We specialize in creating beautiful, functional kitchens with premium materials 
            and exceptional craftsmanship that stands the test of time.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white">
            <div className="aspect-video overflow-hidden">
              <img
                src={cabinetsDetail}
                alt="Custom kitchen cabinets with detailed woodwork"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <CardHeader className="pb-4">
              <CardTitle className="text-3xl text-foreground font-bold">Custom Kitchen Cabinets</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                Handcrafted cabinets tailored to your space and style preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 mb-8 text-muted-foreground">
                <li className="flex items-center">
                  <div className="w-3 h-3 bg-primary rounded-full mr-4"></div>
                  Premium Australian timber and materials
                </li>
                <li className="flex items-center">
                  <div className="w-3 h-3 bg-primary rounded-full mr-4"></div>
                  Soft-close hinges and drawer systems
                </li>
                <li className="flex items-center">
                  <div className="w-3 h-3 bg-primary rounded-full mr-4"></div>
                  Custom sizes and configurations
                </li>
                <li className="flex items-center">
                  <div className="w-3 h-3 bg-primary rounded-full mr-4"></div>
                  Modern and traditional styles available
                </li>
              </ul>
              <Button variant="outline" className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold">
                Learn More About Cabinets
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white">
            <div className="aspect-video overflow-hidden">
              <img
                src={benchtopDetail}
                alt="Beautiful marble benchtop installation"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <CardHeader className="pb-4">
              <CardTitle className="text-3xl text-foreground font-bold">Premium Benchtops</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                Stunning stone and engineered surfaces for lasting beauty
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 mb-8 text-muted-foreground">
                <li className="flex items-center">
                  <div className="w-3 h-3 bg-primary rounded-full mr-4"></div>
                  Natural stone, quartz, and granite options
                </li>
                <li className="flex items-center">
                  <div className="w-3 h-3 bg-primary rounded-full mr-4"></div>
                  Professional templating and installation
                </li>
                <li className="flex items-center">
                  <div className="w-3 h-3 bg-primary rounded-full mr-4"></div>
                  Seamless joins and perfect finishes
                </li>
                <li className="flex items-center">
                  <div className="w-3 h-3 bg-primary rounded-full mr-4"></div>
                  Heat and scratch resistant surfaces
                </li>
              </ul>
              <Button variant="outline" className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold">
                Explore Benchtop Options
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-16">
          <Button variant="hero" size="lg" className="px-12 py-4 text-lg">
            Get Your Free Quote Today
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Services;