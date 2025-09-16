import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Type helpers
type Tables = Database['public']['Tables'];
type CabinetType = Tables['cabinet_types']['Row'];
type DoorStyle = Tables['door_styles']['Row'];
type Color = Tables['colors']['Row'];
type Order = Tables['orders']['Row'];
type CartItem = Tables['cart_items']['Row'];

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Cabinet Types API
export const cabinetTypesApi = {
  getAll: async (): Promise<CabinetType[]> => {
    const { data, error } = await supabase
      .from('cabinet_types')
      .select('*')
      .eq('active', true)
      .order('category')
      .order('name');
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  getById: async (id: string): Promise<CabinetType | null> => {
    const { data, error } = await supabase
      .from('cabinet_types')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .maybeSingle();
    
    if (error) throw new Error(error.message);
    return data;
  },

  getByCategory: async (category: string): Promise<CabinetType[]> => {
    const { data, error } = await supabase
      .from('cabinet_types')
      .select('*')
      .eq('category', category)
      .eq('active', true)
      .order('name');
    
    if (error) throw new Error(error.message);
    return data || [];
  }
};

// Door Styles API
export const doorStylesApi = {
  getAll: async (): Promise<DoorStyle[]> => {
    const { data, error } = await supabase
      .from('door_styles')
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  getById: async (id: string): Promise<DoorStyle | null> => {
    const { data, error } = await supabase
      .from('door_styles')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .maybeSingle();
    
    if (error) throw new Error(error.message);
    return data;
  }
};

// Colors API
export const colorsApi = {
  getAll: async (): Promise<Color[]> => {
    const { data, error } = await supabase
      .from('colors')
      .select('*')
      .eq('active', true)
      .order('sort_order')
      .order('name');
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  getByDoorStyle: async (doorStyleId: string): Promise<Color[]> => {
    const { data, error } = await supabase
      .from('colors')
      .select('*')
      .eq('door_style_id', doorStyleId)
      .eq('active', true)
      .order('sort_order')
      .order('name');
    
    if (error) throw new Error(error.message);
    return data || [];
  }
};

// Cart API
export const cartApi = {
  getUserCart: async (userId: string) => {
    const { data, error } = await supabase
      .from('carts')
      .select(`
        *,
        cart_items (
          *,
          cabinet_types (name, category, product_image_url)
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    
    if (error) throw new Error(error.message);
    return data;
  },

  addItem: async (cartId: string, item: Omit<CartItem, 'id' | 'created_at' | 'updated_at' | 'cart_id'>) => {
    const { data, error } = await supabase
      .from('cart_items')
      .insert({
        ...item,
        cart_id: cartId
      })
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  updateItem: async (itemId: string, updates: Partial<CartItem>) => {
    const { data, error } = await supabase
      .from('cart_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  removeItem: async (itemId: string) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);
    
    if (error) throw new Error(error.message);
  }
};

// Orders API
export const ordersApi = {
  getUserOrders: async (userId: string): Promise<Order[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          cabinet_types (name, category)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  getById: async (id: string): Promise<Order | null> => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          cabinet_types (name, category, product_image_url)
        ),
        contacts (name, email, phone)
      `)
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw new Error(error.message);
    return data;
  }
};

// Global Settings API
export const settingsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('global_settings')
      .select('*')
      .order('setting_key');
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  getByKey: async (key: string) => {
    const { data, error } = await supabase
      .from('global_settings')
      .select('*')
      .eq('setting_key', key)
      .maybeSingle();
    
    if (error) throw new Error(error.message);
    return data?.setting_value || null;
  }
};

// Error handling helper
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};