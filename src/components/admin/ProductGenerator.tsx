import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Package, Wand2, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CabinetType {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  active: boolean;
  base_price: number;
  default_width_mm: number;
  default_height_mm: number;
  default_depth_mm: number;
}

interface Product {
  id: string;
  title: string;
  handle: string;
}

interface GenerationProgress {
  current: number;
  total: number;
  currentItem: string;
  completed: string[];
  errors: string[];
}

export function ProductGenerator() {
  const { toast } = useToast();
  const [cabinetTypes, setCabinetTypes] = useState<CabinetType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCabinets, setSelectedCabinets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load cabinet types
      const { data: cabinets, error: cabinetsError } = await supabase
        .from('cabinet_types')
        .select('id, name, category, subcategory, active, base_price, default_width_mm, default_height_mm, default_depth_mm')
        .eq('active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (cabinetsError) throw cabinetsError;

      // Load existing products
      const { data: existingProducts, error: productsError } = await supabase
        .from('products')
        .select('id, title, handle')
        .eq('product_type', 'cabinet');

      if (productsError) throw productsError;

      setCabinetTypes(cabinets || []);
      setProducts(existingProducts || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load cabinet types and products",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  // Find cabinet types that don't have corresponding products
  const getUnmappedCabinets = () => {
    return cabinetTypes.filter(cabinet => {
      const productExists = products.some(product => {
        const productTitle = product.title.toLowerCase();
        const cabinetName = cabinet.name.toLowerCase();
        return productTitle.includes(cabinetName) || product.handle.includes(cabinetName.replace(/\s+/g, '-'));
      });
      return !productExists;
    });
  };

  const toggleCabinetSelection = (cabinetId: string) => {
    setSelectedCabinets(prev => 
      prev.includes(cabinetId) 
        ? prev.filter(id => id !== cabinetId)
        : [...prev, cabinetId]
    );
  };

  const selectAllUnmapped = () => {
    const unmapped = getUnmappedCabinets();
    setSelectedCabinets(unmapped.map(c => c.id));
  };

  const clearSelection = () => {
    setSelectedCabinets([]);
  };

  const generateProduct = async (cabinetType: CabinetType) => {
    // Create the product
    const handle = cabinetType.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        title: cabinetType.name,
        handle: handle,
        product_type: 'cabinet',
        status: 'active',
        vendor: 'DIY Australia',
        description: `High-quality ${cabinetType.name.toLowerCase()} cabinet for your kitchen renovation.`
      })
      .select()
      .single();

    if (productError) throw productError;

    // Create product options
    const productOptions = [
      {
        product_id: product.id,
        name: 'Door Style',
        display_type: 'dropdown',
        position: 1
      },
      {
        product_id: product.id,
        name: 'Color',
        display_type: 'swatch',
        position: 2
      },
      {
        product_id: product.id,
        name: 'Hardware',
        display_type: 'dropdown',
        position: 3
      }
    ];

    const { data: createdOptions, error: optionsError } = await supabase
      .from('product_options')
      .insert(productOptions)
      .select();

    if (optionsError) throw optionsError;

    // Create default option values
    const optionValues = [];

    // Door Style values
    const doorStyleOption = createdOptions.find(opt => opt.name === 'Door Style');
    if (doorStyleOption) {
      optionValues.push(
        {
          product_option_id: doorStyleOption.id,
          value: 'Shaker',
          code: 'shaker',
          sort_order: 1,
          is_active: true
        },
        {
          product_option_id: doorStyleOption.id,
          value: 'Flat Panel',
          code: 'flat-panel',
          sort_order: 2,
          is_active: true
        }
      );
    }

    // Color values
    const colorOption = createdOptions.find(opt => opt.name === 'Color');
    if (colorOption) {
      optionValues.push(
        {
          product_option_id: colorOption.id,
          value: 'White',
          code: 'white',
          swatch_hex: '#FFFFFF',
          sort_order: 1,
          is_active: true
        },
        {
          product_option_id: colorOption.id,
          value: 'Natural Wood',
          code: 'natural-wood',
          swatch_hex: '#D2B48C',
          sort_order: 2,
          is_active: true
        },
        {
          product_option_id: colorOption.id,
          value: 'Charcoal',
          code: 'charcoal',
          swatch_hex: '#36454F',
          sort_order: 3,
          is_active: true
        }
      );
    }

    // Hardware values
    const hardwareOption = createdOptions.find(opt => opt.name === 'Hardware');
    if (hardwareOption) {
      optionValues.push(
        {
          product_option_id: hardwareOption.id,
          value: 'Blum',
          code: 'blum',
          sort_order: 1,
          is_active: true
        },
        {
          product_option_id: hardwareOption.id,
          value: 'Hafele',
          code: 'hafele',
          sort_order: 2,
          is_active: true
        }
      );
    }

    if (optionValues.length > 0) {
      const { error: valuesError } = await supabase
        .from('option_values')
        .insert(optionValues);

      if (valuesError) throw valuesError;
    }

    // Create a default variant
    const { data: variant, error: variantError } = await supabase
      .from('variants')
      .insert({
        product_id: product.id,
        sku: `${handle}-default`,
        option_value_ids: [],
        is_active: true,
        width_mm: cabinetType.default_width_mm || 600,
        height_mm: cabinetType.default_height_mm || 720,
        length_mm: cabinetType.default_depth_mm || 560
      })
      .select()
      .single();

    if (variantError) throw variantError;

    // Create variant metafield linking to cabinet type
    const { error: metafieldError } = await supabase
      .from('variant_metafields')
      .insert({
        variant_id: variant.id,
        key: 'cabinet_type_id',
        value_json: cabinetType.id
      });

    if (metafieldError) throw metafieldError;

    return product;
  };

  const generateSelectedProducts = async () => {
    const selectedCabinetTypes = cabinetTypes.filter(c => selectedCabinets.includes(c.id));
    
    if (selectedCabinetTypes.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one cabinet type to generate products for.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setProgress({
      current: 0,
      total: selectedCabinetTypes.length,
      currentItem: '',
      completed: [],
      errors: []
    });

    try {
      for (let i = 0; i < selectedCabinetTypes.length; i++) {
        const cabinetType = selectedCabinetTypes[i];
        
        setProgress(prev => prev ? {
          ...prev,
          current: i + 1,
          currentItem: cabinetType.name
        } : null);

        try {
          await generateProduct(cabinetType);
          setProgress(prev => prev ? {
            ...prev,
            completed: [...prev.completed, cabinetType.name]
          } : null);
        } catch (error) {
          console.error(`Error generating product for ${cabinetType.name}:`, error);
          setProgress(prev => prev ? {
            ...prev,
            errors: [...prev.errors, `${cabinetType.name}: ${error.message}`]
          } : null);
        }

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Reload data to show new products
      await loadData();
      setSelectedCabinets([]);

      const successCount = progress?.completed.length || 0;
      const errorCount = progress?.errors.length || 0;

      toast({
        title: "Generation Complete",
        description: `Generated ${successCount} products successfully. ${errorCount > 0 ? `${errorCount} errors occurred.` : ''}`,
        variant: errorCount > 0 ? "destructive" : "default",
      });

    } catch (error) {
      console.error('Error during product generation:', error);
      toast({
        title: "Generation Failed",
        description: "An unexpected error occurred during product generation.",
        variant: "destructive",
      });
    }

    setGenerating(false);
    setProgress(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading cabinet types and products...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const unmappedCabinets = getUnmappedCabinets();
  const allMapped = unmappedCabinets.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Product Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">
                Generate products from existing cabinet types to enable the new configurator system.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {unmappedCabinets.length} cabinet types need products created.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadData} variant="outline" size="sm">
                Refresh
              </Button>
              {!allMapped && (
                <Button 
                  onClick={generateSelectedProducts}
                  disabled={selectedCabinets.length === 0 || generating}
                  size="sm"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Generate Selected ({selectedCabinets.length})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Progress */}
      {progress && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Generating Products</span>
                <span className="text-sm text-muted-foreground">
                  {progress.current} of {progress.total}
                </span>
              </div>
              
              <Progress value={(progress.current / progress.total) * 100} />
              
              {progress.currentItem && (
                <p className="text-sm text-muted-foreground">
                  Currently generating: {progress.currentItem}
                </p>
              )}

              {progress.errors.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <span className="font-medium">Errors occurred:</span>
                      {progress.errors.map((error, i) => (
                        <div key={i} className="text-sm">{error}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cabinet Types List */}
      {allMapped ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-medium mb-2">All Products Generated</h3>
              <p className="text-muted-foreground">
                All active cabinet types now have corresponding products in the catalog.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Cabinet Types Needing Products ({unmappedCabinets.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={selectAllUnmapped} variant="outline" size="sm">
                Select All
              </Button>
              <Button onClick={clearSelection} variant="outline" size="sm">
                Clear Selection
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {unmappedCabinets.map((cabinet) => (
                <div
                  key={cabinet.id}
                  className="flex items-center space-x-3 p-3 border rounded hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedCabinets.includes(cabinet.id)}
                    onCheckedChange={() => toggleCabinetSelection(cabinet.id)}
                    disabled={generating}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{cabinet.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {cabinet.category}
                      </Badge>
                      {cabinet.subcategory && (
                        <Badge variant="secondary" className="text-xs">
                          {cabinet.subcategory}
                        </Badge>
                      )}
                    </div>
                    {cabinet.base_price > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Base Price: ${cabinet.base_price.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}