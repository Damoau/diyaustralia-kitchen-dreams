import { supabase } from '@/integrations/supabase/client';

export const inviteAdminUser = async (email: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`https://nqxsfmnvdfdfvndrodvs.supabase.co/functions/v1/admin-invite-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ 
        email, 
        role: 'admin' 
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send invitation');
    }

    return result;
  } catch (error) {
    console.error('Error inviting admin user:', error);
    throw error;
  }
};