import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Upload, Calculator, FileText, Truck, MapPin, Sparkles, ArrowRight } from "lucide-react";
import QuoteForm from "@/components/QuoteForm";

const GetQuote = () => {
  const processSteps = [
    {
      icon: <Upload className="h-8 w-8 text-primary" />,
      title: "1. Upload Your Plans",
      description: "Share your kitchen plans from any source - IKEA, Bunnings, other kitchen companies, or hand-sketched designs"
    },
    {
      icon: <Calculator className="h-8 w-8 text-primary" />,
      title: "2. Receive Your Quote",
      description: "We'll provide a detailed quote for your custom cabinet solution"
    },
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      title: "3. 10% Deposit & Drawings",
      description: "If you're happy to proceed, pay a 10% deposit and we'll arrange professional drawings with on-site measurements"
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-primary" />,
      title: "4. Approval & Production",
      description: "Once you approve the drawings, we'll send DocuSign for final approval and start production"
    },
    {
      icon: <Truck className="h-8 w-8 text-primary" />,
      title: "5. Delivery & Assembly",
      description: "Receive your cabinets flat-packed or assembled, all pre-drilled and labeled for easy installation"
    }
  ];

  const deliveryAreas = [
    { state: "NSW" },
    { state: "QLD" },
    { state: "VIC" },
    { state: "SA" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-400/20 to-purple-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-400/20 to-cyan-600/20 rounded-full blur-3xl" />
      
      <Header />
      
      <main className="pt-24 pb-12 relative">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-medium text-primary mb-6">
              <Sparkles className="h-4 w-4" />
              Professional Kitchen Solutions
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent mb-6 leading-tight">
              Get Your Custom<br />Kitchen Quote
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              From concept to completion - we make custom kitchen cabinets accessible and affordable across Australia
            </p>
            <div className="flex items-center justify-center gap-2 mt-8">
              <ArrowRight className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-sm text-slate-500 font-medium">Scroll to see our process</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 mb-16">
            {/* Process Section */}
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-8 w-1 bg-gradient-to-b from-primary to-blue-600 rounded-full" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Our Simple 5-Step Process
                </h2>
              </div>
              
              <div className="space-y-4">
                {processSteps.map((step, index) => (
                  <Card 
                    key={index} 
                    className="group relative bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardContent className="p-6 relative">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 relative">
                          <div className="p-4 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                            {step.icon}
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-primary to-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-primary transition-colors duration-300">
                            {step.title}
                          </h3>
                          <p className="text-slate-600 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Delivery Information */}
              <Card className="mt-8 relative bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-blue-50/50 to-purple-50/80" />
                <CardContent className="p-8 relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-2xl">
                      <MapPin className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                      Delivery Areas
                    </h3>
                  </div>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    We can transport to depots across Australia:
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {deliveryAreas.map((area, index) => (
                      <div key={index} className="group">
                        <Badge 
                          variant="secondary" 
                          className="w-full py-2 bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 border-slate-200 group-hover:from-primary/10 group-hover:to-blue-500/10 group-hover:border-primary/30 group-hover:text-primary transition-all duration-300"
                        >
                          {area.state}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/50">
                    <div className="flex items-start gap-3">
                      <Truck className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-800">Flat Pack:</span>
                        <span className="text-slate-600 ml-2">Available Australia-wide</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-800">Assembled:</span>
                        <span className="text-slate-600 ml-2">Selected areas only</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-800">Pre-drilled & Labeled:</span>
                        <span className="text-slate-600 ml-2">All cabinets come with cabinet numbers matching your drawings for easy assembly</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quote Form */}
            <div className="animate-fade-in relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl opacity-30" />
              <div className="relative">
                <QuoteForm />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default GetQuote;