import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Save } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import BrandEditDialog from "@/components/admin/BrandEditDialog";
import FinishEditDialog from "@/components/admin/FinishEditDialog";
import ColorEditDialog from "@/components/admin/ColorEditDialog";
import DoorStyleEditDialog from "@/components/admin/DoorStyleEditDialog";
import CabinetTypeEditDialog from "@/components/admin/CabinetTypeEditDialog";
import GlobalSettingsEditDialog from "@/components/admin/GlobalSettingsEditDialog";
import { DoorStylesManager } from "@/components/admin/DoorStylesManager";
import { CabinetTypePricingSetup } from "@/components/admin/CabinetTypePricingSetup";
import HardwareEditDialog from "@/components/admin/HardwareEditDialog";


interface Finish {
  id: string;
  name: string;
  finish_type: string;
  rate_per_sqm: number;
  active: boolean;
  brand_id: string;
}

interface Color {
  id: string;
  name: string;
  hex_code: string;
  image_url: string;
  active: boolean;
  door_style_id: string;
  surcharge_rate_per_sqm: number;
}


interface GlobalSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string;
}

interface HardwareType {
  id: string;
  name: string;
  category: string;
  description: string;
  active: boolean;
}

interface HardwareBrand {
  id: string;
  name: string;
  description: string;
  website_url: string;
  active: boolean;
}

interface HardwareProduct {
  id: string;
  hardware_type_id: string;
  hardware_brand_id: string;
  name: string;
  model_number: string;
  cost_per_unit: number;
  description: string;
  active: boolean;
}

interface ProductRange {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  active: boolean;
}

interface CabinetType {
  id: string;
  name: string;
  category: string;
  default_width_mm: number;
  default_height_mm: number;
  default_depth_mm: number;
  door_count: number;
  drawer_count: number;
  active: boolean;
}

