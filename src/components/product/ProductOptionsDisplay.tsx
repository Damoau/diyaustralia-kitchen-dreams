import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Settings, Download } from 'lucide-react';
import { ProductOptionValue, ProductOptionConfig } from './ProductOptionsConfiguration';

interface ProductOptionsDisplayProps {
  options: ProductOptionConfig[];
  values: ProductOptionValue[];
  title?: string;
}

export const ProductOptionsDisplay: React.FC<ProductOptionsDisplayProps> = ({
  options,
  values,
  title = "Product Options"
}) => {
  const getOptionConfig = (optionId: string): ProductOptionConfig | undefined => {
    return options.find(opt => opt.id === optionId);
  };

  const getDisplayValue = (value: ProductOptionValue): string => {
    const option = getOptionConfig(value.optionId);
    if (!option) return '';

    switch (option.type) {
      case 'file_upload':
        return value.textValue || 'File uploaded';
      case 'select':
      case 'text':
      case 'textarea':
        return value.value as string || '';
      default:
        return '';
    }
  };

  const filteredValues = values.filter(v => v.value !== null && v.value !== '');

  if (filteredValues.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {filteredValues.map((value) => {
          const option = getOptionConfig(value.optionId);
          if (!option) return null;

          return (
            <div key={value.optionId} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {option.type === 'file_upload' && <FileText className="h-4 w-4 text-muted-foreground" />}
                <span className="text-sm font-medium">{option.name}:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {getDisplayValue(value)}
                </span>
                {option.type === 'file_upload' && value.value && (
                  <Badge variant="secondary" className="text-xs">
                    PDF
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};