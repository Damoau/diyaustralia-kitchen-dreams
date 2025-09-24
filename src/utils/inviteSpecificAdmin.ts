// Temporary utility to invite the specific admin user
// This should be run once to invite ibilashhalder@gmail.com

import { supabase } from '@/integrations/supabase/client';

export const inviteSpecificAdmin = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-invite-user', {
      body: { 
        email: 'ibilashhalder@gmail.com',
        role: 'admin' 
      }
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error inviting admin:', error);
    throw error;
  }
};

// Auto-run the invitation when this module is imported
// This is just for the one-time setup
if (typeof window !== 'undefined') {
  // Run after a short delay to ensure auth is ready
  setTimeout(async () => {
    try {
      const result = await inviteSpecificAdmin();
      console.log('Admin invitation sent:', result);
    } catch (error) {
      console.error('Failed to send admin invitation:', error);
    }
  }, 2000);
}