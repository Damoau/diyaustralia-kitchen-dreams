import { z } from 'zod';

// Global validation schemas
export const contactSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  abn: z.string().optional(),
});

export const addressSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['shipping', 'billing']),
  name: z.string().min(1, 'Name is required'),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  suburb: z.string().min(1, 'Suburb is required'),
  state: z.string().min(1, 'State is required'),
  postcode: z.string().min(4, 'Postcode must be at least 4 characters'),
  country: z.string().default('Australia'),
  phone: z.string().optional(),
  is_default: z.boolean().default(false),
});

export const cabinetConfigurationSchema = z.object({
  cabinet_type_id: z.string().uuid(),
  width_mm: z.number().min(100).max(2000),
  height_mm: z.number().min(100).max(3000),
  depth_mm: z.number().min(100).max(1000),
  door_style_id: z.string().uuid().optional(),
  color_id: z.string().uuid().optional(),
  finish_id: z.string().uuid().optional(),
  hardware_selections: z.record(z.string().uuid()).optional(),
  notes: z.string().optional(),
});

export const cartItemSchema = z.object({
  id: z.string().uuid().optional(),
  cabinet_type_id: z.string().uuid(),
  width_mm: z.number().min(100).max(2000),
  height_mm: z.number().min(100).max(3000),
  depth_mm: z.number().min(100).max(1000),
  quantity: z.number().min(1).max(100),
  door_style_id: z.string().uuid().optional(),
  color_id: z.string().uuid().optional(),
  finish_id: z.string().uuid().optional(),
  notes: z.string().optional(),
  configuration: z.record(z.any()).optional(),
});

export const quoteRequestSchema = z.object({
  customer_details: contactSchema,
  delivery_address: addressSchema.optional(),
  billing_address: addressSchema.optional(),
  items: z.array(cartItemSchema).min(1, 'At least one item is required'),
  project_details: z.object({
    project_name: z.string().optional(),
    project_description: z.string().optional(),
    timeline: z.string().optional(),
    budget_range: z.string().optional(),
  }).optional(),
  special_requirements: z.string().optional(),
  how_heard: z.string().optional(),
  marketing_opt_in: z.boolean().default(false),
});

export const checkoutSchema = z.object({
  customer_first_name: z.string().min(1, 'First name is required'),
  customer_last_name: z.string().min(1, 'Last name is required'),
  customer_email: z.string().email('Invalid email address'),
  customer_phone: z.string().min(10, 'Phone number is required'),
  customer_company: z.string().optional(),
  customer_abn: z.string().optional(),
  how_heard: z.string().optional(),
  marketing_opt_in: z.boolean().default(false),
  accept_terms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  accept_privacy: z.boolean().refine(val => val === true, 'You must accept the privacy policy'),
});

// Type exports
export type ContactFormData = z.infer<typeof contactSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type CabinetConfigurationData = z.infer<typeof cabinetConfigurationSchema>;
export type CartItemFormData = z.infer<typeof cartItemSchema>;
export type QuoteRequestData = z.infer<typeof quoteRequestSchema>;
export type CheckoutFormData = z.infer<typeof checkoutSchema>;

// Validation helpers
export const validateEmail = (email: string): boolean => {
  return z.string().email().safeParse(email).success;
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\+61|0)[2-9]\d{8}$/;
  return phoneRegex.test(phone);
};

export const validateABN = (abn: string): boolean => {
  const abnRegex = /^\d{11}$/;
  return abnRegex.test(abn.replace(/\s/g, ''));
};

export const validatePostcode = (postcode: string, state: string): boolean => {
  const postcodeRanges: Record<string, [number, number][]> = {
    'NSW': [[1000, 1999], [2000, 2599], [2619, 2899], [2921, 2999]],
    'VIC': [[3000, 3999], [8000, 8999]],
    'QLD': [[4000, 4999], [9000, 9999]],
    'SA': [[5000, 5999]],
    'WA': [[6000, 6799], [6800, 6999]],
    'TAS': [[7000, 7999]],
    'NT': [[800, 999]],
    'ACT': [[200, 299], [2600, 2618], [2900, 2920]],
  };

  const code = parseInt(postcode);
  const ranges = postcodeRanges[state];
  
  if (!ranges) return false;
  
  return ranges.some(([min, max]) => code >= min && code <= max);
};