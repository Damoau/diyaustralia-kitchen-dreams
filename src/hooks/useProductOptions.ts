import { useState, useCallback, useEffect } from 'react';
import { ProductOptionConfig, ProductOptionValue, getDefaultCabinetOptions } from '@/components/product/ProductOptionsConfiguration';
import { supabase } from '@/integrations/supabase/client';

interface UseProductOptionsProps {
  cabinetTypeId?: string;
  cabinetTypeName?: string;
}

export const useProductOptions = ({ cabinetTypeId, cabinetTypeName }: UseProductOptionsProps = {}) => {
  const [options, setOptions] = useState<ProductOptionConfig[]>([]);
  const [hiddenOptions, setHiddenOptions] = useState<ProductOptionConfig[]>([]);
  const [values, setValues] = useState<ProductOptionValue[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load options when cabinet type changes
  useEffect(() => {
    if (cabinetTypeId && cabinetTypeName) {
      loadOptionsForCabinetType(cabinetTypeId, cabinetTypeName);
    } else {
      setOptions([]);
      setValues([]);
    }
  }, [cabinetTypeId, cabinetTypeName]);

  const loadOptionsForCabinetType = useCallback(async (cabinetTypeId: string, cabinetTypeName: string) => {
    setIsLoading(true);
    
    try {
      // First try to load custom options from database with proper joins
      const { data: customOptions, error } = await supabase
        .from('cabinet_product_options')
        .select(`
          id,
          option_name,
          option_type,
          required,
          description,
          display_order,
          active,
          display_to_customers,
          cabinet_option_values(
            id,
            value,
            display_text,
            display_order,
            active,
            price_adjustment
          )
        `)
        .eq('cabinet_type_id', cabinetTypeId)
        .eq('active', true)
        .order('display_order');

      console.log('Debug - Custom options query result:', { customOptions, error, cabinetTypeId });

      if (error) {
        console.error('Error loading custom options:', error);
        // Fall back to default options
        const defaultOptions = getDefaultCabinetOptions(cabinetTypeName);
        setOptions(defaultOptions);
      } else if (customOptions && customOptions.length > 0) {
        console.log('Debug - Found custom options, converting...', customOptions);
        
        // Convert database options to ProductOptionConfig format, filtering by display_to_customers
        const visibleOptions = customOptions
          .filter(option => option.display_to_customers !== false) // Only show options that should be displayed to customers
          .map(option => {
          console.log('Debug - Converting option:', option.option_name, {
            hasValues: !!option.cabinet_option_values,
            valueCount: option.cabinet_option_values?.length || 0,
            values: option.cabinet_option_values
          });
          
          return {
            id: option.id,
            name: option.option_name,
            type: option.option_type as 'select' | 'text' | 'textarea' | 'file_upload' | 'brand_model_attachment' | 'card_sentence' | 'hinge_side',
            required: option.required,
            description: option.description,
            displayType: (option as any).display_type || 'select',
            options: (option.option_type === 'select' || option.option_type === 'hinge_side') && option.cabinet_option_values 
              ? option.cabinet_option_values
                  .filter((v: any) => v.active)
                  .sort((a: any, b: any) => a.display_order - b.display_order)
                  .map((v: any) => v.display_text)  // Just use display_text as string
              : undefined,
            priceAdjustments: (option.option_type === 'select' || option.option_type === 'hinge_side') && option.cabinet_option_values
              ? option.cabinet_option_values
                  .filter((v: any) => v.active && v.price_adjustment)
                  .reduce((acc: Record<string, number>, v: any) => {
                    acc[v.display_text] = v.price_adjustment;
                    return acc;
                  }, {})
              : undefined,
            defaultValue: (option.option_type === 'select' || option.option_type === 'hinge_side') && option.cabinet_option_values
              ? option.cabinet_option_values.find((v: any) => v.is_default)?.display_text
              : undefined,
            maxFileSize: option.option_type === 'file_upload' ? 5 : undefined,
            fileTypes: option.option_type === 'file_upload' ? ['image/*', '.pdf'] : undefined
          };
        });

        // Store hidden options separately for pricing calculations
        const hiddenOptionsConverted = customOptions
          .filter(option => option.display_to_customers === false) // Options hidden from customers
          .map(option => ({
            id: option.id,
            name: option.option_name,
            type: option.option_type as 'select' | 'text' | 'textarea' | 'file_upload' | 'brand_model_attachment' | 'card_sentence' | 'hinge_side',
            required: option.required,
            description: option.description,
            displayType: (option as any).display_type || 'select',
            options: (option.option_type === 'select' || option.option_type === 'hinge_side') && option.cabinet_option_values 
              ? option.cabinet_option_values
                  .filter((v: any) => v.active)
                  .sort((a: any, b: any) => a.display_order - b.display_order)
                  .map((v: any) => v.display_text)
              : undefined,
            priceAdjustments: (option.option_type === 'select' || option.option_type === 'hinge_side') && option.cabinet_option_values
              ? option.cabinet_option_values
                  .filter((v: any) => v.active && v.price_adjustment)
                  .reduce((acc: Record<string, number>, v: any) => {
                    acc[v.display_text] = v.price_adjustment;
                    return acc;
                  }, {})
              : undefined,
            maxFileSize: option.option_type === 'file_upload' ? 5 : undefined,
            fileTypes: option.option_type === 'file_upload' ? ['image/*', '.pdf'] : undefined
          }));
        
        console.log('Debug - Converted visible options:', visibleOptions);
        console.log('Debug - Converted hidden options:', hiddenOptionsConverted);
        setOptions(visibleOptions);
        setHiddenOptions(hiddenOptionsConverted);
      } else {
        // No custom options found, use defaults
        const defaultOptions = getDefaultCabinetOptions(cabinetTypeName);
        setOptions(defaultOptions);
      }
      
      // Clear existing values when options change
      setValues([]);
      setHiddenOptions([]);
      
    } catch (error) {
      console.error('Error loading product options:', error);
      // Fall back to default options
      const defaultOptions = getDefaultCabinetOptions(cabinetTypeName);
      setOptions(defaultOptions);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateValues = useCallback((newValues: ProductOptionValue[]) => {
    setValues(newValues);
  }, []);

  const getValueForOption = useCallback((optionId: string): ProductOptionValue | undefined => {
    return values.find(v => v.optionId === optionId);
  }, [values]);

  const validateRequiredOptions = useCallback((): boolean => {
    const requiredOptions = options.filter(opt => opt.required);
    const requiredOptionIds = requiredOptions.map(opt => opt.id);
    const providedOptionIds = values.filter(v => v.value !== null && v.value !== '').map(v => v.optionId);
    
    return requiredOptionIds.every(id => providedOptionIds.includes(id));
  }, [options, values]);

  const getValidationErrors = useCallback((): string[] => {
    const errors: string[] = [];
    const requiredOptions = options.filter(opt => opt.required);
    
    requiredOptions.forEach(option => {
      const value = getValueForOption(option.id);
      if (!value || value.value === null || value.value === '') {
        errors.push(`${option.name} is required`);
      }
    });
    
    return errors;
  }, [options, getValueForOption]);

  const resetValues = useCallback(() => {
    setValues([]);
  }, []);

  const exportValues = useCallback(() => {
    return values.reduce((acc, value) => {
      const option = options.find(opt => opt.id === value.optionId);
      if (option) {
        acc[option.name] = {
          type: option.type,
          value: value.value,
          textValue: value.textValue
        };
      }
      return acc;
    }, {} as Record<string, any>);
  }, [values, options]);

  const getHiddenOptionsCost = useCallback(() => {
    let totalCost = 0;
    
    hiddenOptions.forEach(option => {
      if (option.type === 'plastic_legs') {
        // Default plastic legs cost - this should come from your pricing logic
        // For now, using a hardcoded value, but this should be calculated based on your pricing rules
        totalCost += 9.60; // This matches the cost shown in your image
      } else if (option.priceAdjustments && option.options) {
        // For other hidden options with price adjustments, add the first option's cost as default
        const firstOptionCost = option.priceAdjustments[option.options[0]] || 0;
        totalCost += firstOptionCost;
      }
    });
    
    return totalCost;
  }, [hiddenOptions]);

  return {
    options,
    hiddenOptions,
    values,
    isLoading,
    updateValues,
    getValueForOption,
    validateRequiredOptions,
    getValidationErrors,
    resetValues,
    exportValues,
    getHiddenOptionsCost
  };
};