import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, X, FileText } from 'lucide-react';
import { toast } from 'sonner';

// Define option types
export type ProductOptionType = 'select' | 'text' | 'textarea' | 'file_upload' | 'brand_model_attachment' | 'card_sentence' | 'hinge_brand_set' | 'runner_brand_set';

export interface ProductOptionConfig {
  id: string;
  name: string;
  type: ProductOptionType;
  required: boolean;
  description?: string;
  options?: string[]; // For select type
  fileTypes?: string[]; // For file upload type
  maxFileSize?: number; // In MB
  placeholder?: string;
  priceAdjustments?: Record<string, number>; // Price adjustments for select options
}

export interface ProductOptionValue {
  optionId: string;
  value: string | File | BrandModelAttachmentValue | null;
  textValue?: string; // For display purposes
  priceAdjustment?: number; // Price adjustment for this option
}

export interface BrandModelAttachmentValue {
  brand: string;
  model: string;
  attachment?: File;
}

interface ProductOptionsConfigurationProps {
  cabinetTypeId: string;
  options: ProductOptionConfig[];
  values: ProductOptionValue[];
  onValuesChange: (values: ProductOptionValue[]) => void;
  disabled?: boolean;
}

export const ProductOptionsConfiguration: React.FC<ProductOptionsConfigurationProps> = ({
  cabinetTypeId,
  options,
  values,
  onValuesChange,
  disabled = false
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  const updateOptionValue = useCallback((optionId: string, value: string | File | BrandModelAttachmentValue | null, textValue?: string, priceAdjustment?: number) => {
    const newValues = values.filter(v => v.optionId !== optionId);
    newValues.push({
      optionId,
      value,
      textValue,
      priceAdjustment
    });
    onValuesChange(newValues);
  }, [values, onValuesChange]);

  const getOptionValue = useCallback((optionId: string): ProductOptionValue | undefined => {
    return values.find(v => v.optionId === optionId);
  }, [values]);

  const handleFileUpload = async (optionId: string, file: File, option: ProductOptionConfig) => {
    if (disabled) return;

    // Validate file type
    if (option.fileTypes && option.fileTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !option.fileTypes.includes(fileExtension)) {
        toast.error(`File type not allowed. Accepted types: ${option.fileTypes.join(', ')}`);
        return;
      }
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    const maxSize = option.maxFileSize || 10; // Default 10MB
    if (fileSizeMB > maxSize) {
      toast.error(`File size exceeds ${maxSize}MB limit`);
      return;
    }

    setUploadingFiles(prev => new Set(prev).add(optionId));

    try {
      // For now, just store the file object
      // In a real implementation, you'd upload to Supabase storage
      updateOptionValue(optionId, file, file.name);
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(optionId);
        return newSet;
      });
    }
  };

  const removeFile = (optionId: string) => {
    updateOptionValue(optionId, null);
  };

  const renderOptionInput = (option: ProductOptionConfig) => {
    const currentValue = getOptionValue(option.id);
    const isUploading = uploadingFiles.has(option.id);

    switch (option.type) {
      case 'select':
        return (
          <Select
            value={currentValue?.value as string || ''}
            onValueChange={(value) => {
              const priceAdjustment = option.priceAdjustments?.[value] || 0;
              updateOptionValue(option.id, value, value, priceAdjustment);
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={option.placeholder || `Select ${option.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {option.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  <div className="flex justify-between items-center w-full">
                    <span>{opt}</span>
                    {option.priceAdjustments?.[opt] && option.priceAdjustments[opt] !== 0 && (
                      <span className="text-sm text-muted-foreground ml-2">
                        {option.priceAdjustments[opt] > 0 ? '+' : ''}${option.priceAdjustments[opt]}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'text':
        return (
          <Input
            value={currentValue?.value as string || ''}
            onChange={(e) => updateOptionValue(option.id, e.target.value)}
            placeholder={option.placeholder || `Enter ${option.name.toLowerCase()}`}
            disabled={disabled}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={currentValue?.value as string || ''}
            onChange={(e) => updateOptionValue(option.id, e.target.value)}
            placeholder={option.placeholder || `Enter ${option.name.toLowerCase()}`}
            disabled={disabled}
            rows={3}
          />
        );

      case 'file_upload':
        return (
          <div className="space-y-2">
            {currentValue?.value ? (
              <div className="flex items-center gap-2 p-2 border rounded">
                <FileText className="h-4 w-4" />
                <span className="text-sm flex-1">{currentValue.textValue}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(option.id)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  id={`file-${option.id}`}
                  className="hidden"
                  accept={option.fileTypes?.map(ext => `.${ext}`).join(',')}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(option.id, file, option);
                    }
                  }}
                  disabled={disabled || isUploading}
                />
                <label
                  htmlFor={`file-${option.id}`}
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {isUploading ? 'Uploading...' : 'Click to upload file'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {option.fileTypes ? `Accepted: ${option.fileTypes.join(', ')}` : 'Any file type'}
                      {option.maxFileSize && ` • Max ${option.maxFileSize}MB`}
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>
        );

      case 'brand_model_attachment':
        const brandModelValue = currentValue?.value as BrandModelAttachmentValue | undefined;
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`brand-${option.id}`}>Brand</Label>
                <Input
                  id={`brand-${option.id}`}
                  value={brandModelValue?.brand || ''}
                  onChange={(e) => {
                    const newValue: BrandModelAttachmentValue = {
                      brand: e.target.value,
                      model: brandModelValue?.model || '',
                      attachment: brandModelValue?.attachment
                    };
                    updateOptionValue(option.id, newValue, `${newValue.brand} ${newValue.model}`.trim());
                  }}
                  placeholder="Enter brand"
                  disabled={disabled}
                />
              </div>
              <div>
                <Label htmlFor={`model-${option.id}`}>Model</Label>
                <Input
                  id={`model-${option.id}`}
                  value={brandModelValue?.model || ''}
                  onChange={(e) => {
                    const newValue: BrandModelAttachmentValue = {
                      brand: brandModelValue?.brand || '',
                      model: e.target.value,
                      attachment: brandModelValue?.attachment
                    };
                    updateOptionValue(option.id, newValue, `${newValue.brand} ${newValue.model}`.trim());
                  }}
                  placeholder="Enter model"
                  disabled={disabled}
                />
              </div>
            </div>
            <div>
              <Label htmlFor={`attachment-${option.id}`}>Attachment (Optional)</Label>
              {brandModelValue?.attachment ? (
                <div className="flex items-center gap-2 p-2 border rounded">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm flex-1">{brandModelValue.attachment.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newValue: BrandModelAttachmentValue = {
                        brand: brandModelValue.brand,
                        model: brandModelValue.model
                      };
                      updateOptionValue(option.id, newValue, `${newValue.brand} ${newValue.model}`.trim());
                    }}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    id={`attachment-${option.id}`}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const newValue: BrandModelAttachmentValue = {
                          brand: brandModelValue?.brand || '',
                          model: brandModelValue?.model || '',
                          attachment: file
                        };
                        updateOptionValue(option.id, newValue, `${newValue.brand} ${newValue.model}`.trim());
                      }
                    }}
                    disabled={disabled || isUploading}
                  />
                  <label
                    htmlFor={`attachment-${option.id}`}
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-6 w-6 text-gray-400" />
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {isUploading ? 'Uploading...' : 'Click to upload file'}
                      </p>
                      <p className="text-xs text-gray-500">PDF, JPEG, PNG files</p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>
        );

      case 'card_sentence':
        return (
          <Textarea
            value={currentValue?.value as string || ''}
            onChange={(e) => updateOptionValue(option.id, e.target.value)}
            placeholder="Enter text that will appear on the product card"
            disabled={disabled}
            rows={2}
            className="resize-none"
          />
        );

        case 'hinge_brand_set':
        case 'runner_brand_set':
          // These will be handled by the hardware set system
          return null;

        default:
        return null;
    }
  };

  if (options.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-8 space-y-8">
        {options.map((option, index) => (
          <div key={option.id}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={`option-${option.id}`} className="text-sm font-medium">
                  {option.name}
                </Label>
                {option.required && (
                  <Badge variant="destructive" className="text-xs">Required</Badge>
                )}
              </div>
              {option.description && (
                <p className="text-sm text-muted-foreground">{option.description}</p>
              )}
              {renderOptionInput(option)}
            </div>
            {index < options.length - 1 && <Separator className="my-4" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// Default configurations for common cabinet options
export const getDefaultCabinetOptions = (cabinetType: string): ProductOptionConfig[] => {
  const baseOptions: ProductOptionConfig[] = [];

  // Add hinge configuration for door cabinets
  if (cabinetType.includes('door') || cabinetType.toLowerCase().includes('door')) {
    baseOptions.push({
      id: 'hinge_configuration',
      name: 'Hinge Configuration',
      type: 'select',
      required: true,
      description: 'Select the hinge configuration for your cabinet doors',
      options: [
        'Left-handed',
        'Right-handed', 
        'Left-Left-Right',
        'Right-Right-Left',
        'Both sides (reversible)'
      ]
    });
  }

  // Add appliance integration options for kitchen cabinets
  if (cabinetType.toLowerCase().includes('kitchen') || cabinetType.toLowerCase().includes('appliance')) {
    baseOptions.push(
      {
        id: 'appliance_brand',
        name: 'Appliance Brand',
        type: 'text',
        required: false,
        description: 'Specify the appliance brand if this cabinet will house an appliance',
        placeholder: 'e.g., Miele, Bosch, Fisher & Paykel'
      },
      {
        id: 'appliance_model',
        name: 'Appliance Model/Details',
        type: 'textarea',
        required: false,
        description: 'Provide model number and any specific installation requirements',
        placeholder: 'Model number and any special installation notes...'
      },
      {
        id: 'installation_instructions',
        name: 'Installation Instructions PDF',
        type: 'file_upload',
        required: false,
        description: 'Upload appliance installation instructions (PDF format)',
        fileTypes: ['pdf'],
        maxFileSize: 10
      }
    );
  }

  return baseOptions;
};