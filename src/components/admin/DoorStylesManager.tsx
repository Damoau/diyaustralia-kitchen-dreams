import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { DoorStyle, Brand } from '@/types/cabinet';
import { useToast } from '@/hooks/use-toast';
import { DoorStyleFinishesManager } from './DoorStyleFinishesManager';

export function DoorStylesManager() {
  const { toast } = useToast();
  const [doorStyles, setDoorStyles] = useState<DoorStyle[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedDoorStyle, setSelectedDoorStyle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [doorStylesRes, brandsRes] = await Promise.all([
        supabase
          .from('door_styles')
          .select(`
            *,
            brand:brands(*)
          `)
          .order('name'),
        supabase
          .from('brands')
          .select('*')
          .eq('active', true)
          .order('name')
      ]);

      if (doorStylesRes.error) throw doorStylesRes.error;
      if (brandsRes.error) throw brandsRes.error;
      
      if (doorStylesRes.data) setDoorStyles(doorStylesRes.data as DoorStyle[]);
      if (brandsRes.data) setBrands(brandsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const addDoorStyle = async () => {
    const newStyle = {
      name: "New Door Style",
      description: "",
      base_rate_per_sqm: 0,
      active: true
    };

    const { data, error } = await supabase
      .from('door_styles')
      .insert(newStyle)
      .select(`
        *,
        brand:brands(*)
      `)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add door style",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setDoorStyles([...doorStyles, data as DoorStyle]);
    }
  };

  const updateDoorStyle = async (id: string, updates: Partial<DoorStyle>) => {
    const { error } = await supabase
      .from('door_styles')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update door style",
        variant: "destructive",
      });
      return;
    }

    // Refresh data to get updated brand information
    fetchData();
  };

  const deleteDoorStyle = async (id: string) => {
    const { error } = await supabase
      .from('door_styles')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete door style",
        variant: "destructive",
      });
      return;
    }

    setDoorStyles(doorStyles.filter(style => style.id !== id));
    if (selectedDoorStyle === id) {
      setSelectedDoorStyle(null);
    }
  };

  if (loading) {
    return <div>Loading door styles...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs value={selectedDoorStyle || "list"} onValueChange={setSelectedDoorStyle}>
        <TabsList>
          <TabsTrigger value="list">Door Styles</TabsTrigger>
          {selectedDoorStyle && (
            <TabsTrigger value={selectedDoorStyle}>
              Manage Finishes
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Door Styles</CardTitle>
              <Button onClick={addDoorStyle} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Door Style
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Base Rate ($/sqm)</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doorStyles.map((style) => (
                    <TableRow key={style.id}>
                      <TableCell>
                        <Select
                          value={style.brand_id || "none"}
                          onValueChange={(value) => updateDoorStyle(style.id, { brand_id: value === "none" ? null : value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No brand</SelectItem>
                            {brands.map(brand => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={style.name}
                          onChange={(e) => updateDoorStyle(style.id, { name: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={style.description || ""}
                          onChange={(e) => updateDoorStyle(style.id, { description: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={style.base_rate_per_sqm}
                          onChange={(e) => updateDoorStyle(style.id, { base_rate_per_sqm: parseFloat(e.target.value) || 0 })}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={style.active ? "true" : "false"}
                          onValueChange={(value) => updateDoorStyle(style.id, { active: value === "true" })}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => setSelectedDoorStyle(style.id)}
                            variant="outline"
                            size="sm"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => deleteDoorStyle(style.id)}
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {selectedDoorStyle && (
          <TabsContent value={selectedDoorStyle}>
            <DoorStyleFinishesManager doorStyleId={selectedDoorStyle} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}