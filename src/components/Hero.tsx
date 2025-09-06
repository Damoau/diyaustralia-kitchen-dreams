import { Button } from "@/components/ui/button";
import heroKitchen from "@/assets/hero-kitchen.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroKitchen}
          alt="Beautiful custom kitchen with wooden cabinets and marble benchtops"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 to-foreground/30"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          Custom Kitchen
          <span className="block text-accent">Perfection</span>
        </h1>
        
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
          Transform your kitchen with our premium custom cabinets and benchtops. 
          Australian craftsmanship meets modern design.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button variant="hero" size="lg">
            Free Consultation
          </Button>
          <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-foreground">
            View Gallery
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">15+</div>
            <div className="text-sm opacity-90">Years Experience</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">500+</div>
            <div className="text-sm opacity-90">Kitchens Completed</div>
          </div>
          <div className="text-center col-span-2 md:col-span-1">
            <div className="text-3xl font-bold mb-2">100%</div>
            <div className="text-sm opacity-90">Satisfaction Rate</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;