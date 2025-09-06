import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [finishes, setFinishes] = useState<Finish[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [doorStyles, setDoorStyles] = useState<DoorStyle[]>([]);
  const [cabinetTypes, setCabinetTypes] = useState<CabinetType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkAdminRole();
  }, []);

  const checkAdminRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      setIsAdmin(!!data && !error);
      if (data && !error) {
        loadAllData();
      }
    } catch (error) {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    try {
      const [brandsRes, finishesRes, colorsRes, doorStylesRes, cabinetTypesRes] = await Promise.all([
        supabase.from('brands').select('*').order('name'),
        supabase.from('finishes').select('*').order('name'),
        supabase.from('colors').select('*').order('name'),
        supabase.from('door_styles').select('*').order('name'),
        supabase.from('cabinet_types').select('*').order('name')
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
        variant: "destructive",
      });
    }
  };

  const saveBrand = async (brand: Partial<Brand>) => {
    try {
      if (!brand.name) {
        toast({ title: "Error", description: "Brand name is required", variant: "destructive" });
        return;
      }
      
      if (brand.id) {
        await supabase.from('brands').update(brand).eq('id', brand.id);
      } else {
        await supabase.from('brands').insert({
          name: brand.name,
          description: brand.description || null,
          active: brand.active ?? true
        });
      }
      loadAllData();
      toast({ title: "Success", description: "Brand saved!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save brand", variant: "destructive" });
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
      toast({ title: "Success", description: "Finish saved!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save finish", variant: "destructive" });
    }
  };

  const saveColor = async (color: Partial<Color>) => {
    try {
      if (!color.name || !color.finish_id) {
        toast({ title: "Error", description: "Name and finish are required", variant: "destructive" });
        return;
      }
      
      if (color.id) {
        await supabase.from('colors').update(color).eq('id', color.id);
      } else {
        await supabase.from('colors').insert({
          name: color.name,
          finish_id: color.finish_id,
          hex_code: color.hex_code || null,
          image_url: color.image_url || null,
          surcharge_rate_per_sqm: color.surcharge_rate_per_sqm || 0,
          active: color.active ?? true
        });
      }
      loadAllData();
      toast({ title: "Success", description: "Color saved!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save color", variant: "destructive" });
    }
  };

  const saveDoorStyle = async (doorStyle: Partial<DoorStyle>) => {
    try {
      if (!doorStyle.name) {
        toast({ title: "Error", description: "Door style name is required", variant: "destructive" });
        return;
      }
      
      if (doorStyle.id) {
        await supabase.from('door_styles').update(doorStyle).eq('id', doorStyle.id);
      } else {
        await supabase.from('door_styles').insert({
          name: doorStyle.name,
          description: doorStyle.description || null,
          base_rate_per_sqm: doorStyle.base_rate_per_sqm || 0,
          active: doorStyle.active ?? true
        });
      }
      loadAllData();
      toast({ title: "Success", description: "Door style saved!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save door style", variant: "destructive" });
    }
  };

  const saveCabinetType = async (cabinetType: Partial<CabinetType>) => {
    try {
      if (!cabinetType.name || !cabinetType.category || 
          !cabinetType.default_width_mm || !cabinetType.default_height_mm || !cabinetType.default_depth_mm) {
        toast({ title: "Error", description: "All fields are required", variant: "destructive" });
        return;
      }
      
      if (cabinetType.id) {
        await supabase.from('cabinet_types').update(cabinetType).eq('id', cabinetType.id);
      } else {
        await supabase.from('cabinet_types').insert({
          name: cabinetType.name,
          category: cabinetType.category,
          default_width_mm: cabinetType.default_width_mm,
          default_height_mm: cabinetType.default_height_mm,
          default_depth_mm: cabinetType.default_depth_mm,
          active: cabinetType.active ?? true
        });
      }
      loadAllData();
      toast({ title: "Success", description: "Cabinet type saved!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save cabinet type", variant: "destructive" });
    }
  };

  const deleteBrand = async (id: string) => {
    try {
      await supabase.from('brands').delete().eq('id', id);
      loadAllData();
      toast({ title: "Success", description: "Brand deleted!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete brand", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card>
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>You need admin privileges to access this page.</CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
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
            <BrandsManager brands={brands} onSave={saveBrand} onDelete={deleteBrand} />
          </TabsContent>

          <TabsContent value="finishes">
            <FinishesManager finishes={finishes} brands={brands} onSave={saveFinish} />
          </TabsContent>

          <TabsContent value="colors">
            <ColorsManager colors={colors} finishes={finishes} onSave={saveColor} />
          </TabsContent>

          <TabsContent value="door-styles">
            <DoorStylesManager doorStyles={doorStyles} onSave={saveDoorStyle} />
          </TabsContent>

          <TabsContent value="cabinet-types">
            <CabinetTypesManager cabinetTypes={cabinetTypes} onSave={saveCabinetType} />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

// Component for managing brands
const BrandsManager = ({ brands, onSave, onDelete }: { 
  brands: Brand[]; 
  onSave: (brand: Partial<Brand>) => void;
  onDelete: (id: string) => void;
}) => {
  const [editingBrand, setEditingBrand] = useState<Partial<Brand>>({});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add/Edit Brand</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="brand-name">Name</Label>
            <Input
              id="brand-name"
              value={editingBrand.name || ''}
              onChange={(e) => setEditingBrand(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="brand-description">Description</Label>
            <Textarea
              id="brand-description"
              value={editingBrand.description || ''}
              onChange={(e) => setEditingBrand(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={editingBrand.active ?? true}
              onCheckedChange={(checked) => setEditingBrand(prev => ({ ...prev, active: checked }))}
            />
            <Label>Active</Label>
          </div>
          <Button onClick={() => {
            onSave(editingBrand);
            setEditingBrand({});
          }}>
            <Save className="h-4 w-4 mr-2" />
            Save Brand
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Brands</CardTitle>
        </CardHeader>
        <CardContent>
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
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingBrand(brand)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onDelete(brand.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Component for managing finishes
const FinishesManager = ({ finishes, brands, onSave }: { 
  finishes: Finish[]; 
  brands: Brand[];
  onSave: (finish: Partial<Finish>) => void;
}) => {
  const [editingFinish, setEditingFinish] = useState<Partial<Finish>>({});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add/Edit Finish</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="finish-name">Name</Label>
            <Input
              id="finish-name"
              value={editingFinish.name || ''}
              onChange={(e) => setEditingFinish(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="finish-type">Finish Type</Label>
            <Input
              id="finish-type"
              value={editingFinish.finish_type || ''}
              onChange={(e) => setEditingFinish(prev => ({ ...prev, finish_type: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="finish-rate">Rate per m²</Label>
            <Input
              id="finish-rate"
              type="number"
              step="0.01"
              value={editingFinish.rate_per_sqm || ''}
              onChange={(e) => setEditingFinish(prev => ({ ...prev, rate_per_sqm: parseFloat(e.target.value) }))}
            />
          </div>
          <div>
            <Label htmlFor="finish-brand">Brand</Label>
            <Select value={editingFinish.brand_id || ''} onValueChange={(value) => setEditingFinish(prev => ({ ...prev, brand_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={editingFinish.active ?? true}
              onCheckedChange={(checked) => setEditingFinish(prev => ({ ...prev, active: checked }))}
            />
            <Label>Active</Label>
          </div>
          <Button onClick={() => {
            onSave(editingFinish);
            setEditingFinish({});
          }}>
            <Save className="h-4 w-4 mr-2" />
            Save Finish
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Finishes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {finishes.map((finish) => (
              <div key={finish.id} className="flex items-center justify-between p-4 border rounded">
                <div>
                  <h4 className="font-medium">{finish.name}</h4>
                  <p className="text-sm text-muted-foreground">{finish.finish_type} - ${finish.rate_per_sqm}/m²</p>
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
        </CardContent>
      </Card>
    </div>
  );
};

// Component for managing colors
const ColorsManager = ({ colors, finishes, onSave }: { 
  colors: Color[]; 
  finishes: Finish[];
  onSave: (color: Partial<Color>) => void;
}) => {
  const [editingColor, setEditingColor] = useState<Partial<Color>>({});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add/Edit Color</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="color-name">Name</Label>
            <Input
              id="color-name"
              value={editingColor.name || ''}
              onChange={(e) => setEditingColor(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="color-hex">Hex Code</Label>
            <Input
              id="color-hex"
              value={editingColor.hex_code || ''}
              onChange={(e) => setEditingColor(prev => ({ ...prev, hex_code: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="color-image">Image URL</Label>
            <Input
              id="color-image"
              value={editingColor.image_url || ''}
              onChange={(e) => setEditingColor(prev => ({ ...prev, image_url: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="color-surcharge">Surcharge per m²</Label>
            <Input
              id="color-surcharge"
              type="number"
              step="0.01"
              value={editingColor.surcharge_rate_per_sqm || ''}
              onChange={(e) => setEditingColor(prev => ({ ...prev, surcharge_rate_per_sqm: parseFloat(e.target.value) }))}
            />
          </div>
          <div>
            <Label htmlFor="color-finish">Finish</Label>
            <Select value={editingColor.finish_id || ''} onValueChange={(value) => setEditingColor(prev => ({ ...prev, finish_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select finish" />
              </SelectTrigger>
              <SelectContent>
                {finishes.map((finish) => (
                  <SelectItem key={finish.id} value={finish.id}>{finish.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={editingColor.active ?? true}
              onCheckedChange={(checked) => setEditingColor(prev => ({ ...prev, active: checked }))}
            />
            <Label>Active</Label>
          </div>
          <Button onClick={() => {
            onSave(editingColor);
            setEditingColor({});
          }}>
            <Save className="h-4 w-4 mr-2" />
            Save Color
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {colors.map((color) => (
              <div key={color.id} className="flex items-center justify-between p-4 border rounded">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: color.hex_code }}
                  />
                  <div>
                    <h4 className="font-medium">{color.name}</h4>
                    <p className="text-sm text-muted-foreground">+${color.surcharge_rate_per_sqm}/m²</p>
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
        </CardContent>
      </Card>
    </div>
  );
};

// Component for managing door styles
const DoorStylesManager = ({ doorStyles, onSave }: { 
  doorStyles: DoorStyle[]; 
  onSave: (doorStyle: Partial<DoorStyle>) => void;
}) => {
  const [editingDoorStyle, setEditingDoorStyle] = useState<Partial<DoorStyle>>({});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add/Edit Door Style</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="door-name">Name</Label>
            <Input
              id="door-name"
              value={editingDoorStyle.name || ''}
              onChange={(e) => setEditingDoorStyle(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="door-description">Description</Label>
            <Textarea
              id="door-description"
              value={editingDoorStyle.description || ''}
              onChange={(e) => setEditingDoorStyle(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="door-rate">Base Rate per m²</Label>
            <Input
              id="door-rate"
              type="number"
              step="0.01"
              value={editingDoorStyle.base_rate_per_sqm || ''}
              onChange={(e) => setEditingDoorStyle(prev => ({ ...prev, base_rate_per_sqm: parseFloat(e.target.value) }))}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={editingDoorStyle.active ?? true}
              onCheckedChange={(checked) => setEditingDoorStyle(prev => ({ ...prev, active: checked }))}
            />
            <Label>Active</Label>
          </div>
          <Button onClick={() => {
            onSave(editingDoorStyle);
            setEditingDoorStyle({});
          }}>
            <Save className="h-4 w-4 mr-2" />
            Save Door Style
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Door Styles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {doorStyles.map((doorStyle) => (
              <div key={doorStyle.id} className="flex items-center justify-between p-4 border rounded">
                <div>
                  <h4 className="font-medium">{doorStyle.name}</h4>
                  <p className="text-sm text-muted-foreground">{doorStyle.description}</p>
                  <p className="text-sm font-medium">${doorStyle.base_rate_per_sqm}/m²</p>
                  <span className={`text-xs px-2 py-1 rounded ${doorStyle.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {doorStyle.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditingDoorStyle(doorStyle)}>
                  Edit
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Component for managing cabinet types
const CabinetTypesManager = ({ cabinetTypes, onSave }: { 
  cabinetTypes: CabinetType[]; 
  onSave: (cabinetType: Partial<CabinetType>) => void;
}) => {
  const [editingCabinetType, setEditingCabinetType] = useState<Partial<CabinetType>>({});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add/Edit Cabinet Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cabinet-name">Name</Label>
            <Input
              id="cabinet-name"
              value={editingCabinetType.name || ''}
              onChange={(e) => setEditingCabinetType(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="cabinet-category">Category</Label>
            <Input
              id="cabinet-category"
              value={editingCabinetType.category || ''}
              onChange={(e) => setEditingCabinetType(prev => ({ ...prev, category: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cabinet-width">Default Width (mm)</Label>
              <Input
                id="cabinet-width"
                type="number"
                value={editingCabinetType.default_width_mm || ''}
                onChange={(e) => setEditingCabinetType(prev => ({ ...prev, default_width_mm: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="cabinet-height">Default Height (mm)</Label>
              <Input
                id="cabinet-height"
                type="number"
                value={editingCabinetType.default_height_mm || ''}
                onChange={(e) => setEditingCabinetType(prev => ({ ...prev, default_height_mm: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="cabinet-depth">Default Depth (mm)</Label>
              <Input
                id="cabinet-depth"
                type="number"
                value={editingCabinetType.default_depth_mm || ''}
                onChange={(e) => setEditingCabinetType(prev => ({ ...prev, default_depth_mm: parseInt(e.target.value) }))}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={editingCabinetType.active ?? true}
              onCheckedChange={(checked) => setEditingCabinetType(prev => ({ ...prev, active: checked }))}
            />
            <Label>Active</Label>
          </div>
          <Button onClick={() => {
            onSave(editingCabinetType);
            setEditingCabinetType({});
          }}>
            <Save className="h-4 w-4 mr-2" />
            Save Cabinet Type
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Cabinet Types</CardTitle>
        </CardHeader>
        <CardContent>
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
                <Button variant="outline" size="sm" onClick={() => setEditingCabinetType(cabinetType)}>
                  Edit
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;