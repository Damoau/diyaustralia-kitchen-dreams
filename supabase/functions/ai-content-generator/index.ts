import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ebf0769f-8814-47f0-bfb6-515c0f9cba2c.lovableproject.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cabinetName, category, subcategory, description } = await req.json();

    const prompt = `Generate SEO and marketing content for a kitchen cabinet product with these details:
    
Name: ${cabinetName}
Category: ${category || 'N/A'}
Subcategory: ${subcategory || 'N/A'}
Description: ${description || 'N/A'}

MANDATORY CONTENT REQUIREMENTS:

SHORT DESCRIPTION RULES:
- Must include the cabinet name
- Must include "Custom Australian kitchens at amazing prices"
- Keep to 1-2 sentences for product listings

LONG DESCRIPTION RULES:
- Must include "The carcasses are HMR Australian made"
- Must list available door options: Shaker, Flat Panel, Raised Panel, Glass Front, and other popular styles
- Must mention "All hinges and drawer runners are soft close and come with a 20-year warranty"
- Must state "All cabinets come with a 15-year warranty"
- Must include "Feet included and adjustable from 100mm to 190mm. Most people set their kicks at 150mm"
- Must mention "Kitchens can be delivered as flat pack or assembled in selected areas"
- If category is "base" or contains "base": Must state "Height excludes the kick"
- If category is "pantry" or contains "pantry": Must state "Pantry height excludes the kick"

Please generate:
1. Meta Title (under 60 characters, include product name and "DIY Kitchens")
2. Meta Description (150-160 characters, SEO optimized with call to action)
3. Meta Keywords (comma-separated, focus on kitchen cabinets, flat pack, DIY, Australia)
4. URL Slug (lowercase, hyphen-separated, SEO friendly)
5. Short Description (following SHORT DESCRIPTION RULES above)
6. Long Description (3-4 paragraphs following LONG DESCRIPTION RULES above)

Format response as JSON with keys: meta_title, meta_description, meta_keywords, url_slug, short_description, long_description`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert SEO copywriter specializing in Australian kitchen cabinets and flat-pack furniture. Always respond with valid JSON only.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      throw new Error('Failed to generate content');
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    // Parse the JSON response
    let contentData;
    try {
      // Remove markdown code blocks if present
      let cleanContent = generatedContent.trim();
      
      // Handle different markdown formats
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*\n?/, '').replace(/\n?\s*```\s*$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*\n?/, '').replace(/\n?\s*```\s*$/, '');
      }
      
      // Additional cleanup for any remaining formatting
      cleanContent = cleanContent.trim();
      
      console.log('Cleaned content for parsing:', cleanContent);
      contentData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response. Original:', generatedContent);
      console.error('Parse error:', parseError);
      throw new Error(`Invalid AI response format: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }

    return new Response(JSON.stringify(contentData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-content-generator function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});