import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ConfiguratorDialog } from "@/components/cabinet/ConfiguratorDialog";
import { supabase } from "@/integrations/supabase/client";
import { CabinetType, Finish, Color, CabinetPart, GlobalSettings, HardwareBrand } from "@/types/cabinet";
import { calculateCabinetPrice } from "@/lib/dynamicPricing";
import { calculateHardwareCost } from "@/lib/hardwarePricing";
import { useCart } from "@/hooks/useCart";
import { generateCutlist, parseGlobalSettings } from "@/lib/pricing";
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
  const [colors, setColors] = useState<Color[]>([]);
  const [cabinetParts, setCabinetParts] = useState<CabinetPart[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings[]>([]);
  
  // Add hardware selection to popup
  const [hardwareBrands, setHardwareBrands] = useState<HardwareBrand[]>([]);
  const [selectedHardwareBrand, setSelectedHardwareBrand] = useState<string>('');
  
  const { addToCart, isLoading: isAddingToCart } = useCart();
  const { toast } = useToast();
  
  // Popup state
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupConfig, setPopupConfig] = useState({
    cabinetType: "",
    width: 300,
    height: 720,
    depth: 560,
    finish: "",
    finishId: "",
    colorId: "",
    hardwareBrandId: "",
    price: 0
  });

  // Load cabinet types and data
  useEffect(() => {
    loadCabinetTypes();
    loadFinishes();
    loadCabinetParts();
    loadGlobalSettings();
    loadHardwareBrands();
  }, []);

  // Update price when hardware brand or color changes
  useEffect(() => {
    if (popupConfig.hardwareBrandId && popupConfig.cabinetType && popupOpen) {
      const cabinetType = cabinetTypes.find(ct => ct.name === popupConfig.cabinetType);
      const finish = finishes.find(f => f.id === popupConfig.finishId);
      
      if (cabinetType && finish) {
        const relevantParts = cabinetParts.filter(p => p.cabinet_type_id === cabinetType.id);
        
        // Calculate hardware cost for selected brand
        calculateHardwareCost(cabinetType, popupConfig.hardwareBrandId, 1).then(hwCost => {
          const updatedPrice = calculateCabinetPrice(
            cabinetType,
            popupConfig.width,
            popupConfig.height,
            popupConfig.depth,
            finish,
            undefined, // no door style selected yet
            undefined, // no color selected yet  
            relevantParts,
            globalSettings,
            hwCost
          );
          
          setPopupConfig(prev => ({ ...prev, price: updatedPrice }));
        });
      }
    }
  }, [popupConfig.hardwareBrandId, popupConfig.colorId, popupOpen, cabinetTypes, finishes, cabinetParts, globalSettings]);

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

  const loadColors = async (doorStyleId: string) => {
    try {
      const { data, error } = await supabase
        .from('colors')
        .select('*')
        .eq('door_style_id', doorStyleId)
        .eq('active', true);

      if (error) throw error;
      setColors((data || []) as Color[]);
    } catch (error) {
      console.error('Error loading colors:', error);
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

  const loadHardwareBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('hardware_brands')
        .select('*')
        .eq('active', true);

      if (error) throw error;
      setHardwareBrands((data || []) as HardwareBrand[]);
      if (data && data.length > 0 && !selectedHardwareBrand) {
        setSelectedHardwareBrand(data[0].id);
      }
    } catch (error) {
      console.error('Error loading hardware brands:', error);
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

  const handlePriceClick = async (cabinetName: string, sizeRange: string, price: number, finishName: string) => {
    const width = parseWidthRange(sizeRange);
    const matchedFinish = finishes.find(f => f.name === finishName);
    const cabinetType = cabinetTypes.find(ct => ct.name === cabinetName);
    
    // Calculate dynamic price using your formula
    let calculatedPrice = price; // fallback to static price
    if (matchedFinish && cabinetType) {
      const relevantParts = cabinetParts.filter(p => p.cabinet_type_id === cabinetType.id);
      calculatedPrice = calculateCabinetPrice(
        cabinetType,
        width,
        cabinetType.default_height_mm,
        cabinetType.default_depth_mm,
        matchedFinish,
        undefined, // no door style selected yet
        undefined, // no color selected yet
        relevantParts,
        globalSettings,
        45 // default hardware cost - will be updated when hardware brand is selected
      );
    }
    
    setPopupConfig({
      cabinetType: cabinetName,
      width: width,
      height: 720,
      depth: 560,
      finish: finishName,
      finishId: matchedFinish?.id || "",
      colorId: "",
      hardwareBrandId: selectedHardwareBrand,
      price: calculatedPrice
    });
    
    if (matchedFinish?.id) {
      // TODO: Update to load colors based on door style selection
      // For now, load empty colors array until door style is selected
      setColors([]);
    }
    
    setPopupOpen(true);
  };

  const handleAddToQuote = async () => {
    try {
      const cabinetType = cabinetTypes.find(ct => ct.name === popupConfig.cabinetType);
      const finish = finishes.find(f => f.id === popupConfig.finishId);
      const color = colors.find(c => c.id === popupConfig.colorId);
      
      if (!cabinetType) {
        toast({
          title: "Error",
          description: "Cabinet type not found",
          variant: "destructive"
        });
        return;
      }

      if (!finish) {
        toast({
          title: "Error", 
          description: "Please select a finish",
          variant: "destructive"
        });
        return;
      }

      if (!color) {
        toast({
          title: "Error",
          description: "Please select a color", 
          variant: "destructive"
        });
        return;
      }

      if (!hardwareBrands.find(hb => hb.id === popupConfig.hardwareBrandId)) {
        toast({
          title: "Error",
          description: "Please select a hardware brand",
          variant: "destructive"
        });
        return;
      }

      const configuration = {
        cabinetType,
        width: popupConfig.width,
        height: popupConfig.height, 
        depth: popupConfig.depth,
        quantity: 1,
        finish,
        color,
        doorStyle: undefined,
        hardwareBrand: popupConfig.hardwareBrandId
      };

      const relevantParts = cabinetParts.filter(part => part.cabinet_type_id === cabinetType.id);
      const settings = parseGlobalSettings(globalSettings);
      
      await addToCart(configuration, relevantParts, settings);
      
      toast({
        title: "Added to Cart",
        description: `${cabinetType.name} added to your quote successfully!`
      });
      
      setPopupOpen(false);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
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
                              <Popover open={popupOpen && popupConfig.cabinetType === cabinet.name && popupConfig.width === parseWidthRange(size.range) && popupConfig.finish === finish.name}>
                                <PopoverTrigger asChild>
                                  <button
                                    onClick={() => handlePriceClick(cabinet.name, size.range, price, finish.name)}
                                    className="text-lg font-bold text-primary hover:text-primary/80 cursor-pointer transition-colors"
                                  >
                                    ${price}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-4 bg-background border border-border shadow-lg">
                                  <div className="space-y-4">
                                    <h3 className="font-semibold text-foreground text-center">Configure Your Cabinet</h3>
                                    
                                    <div className="grid grid-cols-3 gap-3">
                                      <div>
                                        <Label htmlFor="width" className="text-sm font-medium text-foreground">Width (mm)</Label>
                                        <Input
                                          id="width"
                                          type="number"
                                          value={popupConfig.width}
                                          onChange={(e) => setPopupConfig(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                                          className="mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="height" className="text-sm font-medium text-foreground">Height (mm)</Label>
                                        <Input
                                          id="height"
                                          type="number"
                                          value={popupConfig.height}
                                          onChange={(e) => setPopupConfig(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                                          className="mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="depth" className="text-sm font-medium text-foreground">Depth (mm)</Label>
                                        <Input
                                          id="depth"
                                          type="number"
                                          value={popupConfig.depth}
                                          onChange={(e) => setPopupConfig(prev => ({ ...prev, depth: parseInt(e.target.value) || 0 }))}
                                          className="mt-1"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <Label className="text-sm font-medium text-foreground">Selected Finish</Label>
                                      <p className="mt-1 p-2 bg-muted rounded text-foreground">{popupConfig.finish}</p>
                                    </div>

                                    <div>
                                      <Label className="text-sm font-medium text-foreground">Hardware Brand</Label>
                                      <Select 
                                        value={popupConfig.hardwareBrandId} 
                                        onValueChange={(value) => setPopupConfig(prev => ({ ...prev, hardwareBrandId: value }))}
                                      >
                                        <SelectTrigger className="mt-1">
                                          <SelectValue placeholder="Select hardware brand" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {hardwareBrands.map((brand) => (
                                            <SelectItem key={brand.id} value={brand.id}>
                                              {brand.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div>
                                      <Label className="text-sm font-medium text-foreground">Color</Label>
                                      <Select 
                                        value={popupConfig.colorId} 
                                        onValueChange={(value) => setPopupConfig(prev => ({ ...prev, colorId: value }))}
                                      >
                                        <SelectTrigger className="mt-1">
                                          <SelectValue placeholder="Select a color" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {colors.map((color) => (
                                            <SelectItem key={color.id} value={color.id}>
                                              <div className="flex items-center gap-2">
                                                {color.hex_code && (
                                                  <div 
                                                    className="w-4 h-4 rounded border border-border"
                                                    style={{ backgroundColor: color.hex_code }}
                                                  />
                                                )}
                                                {color.name}
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="text-center">
                                      <p className="text-lg font-bold text-primary mb-3">Price: ${popupConfig.price}</p>
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => setPopupOpen(false)}
                                          variant="outline"
                                          size="sm"
                                          className="flex-1"
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          onClick={handleAddToQuote}
                                          size="sm"
                                          className="flex-1"
                                          disabled={isAddingToCart || !popupConfig.colorId || !popupConfig.hardwareBrandId}
                                        >
                                          {isAddingToCart ? "Adding..." : "Add to Quote"}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
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