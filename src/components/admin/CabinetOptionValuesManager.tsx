import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Edit2, GripVertical } from 'lucide-react';

interface CabinetOptionValue {
  id: string;
  value: string;
  display_text: string;
  display_order: number;
  active: boolean;
  price_adjustment?: number;
  card_display_position?: number;
}

interface CabinetOptionValuesManagerProps {
  optionId: string;
  optionName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CabinetOptionValuesManager: React.FC<CabinetOptionValuesManagerProps> = ({
  optionId,
  optionName,
  isOpen,
  onClose
}) => {
  const [values, setValues] = useState<CabinetOptionValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingValue, setEditingValue] = useState<CabinetOptionValue | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && optionId) {
      loadValues();
    }
  }, [isOpen, optionId]);

  const loadValues = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cabinet_option_values')
        .select('*')
        .eq('cabinet_option_id', optionId)
        .order('display_order');

      if (error) throw error;
      setValues(data || []);
    } catch (error) {
      console.error('Error loading option values:', error);
      toast({
        title: 'Error',
        description: 'Failed to load option values',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveValue = async (valueData: Partial<CabinetOptionValue>) => {
    try {
      if (editingValue?.id) {
        // Update existing value
        const { error } = await supabase
          .from('cabinet_option_values')
          .update({
            value: valueData.value,
            display_text: valueData.display_text,
            display_order: valueData.display_order,
            active: valueData.active,
            price_adjustment: valueData.price_adjustment || 0,
            card_display_position: valueData.card_display_position || null
          })
          .eq('id', editingValue.id);

        if (error) throw error;
      } else {
        // Create new value
        const { error } = await supabase
          .from('cabinet_option_values')
          .insert({
            cabinet_option_id: optionId,
            value: valueData.value,
            display_text: valueData.display_text,
            display_order: valueData.display_order || 0,
            active: valueData.active ?? true,
            price_adjustment: valueData.price_adjustment || 0,
            card_display_position: valueData.card_display_position || null
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: `Option value ${editingValue?.id ? 'updated' : 'created'} successfully`
      });

      setIsEditDialogOpen(false);
      setEditingValue(null);
      loadValues();
    } catch (error) {
      console.error('Error saving value:', error);
      toast({
        title: 'Error',
        description: 'Failed to save option value',
        variant: 'destructive'
      });
    }
  };

  const deleteValue = async (valueId: string) => {
    try {
      const { error } = await supabase
        .from('cabinet_option_values')
        .delete()
        .eq('id', valueId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Option value deleted successfully'
      });

      loadValues();
    } catch (error) {
      console.error('Error deleting value:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete option value',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (value?: CabinetOptionValue) => {
    setEditingValue(value || null);
    setIsEditDialogOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Values for "{optionName}"</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Configure the available options customers can choose from
            </p>
            <Button onClick={() => openEditDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Value
            </Button>
          </div>

          {loading ? (
            <div className="p-4 text-center">Loading values...</div>
          ) : values.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No values configured. Add values for customers to choose from.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {values.map((value) => (
                <div key={value.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                     <div>
                       <div className="flex items-center gap-2">
                         <span className="font-medium">{value.display_text}</span>
                         <Badge variant={value.active ? 'default' : 'secondary'}>
                           {value.active ? 'Active' : 'Inactive'}
                         </Badge>
                         {value.price_adjustment && value.price_adjustment !== 0 && (
                           <Badge variant="outline" className="text-xs">
                             {value.price_adjustment > 0 ? '+' : ''}${value.price_adjustment}
                           </Badge>
                         )}
                       </div>
                       <div className="text-sm text-muted-foreground space-y-1">
                         <div>Value: {value.value}</div>
                         {value.card_display_position && (
                           <div>Card Position: {value.card_display_position}</div>
                         )}
                       </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(value)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteValue(value.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <ValueEditDialog
          value={editingValue}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingValue(null);
          }}
          onSave={saveValue}
        />
      </DialogContent>
    </Dialog>
  );
};

interface ValueEditDialogProps {
  value: CabinetOptionValue | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: Partial<CabinetOptionValue>) => void;
}

const ValueEditDialog: React.FC<ValueEditDialogProps> = ({
  value,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    value: '',
    display_text: '',
    display_order: 0,
    active: true,
    price_adjustment: 0,
    card_display_position: 0
  });

  useEffect(() => {
    if (value) {
      setFormData({
        value: value.value,
        display_text: value.display_text,
        display_order: value.display_order,
        active: value.active,
        price_adjustment: value.price_adjustment || 0,
        card_display_position: value.card_display_position || 0
      });
    } else {
      setFormData({
        value: '',
        display_text: '',
        display_order: 0,
        active: true,
        price_adjustment: 0,
        card_display_position: 0
      });
    }
  }, [value]);

  const handleSave = () => {
    if (!formData.value.trim() || !formData.display_text.trim()) return;
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {value ? 'Edit Option Value' : 'Add Option Value'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="value">Value</Label>
            <Input
              id="value"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
              placeholder="e.g., left_handed"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Internal value used in the system
            </p>
          </div>

          <div>
            <Label htmlFor="display_text">Display Text</Label>
            <Input
              id="display_text"
              value={formData.display_text}
              onChange={(e) => setFormData(prev => ({ ...prev, display_text: e.target.value }))}
              placeholder="e.g., Left-handed"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Text shown to customers
            </p>
          </div>

          <div>
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <div>
            <Label htmlFor="price_adjustment">Price Adjustment ($)</Label>
            <Input
              id="price_adjustment"
              type="number"
              step="0.01"
              value={formData.price_adjustment}
              onChange={(e) => setFormData(prev => ({ ...prev, price_adjustment: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Additional cost/discount for this option (use negative for discounts)
            </p>
          </div>

          <div>
            <Label htmlFor="card_display_position">Card Display Position</Label>
            <Input
              id="card_display_position"
              type="number"
              value={formData.card_display_position}
              onChange={(e) => setFormData(prev => ({ ...prev, card_display_position: parseInt(e.target.value) || 0 }))}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Position on product card (for card_sentence type options only)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
            />
            <Label htmlFor="active">Active</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.value.trim() || !formData.display_text.trim()}>
              {value ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};