import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Settings, Upload, Image } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { DoorStyle, Brand } from '@/types/cabinet';
import { useToast } from '@/hooks/use-toast';
export function DoorStylesManager() {
  const { toast } = useToast();
  const [doorStyles, setDoorStyles] = useState<DoorStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImages, setUploadingImages] = useState<{ [key: string]: boolean }>({});
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const doorStylesRes = await supabase
        .from('door_styles')
        .select('*')
        .order('name');

      if (doorStylesRes.error) throw doorStylesRes.error;
      
      if (doorStylesRes.data) setDoorStyles(doorStylesRes.data as DoorStyle[]);
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
      .select('*')
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

    // Update local state without refetch to avoid input flicker
    setDoorStyles((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
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
  };

  const handleImageUpload = async (styleId: string, file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setUploadingImages(prev => ({ ...prev, [styleId]: true }));

    try {
      // Compress image before upload
      const { compressImage, getOptimalCompressionSettings } = await import('@/lib/imageUtils');
      const compressionSettings = getOptimalCompressionSettings(file.size);
      const compressedFile = await compressImage(file, compressionSettings);

      // Create unique filename
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${styleId}-${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('door-style-images')
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('door-style-images')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update door style with image URL
      await updateDoorStyle(styleId, { image_url: publicUrl });

      toast({
        title: "Success",
        description: "Image compressed and uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImages(prev => ({ ...prev, [styleId]: false }));
    }
  };

  const triggerFileInput = (styleId: string) => {
    fileInputRefs.current[styleId]?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, styleId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleImageUpload(styleId, imageFile);
    } else {
      toast({
        title: "Error",
        description: "Please drop an image file",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading door styles...</div>;
  }

  return (
    <div className="space-y-6">
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
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Base Rate ($/sqm)</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doorStyles.map((style) => (
                <TableRow key={style.id}>
                  <TableCell>
                    <Input
                      value={style.name}
                      onChange={(e) => {
                        setDoorStyles((prev) => prev.map((s) => s.id === style.id ? { ...s, name: e.target.value } : s));
                      }}
                      onBlur={(e) => {
                        updateDoorStyle(style.id, { name: e.target.value });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={style.description || ""}
                      onChange={(e) => {
                        setDoorStyles((prev) => prev.map((s) => s.id === style.id ? { ...s, description: e.target.value } : s));
                      }}
                      onBlur={(e) => {
                        updateDoorStyle(style.id, { description: e.target.value });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={style.base_rate_per_sqm}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        setDoorStyles((prev) => prev.map((s) => s.id === style.id ? { ...s, base_rate_per_sqm: Number.isNaN(val) ? 0 : val } : s));
                      }}
                      onBlur={(e) => {
                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        updateDoorStyle(style.id, { base_rate_per_sqm: Number.isNaN(val) ? 0 : val });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div 
                      className="flex items-center gap-2 p-2 border-2 border-dashed border-gray-200 rounded hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                      onDrop={(e) => handleDrop(e, style.id)}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onClick={() => triggerFileInput(style.id)}
                    >
                      {style.image_url && (
                        <img 
                          src={style.image_url} 
                          alt={style.name}
                          className="w-12 h-12 object-cover rounded border"
                        />
                      )}
                      <input
                        ref={(el) => { fileInputRefs.current[style.id] = el; }}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(style.id, file);
                        }}
                      />
                      <div className="flex flex-col items-center gap-1">
                        {uploadingImages[style.id] ? (
                          <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                        ) : (
                          <Upload className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-xs text-gray-500">
                          {uploadingImages[style.id] ? 'Uploading...' : 'Drop or click'}
                        </span>
                      </div>
                    </div>
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
                    <Button
                      onClick={() => deleteDoorStyle(style.id)}
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
    </div>
  );
}