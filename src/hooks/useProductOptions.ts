import { useState, useCallback, useEffect } from 'react';
import { ProductOptionConfig, ProductOptionValue, getDefaultCabinetOptions } from '@/components/product/ProductOptionsConfiguration';

interface UseProductOptionsProps {
  cabinetTypeId?: string;
  cabinetTypeName?: string;
}

export const useProductOptions = ({ cabinetTypeId, cabinetTypeName }: UseProductOptionsProps = {}) => {
  const [options, setOptions] = useState<ProductOptionConfig[]>([]);
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
      // For now, use default options based on cabinet type
      // In a real implementation, you'd fetch from database
      const defaultOptions = getDefaultCabinetOptions(cabinetTypeName);
      
      // TODO: Load custom options from database
      // const { data: customOptions, error } = await supabase
      //   .from('cabinet_product_options')
      //   .select('*')
      //   .eq('cabinet_type_id', cabinetTypeId)
      //   .eq('active', true);
      
      setOptions(defaultOptions);
      
      // Clear existing values when options change
      setValues([]);
      
    } catch (error) {
      console.error('Error loading product options:', error);
      setOptions([]);
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

  return {
    options,
    values,
    isLoading,
    updateValues,
    getValueForOption,
    validateRequiredOptions,
    getValidationErrors,
    resetValues,
    exportValues
  };
};