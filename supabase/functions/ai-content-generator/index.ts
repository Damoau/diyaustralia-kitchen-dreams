import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, category, subcategory, cabinet_style, dimensions } = await req.json();

    const prompt = `Generate SEO and marketing content for a kitchen cabinet product with these details:
    
Name: ${name}
Category: ${category}
Subcategory: ${subcategory || 'N/A'}
Style: ${cabinet_style || 'standard'}
Dimensions: ${dimensions.width}mm W x ${dimensions.height}mm H x ${dimensions.depth}mm D

Please generate:
1. Meta Title (under 60 characters, include product name and "DIY Australia")
2. Meta Description (150-160 characters, SEO optimized with call to action)
3. Meta Keywords (comma-separated, focus on kitchen cabinets, flat pack, DIY, Australia)
4. URL Slug (lowercase, hyphen-separated, SEO friendly)
5. Short Description (1-2 sentences for product listings)
6. Long Description (3-4 paragraphs, detailed product description mentioning Australian-made, flat-pack, quality materials, Blum/Titus hardware, fast delivery)

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
      contentData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', generatedContent);
      throw new Error('Invalid AI response format');
    }

    return new Response(JSON.stringify(contentData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-content-generator function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});