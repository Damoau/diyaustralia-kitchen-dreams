import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, Calculator, Wrench } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CabinetPart {
  id: string;
  part_name: string;
  quantity: number;
  width_formula?: string;
  height_formula?: string;
  is_door: boolean;
  is_hardware: boolean;
}

interface CabinetComponentsTabProps {
  cabinetId: string;
  cabinetStyle: string;
  onCabinetStyleChange: (style: string) => void;
}

export const CabinetComponentsTab: React.FC<CabinetComponentsTabProps> = ({ cabinetId, cabinetStyle, onCabinetStyleChange }) => {
  const [isAddingPart, setIsAddingPart] = useState(false);
  const [newPart, setNewPart] = useState({
    part_name: '',
    quantity: 1,
    width_formula: '',
    height_formula: '',
    is_door: false,
    is_hardware: false,
  });

  const queryClient = useQueryClient();

  // Fetch cabinet parts
  const { data: parts, isLoading } = useQuery({
    queryKey: ['cabinet-parts', cabinetId],
    queryFn: async () => {
      if (cabinetId === 'new') return [];
      
      const { data, error } = await supabase
        .from('cabinet_parts')
        .select('*')
        .eq('cabinet_type_id', cabinetId)
        .order('part_name');

      if (error) throw error;
      return data as CabinetPart[];
    },
    enabled: cabinetId !== 'new',
  });

  // Add part mutation
  const addPartMutation = useMutation({
    mutationFn: async (part: typeof newPart) => {
      const { error } = await supabase
        .from('cabinet_parts')
        .insert([{ ...part, cabinet_type_id: cabinetId }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-parts'] });
      toast.success('Cabinet part added');
      setIsAddingPart(false);
      setNewPart({
        part_name: '',
        quantity: 1,
        width_formula: '',
        height_formula: '',
        is_door: false,
        is_hardware: false,
      });
    },
    onError: (error) => {
      console.error('Error adding part:', error);
      toast.error('Failed to add cabinet part');
    },
  });

  // Delete part mutation
  const deletePartMutation = useMutation({
    mutationFn: async (partId: string) => {
      const { error } = await supabase
        .from('cabinet_parts')
        .delete()
        .eq('id', partId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-parts'] });
      toast.success('Cabinet part deleted');
    },
    onError: (error) => {
      console.error('Error deleting part:', error);
      toast.error('Failed to delete cabinet part');
    },
  });

  const handleAddPart = () => {
    if (!newPart.part_name.trim()) {
      toast.error('Part name is required');
      return;
    }
    addPartMutation.mutate(newPart);
  };

  // Handle cabinet style change and update parent
  const handleCabinetStyleChange = (style: string) => {
    onCabinetStyleChange(style);
  };

  if (cabinetId === 'new') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Cabinet Components
          </CardTitle>
          <CardDescription>
            Save the cabinet first to manage its components and formulas
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Cabinet Components
              </CardTitle>
              <CardDescription>
                Define the parts that make up this cabinet type and their quantity formulas
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="cabinet_style" className="text-sm font-medium">Cabinet Style</Label>
                <Select value={cabinetStyle || 'standard'} onValueChange={handleCabinetStyleChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Cabinet</SelectItem>
                    <SelectItem value="corner">Corner Cabinet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isAddingPart} onOpenChange={setIsAddingPart}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Component
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Cabinet Component</DialogTitle>
                    <DialogDescription>
                      Define a new component for this cabinet type
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Part Name</Label>
                      <Input
                        value={newPart.part_name}
                        onChange={(e) => setNewPart({ ...newPart, part_name: e.target.value })}
                        placeholder="e.g., Left Side, Right Side, Door"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={newPart.quantity}
                        onChange={(e) => setNewPart({ ...newPart, quantity: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Width Formula</Label>
                        <Input
                          value={newPart.width_formula}
                          onChange={(e) => setNewPart({ ...newPart, width_formula: e.target.value })}
                          placeholder="W or W-30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Height Formula</Label>
                        <Input
                          value={newPart.height_formula}
                          onChange={(e) => setNewPart({ ...newPart, height_formula: e.target.value })}
                          placeholder="H or H-20"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newPart.is_door}
                          onCheckedChange={(checked) => setNewPart({ ...newPart, is_door: checked })}
                        />
                        <Label>Is Door</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newPart.is_hardware}
                          onCheckedChange={(checked) => setNewPart({ ...newPart, is_hardware: checked })}
                        />
                        <Label>Is Hardware</Label>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleAddPart} disabled={addPartMutation.isPending}>
                        Add Component
                      </Button>
                      <Button variant="outline" onClick={() => setIsAddingPart(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading components...</div>
          ) : parts && parts.length > 0 ? (
            <div className="space-y-3">
              {parts.map((part) => (
                <div key={part.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{part.part_name}</span>
                      <Badge variant="outline">Qty: {part.quantity}</Badge>
                      {part.is_door && <Badge>Door</Badge>}
                      {part.is_hardware && <Badge variant="secondary">Hardware</Badge>}
                    </div>
                    {(part.width_formula || part.height_formula) && (
                      <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        <Calculator className="h-3 w-3" />
                        {part.width_formula && `W: ${part.width_formula}`}
                        {part.width_formula && part.height_formula && ' • '}
                        {part.height_formula && `H: ${part.height_formula}`}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deletePartMutation.mutate(part.id)}
                    disabled={deletePartMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No components defined yet</p>
              <p className="text-sm">Add components to define how this cabinet is built</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Formula Reference
          </CardTitle>
          <CardDescription>
            Use these variables in your formulas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">Dimensions</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li><code className="bg-muted px-1 rounded">W</code> - Cabinet width</li>
                <li><code className="bg-muted px-1 rounded">H</code> - Cabinet height</li>
                <li><code className="bg-muted px-1 rounded">D</code> - Cabinet depth</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Operations</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li><code className="bg-muted px-1 rounded">W-30</code> - Width minus 30mm</li>
                <li><code className="bg-muted px-1 rounded">H/2</code> - Height divided by 2</li>
                <li><code className="bg-muted px-1 rounded">D+18</code> - Depth plus 18mm</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};