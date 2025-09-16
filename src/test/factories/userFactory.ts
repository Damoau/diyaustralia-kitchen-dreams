import type { User } from '@supabase/supabase-js';

export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'test-user-id',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  email_confirmed_at: new Date().toISOString(),
  phone: '+1234567890',
  phone_confirmed_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {
    full_name: 'Test User',
  },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_anonymous: false,
  ...overrides,
});

export const createMockAdminUser = (overrides?: Partial<User>): User => 
  createMockUser({
    app_metadata: {
      role: 'admin',
    },
    user_metadata: {
      full_name: 'Admin User',
    },
    ...overrides,
  });

export const createMockUserProfile = (overrides?: any) => ({
  id: 'test-profile-id',
  user_id: 'test-user-id',
  full_name: 'Test User',
  phone: '+1234567890',
  company_name: 'Test Company',
  business_type: 'individual',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockUserRole = (overrides?: any) => ({
  id: 'test-role-id',
  user_id: 'test-user-id',
  role: 'customer',
  created_at: new Date().toISOString(),
  ...overrides,
});