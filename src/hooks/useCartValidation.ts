import { useState } from 'react';

export interface CartItem {
  cabinet_type_id: string;
  door_style_id: string;
  color_id: string;
  finish_id: string;
  width_mm: number;
  height_mm: number;
  depth_mm: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  configuration?: any;
  notes?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export const useCartValidation = () => {
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const validateCartItem = (item: CartItem): ValidationError[] => {
    const validationErrors: ValidationError[] = [];

    // Required field validation
    if (!item.cabinet_type_id) {
      validationErrors.push({ field: 'cabinet_type_id', message: 'Cabinet type is required' });
    }

    if (!item.door_style_id) {
      validationErrors.push({ field: 'door_style_id', message: 'Door style is required' });
    }

    if (!item.color_id) {
      validationErrors.push({ field: 'color_id', message: 'Color is required' });
    }

    if (!item.finish_id) {
      validationErrors.push({ field: 'finish_id', message: 'Finish is required' });
    }

    // Dimension validation
    if (!item.width_mm || item.width_mm <= 0) {
      validationErrors.push({ field: 'width_mm', message: 'Width must be greater than 0' });
    }

    if (!item.height_mm || item.height_mm <= 0) {
      validationErrors.push({ field: 'height_mm', message: 'Height must be greater than 0' });
    }

    if (!item.depth_mm || item.depth_mm <= 0) {
      validationErrors.push({ field: 'depth_mm', message: 'Depth must be greater than 0' });
    }

    // Reasonable dimension limits (in mm)
    if (item.width_mm > 3000) {
      validationErrors.push({ field: 'width_mm', message: 'Width cannot exceed 3000mm' });
    }

    if (item.height_mm > 3000) {
      validationErrors.push({ field: 'height_mm', message: 'Height cannot exceed 3000mm' });
    }

    if (item.depth_mm > 1000) {
      validationErrors.push({ field: 'depth_mm', message: 'Depth cannot exceed 1000mm' });
    }

    // Quantity validation
    if (!item.quantity || item.quantity <= 0) {
      validationErrors.push({ field: 'quantity', message: 'Quantity must be at least 1' });
    }

    if (item.quantity > 100) {
      validationErrors.push({ field: 'quantity', message: 'Quantity cannot exceed 100' });
    }

    // Price validation
    if (item.unit_price <= 0) {
      validationErrors.push({ field: 'unit_price', message: 'Unit price must be greater than 0' });
    }

    if (item.total_price <= 0) {
      validationErrors.push({ field: 'total_price', message: 'Total price must be greater than 0' });
    }

    // Price consistency check
    if (Math.abs(item.total_price - (item.unit_price * item.quantity)) > 0.01) {
      validationErrors.push({ 
        field: 'total_price', 
        message: 'Total price does not match unit price × quantity' 
      });
    }

    setErrors(validationErrors);
    return validationErrors;
  };

  const isValidCartItem = (item: CartItem): boolean => {
    const validationErrors = validateCartItem(item);
    return validationErrors.length === 0;
  };

  const getErrorMessage = (field: string): string | undefined => {
    const error = errors.find(e => e.field === field);
    return error?.message;
  };

  return {
    validateCartItem,
    isValidCartItem,
    errors,
    getErrorMessage,
    clearErrors: () => setErrors([])
  };
};