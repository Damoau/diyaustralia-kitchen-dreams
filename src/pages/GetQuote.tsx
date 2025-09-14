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

              {/* Australia Map */}
              <Card className="mt-12 bg-gradient-to-r from-primary/5 to-blue-500/5">
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <MapPin className="h-8 w-8 text-primary" />
                    <h3 className="text-2xl font-semibold text-foreground">Australia-Wide Delivery</h3>
                  </div>
                  
                  {/* Simple Australia outline SVG */}
                  <div className="max-w-md mx-auto mb-6">
                    <svg viewBox="0 0 400 300" className="w-full h-48">
                      <path d="M50 150 Q80 100 120 120 L200 110 Q280 100 320 130 L350 160 Q360 200 340 220 L300 240 Q250 250 200 240 L120 250 Q80 230 60 200 Q40 180 50 150 Z" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth="2" className="animate-pulse" />
                      <circle cx="120" cy="180" r="4" fill="hsl(var(--primary))" />
                      <circle cx="200" cy="200" r="4" fill="hsl(var(--primary))" />
                      <circle cx="280" cy="170" r="4" fill="hsl(var(--primary))" />
                      <circle cx="320" cy="210" r="4" fill="hsl(var(--primary))" />
                      <text x="120" y="195" className="text-xs fill-primary" textAnchor="middle">NSW</text>
                      <text x="200" y="215" className="text-xs fill-primary" textAnchor="middle">VIC</text>
                      <text x="280" y="185" className="text-xs fill-primary" textAnchor="middle">QLD</text>
                      <text x="320" y="225" className="text-xs fill-primary" textAnchor="middle">SA</text>
                    </svg>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-white/50 rounded-lg">
                      <strong className="text-primary">Flat Pack:</strong> Australia-wide
                    </div>
                    <div className="p-3 bg-white/50 rounded-lg">
                      <strong className="text-primary">Assembled:</strong> Selected areas
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