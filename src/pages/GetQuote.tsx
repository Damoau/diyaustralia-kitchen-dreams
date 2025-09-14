import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Upload, Calculator, FileText, Truck, MapPin, Star, ChevronDown } from "lucide-react";
import QuoteForm from "@/components/QuoteForm";
import { useState, useEffect } from "react";
import logoBlum from "@/assets/logo-blum.png";
import logoTitus from "@/assets/logo-titus.png";
import logoPolytec from "@/assets/logo-polytec.png";
import logoLaminex from "@/assets/logo-laminex.png";
const GetQuote = () => {
  const [isSticky, setIsSticky] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const scrollToForm = () => {
    document.getElementById('quote-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };
  const processSteps = [{
    icon: <Upload className="h-12 w-12 text-primary" />,
    title: "Upload Plans",
    description: "Send us your hand drawings, Bunnings plans, IKEA kitchen designs, or plans from any kitchen company. We work with any format - photos, PDFs, or even rough sketches on paper."
  }, {
    icon: <Calculator className="h-12 w-12 text-primary" />,
    title: "Get Quote",
    description: "Our expert team analyzes your plans and provides a detailed, itemized quote within 24 hours. Includes material costs, hardware options, and delivery estimates with no hidden fees."
  }, {
    icon: <FileText className="h-12 w-12 text-primary" />,
    title: "Approve Design",
    description: "Receive professional CAD drawings with precise measurements and 3D renderings. Make any adjustments needed before we finalize your custom cabinet specifications."
  }, {
    icon: <CheckCircle className="h-12 w-12 text-primary" />,
    title: "Production",
    description: "Your cabinets are custom manufactured in our Australian facility using premium materials and precision machinery. Track your order progress through our production stages."
  }, {
    icon: <Truck className="h-12 w-12 text-primary" />,
    title: "Delivery",
    description: "Receive your cabinets pre-drilled, labeled, and ready to install. Flat-pack delivery Australia-wide or assembled delivery to selected metro areas with white-glove service."
  }];
  const testimonials = [{
    name: "Sarah M.",
    location: "Sydney, NSW",
    rating: 5,
    text: "Exceptional quality cabinets at half the price of major retailers. The installation was seamless!"
  }, {
    name: "David K.",
    location: "Melbourne, VIC",
    rating: 5,
    text: "Professional service from quote to delivery. Our kitchen transformation exceeded expectations."
  }, {
    name: "Emma L.",
    location: "Brisbane, QLD",
    rating: 5,
    text: "Custom sizing was perfect for our unique space. Highly recommend for anyone wanting quality cabinets."
  }];
  const supplierLogos = [{
    name: "Blum",
    logo: logoBlum
  }, {
    name: "Titus",
    logo: logoTitus
  }, {
    name: "Polytec",
    logo: logoPolytec
  }, {
    name: "Laminex",
    logo: logoLaminex
  }];
  return <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Header />
      
      {/* Sticky Mobile CTA */}
      {isSticky && <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
          <Button onClick={scrollToForm} className="w-full bg-primary text-white shadow-lg animate-fade-in" size="lg">
            Get My Free Quote Now
          </Button>
        </div>}
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 gradient-text">
              Get Your Custom Kitchen Quote
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-8 leading-relaxed">
              Australian-made custom cabinets • Any size, any style • Fast Australia-wide delivery
            </p>
            
          </div>

          <div className="grid lg:grid-cols-2 gap-16 mb-16 lg:items-stretch">
            {/* Process Timeline */}
            <div className="flex flex-col h-full">
              <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Simple 5-Step Process</h2>
              
              {/* Vertical Timeline */}
              <div className="space-y-8 flex-1">
                {processSteps.map((step, index) => (
                  <div key={index} className="relative flex items-start gap-6">
                    {/* Timeline line */}
                    {index < processSteps.length - 1 && (
                      <div className="absolute left-8 top-20 w-0.5 h-12 bg-gradient-to-b from-primary to-primary/30"></div>
                    )}
                    
                    {/* Step icon */}
                    <div className="relative z-10 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full border-2 border-primary/20 shadow-lg">
                      {step.icon}
                    </div>
                    
                    {/* Step content */}
                    <div className="flex-1 min-w-0 pt-2">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant="secondary" className="text-xs font-medium">
                          Step {index + 1}
                        </Badge>
                        <h3 className="text-lg font-semibold text-foreground">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Options */}
              <Card className="mt-12 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <Truck className="h-8 w-8 text-primary" />
                      <h3 className="text-2xl font-semibold text-foreground">Delivery Options</h3>
                    </div>
                    <p className="text-muted-foreground">Choose the delivery method that works best for you</p>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Flat Pack Option */}
                    <div className="bg-white/80 rounded-xl p-6 border border-primary/10">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                          <MapPin className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="text-lg font-semibold text-foreground">Flat Pack Delivery</h4>
                            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                              Australia-Wide
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">
                            Ready-to-assemble cabinets delivered to your door with all hardware and detailed instructions.
                          </p>
                          <div className="flex flex-wrap gap-2 text-sm">
                            <span className="px-3 py-1 bg-primary/5 text-primary rounded-full">Free shipping over $2000</span>
                            <span className="px-3 py-1 bg-primary/5 text-primary rounded-full">5-10 business days</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Assembled Option */}
                    <div className="bg-white/80 rounded-xl p-6 border border-primary/10">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                          <CheckCircle className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="text-lg font-semibold text-foreground">Assembled Delivery</h4>
                            <Badge variant="outline" className="border-orange-200 text-orange-700">
                              Metro Areas
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">
                            Fully assembled cabinets delivered and positioned in your home by our professional team.
                          </p>
                          <div className="flex flex-wrap gap-2 text-sm mb-3">
                            <span className="px-3 py-1 bg-primary/5 text-primary rounded-full">White glove service</span>
                            <span className="px-3 py-1 bg-primary/5 text-primary rounded-full">Installation ready</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Available in Sydney, Melbourne, Brisbane, Perth, Adelaide metro areas
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quote Form */}
            <div id="quote-form">
              <QuoteForm />
            </div>
          </div>

          {/* Trusted Suppliers */}
          <Card className="mb-16 bg-gradient-to-r from-muted/30 to-background">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold text-foreground mb-6">Trusted by Premium Suppliers</h3>
              <div className="flex justify-center items-center gap-8 flex-wrap opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
                {supplierLogos.map((supplier, index) => <div key={index} className="w-20 h-12 flex items-center justify-center">
                    <img src={supplier.logo} alt={`${supplier.name} logo`} className="max-w-full max-h-full object-contain" />
                  </div>)}
              </div>
            </CardContent>
          </Card>

          {/* Customer Testimonials */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-center text-foreground mb-8">What Our Customers Say</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <CardContent className="space-y-4">
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />)}
                    </div>
                    <p className="text-muted-foreground italic">"{testimonial.text}"</p>
                    <div className="pt-2 border-t">
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                    </div>
                  </CardContent>
                </Card>)}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>;
};
export default GetQuote;