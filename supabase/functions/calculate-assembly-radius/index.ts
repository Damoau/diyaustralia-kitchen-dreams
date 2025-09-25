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

interface PostcodeZone {
  postcode: string;
  latitude?: number;
  longitude?: number;
  assembly_eligible?: boolean;
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

    const { center, apply_changes = false }: { 
      center: AssemblyCenter, 
      apply_changes?: boolean 
    } = await req.json()

    if (!center || !center.latitude || !center.longitude || !center.radius_km) {
      return new Response(
        JSON.stringify({ error: 'Assembly center with coordinates and radius required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get all postcode zones
    const { data: postcodes, error: fetchError } = await supabaseClient
      .from('postcode_zones')
      .select('*')

    if (fetchError) {
      console.error('Error fetching postcodes:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch postcode data' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // For postcodes that don't have coordinates, we'll need to geocode them
    const MAPBOX_TOKEN = Deno.env.get('MAPBOX_PUBLIC_TOKEN')
    const postcodesNeedingGeocode = postcodes.filter(pc => !pc.latitude || !pc.longitude)
    
    let geocodedPostcodes: any[] = []
    
    if (postcodesNeedingGeocode.length > 0 && MAPBOX_TOKEN) {
      console.log(`Geocoding ${postcodesNeedingGeocode.length} postcodes...`)
      
      // Batch geocode missing coordinates (limit to prevent timeout)
      const batchSize = 20
      for (let i = 0; i < Math.min(postcodesNeedingGeocode.length, batchSize); i++) {
        const pc = postcodesNeedingGeocode[i]
        try {
          const query = encodeURIComponent(`${pc.postcode}, ${pc.state}, Australia`)
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&country=AU&limit=1`
          )
          
          const data = await response.json()
          
          if (data.features && data.features.length > 0) {
            const [longitude, latitude] = data.features[0].center
            geocodedPostcodes.push({
              ...pc,
              latitude,
              longitude
            })
          }
        } catch (error) {
          console.error(`Failed to geocode ${pc.postcode}:`, error)
        }
      }

      // Update database with new coordinates (if applying changes)
      if (apply_changes && geocodedPostcodes.length > 0) {
        for (const pc of geocodedPostcodes) {
          await supabaseClient
            .from('postcode_zones')
            .update({ 
              latitude: pc.latitude, 
              longitude: pc.longitude 
            })
            .eq('id', pc.id)
        }
      }
    }

    // Combine original postcodes with geocoded ones
    const allPostcodes = postcodes.map(pc => {
      const geocoded = geocodedPostcodes.find(g => g.id === pc.id)
      return geocoded || pc
    })

    // Calculate distances and determine assembly eligibility
    const results = allPostcodes.map((pc) => {
      if (!pc.latitude || !pc.longitude) {
        return {
          postcode: pc.postcode,
          state: pc.state,
          suburb: pc.suburb,
          distance_km: null,
          within_radius: false,
          coordinates_available: false
        }
      }

      const distance = calculateDistance(
        center.latitude,
        center.longitude,
        pc.latitude,
        pc.longitude
      )

      const withinRadius = distance <= center.radius_km

      return {
        postcode: pc.postcode,
        state: pc.state,
        suburb: pc.suburb,
        latitude: pc.latitude,
        longitude: pc.longitude,
        distance_km: Math.round(distance * 10) / 10,
        within_radius: withinRadius,
        coordinates_available: true,
        current_assembly_eligible: pc.assembly_eligible
      }
    })

    // Apply assembly eligibility changes if requested
    if (apply_changes) {
      const eligibilityUpdates = results
        .filter(r => r.coordinates_available && r.within_radius !== r.current_assembly_eligible)
        .map(r => ({ postcode: r.postcode, assembly_eligible: r.within_radius }))

      if (eligibilityUpdates.length > 0) {
        console.log(`Updating assembly eligibility for ${eligibilityUpdates.length} postcodes`)
        
        for (const update of eligibilityUpdates) {
          await supabaseClient
            .from('postcode_zones')
            .update({ assembly_eligible: update.assembly_eligible })
            .eq('postcode', update.postcode)
        }
      }
    }

    // Generate summary statistics
    const stats = {
      total_postcodes: results.length,
      within_radius: results.filter(r => r.within_radius).length,
      outside_radius: results.filter(r => r.coordinates_available && !r.within_radius).length,
      missing_coordinates: results.filter(r => !r.coordinates_available).length,
      coverage_percentage: results.length > 0 
        ? Math.round((results.filter(r => r.within_radius).length / results.length) * 100)
        : 0,
      geocoded_count: geocodedPostcodes.length
    }

    return new Response(
      JSON.stringify({
        results: results.sort((a, b) => (a.distance_km || 999999) - (b.distance_km || 999999)),
        stats,
        center,
        applied_changes: apply_changes
      }),
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
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})