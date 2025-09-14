import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Upload, Calculator, FileText, Truck, MapPin } from "lucide-react";
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
    { state: "NSW", color: "bg-blue-100 text-blue-800" },
    { state: "QLD", color: "bg-green-100 text-green-800" },
    { state: "VIC", color: "bg-purple-100 text-purple-800" },
    { state: "SA", color: "bg-orange-100 text-orange-800" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 gradient-text">
              Get Your Custom Kitchen Quote
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From concept to completion - we make custom kitchen cabinets accessible and affordable across Australia
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-12">
            {/* Process Section */}
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-8">Our Simple 5-Step Process</h2>
              
              <div className="space-y-6">
                {processSteps.map((step, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 p-3 bg-primary/10 rounded-lg">
                          {step.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            {step.title}
                          </h3>
                          <p className="text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Delivery Information */}
              <Card className="mt-8 bg-gradient-to-r from-primary/5 to-blue-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">Delivery Areas</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    We can transport to depots across Australia:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {deliveryAreas.map((area, index) => (
                      <Badge key={index} variant="secondary" className={area.color}>
                        {area.state}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-4 p-4 bg-white/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Flat Pack:</strong> Available Australia-wide<br />
                      <strong>Assembled:</strong> Selected areas only<br />
                      <strong>Pre-drilled & Labeled:</strong> All cabinets come with cabinet numbers matching your drawings for easy assembly
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quote Form */}
            <div>
              <QuoteForm />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default GetQuote;