const Admin = () => {
  
  const [finishes, setFinishes] = useState<Finish[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  
  const [cabinetTypes, setCabinetTypes] = useState<CabinetType[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSetting[]>([]);
  const [hardwareTypes, setHardwareTypes] = useState<HardwareType[]>([]);
  const [hardwareBrands, setHardwareBrands] = useState<HardwareBrand[]>([]);
  const [hardwareProducts, setHardwareProducts] = useState<HardwareProduct[]>([]);
  const [productRanges, setProductRanges] = useState<ProductRange[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit states
  
  const [editingFinish, setEditingFinish] = useState<Finish | null>(null);
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  
  const [editingCabinetType, setEditingCabinetType] = useState<CabinetType | null>(null);
  const [editingGlobalSetting, setEditingGlobalSetting] = useState<GlobalSetting | null>(null);
  const [editingHardware, setEditingHardware] = useState<{ type: 'hardware_type' | 'hardware_brand' | 'hardware_product' | 'product_range', item: any } | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [
        finishesRes, 
        colorsRes, 
        cabinetTypesRes,
        globalSettingsRes,
        hardwareTypesRes,
        hardwareBrandsRes,
        hardwareProductsRes
      ] = await Promise.all([
        supabase.from('finishes').select('*').order('name'),
        supabase.from('colors').select('*').order('name'),
        supabase.from('cabinet_types').select('*').order('name'),
        supabase.from('global_settings').select('*').order('setting_key'),
        supabase.from('hardware_types').select('*').order('name'),
        supabase.from('hardware_brands').select('*').order('name'),
        supabase.from('hardware_products').select('*').order('name')
      ]);

      if (finishesRes.data) setFinishes(finishesRes.data);
      if (colorsRes.data) setColors(colorsRes.data);
      if (cabinetTypesRes.data) {
        // Ensure the cabinet types have door_count and drawer_count (may be null in old records)
        const cabinetTypesWithDefaults = cabinetTypesRes.data.map(ct => ({
          ...ct,
          door_count: ct.door_count || 0,
          drawer_count: ct.drawer_count || 0
        }));
        setCabinetTypes(cabinetTypesWithDefaults);
      }
      if (globalSettingsRes.data) setGlobalSettings(globalSettingsRes.data);
      if (hardwareTypesRes.data) setHardwareTypes(hardwareTypesRes.data);
      if (hardwareBrandsRes.data) setHardwareBrands(hardwareBrandsRes.data);
      if (hardwareProductsRes.data) setHardwareProducts(hardwareProductsRes.data);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to load data", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };


  const saveFinish = async (finish: Partial<Finish>) => {
    try {
      if (!finish.name || !finish.finish_type || !finish.brand_id) {
        toast({ title: "Error", description: "Name, finish type, and brand are required", variant: "destructive" });
        return;
      }
      
      if (finish.id) {
        await supabase.from('finishes').update(finish).eq('id', finish.id);
      } else {
        await supabase.from('finishes').insert({
          name: finish.name,
          finish_type: finish.finish_type,
          brand_id: finish.brand_id,
          rate_per_sqm: finish.rate_per_sqm || 0,
          active: finish.active ?? true
        });
      }
      loadAllData();
      setEditingFinish(null);
      toast({ title: "Success", description: "Finish saved!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save finish", variant: "destructive" });
    }
  };

  const saveColor = async (color: Partial<Color>) => {
    try {
      if (!color.name || !color.door_style_id) {
        toast({ title: "Error", description: "Name and door style are required", variant: "destructive" });
        return;
      }
      
      if (color.id) {
        await supabase.from('colors').update(color).eq('id', color.id);
      } else {
        await supabase.from('colors').insert({
          name: color.name,
          door_style_id: color.door_style_id,
          hex_code: color.hex_code || "",
          image_url: color.image_url || null,
          surcharge_rate_per_sqm: color.surcharge_rate_per_sqm || 0,
          active: color.active ?? true
        });
      }
      loadAllData();
      setEditingColor(null);
      toast({ title: "Success", description: "Color saved!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save color", variant: "destructive" });
    }
  };


  const saveCabinetType = async (cabinetType: Partial<CabinetType>) => {
    try {
      if (!cabinetType.name || !cabinetType.category) {
        toast({ title: "Error", description: "Name and category are required", variant: "destructive" });
        return;
      }
      
      if (cabinetType.id) {
        await supabase.from('cabinet_types').update(cabinetType).eq('id', cabinetType.id);
      } else {
        await supabase.from('cabinet_types').insert({
          name: cabinetType.name,
          category: cabinetType.category,
          default_width_mm: cabinetType.default_width_mm || 300,
          default_height_mm: cabinetType.default_height_mm || 720,
          default_depth_mm: cabinetType.default_depth_mm || 560,
          active: cabinetType.active ?? true
        });
      }
      loadAllData();
      setEditingCabinetType(null);
      toast({ title: "Success", description: "Cabinet type saved!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save cabinet type", variant: "destructive" });
    }
  };

  const saveGlobalSetting = async (setting: Partial<GlobalSetting>) => {
    try {
      if (!setting.setting_key || !setting.setting_value) {
        toast({ title: "Error", description: "Setting key and value are required", variant: "destructive" });
        return;
      }
      
      if (setting.id) {
        await supabase.from('global_settings').update(setting).eq('id', setting.id);
      } else {
        await supabase.from('global_settings').insert({
          setting_key: setting.setting_key,
          setting_value: setting.setting_value,
          description: setting.description || ""
        });
      }
      loadAllData();
      setEditingGlobalSetting(null);
      toast({ title: "Success", description: "Global setting saved!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save global setting", variant: "destructive" });
    }
  };

  const saveHardware = async (item: any) => {
    try {
      if (!editingHardware) return;
      
      const { type } = editingHardware;
      
      if (item.id) {
        // Update existing item
        switch (type) {
          case 'hardware_type':
            await supabase.from('hardware_types').update(item).eq('id', item.id);
            break;
          case 'hardware_brand':
            await supabase.from('hardware_brands').update(item).eq('id', item.id);
            break;
          case 'hardware_product':
            await supabase.from('hardware_products').update(item).eq('id', item.id);
            break;
          case 'product_range':
            await supabase.from('product_ranges').update(item).eq('id', item.id);
            break;
        }
      } else {
        // Insert new item
        delete item.id;
        switch (type) {
          case 'hardware_type':
            await supabase.from('hardware_types').insert(item);
            break;
          case 'hardware_brand':
            await supabase.from('hardware_brands').insert(item);
            break;
          case 'hardware_product':
            await supabase.from('hardware_products').insert(item);
            break;
          case 'product_range':
            await supabase.from('product_ranges').insert(item);
            break;
        }
      }
      
      loadAllData();
      setEditingHardware(null);
      toast({ title: "Success", description: `${type.replace('_', ' ')} saved!` });
    } catch (error) {
      toast({ title: "Error", description: `Failed to save ${editingHardware?.type.replace('_', ' ')}`, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading admin data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage your product catalog, brands, finishes, and configurations
            </p>
          </div>

          <Tabs defaultValue="door-styles" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="door-styles">Door Styles</TabsTrigger>
              <TabsTrigger value="finishes">Finishes</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="cabinet-types">Cabinet Types</TabsTrigger>
              <TabsTrigger value="hardware">Hardware</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="door-styles">
              <DoorStylesManager />
            </TabsContent>

            <TabsContent value="finishes">
              <Card>
                <CardHeader>
                  <CardTitle>Finishes Management</CardTitle>
                  <CardDescription>
                    Manage finish types and pricing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full" onClick={() => setEditingFinish({} as Finish)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Finish
                    </Button>
                    
                    <div className="space-y-2">
                      {finishes.map((finish) => (
                        <div key={finish.id} className="flex items-center justify-between p-4 border rounded">
                          <div>
                            <h4 className="font-medium">{finish.name}</h4>
                            <p className="text-sm text-muted-foreground">{finish.finish_type}</p>
                            <p className="text-sm">${finish.rate_per_sqm}/sqm</p>
                            <span className={`text-xs px-2 py-1 rounded ${finish.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {finish.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setEditingFinish(finish)}>
                            Edit
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="colors">
              <Card>
                <CardHeader>
                  <CardTitle>Colors Management</CardTitle>
                  <CardDescription>
                    Manage color options and surcharges
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full" onClick={() => setEditingColor({} as Color)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Color
                    </Button>
                    
                    <div className="space-y-2">
                      {colors.map((color) => (
                        <div key={color.id} className="flex items-center justify-between p-4 border rounded">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: color.hex_code }}
                            />
                            <div>
                              <h4 className="font-medium">{color.name}</h4>
                              <p className="text-sm text-muted-foreground">{color.hex_code}</p>
                              <p className="text-sm">+${color.surcharge_rate_per_sqm}/sqm</p>
                              <span className={`text-xs px-2 py-1 rounded ${color.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {color.active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setEditingColor(color)}>
                            Edit
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="door-styles">
              <DoorStylesManager />
            </TabsContent>

            <TabsContent value="cabinet-types">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Cabinet Types Management</CardTitle>
                    <CardDescription>
                      Manage cabinet types and default dimensions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button className="w-full" onClick={() => setEditingCabinetType({} as CabinetType)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Cabinet Type
                      </Button>
                      
                      <div className="space-y-2">
                        {cabinetTypes.map((cabinetType) => (
                          <div key={cabinetType.id} className="border rounded">
                            <div className="flex items-center justify-between p-4">
                              <div>
                                <h4 className="font-medium">{cabinetType.name}</h4>
                                <p className="text-sm text-muted-foreground">{cabinetType.category}</p>
                                <p className="text-sm">
                                  {cabinetType.default_width_mm}×{cabinetType.default_height_mm}×{cabinetType.default_depth_mm}mm
                                </p>
                                <span className={`text-xs px-2 py-1 rounded ${cabinetType.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {cabinetType.active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => setEditingCabinetType(cabinetType)}>
                                Edit
                              </Button>
                            </div>
                            {cabinetType.active && (
                              <div className="border-t p-4 bg-muted/20">
                                <h5 className="font-medium mb-4">Pricing Configuration</h5>
                                <CabinetTypePricingSetup cabinetTypeId={cabinetType.id} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="hardware">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Hardware Types</CardTitle>
                    <CardDescription>Manage hardware categories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="mb-4" onClick={() => setEditingHardware({ type: 'hardware_type', item: {} })}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Hardware Type
                    </Button>
                    <div className="space-y-2">
                      {hardwareTypes.map((type) => (
                        <div key={type.id} className="flex items-center justify-between p-4 border rounded">
                          <div>
                            <h4 className="font-medium">{type.name}</h4>
                            <p className="text-sm text-muted-foreground">{type.category}</p>
                            <span className={`text-xs px-2 py-1 rounded ${type.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {type.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setEditingHardware({ type: 'hardware_type', item: type })}>
                            Edit
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>


            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Global Settings</CardTitle>
                  <CardDescription>Manage pricing and system settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="mb-4" onClick={() => setEditingGlobalSetting({} as GlobalSetting)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Global Setting
                  </Button>
                  <div className="space-y-2">
                    {globalSettings.map((setting) => (
                      <div key={setting.id} className="flex items-center justify-between p-4 border rounded">
                        <div>
                          <h4 className="font-medium">{setting.setting_key}</h4>
                          <p className="text-sm font-mono">{setting.setting_value}</p>
                          <p className="text-sm text-muted-foreground">{setting.description}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setEditingGlobalSetting(setting)}>
                          Edit
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Edit Dialogs */}
          <GlobalSettingsEditDialog
            setting={editingGlobalSetting}
            open={!!editingGlobalSetting}
            onOpenChange={(open) => !open && setEditingGlobalSetting(null)}
            onSave={saveGlobalSetting}
          />



          <HardwareEditDialog
            type={editingHardware?.type || 'hardware_type'}
            item={editingHardware?.item}
            hardwareTypes={hardwareTypes}
            hardwareBrands={hardwareBrands}
            open={!!editingHardware}
            onOpenChange={(open) => !open && setEditingHardware(null)}
            onSave={saveHardware}
          />

          <CabinetTypeEditDialog
            cabinetType={editingCabinetType}
            open={!!editingCabinetType}
            onOpenChange={(open) => !open && setEditingCabinetType(null)}
            onSave={saveCabinetType}
          />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default Admin;