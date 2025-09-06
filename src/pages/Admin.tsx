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

interface Brand {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

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
  finish_id: string;
  surcharge_rate_per_sqm: number;
}

interface DoorStyle {
  id: string;
  name: string;
  description: string;
  base_rate_per_sqm: number;
  active: boolean;
}

interface CabinetType {
  id: string;
  name: string;
  category: string;
  default_width_mm: number;
  default_height_mm: number;
  default_depth_mm: number;
  active: boolean;
}

const Admin = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [finishes, setFinishes] = useState<Finish[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [doorStyles, setDoorStyles] = useState<DoorStyle[]>([]);
  const [cabinetTypes, setCabinetTypes] = useState<CabinetType[]>([]);
  const [loading, setLoading] = useState(true);
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
      const [brandsRes, finishesRes, colorsRes, doorStylesRes, cabinetTypesRes] = await Promise.all([
        supabase.from('brands').select('*').order('name'),
        supabase.from('finishes').select('*').order('name'),
        supabase.from('colors').select('*').order('name'),
        supabase.from('door_styles').select('*').order('name'),
        supabase.from('cabinet_types').select('*').order('name'),
      ]);

      if (brandsRes.data) setBrands(brandsRes.data);
      if (finishesRes.data) setFinishes(finishesRes.data);
      if (colorsRes.data) setColors(colorsRes.data);
      if (doorStylesRes.data) setDoorStyles(doorStylesRes.data);
      if (cabinetTypesRes.data) setCabinetTypes(cabinetTypesRes.data);
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

          <Tabs defaultValue="brands" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="brands">Brands</TabsTrigger>
              <TabsTrigger value="finishes">Finishes</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="door-styles">Door Styles</TabsTrigger>
              <TabsTrigger value="cabinet-types">Cabinet Types</TabsTrigger>
            </TabsList>

            <TabsContent value="brands">
              <Card>
                <CardHeader>
                  <CardTitle>Brands Management</CardTitle>
                  <CardDescription>
                    Add, edit, and manage cabinet brands
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Brand
                    </Button>
                    
                    <div className="space-y-2">
                      {brands.map((brand) => (
                        <div key={brand.id} className="flex items-center justify-between p-4 border rounded">
                          <div>
                            <h4 className="font-medium">{brand.name}</h4>
                            <p className="text-sm text-muted-foreground">{brand.description}</p>
                            <span className={`text-xs px-2 py-1 rounded ${brand.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {brand.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="space-x-2">
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                    <Button className="w-full">
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
                          <Button variant="outline" size="sm">
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
                    <Button className="w-full">
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
                          <Button variant="outline" size="sm">
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
              <Card>
                <CardHeader>
                  <CardTitle>Door Styles Management</CardTitle>
                  <CardDescription>
                    Manage door styles and base pricing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Door Style
                    </Button>
                    
                    <div className="space-y-2">
                      {doorStyles.map((doorStyle) => (
                        <div key={doorStyle.id} className="flex items-center justify-between p-4 border rounded">
                          <div>
                            <h4 className="font-medium">{doorStyle.name}</h4>
                            <p className="text-sm text-muted-foreground">{doorStyle.description}</p>
                            <p className="text-sm">${doorStyle.base_rate_per_sqm}/sqm base rate</p>
                            <span className={`text-xs px-2 py-1 rounded ${doorStyle.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {doorStyle.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                  <div className="space-y-4">
                    <Button className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Cabinet Type
                    </Button>
                    
                    <div className="space-y-2">
                      {cabinetTypes.map((cabinetType) => (
                        <div key={cabinetType.id} className="flex items-center justify-between p-4 border rounded">
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
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default Admin;