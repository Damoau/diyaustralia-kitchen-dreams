import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Palette } from "lucide-react";
import DoorStyleEditDialog from "@/components/admin/DoorStyleEditDialog";
import ColorEditDialog from "@/components/admin/ColorEditDialog";
import FinishEditDialog from "@/components/admin/FinishEditDialog";
import { ProductConfigurator } from "@/components/product/ProductConfigurator";

interface DoorStyle {
  id: string;
  name: string;
  description: string;
  base_rate_per_sqm: number;
  active: boolean;
}

interface Color {
  id: string;
  name: string;
  hex_code: string;
  image_url: string;
  door_style_id: string;
  surcharge_rate_per_sqm: number;
  active: boolean;
}

interface Finish {
  id: string;
  name: string;
  finish_type: string;
  rate_per_sqm: number;
  brand_id: string;
  active: boolean;
}

const DoorStyles = () => {
  const [doorStyleDialog, setDoorStyleDialog] = useState<{ open: boolean; doorStyle: DoorStyle | null }>({
    open: false,
    doorStyle: null
  });
  
  const [colorDialog, setColorDialog] = useState<{ open: boolean; color: Color | null }>({
    open: false,
    color: null
  });
  
  const [finishDialog, setFinishDialog] = useState<{ open: boolean; finish: Finish | null }>({
    open: false,
    finish: null
  });

  const [configuratorDialog, setConfiguratorDialog] = useState<{ open: boolean; cabinetType: any | null }>({
    open: false,
    cabinetType: null
  });

  const queryClient = useQueryClient();

  // Fetch door styles
  const { data: doorStyles, isLoading: loadingDoorStyles } = useQuery({
    queryKey: ['door-styles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('door_styles')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as DoorStyle[];
    },
  });

  // Fetch colors
  const { data: colors, isLoading: loadingColors } = useQuery({
    queryKey: ['colors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('colors')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Color[];
    },
  });

  // Fetch finishes with brands
  const { data: finishes, isLoading: loadingFinishes } = useQuery({
    queryKey: ['finishes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finishes')
        .select(`
          *,
          brands!inner(name)
        `)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch a sample cabinet type for testing
  const { data: sampleCabinetType } = useQuery({
    queryKey: ['sample-cabinet'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('active', true)
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Door style mutations
  const saveDoorStyleMutation = useMutation({
    mutationFn: async (doorStyle: Partial<DoorStyle>) => {
      if (doorStyle.id) {
        const { error } = await supabase
          .from('door_styles')
          .update(doorStyle)
          .eq('id', doorStyle.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('door_styles')
          .insert({
            name: doorStyle.name || '',
            description: doorStyle.description || '',
            base_rate_per_sqm: doorStyle.base_rate_per_sqm || 0,
            active: doorStyle.active ?? true
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['door-styles'] });
      toast.success('Door style saved successfully');
      setDoorStyleDialog({ open: false, doorStyle: null });
    },
    onError: (error) => {
      toast.error('Failed to save door style');
      console.error(error);
    },
  });

  const deleteDoorStyleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('door_styles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['door-styles'] });
      toast.success('Door style deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete door style');
      console.error(error);
    },
  });

  // Color mutations
  const saveColorMutation = useMutation({
    mutationFn: async (color: Partial<Color>) => {
      if (color.id) {
        const { error } = await supabase
          .from('colors')
          .update(color)
          .eq('id', color.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('colors')
          .insert({
            name: color.name || '',
            hex_code: color.hex_code || '#000000',
            image_url: color.image_url || '',
            door_style_id: color.door_style_id || '',
            surcharge_rate_per_sqm: color.surcharge_rate_per_sqm || 0,
            active: color.active ?? true
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colors'] });
      toast.success('Color saved successfully');
      setColorDialog({ open: false, color: null });
    },
    onError: (error) => {
      toast.error('Failed to save color');
      console.error(error);
    },
  });

  const deleteColorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('colors')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colors'] });
      toast.success('Color deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete color');
      console.error(error);
    },
  });

  // Finish mutations
  const saveFinishMutation = useMutation({
    mutationFn: async (finish: Partial<Finish>) => {
      if (finish.id) {
        const { error } = await supabase
          .from('finishes')
          .update(finish)
          .eq('id', finish.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('finishes')
          .insert({
            name: finish.name || '',
            finish_type: finish.finish_type || 'standard',
            rate_per_sqm: finish.rate_per_sqm || 0,
            brand_id: finish.brand_id || '',
            active: finish.active ?? true
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finishes'] });
      toast.success('Finish saved successfully');
      setFinishDialog({ open: false, finish: null });
    },
    onError: (error) => {
      toast.error('Failed to save finish');
      console.error(error);
    },
  });

  const deleteFinishMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('finishes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finishes'] });
      toast.success('Finish deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete finish');
      console.error(error);
    },
  });

  const openConfigurator = () => {
    if (!sampleCabinetType) {
      toast.error('No cabinet available for testing');
      return;
    }
    setConfiguratorDialog({ open: true, cabinetType: sampleCabinetType });
  };

  if (loadingDoorStyles || loadingColors || loadingFinishes) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Door Styles & Colors</h1>
          <p className="text-muted-foreground">Manage door styles, colors, and finishes for cabinets</p>
        </div>
        <Button onClick={openConfigurator} className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Test Configuration
        </Button>
      </div>

      {/* Door Styles Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Door Styles</CardTitle>
          <Button onClick={() => setDoorStyleDialog({ open: true, doorStyle: null })}>
            <Plus className="h-4 w-4 mr-2" />
            Add Door Style
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {doorStyles?.map((doorStyle) => (
              <Card key={doorStyle.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{doorStyle.name}</h3>
                    <p className="text-sm text-muted-foreground">${doorStyle.base_rate_per_sqm}/sqm</p>
                  </div>
                  <Badge variant={doorStyle.active ? "default" : "secondary"}>
                    {doorStyle.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {doorStyle.description && (
                  <p className="text-sm text-muted-foreground mb-3">{doorStyle.description}</p>
                )}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setDoorStyleDialog({ open: true, doorStyle })}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => deleteDoorStyleMutation.mutate(doorStyle.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Colors Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Colors</CardTitle>
          <Button onClick={() => setColorDialog({ open: true, color: null })}>
            <Plus className="h-4 w-4 mr-2" />
            Add Color
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {colors?.map((color) => (
              <Card key={color.id} className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: color.hex_code }}
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{color.name}</h3>
                    <p className="text-sm text-muted-foreground">+${color.surcharge_rate_per_sqm}/sqm</p>
                  </div>
                  <Badge variant={color.active ? "default" : "secondary"}>
                    {color.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setColorDialog({ open: true, color })}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => deleteColorMutation.mutate(color.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Finishes Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Finishes</CardTitle>
          <Button onClick={() => setFinishDialog({ open: true, finish: null })}>
            <Plus className="h-4 w-4 mr-2" />
            Add Finish
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {finishes?.map((finish: any) => (
              <Card key={finish.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{finish.name}</h3>
                    <p className="text-sm text-muted-foreground">{finish.brands?.name}</p>
                    <p className="text-sm text-muted-foreground">+${finish.rate_per_sqm}/sqm</p>
                  </div>
                  <Badge variant={finish.active ? "default" : "secondary"}>
                    {finish.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setFinishDialog({ open: true, finish })}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => deleteFinishMutation.mutate(finish.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <DoorStyleEditDialog
        doorStyle={doorStyleDialog.doorStyle}
        open={doorStyleDialog.open}
        onOpenChange={(open) => setDoorStyleDialog({ open, doorStyle: null })}
        onSave={(doorStyle) => saveDoorStyleMutation.mutate(doorStyle)}
      />

      <ColorEditDialog
        color={colorDialog.color}
        open={colorDialog.open}
        onOpenChange={(open) => setColorDialog({ open, color: null })}
        onSave={(color) => saveColorMutation.mutate(color)}
      />

      <FinishEditDialog
        finish={finishDialog.finish}
        brands={[]}
        open={finishDialog.open}
        onOpenChange={(open) => setFinishDialog({ open, finish: null })}
        onSave={(finish) => saveFinishMutation.mutate(finish)}
      />

      {/* Product Configurator for Testing */}
      <ProductConfigurator
        cabinetTypeId={configuratorDialog.cabinetType?.id}
        open={configuratorDialog.open}
        onOpenChange={(open) => setConfiguratorDialog({ open, cabinetType: null })}
      />
    </div>
  );
};

export default DoorStyles;