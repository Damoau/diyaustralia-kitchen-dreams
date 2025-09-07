import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    const { type, content, question, files } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'security_analysis':
        systemPrompt = `You are a senior security engineer specializing in React, TypeScript, and Supabase applications. 
        Analyze the provided code for security vulnerabilities including:
        - SQL injection risks
        - Authentication/authorization issues
        - Data exposure vulnerabilities
        - Input validation problems
        - XSS vulnerabilities
        - Insecure API endpoints
        - Row Level Security (RLS) policy issues
        
        Provide specific recommendations with code examples where possible.
        Format your response with clear sections: CRITICAL, HIGH, MEDIUM, and LOW severity issues.`;
        userPrompt = `Please analyze this code for security issues:\n\n${content}`;
        break;
        
      case 'code_quality':
        systemPrompt = `You are a senior software engineer specializing in React, TypeScript, and modern web development.
        Analyze the provided code for:
        - Code structure and organization
        - Performance optimizations
        - Best practices adherence
        - Maintainability issues
        - Potential bugs
        - TypeScript type safety
        - React patterns and anti-patterns
        
        Provide actionable recommendations with code examples.`;
        userPrompt = `Please analyze this code for quality improvements:\n\n${content}`;
        break;
        
      case 'database_analysis':
        systemPrompt = `You are a database security expert specializing in PostgreSQL and Supabase.
        Analyze the provided database schema/queries for:
        - Row Level Security (RLS) policy effectiveness
        - Data access patterns
        - Index optimization opportunities
        - Query performance issues
        - Data integrity constraints
        - Security vulnerabilities
        
        Provide specific SQL recommendations.`;
        userPrompt = `Please analyze this database code:\n\n${content}`;
        break;
        
      case 'chat':
        systemPrompt = `You are an AI assistant helping with a React/TypeScript/Supabase cabinet pricing application. 
        You have deep knowledge of web security, code quality, and best practices.
        Answer questions about the codebase and provide specific, actionable advice.
        
        The application includes:
        - Cabinet pricing and configuration
        - Supabase authentication and database
        - Shopping cart functionality  
        - Admin panels for managing products
        - Complex pricing calculations`;
        userPrompt = question || 'How can I help you with your code?';
        if (files && files.length > 0) {
          userPrompt += `\n\nRelevant files:\n${files.map((f: any) => `${f.path}:\n${f.content}`).join('\n\n')}`;
        }
        break;
        
      default:
        throw new Error('Invalid analysis type');
    }

    console.log('Sending request to OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');
    
    const analysis = data.choices[0].message.content;

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in ai-code-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to analyze code. Check if OpenAI API key is configured.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});