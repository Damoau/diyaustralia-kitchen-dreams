import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, Calculator, Wrench, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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

// Default parts for different cabinet styles
const getDefaultParts = (style: string): Omit<CabinetPart, 'id'>[] => {
  if (style === 'corner') {
    return [
      { 
        part_name: 'Left Back', 
        quantity: 1, 
        width_formula: '(((left_width/1000*height/1000)*qty)*mat_rate_per_sqm)', 
        height_formula: 'H', 
        is_door: false, 
        is_hardware: false 
      },
      { 
        part_name: 'Right Back', 
        quantity: 1, 
        width_formula: '(((right_width/1000*height/1000)*qty)*mat_rate_per_sqm)', 
        height_formula: 'H', 
        is_door: false, 
        is_hardware: false 
      },
      { 
        part_name: 'Bottom', 
        quantity: 1, 
        width_formula: '(((right_depth/1000*left_depth/1000)*qty)*mat_rate_per_sqm)', 
        height_formula: 'D', 
        is_door: false, 
        is_hardware: false 
      },
      { 
        part_name: 'Left Side', 
        quantity: 1, 
        width_formula: '(((left_depth/1000*height/1000)*qty)*mat_rate_per_sqm)', 
        height_formula: 'H', 
        is_door: false, 
        is_hardware: false 
      },
      { 
        part_name: 'Right Side', 
        quantity: 1, 
        width_formula: '(((right_depth/1000*height/1000)*qty)*mat_rate_per_sqm)', 
        height_formula: 'H', 
        is_door: false, 
        is_hardware: false 
      },
      { 
        part_name: 'Door 1', 
        quantity: 1, 
        width_formula: '(((right_width/1000-left_side/1000)*qty)*door_cost+color_cost+finish_cost)', 
        height_formula: 'H', 
        is_door: true, 
        is_hardware: false 
      },
      { 
        part_name: 'Door 2', 
        quantity: 1, 
        width_formula: '(((left_width/1000-right_side/1000)*qty)*door_cost+color_cost+finish_cost)', 
        height_formula: 'H', 
        is_door: true, 
        is_hardware: false 
      },
    ];
  } else {
    return [
      { 
        part_name: 'Sides', 
        quantity: 2, 
        width_formula: '(((height/1000*depth/1000)*qty)*mat_rate_per_sqm)', 
        height_formula: 'H', 
        is_door: false, 
        is_hardware: false 
      },
      { 
        part_name: 'Backs', 
        quantity: 1, 
        width_formula: '(((height/1000*width/1000)*qty)*mat_rate_per_sqm)', 
        height_formula: 'H', 
        is_door: false, 
        is_hardware: false 
      },
      { 
        part_name: 'Bottoms', 
        quantity: 1, 
        width_formula: '(((depth/1000*width/1000)*qty)*mat_rate_per_sqm)', 
        height_formula: 'D', 
        is_door: false, 
        is_hardware: false 
      },
      { 
        part_name: 'Door', 
        quantity: 1, 
        width_formula: '(((height/1000*width/1000)*qty)*door_cost+color_cost+finish_cost)', 
        height_formula: 'H', 
        is_door: true, 
        is_hardware: false 
      },
    ];
  }
};

