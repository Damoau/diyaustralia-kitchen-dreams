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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50 relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.05),transparent_50%)]" />
      
      <Header />
      
      <main className="pt-20 pb-8 relative">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Compact Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 rounded-full text-sm font-medium text-primary mb-4">
              <Sparkles className="h-3 w-3" />
              Professional Kitchen Solutions
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-br from-slate-900 via-slate-700 to-slate-600 bg-clip-text text-transparent mb-4 leading-tight">
              Custom Kitchen Quote
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Professional kitchen cabinets delivered across Australia
            </p>
          </div>

          {/* Main Content - Single Column Layout */}
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Quote Form - Priority Position */}
            <Card className="relative bg-white/80 backdrop-blur-sm border-0 shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5" />
              <CardContent className="p-8 relative">
                <QuoteForm />
              </CardContent>
            </Card>

            {/* Compact Process Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {processSteps.slice(0, 3).map((step, index) => (
                <Card 
                  key={index} 
                  className="group bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl p-4"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="relative">
                      <div className="p-3 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        {step.icon}
                      </div>
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-br from-primary to-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {index + 1}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-1 text-sm">
                        {step.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Remaining Steps */}
            <div className="grid md:grid-cols-2 gap-4">
              {processSteps.slice(3).map((step, index) => (
                <Card 
                  key={index + 3} 
                  className="group bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="p-3 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        {step.icon}
                      </div>
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-br from-primary to-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {index + 4}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-1 text-sm">
                        {step.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Compact Delivery Info */}
            <Card className="bg-gradient-to-r from-emerald-50/80 via-blue-50/50 to-purple-50/80 border-0 shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-xl">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                      Australia-Wide Delivery
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    {deliveryAreas.map((area, index) => (
                      <Badge 
                        key={index}
                        variant="secondary" 
                        className="text-xs bg-white/60 text-slate-700 border-slate-200/50 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-300"
                      >
                        {area.state}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span><strong>Flat Pack:</strong> Australia-wide</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span><strong>Assembled:</strong> Selected areas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <span><strong>Pre-drilled</strong> & labeled</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default GetQuote;