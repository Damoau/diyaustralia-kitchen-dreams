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
import CabinetTypeEditDialog from "@/components/admin/CabinetTypeEditDialog";
import GlobalSettingsEditDialog from "@/components/admin/GlobalSettingsEditDialog";
import { DoorStylesManager } from "@/components/admin/DoorStylesManager";
import HardwareEditDialog from "@/components/admin/HardwareEditDialog";
import { ColorsManager } from "@/components/admin/ColorsManager";
import AdminAIAssistant from "@/pages/AdminAIAssistant";

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

interface CabinetType {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  default_width_mm: number;
  default_height_mm: number;
  default_depth_mm: number;
  door_count: number;
  drawer_count: number;
  active: boolean;
}

const Admin = () => {
  const [cabinetTypes, setCabinetTypes] = useState<CabinetType[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSetting[]>([]);
  const [hardwareTypes, setHardwareTypes] = useState<HardwareType[]>([]);
  const [hardwareBrands, setHardwareBrands] = useState<HardwareBrand[]>([]);
  const [hardwareProducts, setHardwareProducts] = useState<HardwareProduct[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit states
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
        cabinetTypesRes,
        globalSettingsRes,
        hardwareTypesRes,
        hardwareBrandsRes,
        hardwareProductsRes
      ] = await Promise.all([
        supabase.from('cabinet_types').select('*').order('name'),
        supabase.from('global_settings').select('*').order('setting_key'),
        supabase.from('hardware_types').select('*').order('name'),
        supabase.from('hardware_brands').select('*').order('name'),
        supabase.from('hardware_products').select('*').order('name')
      ]);

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
          subcategory: cabinetType.subcategory || null,
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
              Manage your product catalog, door styles, colors, and configurations
            </p>
          </div>

          <Tabs defaultValue="door-styles" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="door-styles">Door Styles</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="cabinet-types">Cabinet Types</TabsTrigger>
              <TabsTrigger value="hardware">Hardware</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>
            </TabsList>

            <TabsContent value="door-styles">
              <DoorStylesManager />
            </TabsContent>

            <TabsContent value="colors">
              <ColorsManager />
            </TabsContent>

            <TabsContent value="cabinet-types">
              <Card>
                <CardHeader>
                  <CardTitle>Cabinet Types Management</CardTitle>
                  <CardDescription>
                    Manage cabinet types and default dimensions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <Button className="w-full max-w-sm" onClick={() => setEditingCabinetType({} as CabinetType)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Cabinet Type
                    </Button>
                    
                    <div className="bg-gradient-to-br from-background to-muted/20 rounded-xl border border-border/50 overflow-hidden">
                      <div className="grid grid-cols-5 gap-4 p-4 bg-muted/30 border-b border-border/50 font-semibold text-sm text-muted-foreground">
                        <div>Cabinet Name</div>
                        <div>Category</div>
                        <div>Dimensions (mm)</div>
                        <div>Status</div>
                        <div>Actions</div>
                      </div>
                      <div className="divide-y divide-border/30">
                        {cabinetTypes.map((cabinetType, index) => (
                          <div key={cabinetType.id} className="grid grid-cols-5 gap-4 p-4 hover:bg-muted/20 transition-all duration-200 group animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                            <div className="flex flex-col">
                              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{cabinetType.name}</h4>
                            </div>
                            <div className="flex items-center">
                              <span className="px-3 py-1 bg-secondary/50 rounded-full text-sm font-medium">{cabinetType.category}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="font-mono text-sm bg-background/50 px-2 py-1 rounded border">
                                {cabinetType.default_width_mm}×{cabinetType.default_height_mm}×{cabinetType.default_depth_mm}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                cabinetType.active 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {cabinetType.active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setEditingCabinetType(cabinetType)}
                                className="hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-all"
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hardware">
              <div className="grid gap-6">
                {/* Hardware Types */}
                <Card>
                  <CardHeader>
                    <CardTitle>Hardware Types</CardTitle>
                    <CardDescription>Manage hardware categories (hinges, handles, drawer slides, etc.)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <Button className="w-full max-w-sm" onClick={() => setEditingHardware({ type: 'hardware_type', item: {} })}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Hardware Type
                      </Button>
                      
                      <div className="bg-gradient-to-br from-background to-muted/20 rounded-xl border border-border/50 overflow-hidden">
                        <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 border-b border-border/50 font-semibold text-sm text-muted-foreground">
                          <div>Hardware Name</div>
                          <div>Category</div>
                          <div>Status</div>
                          <div>Actions</div>
                        </div>
                        <div className="divide-y divide-border/30">
                          {hardwareTypes.map((type, index) => (
                            <div key={type.id} className="grid grid-cols-4 gap-4 p-4 hover:bg-muted/20 transition-all duration-200 group animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                              <div className="flex flex-col">
                                <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{type.name}</h4>
                              </div>
                              <div className="flex items-center">
                                <span className="px-3 py-1 bg-secondary/50 rounded-full text-sm font-medium">{type.category}</span>
                              </div>
                              <div className="flex items-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                  type.active 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                  {type.active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setEditingHardware({ type: 'hardware_type', item: type })}
                                  className="hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-all"
                                >
                                  Edit
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Hardware Brands */}
                <Card>
                  <CardHeader>
                    <CardTitle>Hardware Brands</CardTitle>
                    <CardDescription>Manage hardware manufacturers (Blum, Titus, etc.)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <Button className="w-full max-w-sm" onClick={() => setEditingHardware({ type: 'hardware_brand', item: {} })}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Hardware Brand
                      </Button>
                      
                      <div className="bg-gradient-to-br from-background to-muted/20 rounded-xl border border-border/50 overflow-hidden">
                        <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 border-b border-border/50 font-semibold text-sm text-muted-foreground">
                          <div>Brand Name</div>
                          <div>Website</div>
                          <div>Status</div>
                          <div>Actions</div>
                        </div>
                        <div className="divide-y divide-border/30">
                          {hardwareBrands.map((brand, index) => (
                            <div key={brand.id} className="grid grid-cols-4 gap-4 p-4 hover:bg-muted/20 transition-all duration-200 group animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                              <div className="flex flex-col">
                                <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{brand.name}</h4>
                                <p className="text-sm text-muted-foreground">{brand.description}</p>
                              </div>
                              <div className="flex items-center">
                                {brand.website_url ? (
                                  <a href={brand.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                                    Visit Website
                                  </a>
                                ) : (
                                  <span className="text-sm text-muted-foreground">No website</span>
                                )}
                              </div>
                              <div className="flex items-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                  brand.active 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                  {brand.active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setEditingHardware({ type: 'hardware_brand', item: brand })}
                                  className="hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-all"
                                >
                                  Edit
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Hardware Products */}
                <Card>
                  <CardHeader>
                    <CardTitle>Hardware Products</CardTitle>
                    <CardDescription>Manage specific hardware products with pricing</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <Button className="w-full max-w-sm" onClick={() => setEditingHardware({ type: 'hardware_product', item: {} })}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Hardware Product
                      </Button>
                      
                      <div className="bg-gradient-to-br from-background to-muted/20 rounded-xl border border-border/50 overflow-hidden">
                        <div className="grid grid-cols-6 gap-4 p-4 bg-muted/30 border-b border-border/50 font-semibold text-sm text-muted-foreground">
                          <div>Product Name</div>
                          <div>Model</div>
                          <div>Type</div>
                          <div>Brand</div>
                          <div>Cost/Unit</div>
                          <div>Actions</div>
                        </div>
                        <div className="divide-y divide-border/30">
                          {hardwareProducts.map((product, index) => {
                            const productType = hardwareTypes.find(t => t.id === product.hardware_type_id);
                            const productBrand = hardwareBrands.find(b => b.id === product.hardware_brand_id);
                            return (
                              <div key={product.id} className="grid grid-cols-6 gap-4 p-4 hover:bg-muted/20 transition-all duration-200 group animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                                <div className="flex flex-col">
                                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{product.name}</h4>
                                  <p className="text-xs text-muted-foreground">{product.description}</p>
                                </div>
                                <div className="flex items-center">
                                  <span className="font-mono text-sm">{product.model_number || 'N/A'}</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="px-2 py-1 bg-accent/20 rounded text-xs">{productType?.name || 'Unknown'}</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="px-2 py-1 bg-secondary/50 rounded text-xs">{productBrand?.name || 'Unknown'}</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="font-semibold text-primary">${product.cost_per_unit}</span>
                                </div>
                                <div className="flex items-center">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setEditingHardware({ type: 'hardware_product', item: product })}
                                    className="hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-all"
                                  >
                                    Edit
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
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
                  <div className="space-y-6">
                    <Button className="w-full max-w-sm" onClick={() => setEditingGlobalSetting({} as GlobalSetting)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Global Setting
                    </Button>
                    
                    <div className="bg-gradient-to-br from-background to-muted/20 rounded-xl border border-border/50 overflow-hidden">
                      <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 border-b border-border/50 font-semibold text-sm text-muted-foreground">
                        <div>Setting Key</div>
                        <div>Value</div>
                        <div>Description</div>
                        <div>Actions</div>
                      </div>
                      <div className="divide-y divide-border/30">
                        {globalSettings.map((setting, index) => (
                          <div key={setting.id} className="grid grid-cols-4 gap-4 p-4 hover:bg-muted/20 transition-all duration-200 group animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                            <div className="flex flex-col">
                              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{setting.setting_key}</h4>
                            </div>
                            <div className="flex items-center">
                              <span className="font-mono text-sm bg-background/50 px-3 py-1 rounded border border-border/30 max-w-xs truncate">
                                {setting.setting_value}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm text-muted-foreground line-clamp-2">{setting.description}</span>
                            </div>
                            <div className="flex items-center">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setEditingGlobalSetting(setting)}
                                className="hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-all"
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai-assistant">
              <AdminAIAssistant />
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