export const CabinetComponentsTab: React.FC<CabinetComponentsTabProps> = ({ cabinetId, cabinetStyle, onCabinetStyleChange }) => {
  const [isAddingPart, setIsAddingPart] = useState(false);
  const [editingPart, setEditingPart] = useState<CabinetPart | null>(null);
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

  // Replace all parts with defaults for cabinet style
  const replacePartsWithDefaultsMutation = useMutation({
    mutationFn: async (newStyle: string) => {
      // First delete all existing parts
      const { error: deleteError } = await supabase
        .from('cabinet_parts')
        .delete()
        .eq('cabinet_type_id', cabinetId);

      if (deleteError) throw deleteError;

      // Then add the new default parts
      const defaultParts = getDefaultParts(newStyle);
      const partsToInsert = defaultParts.map(part => ({
        ...part,
        cabinet_type_id: cabinetId,
        width_formula: part.width_formula || '',
        height_formula: part.height_formula || '',
      }));

      const { error: insertError } = await supabase
        .from('cabinet_parts')
        .insert(partsToInsert);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-parts'] });
      toast.success('Cabinet parts updated for new style');
    },
    onError: (error) => {
      console.error('Error replacing parts:', error);
      toast.error('Failed to update cabinet parts');
    },
  });

  // Update parts when cabinet style changes
  useEffect(() => {
    if (cabinetId !== 'new' && parts !== undefined) {
      if (parts.length === 0) {
        // No existing parts - add defaults
        const defaultParts = getDefaultParts(cabinetStyle);
        defaultParts.forEach(part => {
          const partWithFormulas = {
            part_name: part.part_name,
            quantity: part.quantity,
            width_formula: part.width_formula || '',
            height_formula: part.height_formula || '',
            is_door: part.is_door,
            is_hardware: part.is_hardware,
          };
          addPartMutation.mutate(partWithFormulas);
        });
      } else {
        // Parts exist - check if they match the current style
        const expectedParts = getDefaultParts(cabinetStyle);
        const currentPartNames = parts.map(p => p.part_name).sort();
        const expectedPartNames = expectedParts.map(p => p.part_name).sort();
        
        // If part names don't match, replace with new defaults
        if (JSON.stringify(currentPartNames) !== JSON.stringify(expectedPartNames)) {
          replacePartsWithDefaultsMutation.mutate(cabinetStyle);
        }
      }
    }
  }, [cabinetStyle, parts, cabinetId]);

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
      resetForm();
    },
    onError: (error) => {
      console.error('Error adding part:', error);
      toast.error('Failed to add cabinet part');
    },
  });

  // Update part mutation
  const updatePartMutation = useMutation({
    mutationFn: async (part: CabinetPart) => {
      const { error } = await supabase
        .from('cabinet_parts')
        .update({
          part_name: part.part_name,
          quantity: part.quantity,
          width_formula: part.width_formula,
          height_formula: part.height_formula,
          is_door: part.is_door,
          is_hardware: part.is_hardware,
        })
        .eq('id', part.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-parts'] });
      toast.success('Cabinet part updated');
      setEditingPart(null);
    },
    onError: (error) => {
      console.error('Error updating part:', error);
      toast.error('Failed to update cabinet part');
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

  // Initialize default parts mutation
  const initializePartsMutation = useMutation({
    mutationFn: async () => {
      const defaultParts = getDefaultParts(cabinetStyle);
      const partsToInsert = defaultParts.map(part => ({
        ...part,
        cabinet_type_id: cabinetId
      }));

      const { error } = await supabase
        .from('cabinet_parts')
        .insert(partsToInsert);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-parts'] });
      toast.success(`Default ${cabinetStyle} cabinet parts added`);
    },
    onError: (error) => {
      console.error('Error initializing parts:', error);
      toast.error('Failed to initialize default parts');
    },
  });

  const resetForm = () => {
    setNewPart({
      part_name: '',
      quantity: 1,
      width_formula: '',
      height_formula: '',
      is_door: false,
      is_hardware: false,
    });
  };

  const handleAddPart = () => {
    if (!newPart.part_name.trim()) {
      toast.error('Part name is required');
      return;
    }
    addPartMutation.mutate(newPart);
  };

  const handleUpdatePart = () => {
    if (!editingPart) return;
    updatePartMutation.mutate(editingPart);
  };

  const handleInitializeDefaultParts = () => {
    if (parts && parts.length > 0) {
      if (confirm('This will add default parts. Existing parts will remain. Continue?')) {
        initializePartsMutation.mutate();
      }
    } else {
      initializePartsMutation.mutate();
    }
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
                {cabinetStyle === 'corner' ? 'Corner Cabinet Components' : 'Standard Cabinet Components'}
              </CardTitle>
              <CardDescription>
                Define the parts that make up this {cabinetStyle === 'corner' ? 'corner' : 'standard'} cabinet type and their quantity formulas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {cabinetId !== 'new' && (!parts || parts.length === 0) && (
                <Button
                  variant="secondary"
                  onClick={handleInitializeDefaultParts}
                  disabled={initializePartsMutation.isPending}
                >
                  {initializePartsMutation.isPending ? 'Adding...' : `Add Default ${cabinetStyle === 'corner' ? 'Corner' : 'Standard'} Parts`}
                </Button>
              )}
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPart(part)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePartMutation.mutate(part.id)}
                      disabled={deletePartMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No components defined yet</p>
              <p className="text-sm">
                Add components to define how this {cabinetStyle === 'corner' ? 'corner' : 'standard'} cabinet is built
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Component Dialog */}
      {editingPart && (
        <Dialog open={!!editingPart} onOpenChange={() => setEditingPart(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Cabinet Component</DialogTitle>
              <DialogDescription>
                Modify the component details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Part Name</Label>
                <Input
                  value={editingPart.part_name}
                  onChange={(e) => setEditingPart({ ...editingPart, part_name: e.target.value })}
                  placeholder="e.g., Left Side, Right Side, Door"
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={editingPart.quantity}
                  onChange={(e) => setEditingPart({ ...editingPart, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Width Formula</Label>
                  <Input
                    value={editingPart.width_formula || ''}
                    onChange={(e) => setEditingPart({ ...editingPart, width_formula: e.target.value })}
                    placeholder="W or W-30"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Height Formula</Label>
                  <Input
                    value={editingPart.height_formula || ''}
                    onChange={(e) => setEditingPart({ ...editingPart, height_formula: e.target.value })}
                    placeholder="H or H-20"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingPart.is_door}
                    onCheckedChange={(checked) => setEditingPart({ ...editingPart, is_door: checked })}
                  />
                  <Label>Is Door</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingPart.is_hardware}
                    onCheckedChange={(checked) => setEditingPart({ ...editingPart, is_hardware: checked })}
                  />
                  <Label>Is Hardware</Label>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdatePart} disabled={updatePartMutation.isPending}>
                  {updatePartMutation.isPending ? 'Updating...' : 'Update Component'}
                </Button>
                <Button variant="outline" onClick={() => setEditingPart(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

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