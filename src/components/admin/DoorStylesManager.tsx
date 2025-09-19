import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Save, Plus, Edit, Trash2, Palette, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DoorStyle {
  id?: string;
  name: string;
  description?: string;
  base_rate_per_sqm: number;
  image_url?: string;
  active: boolean;
}

interface Color {
  id?: string;
  name: string;
  hex_code?: string;
  image_url?: string;
  door_style_id?: string;
  surcharge_rate_per_sqm: number;
  sort_order: number;
  active: boolean;
}

interface DoorStyleFinish {
  id?: string;
  door_style_id: string;
  name: string;
  rate_per_sqm: number;
  sort_order: number;
  active: boolean;
}

export const DoorStylesManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('door-styles');
  const [editingDoorStyle, setEditingDoorStyle] = useState<DoorStyle | null>(null);
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [editingFinish, setEditingFinish] = useState<DoorStyleFinish | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch door styles
  const { data: doorStyles, isLoading: loadingDoorStyles } = useQuery({
    queryKey: ['door-styles-admin'],
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
    queryKey: ['colors-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('colors')
        .select(`
          *,
          door_styles (name)
        `)
        .order('door_style_id', { nullsFirst: false })
        .order('sort_order')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  // Fetch door style finishes
  const { data: finishes, isLoading: loadingFinishes } = useQuery({
    queryKey: ['door-style-finishes-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('door_style_finishes')
        .select(`
          *,
          door_styles (name)
        `)
        .order('door_style_id')
        .order('sort_order')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingDoorStyle(null);
    setEditingColor(null);
    setEditingFinish(null);
  };

  const handleNewDoorStyle = () => {
    setEditingDoorStyle({
      name: '',
      description: '',
      base_rate_per_sqm: 0,
      image_url: '',
      active: true,
    });
    setDialogOpen(true);
  };

  const handleNewColor = () => {
    setEditingColor({
      name: '',
      hex_code: '#FFFFFF',
      image_url: '',
      door_style_id: '',
      surcharge_rate_per_sqm: 0,
      sort_order: 0,
      active: true,
    });
    setDialogOpen(true);
  };

  const handleNewFinish = () => {
    setEditingFinish({
      door_style_id: doorStyles?.[0]?.id || '',
      name: '',
      rate_per_sqm: 0,
      sort_order: 0,
      active: true,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Door Styles & Colors Management</h2>
          <p className="text-muted-foreground">
            Manage door styles, colors, and finishes used in cabinet pricing formulas
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Quick Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Door Styles</p>
                    <p className="text-2xl font-bold">{doorStyles?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Colors</p>
                    <p className="text-2xl font-bold">{colors?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Finishes</p>
                    <p className="text-2xl font-bold">{finishes?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="door-styles">Door Styles</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="finishes">Finishes</TabsTrigger>
        </TabsList>

        <TabsContent value="door-styles">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Door Styles
                  </CardTitle>
                  <CardDescription>
                    Base door styles with pricing per square meter. Used in cabinet pricing formulas.
                  </CardDescription>
                </div>
                <Button onClick={handleNewDoorStyle}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Door Style
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingDoorStyles ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {doorStyles?.map((style) => (
                    <Card key={style.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{style.name}</CardTitle>
                          <div className="flex gap-1">
                            <Badge variant={style.active ? "default" : "secondary"}>
                              {style.active ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingDoorStyle(style);
                                setDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Base Rate:</span>
                            <span className="font-medium">${style.base_rate_per_sqm}/sqm</span>
                          </div>
                          {style.description && (
                            <p className="text-muted-foreground">{style.description}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Colors
                  </CardTitle>
                  <CardDescription>
                    Color options with surcharge rates. Can be linked to specific door styles or available for all.
                  </CardDescription>
                </div>
                <Button onClick={handleNewColor}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Color
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingColors ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {colors?.map((color: any) => (
                    <Card key={color.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {color.hex_code && (
                              <div
                                className="w-6 h-6 rounded border-2 border-border"
                                style={{ backgroundColor: color.hex_code }}
                              />
                            )}
                            <CardTitle className="text-lg">{color.name}</CardTitle>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingColor(color);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        {color.door_styles?.name && (
                          <Badge variant="outline">{color.door_styles.name}</Badge>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Surcharge:</span>
                            <span className="font-medium">${color.surcharge_rate_per_sqm}/sqm</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sort Order:</span>
                            <span>{color.sort_order}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finishes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Door Style Finishes
                  </CardTitle>
                  <CardDescription>
                    Additional finish options for specific door styles with pricing.
                  </CardDescription>
                </div>
                <Button onClick={handleNewFinish}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Finish
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingFinishes ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {finishes?.map((finish: any) => (
                    <Card key={finish.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{finish.name}</CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingFinish(finish);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        <Badge variant="outline">{finish.door_styles?.name}</Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Rate:</span>
                            <span className="font-medium">${finish.rate_per_sqm}/sqm</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sort Order:</span>
                            <span>{finish.sort_order}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Simple placeholder dialogs for now */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {editingDoorStyle && (editingDoorStyle.id ? 'Edit Door Style' : 'New Door Style')}
              {editingColor && (editingColor.id ? 'Edit Color' : 'New Color')}
              {editingFinish && (editingFinish.id ? 'Edit Finish' : 'New Finish')}
            </DialogTitle>
            <DialogDescription>
              Manage door styles, colors, and finishes used in pricing calculations.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4">
            <p className="text-muted-foreground">
              Door styles and colors management functionality coming soon. 
              This will allow you to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
              <li>Set base rates per square meter for door styles</li>
              <li>Configure color surcharges</li>
              <li>Manage finish options and pricing</li>
              <li>Link colors to specific door styles</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button onClick={handleCloseDialog}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoorStylesManager;