import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfiguratorDialog } from "@/components/cabinet/ConfiguratorDialog";
import { CellConfigPopup } from "@/components/cabinet/CellConfigPopup";
import { supabase } from "@/integrations/supabase/client";
import { CabinetType, Finish, CabinetPart, GlobalSettings } from "@/types/cabinet";
import { useToast } from "@/hooks/use-toast";

// Import cabinet images
import cabinet1DoorImg from "@/assets/cabinet-1-door.jpg";
import cabinet2DoorImg from "@/assets/cabinet-2-door.jpg";
import cabinetDrawersImg from "@/assets/cabinet-drawers.jpg";

const CabinetPrices = () => {
  const [cabinetTypes, setCabinetTypes] = useState<CabinetType[]>([]);
  const [selectedCabinetType, setSelectedCabinetType] = useState<CabinetType | null>(null);
  const [selectedWidth, setSelectedWidth] = useState<number>(300);
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);
  const [finishes, setFinishes] = useState<Finish[]>([]);
  const [cabinetParts, setCabinetParts] = useState<CabinetPart[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings[]>([]);
  
  const { toast } = useToast();
  
  // Cell popup state
  const [cellPopupOpen, setCellPopupOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    cabinetType: CabinetType;
    finish: Finish;
    width: number;
    price: number;
  } | null>(null);

  // Load cabinet types and data
  useEffect(() => {
    loadCabinetTypes();
    loadFinishes();
    loadCabinetParts();
    loadGlobalSettings();
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

  const loadFinishes = async () => {
    try {
      const { data, error } = await supabase
        .from('finishes')
        .select('*')
        .eq('active', true);

      if (error) throw error;
      setFinishes((data || []) as Finish[]);
    } catch (error) {
      console.error('Error loading finishes:', error);
    }
  };

  const loadCabinetParts = async () => {
    try {
      const { data, error } = await supabase
        .from('cabinet_parts')
        .select('*');

      if (error) throw error;
      setCabinetParts((data || []) as CabinetPart[]);
    } catch (error) {
      console.error('Error loading cabinet parts:', error);
    }
  };

  const loadGlobalSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('global_settings')
        .select('*');

      if (error) throw error;
      setGlobalSettings((data || []) as GlobalSettings[]);
    } catch (error) {
      console.error('Error loading global settings:', error);
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

  const parseWidthRange = (rangeStr: string): number => {
    const match = rangeStr.match(/\d+/);
    return match ? parseInt(match[0]) : 300;
  };

  const handleCellClick = (cabinetName: string, sizeRange: string, price: number, finishName: string) => {
    console.log('Cell clicked:', { cabinetName, sizeRange, price, finishName });
    console.log('Available finishes:', finishes.map(f => f.name));
    console.log('Available cabinet types:', cabinetTypes.map(ct => ct.name));
    
    const width = parseWidthRange(sizeRange);
    const matchedFinish = finishes.find(f => f.name === finishName);
    const cabinetType = cabinetTypes.find(ct => ct.name === cabinetName);
    
    console.log('Matched finish:', matchedFinish);
    console.log('Matched cabinet type:', cabinetType);
    
    if (matchedFinish && cabinetType) {
      setSelectedCell({
        cabinetType,
        finish: matchedFinish,
        width,
        price
      });
      setCellPopupOpen(true);
    } else {
      console.error('No match found for cabinet or finish');
    }
  };

  const finishColumns = [
    { name: "Standard Formica", index: 0 },
    { name: "Standard Laminex", index: 1 },
    { name: "Laminex Impressions", index: 4 },
    { name: "Poly (Matt/Satin/Gloss)", index: 5 },
    { name: "Shaker 86° - Satin", index: 8 }
  ];

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

      {/* Price Tables */}
      <section className="py-16">
        <div className="container mx-auto px-4 space-y-12">
          {Object.entries(cabinetSizes).map(([key, cabinet]) => (
            <div key={key} className="bg-background">
              <h2 className="text-2xl font-bold text-foreground mb-6 text-center">{cabinet.name}</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border border-border p-3 text-left font-semibold text-foreground">Width Range</th>
                      {finishColumns.map((finish, idx) => (
                        <th key={idx} className="border border-border p-3 text-center font-semibold text-foreground">{finish.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cabinet.sizes.map((size, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="border border-border p-3 font-medium text-foreground">{size.range}</td>
                        {finishColumns.map((finish, finishIdx) => {
                          const price = size.price[finish.index];
                          return (
                            <td key={finishIdx} className="border border-border p-3 text-center">
                              <button
                                onClick={() => handleCellClick(cabinet.name, size.range, price, finish.name)}
                                className="text-lg font-bold text-primary hover:text-primary/80 hover:bg-primary/10 cursor-pointer transition-all rounded px-2 py-1"
                              >
                                ${price}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Standard: 720mm height, 560mm depth. Click on a price to configure dimensions and add to quote.
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cell Configuration Popup */}
      {selectedCell && (
        <CellConfigPopup
          isOpen={cellPopupOpen}
          onClose={() => setCellPopupOpen(false)}
          cabinetType={selectedCell.cabinetType}
          finish={selectedCell.finish}
          initialWidth={selectedCell.width}
          initialPrice={selectedCell.price}
          cabinetParts={cabinetParts}
          globalSettings={globalSettings}
        />
      )}

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
                <p className="text-muted-foreground">(internal)</p>
                <Badge variant="outline" className="mt-2">Custom depths available</Badge>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-primary">Custom Widths</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground mb-2">Available</p>
                <p className="text-muted-foreground">Any width possible</p>
                <Badge variant="outline" className="mt-2">Made to order</Badge>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <h3 className="text-2xl font-bold text-foreground mb-6">What's Included</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              <div className="bg-background p-4 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">✓ Carcass</h4>
                <p className="text-sm text-muted-foreground">32mm melamine carcass with adjustable shelves</p>
              </div>
              <div className="bg-background p-4 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">✓ Doors</h4>
                <p className="text-sm text-muted-foreground">Custom doors in your chosen finish</p>
              </div>
              <div className="bg-background p-4 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">✓ Hardware</h4>
                <p className="text-sm text-muted-foreground">Quality hinges and drawer runners</p>
              </div>
              <div className="bg-background p-4 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">✓ Assembly</h4>
                <p className="text-sm text-muted-foreground">Pre-assembled and ready to install</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Configure more button */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-4">Need Something Different?</h3>
          <p className="text-muted-foreground mb-8">
            Use our cabinet configurator to create custom cabinets with exact dimensions, colors, and hardware options.
          </p>
          <Button 
            onClick={() => setIsConfiguratorOpen(true)}
            size="lg"
            className="mx-auto"
          >
            Open Cabinet Configurator
          </Button>
        </div>
      </section>

      {/* Configurator Dialog */}
      {selectedCabinetType && (
        <ConfiguratorDialog
          open={isConfiguratorOpen}
          onOpenChange={setIsConfiguratorOpen}
          cabinetType={selectedCabinetType}
          initialWidth={selectedWidth}
        />
      )}

      <Footer />
    </div>
  );
};

export default CabinetPrices;