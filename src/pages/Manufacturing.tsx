import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEOTags } from "@/components/SEOTags";
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
  ArrowRight,
  Zap,
  Timer,
  Award,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";

const Manufacturing = () => {
  const heroRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const manufacturingSteps = [
    {
      icon: <Factory className="h-10 w-10" />,
      title: "CNC Precision Cutting",
      description: "Every cabinet is cut with state-of-the-art CNC machines in our Australian factory, ensuring perfect dimensions and consistent quality.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Tag className="h-10 w-10" />,
      title: "Smart Labeling System", 
      description: "Each piece is labeled to match your kitchen drawings, making assembly straightforward and error-free.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Settings className="h-10 w-10" />,
      title: "Pre-Drilling & Preparation",
      description: "All components come pre-drilled and ready for assembly - no measuring or drilling required on your end.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Wrench className="h-10 w-10" />,
      title: "Simple Assembly",
      description: "Just use a cordless screwdriver to assemble. Complete assembly plans included with every cabinet order.",
      color: "from-orange-500 to-red-500"
    }
  ];

  const materials = [
    {
      title: "Carcass Material",
      description: "Australian-made HMR (High Moisture Resistant) particleboard",
      badge: "Premium Quality",
      icon: <Shield className="h-6 w-6" />,
      gradient: "from-blue-500/10 to-indigo-500/10"
    },
    {
      title: "Door Material - Polyshaker Shadowline",
      description: "MRMDF (Moisture Resistant MDF) with two-pack polyurethane paint finish",
      badge: "Two-Pack Polyurethane",
      icon: <Award className="h-6 w-6" />,
      gradient: "from-purple-500/10 to-pink-500/10"
    },
    {
      title: "Additional Board Options",
      description: "Laminex and Polytec boards - all Australian-made premium materials",
      badge: "Australian Made",
      icon: <MapPin className="h-6 w-6" />,
      gradient: "from-green-500/10 to-emerald-500/10"
    }
  ];

  const factoryCapabilities = [
    { 
      number: "5", 
      label: "CNC Machines", 
      icon: <Factory className="h-8 w-8" />,
      description: "State-of-the-art precision cutting"
    },
    { 
      number: "3", 
      label: "Edge Banders", 
      icon: <Settings className="h-8 w-8" />,
      description: "High-speed edge finishing"
    },
    { 
      number: "100%", 
      label: "Quality Guarantee", 
      icon: <CheckCircle className="h-8 w-8" />,
      description: "Every cabinet meets our standards"
    }
  ];

  const stats = [
    { number: "1000+", label: "Kitchens Delivered", icon: <Users className="h-6 w-6" /> },
    { number: "48hr", label: "Production Time", icon: <Timer className="h-6 w-6" /> },
    { number: "5★", label: "Customer Rating", icon: <Award className="h-6 w-6" /> },
    { number: "24/7", label: "Support Available", icon: <Zap className="h-6 w-6" /> }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <SEOTags pageType="static" pageIdentifier="/manufacturing" />
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section 
          ref={heroRef}
          className="relative py-24 md:py-32 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden"
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>
          </div>
          
          <div className="container relative mx-auto px-4">
            <div className="max-w-5xl mx-auto text-center animate-on-scroll">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
                <Factory className="h-4 w-4 text-white" />
                <span className="text-white text-sm font-medium">Australian Made Excellence</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-8">
                <span className="text-white">Precision</span>{" "}
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Manufacturing
                </span>
                <br />
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Simple Assembly
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
                Experience the perfect blend of cutting-edge technology and thoughtful design. 
                From our Australian factory to your home in just a few simple steps.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/get-quote">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-8 py-4 text-lg font-semibold hover-scale">
                    Start Your Project
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg">
                  Watch Process Video
                </Button>
              </div>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="absolute bottom-8 left-0 right-0">
            <div className="container mx-auto px-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center animate-on-scroll" style={{ animationDelay: `${index * 200}ms` }}>
                      <div className="flex justify-center mb-2">
                        <div className="p-2 bg-white/20 rounded-lg">
                          {React.cloneElement(stat.icon, { className: "text-white" })}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-white">{stat.number}</div>
                      <div className="text-white/70 text-sm">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Manufacturing Process - Modern Bento Grid */}
        <section className="py-24 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 animate-on-scroll">
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
                <Settings className="h-4 w-4 text-primary" />
                <span className="text-primary text-sm font-medium">Manufacturing Excellence</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Our <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Process</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Every cabinet follows our proven 4-step process, combining advanced technology with meticulous craftsmanship.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {manufacturingSteps.map((step, index) => (
                <Card 
                  key={index} 
                  className={`group relative overflow-hidden bg-gradient-to-br ${step.color}/5 border-0 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-on-scroll`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  {/* Background gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                  
                  <CardHeader className="relative pb-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-4 rounded-2xl bg-gradient-to-br ${step.color} shadow-lg`}>
                        {React.cloneElement(step.icon, { className: "text-white" })}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-primary/70 mb-2">STEP {index + 1}</div>
                        <CardTitle className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                          {step.title}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="relative">
                    <p className="text-muted-foreground leading-relaxed text-lg">{step.description}</p>
                    
                    {/* Progress connector for desktop */}
                    {index < manufacturingSteps.length - 1 && (
                      <div className="hidden md:block absolute -right-4 top-1/2 w-8 h-0.5 bg-gradient-to-r from-muted to-transparent"></div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Assembly Details - Interactive Section */}
        <section className="py-24 bg-gradient-to-b from-muted/20 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16 animate-on-scroll">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                  <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    Assembly Made Simple
                  </span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Our smart design means you can build professional-quality cabinets with minimal tools and maximum confidence.
                </p>
              </div>
              
              {/* Main assembly grid */}
              <div className="grid lg:grid-cols-3 gap-8 mb-12">
                {/* Tools Required - Featured Card */}
                <Card className="lg:col-span-2 group relative overflow-hidden bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border-0 hover:shadow-2xl transition-all duration-500 animate-on-scroll">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                  
                  <CardHeader className="relative">
                    <CardTitle className="flex items-center gap-4 text-2xl">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500">
                        <Wrench className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-primary/70 mb-1">WHAT YOU NEED</div>
                        <div>Just One Tool</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="relative space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-white/50 rounded-xl">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-lg">Cordless Screwdriver</div>
                        <div className="text-muted-foreground">That's literally it!</div>
                      </div>
                    </div>
                    
                    <div className="bg-muted/50 rounded-xl p-6">
                      <h4 className="font-semibold mb-3 text-lg">Why So Simple?</h4>
                      <ul className="space-y-2 text-muted-foreground">
                        <li>• Pre-drilled holes eliminate measuring</li>
                        <li>• No complex joints or hardware installation</li>
                        <li>• Clear assembly instructions with every order</li>
                        <li>• Average assembly time: 30-60 minutes per cabinet</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Adjustable Legs - Compact Card */}
                <Card className="group relative overflow-hidden bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-0 hover:shadow-2xl transition-all duration-500 animate-on-scroll" style={{ animationDelay: '200ms' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                  
                  <CardHeader className="relative">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500">
                        <Ruler className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-primary/70 mb-1">ADJUSTABLE</div>
                        <div className="text-lg">Smart Legs</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="relative space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">Knock-in design</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">100mm - 190mm range</span>
                      </div>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">±45mm</div>
                        <div className="text-xs text-muted-foreground">Height adjustment</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Assembly Plans - Full Width Feature */}
              <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-0 hover:shadow-2xl transition-all duration-500 animate-on-scroll" style={{ animationDelay: '400ms' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                
                <CardHeader className="relative text-center">
                  <CardTitle className="flex items-center justify-center gap-4 text-3xl">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
                      <Tag className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-primary/70 mb-1">INCLUDED WITH EVERY ORDER</div>
                      <div>Smart Assembly System</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="relative">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        Every cabinet comes with detailed assembly plans where each labeled piece corresponds directly 
                        to your kitchen drawings. Our smart labeling system makes assembly intuitive and error-free.
                      </p>
                      
                      <div className="flex items-center gap-3 p-4 bg-white/50 rounded-xl">
                        <Tag className="h-6 w-6 text-primary flex-shrink-0" />
                        <span className="font-semibold">Smart labeling system ensures perfect assembly every time</span>
                      </div>
                    </div>
                    
                    <div className="bg-muted/50 rounded-xl p-6">
                      <h4 className="font-semibold mb-4 text-lg">What's Included:</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Step-by-step guide</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Labeled components</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Hardware kit</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Support hotline</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Premium Materials - Modern Grid */}
        <section className="py-24 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 animate-on-scroll">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 rounded-full px-4 py-2 mb-4">
                <Award className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-600 text-sm font-medium">Premium Quality</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  Premium Materials
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Every component is carefully selected from Australia's leading suppliers, ensuring your kitchen 
                stands the test of time with uncompromising quality.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {materials.map((material, index) => (
                <Card 
                  key={index} 
                  className={`group relative overflow-hidden bg-gradient-to-br ${material.gradient} border-0 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 animate-on-scroll`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white/20 text-foreground border-white/30">
                      {material.badge}
                    </Badge>
                  </div>
                  
                  <CardHeader className="relative">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                        {material.icon}
                      </div>
                      <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {material.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="relative">
                    <p className="text-muted-foreground leading-relaxed">{material.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Soft-Close Hardware Feature */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-0 hover:shadow-2xl transition-all duration-500 animate-on-scroll">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
              
              <CardContent className="p-12 relative">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="text-center lg:text-left">
                    <div className="inline-flex items-center gap-3 mb-6">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500">
                        <Shield className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-primary/70 mb-1">PREMIUM HARDWARE</div>
                        <h3 className="text-3xl font-bold text-foreground">Soft-Close Technology</h3>
                      </div>
                    </div>
                    
                    <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                      Experience the luxury of premium soft-close mechanisms on every drawer and door. 
                      Our high-quality hardware ensures smooth, silent operation for years to come.
                    </p>
                    
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <span className="text-lg font-semibold">Lifetime quality guarantee</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/50 rounded-xl p-6 text-center">
                      <div className="text-2xl font-bold text-primary mb-2">100%</div>
                      <div className="text-muted-foreground">Soft-Close</div>
                    </div>
                    <div className="bg-white/50 rounded-xl p-6 text-center">
                      <div className="text-2xl font-bold text-primary mb-2">50,000+</div>
                      <div className="text-muted-foreground">Cycle Rating</div>
                    </div>
                    <div className="bg-white/50 rounded-xl p-6 text-center">
                      <div className="text-2xl font-bold text-primary mb-2">Silent</div>
                      <div className="text-muted-foreground">Operation</div>
                    </div>
                    <div className="bg-white/50 rounded-xl p-6 text-center">
                      <div className="text-2xl font-bold text-primary mb-2">Premium</div>
                      <div className="text-muted-foreground">Grade</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Factory Capabilities - Interactive Stats */}
        <section className="py-24 bg-gradient-to-b from-muted/20 to-slate-900 text-white overflow-hidden relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          <div className="container mx-auto px-4 relative">
            <div className="text-center mb-16 animate-on-scroll">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
                <Factory className="h-4 w-4 text-white" />
                <span className="text-white text-sm font-medium">State-of-the-Art Facility</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Factory Capabilities
                </span>
              </h2>
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                Our advanced manufacturing facility combines cutting-edge technology with skilled craftsmanship 
                to deliver exceptional results every time.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {factoryCapabilities.map((capability, index) => (
                <Card 
                  key={index} 
                  className="group relative overflow-hidden bg-white/10 backdrop-blur-sm border-white/20 text-center hover:bg-white/20 transition-all duration-500 hover:-translate-y-2 animate-on-scroll"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <CardContent className="p-8 relative">
                    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 w-fit mx-auto group-hover:scale-110 transition-transform duration-300">
                      {capability.icon}
                    </div>
                    <div className="text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                      {capability.number}
                    </div>
                    <div className="text-white/90 font-semibold text-lg mb-2">{capability.label}</div>
                    <div className="text-white/70 text-sm">{capability.description}</div>
                    
                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Additional Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-on-scroll" style={{ animationDelay: '600ms' }}>
              <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="text-3xl font-bold text-blue-400 mb-2">15+</div>
                <div className="text-white/70 text-sm">Years Experience</div>
              </div>
              <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="text-3xl font-bold text-cyan-400 mb-2">99.8%</div>
                <div className="text-white/70 text-sm">Precision Rate</div>
              </div>
              <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="text-3xl font-bold text-purple-400 mb-2">48hrs</div>
                <div className="text-white/70 text-sm">Lead Time</div>
              </div>
              <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="text-3xl font-bold text-pink-400 mb-2">Zero</div>
                <div className="text-white/70 text-sm">Waste Policy</div>
              </div>
            </div>
          </div>
        </section>

        {/* Packaging & Delivery - Enhanced Section */}
        <section className="py-24 bg-gradient-to-b from-slate-900 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-500/5 to-red-500/5 border-0 hover:shadow-2xl transition-all duration-500 animate-on-scroll">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                
                <CardHeader className="relative text-center pb-8">
                  <div className="inline-flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500">
                      <Truck className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-primary/70 mb-1">DELIVERY EXCELLENCE</div>
                      <CardTitle className="text-3xl md:text-4xl font-bold text-foreground">
                        Protected Interstate Delivery
                      </CardTitle>
                    </div>
                  </div>
                  
                  <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                    Every interstate delivery is wrapped in custom-built wooden timber boxes, ensuring your premium 
                    cabinets arrive in perfect condition, ready for immediate assembly.
                  </p>
                </CardHeader>
                
                <CardContent className="relative">
                  <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
                    {/* Protection Features */}
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-foreground mb-6">Protection Features</h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-white/50 rounded-xl">
                          <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-semibold">Hard Wooden Timber Protection</div>
                            <div className="text-muted-foreground text-sm">Custom-built protective casing for every shipment</div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4 p-4 bg-white/50 rounded-xl">
                          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                            <Shield className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-semibold">Damage-Free Guarantee</div>
                            <div className="text-muted-foreground text-sm">Full replacement if any damage occurs during transit</div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4 p-4 bg-white/50 rounded-xl">
                          <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                            <MapPin className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-semibold">Australia-Wide Coverage</div>
                            <div className="text-muted-foreground text-sm">Reliable delivery to every major city and regional area</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Delivery Stats */}
                    <div className="bg-muted/50 rounded-2xl p-8">
                      <h3 className="text-2xl font-bold text-foreground mb-6 text-center">Delivery Performance</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary mb-2">100%</div>
                          <div className="text-muted-foreground text-sm">Delivery Success</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary mb-2">3-7</div>
                          <div className="text-muted-foreground text-sm">Business Days</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary mb-2">Zero</div>
                          <div className="text-muted-foreground text-sm">Damage Claims</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                          <div className="text-muted-foreground text-sm">Tracking Support</div>
                        </div>
                      </div>
                      
                      <div className="mt-6 p-4 bg-primary/10 rounded-xl text-center">
                        <div className="text-sm font-semibold text-primary">Free Delivery Australia-Wide</div>
                        <div className="text-xs text-muted-foreground mt-1">On all orders over $2,000</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section - Modern Design */}
        <section className="py-24 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>
          </div>
          
          <div className="container relative mx-auto px-4 text-center animate-on-scroll">
            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
                <Zap className="h-4 w-4 text-white" />
                <span className="text-white text-sm font-medium">Ready to Get Started?</span>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white">
                Transform Your Kitchen{" "}
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Today
                </span>
              </h2>
              
              <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
                Join thousands of satisfied customers who've experienced the quality of Australian-made cabinets 
                with our precision manufacturing and simple assembly process.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
                <Link to="/get-quote">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-10 py-6 text-xl font-semibold hover-scale">
                    Get Your Free Quote
                    <ArrowRight className="ml-3 h-6 w-6" />
                  </Button>
                </Link>
                <Link to="/products">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-10 py-6 text-xl">
                    Browse Cabinets
                  </Button>
                </Link>
              </div>
              
              {/* Trust indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">Free</div>
                  <div className="text-white/70 text-sm">Consultation</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">48hr</div>
                  <div className="text-white/70 text-sm">Quick Quote</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">100%</div>
                  <div className="text-white/70 text-sm">Australian Made</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">Lifetime</div>
                  <div className="text-white/70 text-sm">Guarantee</div>
                </div>
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