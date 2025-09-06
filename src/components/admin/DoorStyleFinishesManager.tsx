import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DoorStyle, DoorStyleFinish } from '@/types/cabinet';
import { useToast } from '@/hooks/use-toast';

interface DoorStyleFinishesManagerProps {
  doorStyleId: string;
}

export function DoorStyleFinishesManager({ doorStyleId }: DoorStyleFinishesManagerProps) {
  const { toast } = useToast();
  const [doorStyleFinishes, setDoorStyleFinishes] = useState<DoorStyleFinish[]>([]);
  const [doorStyle, setDoorStyle] = useState<DoorStyle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (doorStyleId) {
      fetchData();
    }
  }, [doorStyleId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [finishesRes, doorStyleRes] = await Promise.all([
        supabase
          .from('door_style_finishes')
          .select('*')
          .eq('door_style_id', doorStyleId)
          .order('sort_order'),
        supabase
          .from('door_styles')
          .select('*')
          .eq('id', doorStyleId)
          .single()
      ]);

      if (finishesRes.data) setDoorStyleFinishes(finishesRes.data as DoorStyleFinish[]);
      if (doorStyleRes.data) setDoorStyle(doorStyleRes.data);
    } catch (error) {
      console.error('Error fetching door style finishes:', error);
      toast({
        title: "Error",
        description: "Failed to load door style finishes",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const addFinish = async () => {
    const newFinish = {
      door_style_id: doorStyleId,
      name: "New Finish",
      rate_per_sqm: 0,
      sort_order: doorStyleFinishes.length,
      active: true
    };

    const { data, error } = await supabase
      .from('door_style_finishes')
      .insert(newFinish)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add finish",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setDoorStyleFinishes([...doorStyleFinishes, data as DoorStyleFinish]);
    }
  };

  const updateFinish = async (id: string, updates: Partial<DoorStyleFinish>) => {
    const { error } = await supabase
      .from('door_style_finishes')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update finish",
        variant: "destructive",
      });
      return;
    }

    setDoorStyleFinishes(doorStyleFinishes.map(finish => 
      finish.id === id ? { ...finish, ...updates } : finish
    ));
  };

  const deleteFinish = async (id: string) => {
    const { error } = await supabase
      .from('door_style_finishes')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete finish",
        variant: "destructive",
      });
      return;
    }

    setDoorStyleFinishes(doorStyleFinishes.filter(finish => finish.id !== id));
  };

  if (loading) {
    return <div>Loading door style finishes...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          Finishes for {doorStyle?.name}
          <span className="text-sm text-muted-foreground ml-2">
            (Base Rate: ${doorStyle?.base_rate_per_sqm}/sqm)
          </span>
        </CardTitle>
        <Button onClick={addFinish} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Finish
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Rate ($/sqm)</TableHead>
              <TableHead>Sort Order</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doorStyleFinishes.map((finish) => (
              <TableRow key={finish.id}>
                <TableCell>
                  <Input
                    value={finish.name}
                    onChange={(e) => updateFinish(finish.id, { name: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={finish.rate_per_sqm}
                    onChange={(e) => updateFinish(finish.id, { rate_per_sqm: parseFloat(e.target.value) || 0 })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={finish.sort_order}
                    onChange={(e) => updateFinish(finish.id, { sort_order: parseInt(e.target.value) || 0 })}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => deleteFinish(finish.id)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}