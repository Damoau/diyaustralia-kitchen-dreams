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
    description: "Share your kitchen plans from any source - IKEA, Bunnings, other kitchen companies, or hand-sketched designs"
  }, {
    icon: <Calculator className="h-12 w-12 text-primary" />,
    title: "Receive Your Quote",
    description: "We'll provide a detailed quote for your custom cabinet solution"
  }, {
    icon: <FileText className="h-12 w-12 text-primary" />,
    title: "10% Deposit & Drawings",
    description: "If you're happy to proceed, pay a 10% deposit and we'll arrange professional drawings with on-site measurements"
  }, {
    icon: <CheckCircle className="h-12 w-12 text-primary" />,
    title: "Approval & Production",
    description: "Once you approve the drawings, we'll send DocuSign for final approval and start production"
  }, {
    icon: <Truck className="h-12 w-12 text-primary" />,
    title: "Delivery & Assembly",
    description: "Receive your cabinets flat-packed or assembled, all pre-drilled and labeled for easy installation"
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
              <div className="space-y-8 flex-1 relative">
                {/* Continuous timeline line */}
                <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary to-primary/30"></div>
                
                {processSteps.map((step, index) => (
                  <div key={index} className="relative flex items-start gap-6">
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

              {/* Delivery Areas */}
              <Card className="mt-12 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <MapPin className="h-8 w-8 text-primary" />
                    <h3 className="text-2xl font-semibold text-foreground">Delivery Areas</h3>
                  </div>
                  
                  <p className="text-muted-foreground mb-6">We can transport to depots across Australia:</p>
                  
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 px-4 py-2 text-base">
                      NSW
                    </Badge>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 px-4 py-2 text-base">
                      QLD
                    </Badge>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200 px-4 py-2 text-base">
                      VIC
                    </Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 px-4 py-2 text-base">
                      SA
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quote Form */}
            <div id="quote-form">
              <QuoteForm />
            </div>
          </div>

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