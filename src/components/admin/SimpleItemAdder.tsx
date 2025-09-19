import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface SimpleItemAdderProps {
  onItemAdd: (item: {
    cabinet_type_id: string;
    name: string;
    quantity: number;
    width_mm: number;
    height_mm: number;
    depth_mm: number;
    unit_price: number;
    total_price: number;
    configuration?: any;
    door_style_id?: string;
    color_id?: string;
    finish_id?: string;
  }) => void;
  onCancel: () => void;
}

export const SimpleItemAdder = ({ onItemAdd, onCancel }: SimpleItemAdderProps) => {
  const [selectedCabinetId, setSelectedCabinetId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(720);
  const [depth, setDepth] = useState(560);
  const [unitPrice, setUnitPrice] = useState(0);

  // Fetch cabinet types
  const { data: cabinetTypes } = useQuery({
    queryKey: ['cabinet-types-simple'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const selectedCabinet = cabinetTypes?.find(c => c.id === selectedCabinetId);

  const handleCabinetChange = (cabinetId: string) => {
    setSelectedCabinetId(cabinetId);
    const cabinet = cabinetTypes?.find(c => c.id === cabinetId);
    if (cabinet) {
      setWidth(cabinet.default_width_mm);
      setHeight(cabinet.default_height_mm);
      setDepth(cabinet.default_depth_mm);
      setUnitPrice(cabinet.base_price || 0);
    }
  };

  const handleAddItem = () => {
    if (!selectedCabinet) return;

    onItemAdd({
      cabinet_type_id: selectedCabinetId,
      name: selectedCabinet.name,
      quantity,
      width_mm: width,
      height_mm: height,
      depth_mm: depth,
      unit_price: unitPrice,
      total_price: unitPrice * quantity,
      configuration: {
        width: width,
        height: height,
        depth: depth
      }
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Quote Item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cabinet-select">Cabinet Type</Label>
            <Select value={selectedCabinetId} onValueChange={handleCabinetChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a cabinet type" />
              </SelectTrigger>
              <SelectContent>
                {cabinetTypes?.map(cabinet => (
                  <SelectItem key={cabinet.id} value={cabinet.id}>
                    {cabinet.name} - {cabinet.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCabinet && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="width">Width (mm)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                    min={selectedCabinet.min_width_mm || 100}
                    max={selectedCabinet.max_width_mm || 1200}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (mm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                    min={selectedCabinet.min_height_mm || 200}
                    max={selectedCabinet.max_height_mm || 1000}
                  />
                </div>
                <div>
                  <Label htmlFor="depth">Depth (mm)</Label>
                  <Input
                    id="depth"
                    type="number"
                    value={depth}
                    onChange={(e) => setDepth(parseInt(e.target.value) || 0)}
                    min={selectedCabinet.min_depth_mm || 200}
                    max={selectedCabinet.max_depth_mm || 800}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min={1}
                  />
                </div>
                <div>
                  <Label htmlFor="unit-price">Unit Price ($)</Label>
                  <Input
                    id="unit-price"
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    min={0}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">Total Price:</span>
                <span className="text-lg font-bold">${(unitPrice * quantity).toLocaleString()}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleAddItem}
          disabled={!selectedCabinet || unitPrice <= 0}
        >
          Add Item
        </Button>
      </div>
    </div>
  );
};