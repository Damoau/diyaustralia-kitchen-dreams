import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Upload, X, Palette } from 'lucide-react';
import { ImageDropzone } from './ImageDropzone';

interface DoorStyle {
  id: string;
  name: string;
  image_url?: string;
}

interface CabinetDoorStyle {
  id: string;
  door_style_id: string;
  image_url?: string;
  sort_order: number;
  door_style: DoorStyle;
}

interface CabinetDoorStylesSelectorProps {
  cabinetId: string;
  onUpdate?: () => void;
}

export const CabinetDoorStylesSelector: React.FC<CabinetDoorStylesSelectorProps> = ({
  cabinetId,
  onUpdate,
}) => {
  const [selectedStyles, setSelectedStyles] = useState<Record<string, { selected: boolean; image_url?: string }>>({});
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all available door styles
  const { data: allDoorStyles, isLoading: stylesLoading } = useQuery({
    queryKey: ['door-styles-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('door_styles')
        .select('id, name, image_url')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data as DoorStyle[];
    },
  });

  // Fetch existing cabinet door styles
  const { data: cabinetDoorStyles, isLoading: cabinetStylesLoading } = useQuery({
    queryKey: ['cabinet-door-styles', cabinetId],
    queryFn: async () => {
      if (cabinetId === 'new') return [];
      
      const { data: cabinetStylesData, error } = await supabase
        .from('cabinet_door_styles')
        .select('id, door_style_id, image_url, sort_order')
        .eq('cabinet_type_id', cabinetId)
        .eq('active', true)
        .order('sort_order');
      
      if (error) throw error;
      
      if (!cabinetStylesData || cabinetStylesData.length === 0) return [];
      
      // Fetch door style details for the selected styles
      const doorStyleIds = cabinetStylesData.map(cs => cs.door_style_id);
      const { data: doorStylesData, error: doorStylesError } = await supabase
        .from('door_styles')
        .select('id, name, image_url')
        .in('id', doorStyleIds);
        
      if (doorStylesError) throw doorStylesError;
      
      // Combine the data
      const result = cabinetStylesData.map(cabinetStyle => ({
        ...cabinetStyle,
        door_style: doorStylesData?.find(ds => ds.id === cabinetStyle.door_style_id) || {
          id: cabinetStyle.door_style_id,
          name: 'Unknown',
          image_url: undefined,
        }
      }));
      
      return result as CabinetDoorStyle[];
    },
    enabled: cabinetId !== 'new',
  });

  // Initialize selected styles when data loads
  useEffect(() => {
    if (cabinetDoorStyles && allDoorStyles) {
      const newSelectedStyles: Record<string, { selected: boolean; image_url?: string }> = {};
      
      // Initialize all styles as unselected
      allDoorStyles.forEach(style => {
        newSelectedStyles[style.id] = { selected: false };
      });
      
      // Mark selected styles and their images
      cabinetDoorStyles.forEach(cabinetStyle => {
        newSelectedStyles[cabinetStyle.door_style_id] = {
          selected: true,
          image_url: cabinetStyle.image_url || undefined,
        };
      });
      
      setSelectedStyles(newSelectedStyles);
    }
  }, [cabinetDoorStyles, allDoorStyles]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (cabinetId === 'new') {
        throw new Error('Please save the cabinet first before selecting door styles');
      }

      // Delete existing relationships
      await supabase
        .from('cabinet_door_styles')
        .delete()
        .eq('cabinet_type_id', cabinetId);

      // Insert new relationships
      const selectedStylesData = Object.entries(selectedStyles)
        .filter(([, data]) => data.selected)
        .map(([styleId, data], index) => ({
          cabinet_type_id: cabinetId,
          door_style_id: styleId,
          image_url: data.image_url || null,
          sort_order: index,
        }));

      if (selectedStylesData.length > 0) {
        const { error } = await supabase
          .from('cabinet_door_styles')
          .insert(selectedStylesData);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-door-styles', cabinetId] });
      setUnsavedChanges(false);
      toast.success('Door styles saved successfully');
      onUpdate?.();
    },
    onError: (error) => {
      console.error('Error saving door styles:', error);
      toast.error('Failed to save door styles');
    },
  });

  const handleStyleToggle = (styleId: string, checked: boolean) => {
    setSelectedStyles(prev => ({
      ...prev,
      [styleId]: {
        ...prev[styleId],
        selected: checked,
      },
    }));
    setUnsavedChanges(true);
  };

  const handleImageUpload = (styleId: string, imageUrl: string) => {
    setSelectedStyles(prev => ({
      ...prev,
      [styleId]: {
        ...prev[styleId],
        image_url: imageUrl,
      },
    }));
    setUnsavedChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  if (stylesLoading || cabinetStylesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const selectedCount = Object.values(selectedStyles).filter(s => s.selected).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Door Styles for this Cabinet
        </CardTitle>
        <CardDescription>
          Select which door styles are available for this cabinet and upload specific images for each style.
          {selectedCount > 0 && ` (${selectedCount} selected)`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {cabinetId === 'new' && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Save the cabinet first to configure door styles.
            </p>
          </div>
        )}

        {cabinetId !== 'new' && (
          <>
            <div className="space-y-4">
              {allDoorStyles?.map((style) => {
                const isSelected = selectedStyles[style.id]?.selected || false;
                const styleImageUrl = selectedStyles[style.id]?.image_url;
                
                return (
                  <div key={style.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={`style-${style.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => handleStyleToggle(style.id, checked as boolean)}
                      />
                      <Label 
                        htmlFor={`style-${style.id}`} 
                        className="flex items-center gap-3 cursor-pointer flex-1"
                      >
                        {style.image_url && (
                          <img
                            src={style.image_url}
                            alt={style.name}
                            className="w-12 h-12 object-cover rounded border"
                          />
                        )}
                        <div>
                          <div className="font-medium">{style.name}</div>
                          <div className="text-sm text-muted-foreground">
                            General door style
                          </div>
                        </div>
                      </Label>
                    </div>
                    
                    {isSelected && (
                      <div className="ml-6 pl-4 border-l-2 border-muted">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Cabinet-specific image for {style.name}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Upload how this door style looks specifically on this cabinet
                          </p>
                          <ImageDropzone
                            value={styleImageUrl}
                            onChange={(url) => handleImageUpload(style.id, url)}
                            className="h-32"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {unsavedChanges && (
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  You have unsaved changes
                </div>
                <Button 
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  size="sm"
                >
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            )}

            {!unsavedChanges && selectedCount > 0 && (
              <div className="text-sm text-muted-foreground text-center p-2">
                {selectedCount} door style{selectedCount !== 1 ? 's' : ''} configured for this cabinet
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};