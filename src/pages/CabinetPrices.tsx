import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfiguratorDialog } from "@/components/cabinet/ConfiguratorDialog";
import { supabase } from "@/integrations/supabase/client";
import { CabinetType } from "@/types/cabinet";

const CabinetPrices = () => {
  const [cabinetTypes, setCabinetTypes] = useState<CabinetType[]>([]);
  const [selectedCabinetType, setSelectedCabinetType] = useState<CabinetType | null>(null);
  const [selectedWidth, setSelectedWidth] = useState<number>(300);
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);

  // Load cabinet types
  useEffect(() => {
    loadCabinetTypes();
  }, []);

  const loadCabinetTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('category', 'base')
        .eq('active', true);

      if (error) throw error;
      setCabinetTypes((data || []) as CabinetType[]);
    } catch (error) {
      console.error('Error loading cabinet types:', error);
    }
  };

  const handleConfigure = (cabinetTypeName: string, width: number) => {
    const cabinetType = cabinetTypes.find(ct => ct.name === cabinetTypeName);
    if (cabinetType) {
      setSelectedCabinetType(cabinetType);
      setSelectedWidth(width);
      setIsConfiguratorOpen(true);
    }
  };

  const parseWidthRange = (widthStr: string): number => {
    // Extract the first number from width ranges like "150-199" or "600"
    const match = widthStr.match(/\d+/);
    return match ? parseInt(match[0]) : 300;
  };
  const finishTypes = [
    { name: "Standard Formica", note: "Add 10% for Gloss" },
    { name: "Standard Laminex", note: "Add 10% for Gloss" },
    { name: "Standard Poly Tec", note: "Add 10% for Standard Gloss" },
    { name: "Poly Tec Ravine & Nuance", note: "" },
    { name: "Laminex Impressions", note: "" },
    { name: "Poly (Matt, Satin, Gloss)", note: "" },
    { name: "Shadowline (Matt, Satin, Gloss)", note: "" },
    { name: "Ultra Glaze", note: "" },
    { name: "Shaker 86 degree - Satin", note: "" },
    { name: "Hampton & Provincial - Satin", note: "" },
    { name: "Outdoor BBQ Area", note: "" }
  ];

  const oneDoorPrices = [
    { width: "150-199", prices: [114, 120, 120, 139, 139, 139, 139, 147, 215, 277, 314] },
    { width: "200-249", prices: [132, 139, 139, 164, 164, 164, 164, 175, 253, 322, 398] },
    { width: "250-299", prices: [149, 158, 158, 190, 190, 190, 190, 203, 291, 367, 482] },
    { width: "300-349", prices: [167, 177, 177, 215, 215, 215, 215, 231, 328, 412, 566] },
    { width: "350-399", prices: [184, 197, 197, 241, 241, 241, 241, 260, 366, 456, 650] },
    { width: "400-449", prices: [202, 216, 216, 267, 267, 267, 267, 288, 404, 501, 734] },
    { width: "450-499", prices: [219, 235, 235, 292, 292, 292, 292, 316, 442, 546, 818] },
    { width: "500-549", prices: [237, 255, 255, 318, 318, 318, 318, 344, 479, 591, 902] },
    { width: "550-599", prices: [254, 274, 274, 344, 344, 344, 344, 373, 517, 636, 986] },
    { width: "600", prices: [272, 293, 293, 369, 369, 369, 369, 401, 555, 680, 1070] }
  ];

  const twoDoorPrices = [
    { width: "400-449", prices: [222, 237, 237, 289, 289, 289, 316, 337, 469, 609, 769] },
    { width: "450-499", prices: [234, 251, 251, 310, 310, 310, 337, 361, 503, 649, 850] },
    { width: "500-549", prices: [247, 266, 266, 331, 331, 331, 358, 385, 536, 690, 931] },
    { width: "600-649", prices: [272, 295, 295, 373, 373, 373, 400, 432, 603, 772, 1094] },
    { width: "700-749", prices: [298, 324, 324, 415, 415, 415, 442, 480, 670, 853, 1256] },
    { width: "800-849", prices: [323, 353, 353, 457, 457, 457, 484, 527, 737, 935, 1418] },
    { width: "900-949", prices: [348, 382, 382, 499, 499, 499, 526, 575, 804, 1016, 1580] },
    { width: "1000-1049", prices: [374, 411, 411, 541, 541, 541, 568, 622, 871, 1098, 1742] },
    { width: "1200", prices: [424, 469, 469, 625, 625, 625, 652, 717, 1005, 1261, 2067] }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Base Cabinet <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Prices</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Custom made base cabinets at low prices. All our cabinets are Australian made and custom made to order with premium materials and finishes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" className="px-8">
                Get Custom Quote
              </Button>
              <Button variant="outline" size="lg" className="px-8">
                View Kitchen Styles
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Cabinet Specifications */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-primary">Standard Height</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground mb-2">720mm</p>
                <p className="text-muted-foreground">(excludes legs)</p>
                <Badge variant="outline" className="mt-2">+25% for custom height up to 1000mm</Badge>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-primary">Standard Depth</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground mb-2">560mm</p>
                <p className="text-muted-foreground">(plus door thickness)</p>
                <p className="text-sm text-muted-foreground mb-2">Shadowline: 580mm (20mm doors)</p>
                <Badge variant="outline" className="mt-2">+25% for custom depth up to 900mm</Badge>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-primary">Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-foreground mb-2">16mm HMR</p>
                <p className="text-muted-foreground">Australian made with solid 16mm backs</p>
                <Badge variant="outline" className="mt-2">Plastic adjustable legs included</Badge>
              </CardContent>
            </Card>
          </div>

          {/* Pricing Tables */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground text-center mb-8">Cabinet Pricing</h2>
            
            <Tabs defaultValue="1door" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="1door">1 Door Cabinets</TabsTrigger>
                <TabsTrigger value="2door">2 Door Cabinets</TabsTrigger>
                <TabsTrigger value="drawers">Pot Drawers</TabsTrigger>
              </TabsList>

              <TabsContent value="1door">
                <Card>
                  <CardHeader>
                    <CardTitle>1 Door Base Cabinet Prices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-4 px-2 font-semibold text-foreground">Width</th>
                            <th className="text-left py-4 px-3 font-semibold text-foreground text-sm">Standard Formica</th>
                            <th className="text-left py-4 px-3 font-semibold text-foreground text-sm">Standard Laminex</th>
                            <th className="text-left py-4 px-3 font-semibold text-foreground text-sm">Poly Tec</th>
                            <th className="text-left py-4 px-3 font-semibold text-foreground text-sm">Impressions</th>
                            <th className="text-center py-4 px-2 font-semibold text-foreground">Action</th>
                          </tr>
                        </thead>
                         <tbody className="divide-y divide-border">
                           {oneDoorPrices.map((row, idx) => (
                             <tr key={idx} className="hover:bg-muted/30 transition-colors">
                               <td className="py-4 px-2 font-medium text-foreground">{row.width}mm</td>
                               <td className="py-4 px-3 text-foreground">${row.prices[0]}</td>
                               <td className="py-4 px-3 text-foreground">${row.prices[1]}</td>
                               <td className="py-4 px-3 text-foreground">${row.prices[2]}</td>
                               <td className="py-4 px-3 text-foreground">${row.prices[4]}</td>
                               <td className="py-4 px-2 text-center">
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => handleConfigure('1 Door Base Cabinet', parseWidthRange(row.width))}
                                   className="text-xs px-3"
                                 >
                                   Configure
                                 </Button>
                               </td>
                             </tr>
                           ))}
                         </tbody>
                      </table>
                    </div>
                    <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Note:</strong> Standard Formica and Laminex add 10% for gloss finish. Poly Tec add 10% for standard gloss. 
                        <Button variant="link" className="p-0 h-auto text-sm text-primary">View all finishes & pricing</Button>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="2door">
                <Card>
                  <CardHeader>
                    <CardTitle>2 Door Base Cabinet Prices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-4 px-2 font-semibold text-foreground">Width</th>
                            <th className="text-left py-4 px-3 font-semibold text-foreground text-sm">Standard Formica</th>
                            <th className="text-left py-4 px-3 font-semibold text-foreground text-sm">Standard Laminex</th>
                            <th className="text-left py-4 px-3 font-semibold text-foreground text-sm">Poly Tec</th>
                            <th className="text-left py-4 px-3 font-semibold text-foreground text-sm">Impressions</th>
                            <th className="text-center py-4 px-2 font-semibold text-foreground">Action</th>
                          </tr>
                        </thead>
                         <tbody className="divide-y divide-border">
                           {twoDoorPrices.map((row, idx) => (
                             <tr key={idx} className="hover:bg-muted/30 transition-colors">
                               <td className="py-4 px-2 font-medium text-foreground">{row.width}mm</td>
                               <td className="py-4 px-3 text-foreground">${row.prices[0]}</td>
                               <td className="py-4 px-3 text-foreground">${row.prices[1]}</td>
                               <td className="py-4 px-3 text-foreground">${row.prices[2]}</td>
                               <td className="py-4 px-3 text-foreground">${row.prices[4]}</td>
                               <td className="py-4 px-2 text-center">
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => handleConfigure('2 Door Base Cabinet', parseWidthRange(row.width))}
                                   className="text-xs px-3"
                                 >
                                   Configure
                                 </Button>
                               </td>
                             </tr>
                           ))}
                         </tbody>
                      </table>
                    </div>
                    <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Note:</strong> Standard Formica and Laminex add 10% for gloss finish. Poly Tec add 10% for standard gloss. 
                        <Button variant="link" className="p-0 h-auto text-sm text-primary">View all finishes & pricing</Button>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="drawers">
                <Card>
                  <CardHeader>
                    <CardTitle>2 Pot Drawers Prices</CardTitle>
                  </CardHeader>
                   <CardContent>
                     <div className="space-y-4">
                       <p className="text-muted-foreground">
                         Pot drawer prices vary by width and finish. Contact us for detailed pricing on drawer configurations.
                       </p>
                       <div className="flex gap-4">
                         <Button variant="hero">Get Drawer Pricing</Button>
                         <Button 
                           variant="outline"
                           onClick={() => handleConfigure('Pot Drawer Base', 900)}
                         >
                           Configure Pot Drawers
                         </Button>
                       </div>
                     </div>
                   </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Additional Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Important Pricing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Minimum Orders</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Minimum order: $4,000</li>
                    <li>• $1000-$2000: $700 service fee</li>
                    <li>• $2001-$3000: $450 service fee</li>
                    <li>• $3001-$4000: $250 service fee</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Custom Options</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Any colour from Dulux range</li>
                    <li>• Dark colours: +10% surcharge</li>
                    <li>• Extra height (up to 1100mm): +25%</li>
                    <li>• Extra depth (up to 700mm): +15%</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Contact us for a custom quote or call 1800 921 308 for immediate assistance with your cabinet project.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" className="px-8">
              Get Custom Quote
            </Button>
            <Button variant="outline" size="lg" className="px-8">
              Call 1800 921 308
            </Button>
          </div>
        </div>
      </section>

      <Footer />

      {/* Configurator Dialog */}
      {selectedCabinetType && (
        <ConfiguratorDialog
          isOpen={isConfiguratorOpen}
          onClose={() => setIsConfiguratorOpen(false)}
          cabinetType={selectedCabinetType}
          initialWidth={selectedWidth}
        />
      )}
    </div>
  );
};

export default CabinetPrices;