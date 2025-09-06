import { Button } from "@/components/ui/button";
import heroKitchen from "@/assets/hero-kitchen.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-blue-light to-background">
      {/* Modern geometric background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-foreground rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight text-foreground">
            Modern Kitchen
            <span className="block bg-gradient-to-r from-primary to-blue-dark bg-clip-text text-transparent">
              Excellence
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed text-muted-foreground font-medium">
            Transform your space with cutting-edge custom cabinets and premium benchtops. 
            Where innovation meets Australian craftsmanship.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Button variant="hero" size="lg" className="px-12 py-4 text-lg">
              Start Your Project
            </Button>
            <Button variant="outline" size="lg" className="px-12 py-4 text-lg border-2 border-primary text-primary hover:bg-primary hover:text-white">
              Explore Designs
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl">
              <div className="text-4xl font-bold mb-2 text-primary">15+</div>
              <div className="text-sm text-muted-foreground font-medium">Years Excellence</div>
            </div>
            <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl">
              <div className="text-4xl font-bold mb-2 text-primary">500+</div>
              <div className="text-sm text-muted-foreground font-medium">Projects Delivered</div>
            </div>
            <div className="text-center col-span-2 md:col-span-1 p-6 bg-white/50 backdrop-blur-sm rounded-2xl">
              <div className="text-4xl font-bold mb-2 text-primary">100%</div>
              <div className="text-sm text-muted-foreground font-medium">Client Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;