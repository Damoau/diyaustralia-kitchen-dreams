// Security Headers Configuration
// Implement these headers in your deployment platform (Vercel, Netlify, etc.)

export const securityHeaders = {
  // Content Security Policy - Prevents XSS attacks
  // Now with report-uri for monitoring violations
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paypal.com https://www.paypal.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' blob:",
    "connect-src 'self' https://nqxsfmnvdfdfvndrodvs.supabase.co https://api.paypal.com https://api-m.paypal.com https://api-m.sandbox.paypal.com",
    "frame-src 'self' https://js.paypal.com https://www.paypal.com https://www.sandbox.paypal.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://www.paypal.com https://www.sandbox.paypal.com",
    "frame-ancestors 'none'",
    "report-uri https://nqxsfmnvdfdfvndrodvs.supabase.co/functions/v1/csp-report"
  ].join('; '),

  // Strict Transport Security - Forces HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // XSS Protection (legacy but still useful)
  'X-XSS-Protection': '1; mode=block',

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Referrer Policy - Controls referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions Policy - Controls browser features
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'payment=(self)',
    'usb=()'
  ].join(', '),

  // Cross-Origin policies for additional security
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-site',

  // Remove server information
  'Server': '',
  'X-Powered-By': '',
};

// Vercel configuration (vercel.json)
export const vercelConfig = {
  headers: [
    {
      source: '/(.*)',
      headers: Object.entries(securityHeaders).map(([key, value]) => ({
        key,
        value
      }))
    }
  ]
};

// Netlify configuration (_headers file)
export const netlifyHeaders = `
/*
${Object.entries(securityHeaders)
  .map(([key, value]) => `  ${key}: ${value}`)
  .join('\n')}
`;

// Implementation instructions
export const implementationNotes = {
  vercel: 'Add the vercelConfig to your vercel.json file',
  netlify: 'Create a _headers file in your public directory with netlifyHeaders content',
  supabase: 'These headers are automatically configured for edge functions',
  custom: 'Configure these headers in your web server or CDN settings'
};