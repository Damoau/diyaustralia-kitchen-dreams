import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface AddressRequest {
  name: string;
  type: 'billing' | 'shipping' | 'both';
  line1: string;
  line2?: string;
  suburb: string;
  state: string;
  postcode: string;
  country?: string;
  phone?: string;
  is_default?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const addressId = pathSegments[pathSegments.length - 1];
    
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authorization');
    }

    if (req.method === 'GET') {
      // GET /api/portal/addresses
      const { data: addresses, error: addressesError } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (addressesError) {
        throw addressesError;
      }

      return new Response(JSON.stringify({ addresses }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      // POST /api/portal/addresses
      const addressData: AddressRequest = await req.json();

      // Validate required fields
      const requiredFields = ['name', 'type', 'line1', 'suburb', 'state', 'postcode'];
      for (const field of requiredFields) {
        if (!addressData[field as keyof AddressRequest]) {
          throw new Error(`${field} is required`);
        }
      }

      // If this is set as default, unset other defaults
      if (addressData.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data: address, error: addressError } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          name: addressData.name,
          type: addressData.type,
          line1: addressData.line1,
          line2: addressData.line2,
          suburb: addressData.suburb,
          state: addressData.state,
          postcode: addressData.postcode,
          country: addressData.country || 'Australia',
          phone: addressData.phone,
          is_default: addressData.is_default || false
        })
        .select()
        .single();

      if (addressError) {
        throw addressError;
      }

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_actor_id: user.id,
        p_scope: 'address',
        p_scope_id: address.id,
        p_action: 'created',
        p_after_data: JSON.stringify(addressData)
      });

      return new Response(JSON.stringify({ address }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'PATCH' && addressId && addressId !== 'addresses') {
      // PATCH /api/portal/addresses/{id}
      const updateData: Partial<AddressRequest> = await req.json();

      // Verify address ownership
      const { data: existingAddress, error: existingError } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', addressId)
        .eq('user_id', user.id)
        .single();

      if (existingError || !existingAddress) {
        throw new Error('Address not found or access denied');
      }

      // If setting as default, unset other defaults
      if (updateData.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', addressId);
      }

      const { data: address, error: updateError } = await supabase
        .from('addresses')
        .update(updateData)
        .eq('id', addressId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_actor_id: user.id,
        p_scope: 'address',
        p_scope_id: address.id,
        p_action: 'updated',
        p_before_data: JSON.stringify(existingAddress),
        p_after_data: JSON.stringify(updateData)
      });

      return new Response(JSON.stringify({ address }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'DELETE' && addressId && addressId !== 'addresses') {
      // DELETE /api/portal/addresses/{id}
      const { error: deleteError } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_actor_id: user.id,
        p_scope: 'address',
        p_scope_id: addressId,
        p_action: 'deleted'
      });

      return new Response(JSON.stringify({ message: 'Address deleted successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in portal-addresses:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});