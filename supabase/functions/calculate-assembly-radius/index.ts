import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AssemblyCenter {
  latitude: number;
  longitude: number;
  radius_km: number;
}

interface RadiusRequest {
  center: AssemblyCenter;
  apply_changes: boolean;
  surcharge_settings?: {
    carcass_surcharge_pct: number;
    doors_surcharge_pct: number;
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { center, apply_changes, surcharge_settings, zone_id }: RadiusRequest & { zone_id?: string } = await req.json()

    if (!center || !center.latitude || !center.longitude || !center.radius_km) {
      return new Response(
        JSON.stringify({ error: 'Valid assembly center coordinates and radius required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get all postcode zones with their coordinates
    const { data: postcodeZones, error: fetchError } = await supabaseClient
      .from('postcode_zones')
      .select('*')

    if (fetchError) {
      throw fetchError
    }

    console.log(`Processing ${postcodeZones?.length || 0} postcodes for radius ${center.radius_km}km`)

    const results = []
    let withinRadiusCount = 0
    let outsideRadiusCount = 0
    
    // Default surcharge settings if not provided (percentage only)
    const defaultSurcharge = surcharge_settings || {
      carcass_surcharge_pct: 0,
      doors_surcharge_pct: 0
    }

    for (const zone of postcodeZones || []) {
      // For now, use mock coordinates based on postcode patterns
      // In production, you would geocode these or have them stored in the database
      let latitude = -37.8136 // Default Melbourne coordinates
      let longitude = 144.9631
      
      // Simple coordinate mapping based on state and postcode patterns
      if (zone.state === 'NSW') {
        latitude = -33.8688 + (Math.random() - 0.5) * 2 // Sydney area
        longitude = 151.2093 + (Math.random() - 0.5) * 2
      } else if (zone.state === 'QLD') {
        latitude = -27.4698 + (Math.random() - 0.5) * 2 // Brisbane area
        longitude = 153.0251 + (Math.random() - 0.5) * 2
      } else if (zone.state === 'SA') {
        latitude = -34.9285 + (Math.random() - 0.5) * 2 // Adelaide area
        longitude = 138.6007 + (Math.random() - 0.5) * 2
      } else if (zone.state === 'WA') {
        latitude = -31.9505 + (Math.random() - 0.5) * 4 // Perth area
        longitude = 115.8605 + (Math.random() - 0.5) * 4
      } else if (zone.state === 'VIC') {
        latitude = -37.8136 + (Math.random() - 0.5) * 3 // Melbourne area
        longitude = 144.9631 + (Math.random() - 0.5) * 3
      }

      const distance = calculateDistance(
        center.latitude,
        center.longitude,
        latitude,
        longitude
      )

      const withinRadius = distance <= center.radius_km
      if (withinRadius) {
        withinRadiusCount++
      } else {
        outsideRadiusCount++
      }

      results.push({
        id: zone.id,
        postcode: zone.postcode,
        suburb: zone.suburb || 'Unknown',
        state: zone.state,
        latitude,
        longitude,
        distance_km: Math.round(distance * 10) / 10,
        within_radius: withinRadius,
        current_assembly_eligible: zone.assembly_eligible,
        current_carcass_surcharge_pct: zone.assembly_carcass_surcharge_pct || 0,
        current_doors_surcharge_pct: zone.assembly_doors_surcharge_pct || 0,
      })

      // If applying changes, update the postcode zone with assignment tracking
      if (apply_changes && surcharge_settings) {
        const updates: any = {
          assembly_eligible: withinRadius
        }

        // Only update assembly surcharge percentages if setting assembly to eligible
        if (withinRadius) {
          updates.assembly_carcass_surcharge_pct = defaultSurcharge.carcass_surcharge_pct
          updates.assembly_doors_surcharge_pct = defaultSurcharge.doors_surcharge_pct
          updates.assignment_method = 'radius'
          updates.assigned_from_zone_id = center.zone_id || null
        } else {
          // Clear surcharges for postcodes outside radius
          updates.assembly_carcass_surcharge_pct = 0
          updates.assembly_doors_surcharge_pct = 0
        }

        // Don't override manual settings
        const { error: updateError } = await supabaseClient
          .from('postcode_zones')
          .update(updates)
          .eq('id', zone.id)
          .neq('assignment_method', 'manual')

        if (updateError) {
          console.error(`Error updating postcode ${zone.postcode}:`, updateError)
        }
      }
    }

    const response = {
      success: true,
      results: results.sort((a, b) => a.distance_km - b.distance_km),
      stats: {
        total_postcodes: results.length,
        within_radius: withinRadiusCount,
        outside_radius: outsideRadiusCount,
        center_coordinates: `${center.latitude}, ${center.longitude}`,
        radius_km: center.radius_km
      },
      surcharge_settings: defaultSurcharge,
      changes_applied: apply_changes
    }

    console.log(`Radius calculation complete: ${withinRadiusCount} postcodes within ${center.radius_km}km`)

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Assembly radius calculation error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})