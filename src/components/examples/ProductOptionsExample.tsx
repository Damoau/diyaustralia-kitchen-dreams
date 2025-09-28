import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ProductOptionsConfiguration, 
  ProductOptionConfig, 
  ProductOptionValue 
} from '@/components/product/ProductOptionsConfiguration';
import { ProductOptionsDisplay } from '@/components/product/ProductOptionsDisplay';
import { toast } from 'sonner';

/**
 * Example component demonstrating the Product Options system
 * This shows how different cabinet types can have different option sets
 */
export const ProductOptionsExample: React.FC = () => {
  const [selectedCabinetType, setSelectedCabinetType] = useState<string>('kitchen-door-cabinet');
  const [optionValues, setOptionValues] = useState<ProductOptionValue[]>([]);

  // Example cabinet types with different option sets
  const cabinetTypes = {
    'kitchen-door-cabinet': {
      name: 'Kitchen Door Cabinet',
      options: [
        {
          id: 'appliance_brand',
          name: 'Appliance Brand',
          type: 'text' as const,
          required: false,
          description: 'Specify the appliance brand if this cabinet will house an appliance',
          placeholder: 'e.g., Miele, Bosch, Fisher & Paykel'
        },
        {
          id: 'appliance_model',
          name: 'Appliance Model/Details',
          type: 'textarea' as const,
          required: false,
          description: 'Provide model number and any specific installation requirements',
          placeholder: 'Model number and any special installation notes...'
        },
        {
          id: 'installation_instructions',
          name: 'Installation Instructions PDF',
          type: 'file_upload' as const,
          required: false,
          description: 'Upload appliance installation instructions (PDF format)',
          fileTypes: ['pdf'],
          maxFileSize: 10
        }
      ] as ProductOptionConfig[]
    },
    'base-cabinet': {
      name: 'Base Cabinet',
      options: [
        {
          id: 'drawer_configuration',
          name: 'Drawer Configuration',
          type: 'select' as const,
          required: true,
          description: 'Choose how drawers should be configured',
          options: [
            'Single large drawer',
            'Two equal drawers',
            'Three graduated drawers',
            'Custom configuration'
          ]
        },
        {
          id: 'special_requirements',
          name: 'Special Requirements',
          type: 'textarea' as const,
          required: false,
          description: 'Any special requirements or modifications needed',
          placeholder: 'Describe any custom requirements...'
        }
      ] as ProductOptionConfig[]
    },
    'wall-cabinet': {
      name: 'Wall Cabinet',
      options: [
        {
          id: 'mounting_type',
          name: 'Mounting Type',
          type: 'select' as const,
          required: true,
          description: 'Select the mounting configuration',
          options: [
            'Standard wall mount',
            'Corner wall mount',
            'Under-cabinet mount',
            'Floating mount'
          ]
        },
        {
          id: 'glass_doors',
          name: 'Glass Door Option',
          type: 'select' as const,
          required: false,
          description: 'Choose glass door configuration if desired',
          options: [
            'No glass doors',
            'Clear glass',
            'Frosted glass',
            'Decorative glass'
          ]
        }
      ] as ProductOptionConfig[]
    }
  };

  const currentCabinet = cabinetTypes[selectedCabinetType as keyof typeof cabinetTypes];

  const handleValuesChange = (newValues: ProductOptionValue[]) => {
    setOptionValues(newValues);
  };

  const handleSubmit = () => {
    // Validate required options
    const requiredOptions = currentCabinet.options.filter(opt => opt.required);
    const providedOptionIds = optionValues.filter(v => v.value !== null && v.value !== '').map(v => v.optionId);
    const missingRequired = requiredOptions.filter(opt => !providedOptionIds.includes(opt.id));

    if (missingRequired.length > 0) {
      toast.error(`Please complete required options: ${missingRequired.map(opt => opt.name).join(', ')}`);
      return;
    }

    // Convert to the format that would be stored in the database
    const exportedOptions = optionValues.reduce((acc, value) => {
      const option = currentCabinet.options.find(opt => opt.id === value.optionId);
      if (option && value.value !== null && value.value !== '') {
        acc[option.name] = {
          type: option.type,
          value: value.value,
          textValue: value.textValue
        };
      }
      return acc;
    }, {} as Record<string, any>);

    console.log('Exported Product Options:', exportedOptions);
    toast.success('Product options configured successfully!');
  };

  const resetOptions = () => {
    setOptionValues([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Options System Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select Cabinet Type:</label>
            <div className="flex gap-2 mt-2">
              {Object.entries(cabinetTypes).map(([key, cabinet]) => (
                <Button
                  key={key}
                  variant={selectedCabinetType === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedCabinetType(key);
                    resetOptions();
                  }}
                >
                  {cabinet.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div>
          <ProductOptionsConfiguration
            cabinetType={selectedCabinetType}
            options={currentCabinet.options}
            values={optionValues}
            onValuesChange={handleValuesChange}
          />
          
          <div className="mt-4 flex gap-2">
            <Button onClick={handleSubmit} className="flex-1">
              Save Configuration
            </Button>
            <Button variant="outline" onClick={resetOptions}>
              Reset
            </Button>
          </div>
        </div>

        {/* Display Panel */}
        <div>
          <ProductOptionsDisplay
            options={currentCabinet.options}
            values={optionValues}
            title="Current Configuration"
          />
          
          {optionValues.length > 0 && (
            <>
              <Separator className="my-4" />
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Exported Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                    {JSON.stringify(
                      optionValues.reduce((acc, value) => {
                        const option = currentCabinet.options.find(opt => opt.id === value.optionId);
                        if (option && value.value !== null && value.value !== '') {
                          acc[option.name] = {
                            type: option.type,
                            value: option.type === 'file_upload' ? value.textValue : value.value
                          };
                        }
                        return acc;
                      }, {} as Record<string, any>),
                      null,
                      2
                    )}
                  </pre>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};