import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://ebf0769f-8814-47f0-bfb6-515c0f9cba2c.lovableproject.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if the requesting user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Verify admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      throw new Error('Admin access required');
    }

    // Get all users from auth.users (using service role key)
    const { data: authUsers, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    console.log('Total auth users found:', authUsers.users.length);
    console.log('Auth users emails:', authUsers.users.map(u => u.email));
    console.log('Looking for info@diyaustralia.com:', authUsers.users.find(u => u.email === 'info@diyaustralia.com'));
    
    // Check if there are any users with deleted_at set
    console.log('Users with deleted_at:', authUsers.users.filter(u => (u as any).deleted_at));
    console.log('User creation methods:', authUsers.users.map(u => ({ email: u.email, app_metadata: u.app_metadata })));

    // Get all user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (rolesError) {
      throw new Error(`Failed to fetch user roles: ${rolesError.message}`);
    }

    // Combine user data with roles
    const usersWithRoles = authUsers.users.map(authUser => {
      const userRoleRecords = userRoles?.filter(role => role.user_id === authUser.id) || [];
      
      return {
        id: authUser.id,
        email: authUser.email || 'No email',
        email_confirmed_at: authUser.email_confirmed_at,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        roles: userRoleRecords.map(role => ({
          id: role.id,
          user_id: role.user_id,
          role: role.role,
          created_at: role.created_at
        }))
      };
    });

    return new Response(
      JSON.stringify({
        users: usersWithRoles,
        total: usersWithRoles.length
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in admin-get-users function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
});