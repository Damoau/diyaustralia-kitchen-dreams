import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Factory, 
  Settings, 
  Tag, 
  Wrench, 
  CheckCircle, 
  Truck,
  Ruler,
  Shield,
  MapPin,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

const Manufacturing = () => {
  const manufacturingSteps = [
    {
      icon: <Factory className="h-8 w-8 text-primary" />,
      title: "CNC Precision Cutting",
      description: "Every cabinet is cut with state-of-the-art CNC machines in our Australian factory, ensuring perfect dimensions and consistent quality."
    },
    {
      icon: <Tag className="h-8 w-8 text-primary" />,
      title: "Smart Labeling System", 
      description: "Each piece is labeled to match your kitchen drawings, making assembly straightforward and error-free."
    },
    {
      icon: <Settings className="h-8 w-8 text-primary" />,
      title: "Pre-Drilling & Preparation",
      description: "All components come pre-drilled and ready for assembly - no measuring or drilling required on your end."
    },
    {
      icon: <Wrench className="h-8 w-8 text-primary" />,
      title: "Simple Assembly",
      description: "Just use a cordless screwdriver to assemble. Complete assembly plans included with every cabinet order."
    }
  ];

  const materials = [
    {
      title: "Carcass Material",
      description: "Australian-made HMR (High Moisture Resistant) particleboard",
      badge: "Premium Quality"
    },
    {
      title: "Door Material - Polyshaker Shadowline",
      description: "MRMDF (Moisture Resistant MDF) with two-pack polyurethane paint finish",
      badge: "Two-Pack Polyurethane"
    },
    {
      title: "Additional Board Options",
      description: "Laminex and Polytec boards - all Australian-made premium materials",
      badge: "Australian Made"
    }
  ];

  const factoryCapabilities = [
    { number: "5", label: "CNC Machines", icon: <Factory className="h-6 w-6" /> },
    { number: "3", label: "Edge Banders", icon: <Settings className="h-6 w-6" /> },
    { number: "100%", label: "Quality Guarantee", icon: <CheckCircle className="h-6 w-6" /> }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Manufacturing &{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Assembly
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Discover how our precision manufacturing and simple assembly process delivers 
                professional-quality kitchens straight to your door.
              </p>
              <Link to="/get-quote">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Get Your Quote Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Manufacturing Process */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Our Manufacturing Process</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                From precision cutting to your doorstep, every step is designed for quality and ease of assembly.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {manufacturingSteps.map((step, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20">
                  <CardHeader>
                    <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                      {step.icon}
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Assembly Details */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-foreground mb-12">Simple Assembly Process</h2>
              
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Wrench className="h-6 w-6 text-primary" />
                      Tools Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span>Cordless screwdriver (that's it!)</span>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        No drilling, no measuring, no complicated tools. Just a simple cordless screwdriver 
                        and you're ready to assemble professional-quality cabinets.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Ruler className="h-6 w-6 text-primary" />
                      Adjustable Legs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span>Knock-in design - pre-drilled holes</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span>Adjustable from 100mm to 190mm</span>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Perfect leveling for any floor with our adjustable leg system.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardHeader>
                  <CardTitle className="text-center">Assembly Plans Included</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">
                      Every cabinet comes with detailed assembly plans. Each labeled piece corresponds directly 
                      to your kitchen drawings, making the process intuitive and straightforward.
                    </p>
                    <div className="flex justify-center items-center gap-2">
                      <Tag className="h-5 w-5 text-primary" />
                      <span className="font-medium">Smart labeling system ensures perfect assembly</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Materials Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Premium Materials</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We use only the finest Australian-made materials and premium hardware for lasting quality.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {materials.map((material, index) => (
                <Card key={index} className="border-border/50 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-lg">{material.title}</CardTitle>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {material.badge}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{material.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-primary/20">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-bold mb-4">Soft-Close Hardware</h3>
                <p className="text-muted-foreground mb-4">
                  All drawer runners and hinges feature premium soft-close mechanisms for a luxury feel and lasting performance.
                </p>
                <div className="flex justify-center items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="font-medium">Premium quality guaranteed</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Factory Capabilities */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Factory Capabilities</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our state-of-the-art facility ensures speed, precision, and consistent quality in every cabinet we manufacture.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {factoryCapabilities.map((capability, index) => (
                <Card key={index} className="text-center border-border/50 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                      {capability.icon}
                    </div>
                    <div className="text-3xl font-bold text-primary mb-2">{capability.number}</div>
                    <div className="text-muted-foreground">{capability.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Packaging & Delivery */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardHeader>
                  <CardTitle className="text-center flex items-center justify-center gap-3 text-2xl">
                    <Truck className="h-8 w-8 text-primary" />
                    Protected Interstate Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <p className="text-muted-foreground">
                    For interstate deliveries, we wrap every cabinet in a hard wooden timber box for maximum protection. 
                    This ensures your cabinets arrive in perfect condition, ready for assembly.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Hard wooden timber protection</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>100% delivery guarantee</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>Australia-wide delivery</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>Damage-free guarantee</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-primary to-secondary">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto text-white">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Your Kitchen Project?</h2>
              <p className="text-xl opacity-90 mb-8">
                Experience the quality of Australian-made cabinets with our precision manufacturing and simple assembly process.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/get-quote">
                  <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                    Get Your Free Quote
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/products">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Browse Products
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Manufacturing;