import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConfiguratorDialog } from "@/components/cabinet/ConfiguratorDialog";
import { supabase } from "@/integrations/supabase/client";
import { CabinetType } from "@/types/cabinet";

// Import cabinet images
import cabinet1DoorImg from "@/assets/cabinet-1-door.jpg";
import cabinet2DoorImg from "@/assets/cabinet-2-door.jpg";
import cabinetDrawersImg from "@/assets/cabinet-drawers.jpg";

const CabinetPrices = () => {
  const [cabinetTypes, setCabinetTypes] = useState<CabinetType[]>([]);
  const [selectedCabinetType, setSelectedCabinetType] = useState<CabinetType | null>(null);
  const [selectedWidth, setSelectedWidth] = useState<number>(300);
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);
  const [selectedFinish, setSelectedFinish] = useState<string>("formica");

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

  const finishTypes = {
    formica: { name: "Standard Formica", priceIndex: 0, note: "Add 10% for Gloss" },
    laminex: { name: "Standard Laminex", priceIndex: 1, note: "Add 10% for Gloss" },
    polytec: { name: "Standard Poly Tec", priceIndex: 2, note: "Add 10% for Standard Gloss" },
    impressions: { name: "Laminex Impressions", priceIndex: 4, note: "" },
    poly: { name: "Poly (Matt, Satin, Gloss)", priceIndex: 5, note: "" },
    shaker: { name: "Shaker 86 degree - Satin", priceIndex: 8, note: "" },
  };

  const cabinetSizes = {
    "1door": {
      name: "1 Door Base Cabinet",
      image: cabinet1DoorImg,
      sizes: [
        { range: "150-199mm", price: [114, 120, 120, 139, 164, 139, 139, 147, 215, 277, 314] },
        { range: "200-249mm", price: [132, 139, 139, 164, 164, 164, 164, 175, 253, 322, 398] },
        { range: "250-299mm", price: [149, 158, 158, 190, 190, 190, 190, 203, 291, 367, 482] },
        { range: "300-349mm", price: [167, 177, 177, 215, 215, 215, 215, 231, 328, 412, 566] },
        { range: "350-399mm", price: [184, 197, 197, 241, 241, 241, 241, 260, 366, 456, 650] },
        { range: "400-449mm", price: [202, 216, 216, 267, 267, 267, 267, 288, 404, 501, 734] },
        { range: "450-499mm", price: [219, 235, 235, 292, 292, 292, 292, 316, 442, 546, 818] },
        { range: "500-549mm", price: [237, 255, 255, 318, 318, 318, 318, 344, 479, 591, 902] },
        { range: "550-599mm", price: [254, 274, 274, 344, 344, 344, 344, 373, 517, 636, 986] },
        { range: "600mm", price: [272, 293, 293, 369, 369, 369, 369, 401, 555, 680, 1070] }
      ]
    },
    "2door": {
      name: "2 Door Base Cabinet",
      image: cabinet2DoorImg,
      sizes: [
        { range: "400-449mm", price: [222, 237, 237, 289, 289, 289, 316, 337, 469, 609, 769] },
        { range: "450-499mm", price: [234, 251, 251, 310, 310, 310, 337, 361, 503, 649, 850] },
        { range: "500-549mm", price: [247, 266, 266, 331, 331, 331, 358, 385, 536, 690, 931] },
        { range: "600-649mm", price: [272, 295, 295, 373, 373, 373, 400, 432, 603, 772, 1094] },
        { range: "700-749mm", price: [298, 324, 324, 415, 415, 415, 442, 480, 670, 853, 1256] },
        { range: "800-849mm", price: [323, 353, 353, 457, 457, 457, 484, 527, 737, 935, 1418] },
        { range: "900-949mm", price: [348, 382, 382, 499, 499, 499, 526, 575, 804, 1016, 1580] },
        { range: "1000-1049mm", price: [374, 411, 411, 541, 541, 541, 568, 622, 871, 1098, 1742] },
        { range: "1200mm", price: [424, 469, 469, 625, 625, 625, 652, 717, 1005, 1261, 2067] }
      ]
    },
    "drawers": {
      name: "Pot Drawer Base",
      image: cabinetDrawersImg,
      sizes: [
        { range: "600-800mm", price: [450, 480, 480, 550, 550, 550, 580, 620, 800, 950, 1200] },
        { range: "800-1000mm", price: [550, 580, 580, 650, 650, 650, 680, 720, 900, 1050, 1400] },
        { range: "1000-1200mm", price: [650, 680, 680, 750, 750, 750, 780, 820, 1000, 1150, 1600] }
      ]
    }
  };

  const parseWidthRange = (rangeStr: string): number => {
    const match = rangeStr.match(/\d+/);
    return match ? parseInt(match[0]) : 300;
  };

  const getSelectedFinish = () => finishTypes[selectedFinish as keyof typeof finishTypes];

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
          </div>
        </div>
      </section>

      {/* Finish Selector */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Your Finish Type
            </label>
            <Select value={selectedFinish} onValueChange={setSelectedFinish}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose finish type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(finishTypes).map(([key, finish]) => (
                  <SelectItem key={key} value={key}>
                    {finish.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getSelectedFinish()?.note && (
              <p className="text-sm text-muted-foreground mt-2">
                {getSelectedFinish().note}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Cabinet Cards */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {Object.entries(cabinetSizes).map(([key, cabinet]) => (
              <Card key={key} className="overflow-hidden">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl text-foreground">{cabinet.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Cabinet Image */}
                  <div className="aspect-square w-full bg-muted/20 flex items-center justify-center mb-4">
                    <img 
                      src={cabinet.image} 
                      alt={cabinet.name}
                      className="w-full h-full object-cover rounded-t-none"
                    />
                  </div>

                  {/* Price Ranges */}
                  <div className="px-6 pb-6 space-y-3">
                    <h4 className="font-semibold text-foreground text-center mb-4">
                      {getSelectedFinish()?.name} Prices
                    </h4>
                    
                    {cabinet.sizes.map((size, idx) => {
                      const price = size.price[getSelectedFinish()?.priceIndex || 0];
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                          <div className="flex-1">
                            <span className="text-sm font-medium text-foreground">{size.range}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-primary">${price}</span>
                            <Button
                              size="sm"
                              onClick={() => handleConfigure(cabinet.name, parseWidthRange(size.range))}
                              className="text-xs px-3"
                            >
                              Configure
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Main Configure Button */}
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full mt-4"
                      onClick={() => handleConfigure(cabinet.name, parseWidthRange(cabinet.sizes[0].range))}
                    >
                      Configure {cabinet.name}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Cabinet Specifications */}
      <section className="py-16 bg-muted/30">
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
      <section className="py-16 bg-background">
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