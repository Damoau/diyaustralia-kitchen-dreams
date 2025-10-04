import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ebf0769f-8814-47f0-bfb6-515c0f9cba2c.lovableproject.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { cabinet_type_id, cabinet_name } = await req.json();

    if (!cabinet_type_id) {
      return new Response(
        JSON.stringify({ error: 'cabinet_type_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Setting up default product options for cabinet: ${cabinet_name} (${cabinet_type_id})`);

    // Check if options already exist
    const { data: existingOptions } = await supabaseClient
      .from('cabinet_product_options')
      .select('id')
      .eq('cabinet_type_id', cabinet_type_id);

    if (existingOptions && existingOptions.length > 0) {
      return new Response(
        JSON.stringify({ message: 'Product options already exist for this cabinet type' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine hinge options based on cabinet name/type
    let hingeOptions: { value: string; display_text: string; display_order: number }[] = [];

    if (cabinet_name.toLowerCase().includes('door')) {
      const doorCount = extractDoorCount(cabinet_name);
      
      if (doorCount === 1) {
        hingeOptions = [
          { value: 'left_handed', display_text: 'Left-handed', display_order: 0 },
          { value: 'right_handed', display_text: 'Right-handed', display_order: 1 }
        ];
      } else if (doorCount === 2) {
        hingeOptions = [
          { value: 'left_right', display_text: 'Left-Right', display_order: 0 },
          { value: 'right_left', display_text: 'Right-Left', display_order: 1 }
        ];
      } else if (doorCount >= 3) {
        hingeOptions = [
          { value: 'left_left_right', display_text: 'Left-Left-Right', display_order: 0 },
          { value: 'right_right_left', display_text: 'Right-Right-Left', display_order: 1 },
          { value: 'left_right_left', display_text: 'Left-Right-Left', display_order: 2 },
          { value: 'right_left_right', display_text: 'Right-Left-Right', display_order: 3 }
        ];
      }
    }

    // Create hinge configuration option if we have door(s)
    if (hingeOptions.length > 0) {
      const { data: optionData, error: optionError } = await supabaseClient
        .from('cabinet_product_options')
        .insert({
          cabinet_type_id,
          option_name: 'Hinge Configuration',
          option_type: 'select',
          display_order: 0,
          required: true,
          description: 'Select the hinge configuration for the doors',
          active: true
        })
        .select('id')
        .single();

      if (optionError) throw optionError;

      // Add the option values
      const valuesToInsert = hingeOptions.map(option => ({
        cabinet_option_id: optionData.id,
        ...option,
        active: true
      }));

      const { error: valuesError } = await supabaseClient
        .from('cabinet_option_values')
        .insert(valuesToInsert);

      if (valuesError) throw valuesError;

      console.log(`Created hinge configuration option with ${hingeOptions.length} values`);
    }

    // Add appliance integration option if it's a kitchen cabinet
    if (cabinet_name.toLowerCase().includes('kitchen') || cabinet_name.toLowerCase().includes('appliance')) {
      const { data: applianceOption, error: applianceError } = await supabaseClient
        .from('cabinet_product_options')
        .insert({
          cabinet_type_id,
          option_name: 'Appliance Integration',
          option_type: 'select',
          display_order: 1,
          required: false,
          description: 'Select appliance integration requirements',
          active: true
        })
        .select('id')
        .single();

      if (applianceError) throw applianceError;

      const applianceValues = [
        { value: 'none', display_text: 'No Appliance', display_order: 0 },
        { value: 'dishwasher', display_text: 'Dishwasher Ready', display_order: 1 },
        { value: 'oven', display_text: 'Oven Integration', display_order: 2 },
        { value: 'microwave', display_text: 'Microwave Mounting', display_order: 3 }
      ];

      const applianceValuesToInsert = applianceValues.map(value => ({
        cabinet_option_id: applianceOption.id,
        ...value,
        active: true
      }));

      const { error: applianceValuesError } = await supabaseClient
        .from('cabinet_option_values')
        .insert(applianceValuesToInsert);

      if (applianceValuesError) throw applianceValuesError;

      console.log('Created appliance integration option');
    }

    return new Response(
      JSON.stringify({ 
        message: 'Default product options created successfully',
        cabinet_type_id,
        options_created: hingeOptions.length > 0 ? 'hinge_configuration' : 'none'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error setting up default product options:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractDoorCount(cabinetName: string): number {
  const match1 = cabinetName.match(/(\d+)\s*door/i);
  if (match1) return parseInt(match1[1]);
  
  const match2 = cabinetName.match(/(\d+)door/i);
  if (match2) return parseInt(match2[1]);
  
  // Default fallback
  if (cabinetName.toLowerCase().includes('door')) return 1;
  return 0;
}