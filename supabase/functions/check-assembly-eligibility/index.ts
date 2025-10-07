import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PostcodeRequest {
  postcode: string;
}

interface AssemblyResponse {
  eligible: boolean;
  carcass_only_price?: number;
  with_doors_price?: number;
  lead_time_days?: number;
  includes?: string[];
  postcode: string;
  state?: string;
  zone?: string;
  metro?: boolean;
  assembly_center?: {
    name: string;
    distance_km: number;
  };
  surcharge_info?: {
    carcass_surcharge_pct: number;
    doors_surcharge_pct: number;
    reason: string;
  };
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { postcode }: PostcodeRequest = await req.json()

    if (!postcode || postcode.length !== 4) {
      return new Response(
        JSON.stringify({ 
          error: 'Valid 4-digit postcode required',
          eligible: false,
          postcode 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // First check if postcode exists in our zones table
    const { data: postcodeZone, error: postcodeError } = await supabaseClient
      .from('postcode_zones')
      .select('*')
      .eq('postcode', postcode)
      .maybeSingle()

    if (postcodeError && postcodeError.code !== 'PGRST116') {
      console.error('Error checking postcode zones:', postcodeError)
    }

  // If we have explicit data for this postcode, use it
  if (postcodeZone) {
    const response: AssemblyResponse = {
      eligible: postcodeZone.assembly_eligible || false,
      postcode: postcodeZone.postcode,
      state: postcodeZone.state,
      zone: postcodeZone.zone,
      metro: postcodeZone.metro,
      lead_time_days: postcodeZone.lead_time_days || 8
    }

    // Add assembly pricing if eligible
    if (response.eligible) {
      // Get base prices and surcharges from database
      const baseCarcassPrice = postcodeZone.assembly_base_carcass_price || 50.00;
      const baseDoorsPrice = postcodeZone.assembly_base_doors_price || 100.00;
      const carcassSurcharge = postcodeZone.assembly_carcass_surcharge_pct || 0;
      const doorsSurcharge = postcodeZone.assembly_doors_surcharge_pct || 0;
      
      // Calculate final prices with surcharges
      response.carcass_only_price = baseCarcassPrice * (1 + carcassSurcharge / 100);
      response.with_doors_price = baseDoorsPrice * (1 + doorsSurcharge / 100);
      
      response.includes = [
        'Professional installation',
        'Assembly of carcass components',
        'Drawer runner installation',
        'Quality inspection'
      ]
      
      // Add surcharge info to response if there are surcharges
      if (carcassSurcharge > 0 || doorsSurcharge > 0) {
        response.surcharge_info = {
          carcass_surcharge_pct: carcassSurcharge,
          doors_surcharge_pct: doorsSurcharge,
          reason: postcodeZone.remote ? 'Remote area surcharge' : 'Regional surcharge'
        };
      }
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

    // If no explicit postcode data, try to geocode and check against assembly centers
    const MAPBOX_TOKEN = Deno.env.get('MAPBOX_PUBLIC_TOKEN')
    
    if (MAPBOX_TOKEN) {
      try {
        // Geocode the postcode
        const query = encodeURIComponent(`${postcode}, Australia`)
        const geocodeResponse = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&country=AU&limit=1`
        )
        
        const geocodeData = await geocodeResponse.json()
        
        if (geocodeData.features && geocodeData.features.length > 0) {
          const [longitude, latitude] = geocodeData.features[0].center
          
          // Get assembly centers (for now, using hardcoded Melbourne center as example)
          const assemblyCenters = [
            {
              name: 'Melbourne Assembly Center',
              latitude: -37.8136,
              longitude: 144.9631,
              radius_km: 75,
              active: true
            }
            // In production, this would come from database
          ]

          // Check if postcode is within any assembly center radius
          let nearestCenter = null
          let minDistance = Infinity

          for (const center of assemblyCenters) {
            if (!center.active) continue
            
            const distance = calculateDistance(
              latitude, longitude, 
              center.latitude, center.longitude
            )
            
            if (distance <= center.radius_km && distance < minDistance) {
              minDistance = distance
              nearestCenter = {
                name: center.name,
                distance_km: Math.round(distance * 10) / 10
              }
            }
          }

          const response: AssemblyResponse = {
            eligible: nearestCenter !== null,
            postcode,
            lead_time_days: 8
          }

          if (nearestCenter) {
            response.assembly_center = nearestCenter
            response.carcass_only_price = 50.00
            response.with_doors_price = 100.00
            response.includes = [
              'Professional installation',
              'Assembly of carcass components', 
              'Drawer runner installation',
              'Quality inspection'
            ]
          }

          return new Response(
            JSON.stringify(response),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
      } catch (geocodeError) {
        console.error('Geocoding failed:', geocodeError)
      }
    }

    // Fallback to hardcoded known postcodes for backwards compatibility
    const knownPostcodes: Record<string, AssemblyResponse> = {
      '3000': {
        eligible: true,
        postcode: '3000',
        state: 'VIC',
        zone: 'MEL_METRO',
        metro: true,
        carcass_only_price: 50.00,
        with_doors_price: 100.00,
        lead_time_days: 8,
        includes: [
          'Professional installation',
          'Assembly of carcass components',
          'Drawer runner installation', 
          'Quality inspection'
        ]
      },
      '3001': {
        eligible: true,
        postcode: '3001',
        state: 'VIC',
        zone: 'MEL_METRO',
        metro: true,
        carcass_only_price: 50.00,
        with_doors_price: 100.00,
        lead_time_days: 8,
        includes: [
          'Professional installation',
          'Assembly of carcass components',
          'Drawer runner installation',
          'Quality inspection'
        ]
      },
      '4000': {
        eligible: true,
        postcode: '4000',
        state: 'QLD',
        zone: 'BNE_METRO',
        metro: true,
        carcass_only_price: 60.00,
        with_doors_price: 120.00,
        lead_time_days: 10,
        includes: [
          'Professional installation',
          'Assembly of carcass components',
          'Drawer runner installation',
          'Quality inspection'
        ]
      },
      '2000': {
        eligible: true,
        postcode: '2000', 
        state: 'NSW',
        zone: 'SYD_METRO',
        metro: true,
        carcass_only_price: 55.00,
        with_doors_price: 110.00,
        lead_time_days: 9,
        includes: [
          'Professional installation',
          'Assembly of carcass components',
          'Drawer runner installation',
          'Quality inspection'
        ]
      }
    }

    const result = knownPostcodes[postcode] || {
      eligible: false,
      postcode
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Assembly eligibility check error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        eligible: false,
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})