import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ebf0769f-8814-47f0-bfb6-515c0f9cba2c.lovableproject.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeocodeRequest {
  address?: string;
  postcode?: string;
  postcodes?: string[];
}

interface GeocodeResponse {
  latitude: number;
  longitude: number;
  address?: string;
  postcode?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const MAPBOX_TOKEN = Deno.env.get('MAPBOX_PUBLIC_TOKEN')
    
    if (!MAPBOX_TOKEN) {
      return new Response(
        JSON.stringify({ 
          error: 'Mapbox token not configured. Please add MAPBOX_PUBLIC_TOKEN to Supabase Edge Function Secrets.' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const body: GeocodeRequest = await req.json()

    if (body.postcodes) {
      // Batch geocoding for multiple postcodes
      const results = await Promise.all(
        body.postcodes.map(async (postcode) => {
          try {
            const query = encodeURIComponent(`${postcode}, Australia`)
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&country=AU&limit=1`
            )
            
            const data = await response.json()
            
            if (data.features && data.features.length > 0) {
              const [longitude, latitude] = data.features[0].center
              return {
                postcode,
                latitude,
                longitude,
                address: data.features[0].place_name
              }
            } else {
              return {
                postcode,
                latitude: null,
                longitude: null,
                error: 'Not found'
              }
            }
          } catch (error) {
            return {
              postcode,
              latitude: null,
              longitude: null,
              error: error instanceof Error ? error.message : String(error)
            }
          }
        })
      )

      return new Response(
        JSON.stringify({ results }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } else {
      // Single address/postcode geocoding
      const { address, postcode } = body
      
      if (!address && !postcode) {
        return new Response(
          JSON.stringify({ error: 'Address or postcode required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const query = encodeURIComponent(
        address ? `${address}, ${postcode || ''}, Australia` : `${postcode}, Australia`
      )
      
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&country=AU&limit=1`
      )

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: 'Geocoding service unavailable' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center
        const result: GeocodeResponse = {
          latitude,
          longitude,
          address: data.features[0].place_name,
          postcode: postcode
        }

        return new Response(
          JSON.stringify(result),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } else {
        return new Response(
          JSON.stringify({ error: 'Address not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    
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