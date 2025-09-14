import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { CabinetTypePricingSetup } from "./CabinetTypePricingSetup";
import { CabinetHardwareSetup } from "./CabinetHardwareSetup";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CabinetType {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  default_width_mm: number;
  default_height_mm: number;
  default_depth_mm: number;
  door_count: number;
  drawer_count: number;
  active: boolean;
  product_image_url?: string;
}

interface CabinetTypeEditDialogProps {
  cabinetType: CabinetType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (cabinetType: Partial<CabinetType>) => void;
}

const CabinetTypeEditDialog = ({ cabinetType, open, onOpenChange, onSave }: CabinetTypeEditDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    subcategory: [] as string[],
    default_width_mm: 300,
    default_height_mm: 720,
    default_depth_mm: 560,
    min_width_mm: 100,
    max_width_mm: 1200,
    min_height_mm: 200,
    max_height_mm: 1000,
    min_depth_mm: 200,
    max_depth_mm: 800,
    drawer_count: 0,
    active: true,
    product_image_url: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (cabinetType) {
      setFormData({
        name: cabinetType.name,
        category: cabinetType.category,
        subcategory: (cabinetType as any).subcategory ? (cabinetType as any).subcategory.split(',') : [],
        default_width_mm: cabinetType.default_width_mm,
        default_height_mm: cabinetType.default_height_mm,
        default_depth_mm: cabinetType.default_depth_mm,
        min_width_mm: (cabinetType as any).min_width_mm || 100,
        max_width_mm: (cabinetType as any).max_width_mm || 1200,
        min_height_mm: (cabinetType as any).min_height_mm || 200,
        max_height_mm: (cabinetType as any).max_height_mm || 1000,
        min_depth_mm: (cabinetType as any).min_depth_mm || 200,
        max_depth_mm: (cabinetType as any).max_depth_mm || 800,
        drawer_count: cabinetType.drawer_count,
        active: cabinetType.active,
        product_image_url: cabinetType.product_image_url || ""
      });
      setImagePreview(cabinetType.product_image_url || "");
    } else {
      setFormData({
        name: "",
        category: "",
        subcategory: [] as string[],
        default_width_mm: 300,
        default_height_mm: 720,
        default_depth_mm: 560,
        min_width_mm: 100,
        max_width_mm: 1200,
        min_height_mm: 200,
        max_height_mm: 1000,
        min_depth_mm: 200,
        max_depth_mm: 800,
        drawer_count: 0,
        active: true,
        product_image_url: ""
      });
      setImagePreview("");
    }
  }, [cabinetType]);

  const handleSave = async () => {
    try {
      let finalImageUrl = formData.product_image_url;
      
      // Upload image if a new file was selected
      if (imageFile) {
        setUploadingImage(true);
        const fileName = `cabinet-types/${Date.now()}-${imageFile.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('door-style-images')
          .upload(fileName, imageFile);

        if (uploadError) {
          toast({
            title: "Error",
            description: "Failed to upload image: " + uploadError.message,
            variant: "destructive",
          });
          return;
        }

        const { data: urlData } = supabase.storage
          .from('door-style-images')
          .getPublicUrl(fileName);

        finalImageUrl = urlData.publicUrl;
        setUploadingImage(false);
      }

      const saveData = {
        id: cabinetType?.id,
        ...formData,
        product_image_url: finalImageUrl,
        subcategory: formData.subcategory.length > 0 ? formData.subcategory.join(',') : null
      };
      
      onSave(saveData as any);
    } catch (error) {
      setUploadingImage(false);
      toast({
        title: "Error",
        description: "Failed to save cabinet type",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error", 
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      processImageFile(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData({ ...formData, product_image_url: "" });
  };

  const categories = ["base", "wall", "tall", "panels"];
  
  // Dynamic subcategories based on selected category
  const getSubcategoriesForCategory = (category: string) => {
    switch (category) {
      case 'base':
        return [
          { value: 'doors', label: 'Doors' },
          { value: 'drawers', label: 'Drawers' },
          { value: 'corners', label: 'Corners' },
          { value: 'appliance_cabinets', label: 'Appliance Cabinets' },
          { value: 'bin_cabinets', label: 'Bin Cabinets' }
        ];
      case 'wall':
        return [
          { value: 'doors', label: 'Doors' },
          { value: 'appliance_cabinets', label: 'Appliance Cabinets' },
          { value: 'lift_up_systems', label: 'Lift-Up Systems' },
          { value: 'corners', label: 'Corners' }
        ];
      case 'tall':
        return [
          { value: 'doors', label: 'Doors' },
          { value: 'corners', label: 'Corners' },
          { value: 'appliance_cabinets', label: 'Appliance Cabinets' }
        ];
      case 'panels':
        return [
          { value: 'base', label: 'Base' },
          { value: 'top', label: 'Top' },
          { value: 'pantry', label: 'Pantry' }
        ];
      default:
        return [];
    }
  };

  const availableSubcategories = getSubcategoriesForCategory(formData.category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {cabinetType ? 'Edit Cabinet Type' : 'Add Cabinet Type'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="hardware" disabled={!cabinetType}>Hardware</TabsTrigger>
            <TabsTrigger value="pricing" disabled={!cabinetType}>Pricing Setup</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Product Image Upload */}
                <div className="grid gap-2">
                  <Label>Product Image</Label>
                  <Card className="p-4">
                    <CardContent className="p-0">
                      <div className="flex flex-col gap-4">
                        {imagePreview ? (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Product preview"
                              className="w-32 h-32 object-cover rounded-lg border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                              onClick={removeImage}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all ${
                              isDragOver 
                                ? 'border-primary bg-primary/5 scale-105' 
                                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/20'
                            }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('image-upload')?.click()}
                          >
                            <Upload className={`h-8 w-8 mb-2 transition-colors ${
                              isDragOver ? 'text-primary' : 'text-muted-foreground/50'
                            }`} />
                            <p className={`text-sm font-medium transition-colors ${
                              isDragOver ? 'text-primary' : 'text-muted-foreground'
                            }`}>
                              {isDragOver ? 'Drop image here' : 'Drag & drop or click to upload'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              JPG, PNG, WEBP up to 5MB
                            </p>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                          />
                          {imagePreview && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('image-upload')?.click()}
                              disabled={uploadingImage}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {uploadingImage ? 'Uploading...' : 'Change Image'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value, subcategory: [] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="subcategory">Filter Categories</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                    {availableSubcategories.length > 0 ? (
                      availableSubcategories.map((subcategory) => (
                        <div key={subcategory.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`subcategory-${subcategory.value}`}
                            checked={formData.subcategory.includes(subcategory.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ 
                                  ...formData, 
                                  subcategory: [...formData.subcategory, subcategory.value] 
                                });
                              } else {
                                setFormData({ 
                                  ...formData, 
                                  subcategory: formData.subcategory.filter(s => s !== subcategory.value) 
                                });
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <Label 
                            htmlFor={`subcategory-${subcategory.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {subcategory.label}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Select a category first</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="width">Default Width (mm)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={formData.default_width_mm}
                    onChange={(e) => setFormData({ ...formData, default_width_mm: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Default Height (mm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.default_height_mm}
                    onChange={(e) => setFormData({ ...formData, default_height_mm: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="depth">Default Depth (mm)</Label>
                  <Input
                    id="depth"
                    type="number"
                    value={formData.default_depth_mm}
                    onChange={(e) => setFormData({ ...formData, default_depth_mm: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Min/Max Dimensions */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Dimension Constraints</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  {/* Width Min/Max */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Width Range</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <Label htmlFor="min_width" className="text-xs">Min (mm)</Label>
                        <Input
                          id="min_width"
                          type="number"
                          value={formData.min_width_mm}
                          onChange={(e) => setFormData({ ...formData, min_width_mm: parseInt(e.target.value) || 0 })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_width" className="text-xs">Max (mm)</Label>
                        <Input
                          id="max_width"
                          type="number"
                          value={formData.max_width_mm}
                          onChange={(e) => setFormData({ ...formData, max_width_mm: parseInt(e.target.value) || 0 })}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Height Min/Max */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Height Range</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <Label htmlFor="min_height" className="text-xs">Min (mm)</Label>
                        <Input
                          id="min_height"
                          type="number"
                          value={formData.min_height_mm}
                          onChange={(e) => setFormData({ ...formData, min_height_mm: parseInt(e.target.value) || 0 })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_height" className="text-xs">Max (mm)</Label>
                        <Input
                          id="max_height"
                          type="number"
                          value={formData.max_height_mm}
                          onChange={(e) => setFormData({ ...formData, max_height_mm: parseInt(e.target.value) || 0 })}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Depth Min/Max */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Depth Range</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <Label htmlFor="min_depth" className="text-xs">Min (mm)</Label>
                        <Input
                          id="min_depth"
                          type="number"
                          value={formData.min_depth_mm}
                          onChange={(e) => setFormData({ ...formData, min_depth_mm: parseInt(e.target.value) || 0 })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_depth" className="text-xs">Max (mm)</Label>
                        <Input
                          id="max_depth"
                          type="number"
                          value={formData.max_depth_mm}
                          onChange={(e) => setFormData({ ...formData, max_depth_mm: parseInt(e.target.value) || 0 })}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={uploadingImage}>
                {uploadingImage ? 'Uploading...' : 'Save'}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="hardware">
            {cabinetType && cabinetType.id ? (
              <CabinetHardwareSetup cabinetTypeId={cabinetType.id} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Please save the cabinet type first to configure hardware requirements.</p>
                <p className="text-sm mt-2">Click "Save" in the Basic Info tab, then return here to set up hardware.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="pricing">
            {cabinetType && cabinetType.id ? (
              <CabinetTypePricingSetup cabinetTypeId={cabinetType.id} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Please save the cabinet type first to configure pricing settings.</p>
                <p className="text-sm mt-2">Click "Save" in the Basic Info tab, then return here to set up pricing.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CabinetTypeEditDialog;