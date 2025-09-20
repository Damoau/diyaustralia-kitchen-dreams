import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Settings, DoorOpen, Wrench, Cog, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export default function EditCabinetType() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [cabinetType, setCabinetType] = useState({
    id: id || "",
    name: "",
    category: "",
    subcategory: "",
    active: true,
    door_count: 0,
    drawer_count: 0,
    featured_product: false,
    description: "",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    min_width: 300,
    max_width: 1200,
    min_height: 300,
    max_height: 900,
    min_depth: 300,
    max_depth: 600,
    width_increment: 50,
    height_increment: 50,
    depth_increment: 50,
    // Add other fields as needed
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Add save logic here
      toast.success("Cabinet type saved successfully");
      navigate("/admin/cabinets");
    } catch (error) {
      toast.error("Failed to save cabinet type");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateContent = async () => {
    try {
      // Add AI content generation logic here
      toast.success("SEO content generated successfully");
    } catch (error) {
      toast.error("Failed to generate content");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/cabinets")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cabinets
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">
              {id === "new" ? "Create Cabinet Type" : "Edit Cabinet Type"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure cabinet specifications, parts, and hardware requirements
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/cabinets")}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container px-6 py-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Basic Information
            </TabsTrigger>
            <TabsTrigger value="sizes" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Default Sizes
            </TabsTrigger>
            <TabsTrigger value="doors" className="flex items-center gap-2">
              <DoorOpen className="h-4 w-4" />
              Door Options
            </TabsTrigger>
            <TabsTrigger value="parts" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Parts & Formulas
            </TabsTrigger>
            <TabsTrigger value="hardware" className="flex items-center gap-2">
              <Cog className="h-4 w-4" />
              Hardware Requirements
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <TabsContent value="basic" className="space-y-6 m-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Basic Information</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateContent}
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Generate SEO & Descriptions
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={cabinetType.name}
                        onChange={(e) => setCabinetType(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., 4 door base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={cabinetType.category}
                        onValueChange={(value) => setCabinetType(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Base Cabinets">Base Cabinets</SelectItem>
                          <SelectItem value="Wall Cabinets">Wall Cabinets</SelectItem>
                          <SelectItem value="Tall Cabinets">Tall Cabinets</SelectItem>
                          <SelectItem value="Corner Cabinets">Corner Cabinets</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subcategory">Subcategory</Label>
                      <Input
                        id="subcategory"
                        value={cabinetType.subcategory}
                        onChange={(e) => setCabinetType(prev => ({ ...prev, subcategory: e.target.value }))}
                        placeholder="e.g., doors"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="active"
                        checked={cabinetType.active}
                        onCheckedChange={(checked) => setCabinetType(prev => ({ ...prev, active: checked }))}
                      />
                      <Label htmlFor="active">Active</Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="door_count">Door Count</Label>
                      <Input
                        id="door_count"
                        type="number"
                        value={cabinetType.door_count}
                        onChange={(e) => setCabinetType(prev => ({ ...prev, door_count: parseInt(e.target.value) || 0 }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="drawer_count">Drawer Count</Label>
                      <Input
                        id="drawer_count"
                        type="number"
                        value={cabinetType.drawer_count}
                        onChange={(e) => setCabinetType(prev => ({ ...prev, drawer_count: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={cabinetType.featured_product}
                      onCheckedChange={(checked) => setCabinetType(prev => ({ ...prev, featured_product: checked }))}
                    />
                    <Label htmlFor="featured">Featured Product</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={cabinetType.description}
                      onChange={(e) => setCabinetType(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter cabinet description..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SEO Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="seo_title">SEO Title</Label>
                    <Input
                      id="seo_title"
                      value={cabinetType.seo_title}
                      onChange={(e) => setCabinetType(prev => ({ ...prev, seo_title: e.target.value }))}
                      placeholder="SEO optimized title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seo_description">SEO Description</Label>
                    <Textarea
                      id="seo_description"
                      value={cabinetType.seo_description}
                      onChange={(e) => setCabinetType(prev => ({ ...prev, seo_description: e.target.value }))}
                      placeholder="SEO meta description"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seo_keywords">SEO Keywords</Label>
                    <Input
                      id="seo_keywords"
                      value={cabinetType.seo_keywords}
                      onChange={(e) => setCabinetType(prev => ({ ...prev, seo_keywords: e.target.value }))}
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sizes" className="space-y-6 m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Default Dimensions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {cabinetType.category === "Corner Cabinets" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Left Width</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Min (mm)</Label>
                            <Input type="number" defaultValue="300" />
                          </div>
                          <div className="space-y-2">
                            <Label>Max (mm)</Label>
                            <Input type="number" defaultValue="900" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Right Width</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Min (mm)</Label>
                            <Input type="number" defaultValue="300" />
                          </div>
                          <div className="space-y-2">
                            <Label>Max (mm)</Label>
                            <Input type="number" defaultValue="900" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Height</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Min (mm)</Label>
                            <Input type="number" defaultValue="300" />
                          </div>
                          <div className="space-y-2">
                            <Label>Max (mm)</Label>
                            <Input type="number" defaultValue="900" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Left Depth</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Min (mm)</Label>
                            <Input type="number" defaultValue="300" />
                          </div>
                          <div className="space-y-2">
                            <Label>Max (mm)</Label>
                            <Input type="number" defaultValue="600" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Right Depth</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Min (mm)</Label>
                            <Input type="number" defaultValue="300" />
                          </div>
                          <div className="space-y-2">
                            <Label>Max (mm)</Label>
                            <Input type="number" defaultValue="600" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Width</h4>
                        <div className="space-y-2">
                          <Label>Min (mm)</Label>
                          <Input
                            type="number"
                            value={cabinetType.min_width}
                            onChange={(e) => setCabinetType(prev => ({ ...prev, min_width: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max (mm)</Label>
                          <Input
                            type="number"
                            value={cabinetType.max_width}
                            onChange={(e) => setCabinetType(prev => ({ ...prev, max_width: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Increment (mm)</Label>
                          <Input
                            type="number"
                            value={cabinetType.width_increment}
                            onChange={(e) => setCabinetType(prev => ({ ...prev, width_increment: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Height</h4>
                        <div className="space-y-2">
                          <Label>Min (mm)</Label>
                          <Input
                            type="number"
                            value={cabinetType.min_height}
                            onChange={(e) => setCabinetType(prev => ({ ...prev, min_height: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max (mm)</Label>
                          <Input
                            type="number"
                            value={cabinetType.max_height}
                            onChange={(e) => setCabinetType(prev => ({ ...prev, max_height: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Increment (mm)</Label>
                          <Input
                            type="number"
                            value={cabinetType.height_increment}
                            onChange={(e) => setCabinetType(prev => ({ ...prev, height_increment: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Depth</h4>
                        <div className="space-y-2">
                          <Label>Min (mm)</Label>
                          <Input
                            type="number"
                            value={cabinetType.min_depth}
                            onChange={(e) => setCabinetType(prev => ({ ...prev, min_depth: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max (mm)</Label>
                          <Input
                            type="number"
                            value={cabinetType.max_depth}
                            onChange={(e) => setCabinetType(prev => ({ ...prev, max_depth: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Increment (mm)</Label>
                          <Input
                            type="number"
                            value={cabinetType.depth_increment}
                            onChange={(e) => setCabinetType(prev => ({ ...prev, depth_increment: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">Size Ranges</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      (50mm increments will be generated)
                    </p>
                    {/* Add size ranges display here */}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="doors" className="space-y-6 m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Door Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Door options configuration coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="parts" className="space-y-6 m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Parts & Formulas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Parts and formulas configuration coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hardware" className="space-y-6 m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Hardware Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Hardware requirements configuration coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}