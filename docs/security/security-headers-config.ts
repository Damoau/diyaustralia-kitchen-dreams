// Security Headers Configuration
// Implementation for various web servers and frameworks

export const securityHeaders = {
  // Content Security Policy - Strict policy for XSS protection
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://js.paypal.com https://www.paypal.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://nqxsfmnvdfdfvndrodvs.supabase.co https://api.paypal.com https://www.paypal.com wss://realtime-pooler.supabase.com",
    "frame-src 'self' https://js.paypal.com https://www.paypal.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://www.paypal.com",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; '),

  // HTTP Strict Transport Security - Force HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // XSS Protection
  'X-XSS-Protection': '1; mode=block',

  // Clickjacking protection
  'X-Frame-Options': 'DENY',

  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions Policy (formerly Feature Policy)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=(self "https://www.paypal.com")',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', '),

  // Cross-Origin policies
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',

  // Server identification obfuscation
  'Server': 'DIY-Australia-Secure',
  'X-Powered-By': '', // Remove default server headers
};

// Vite Plugin Implementation
export const viteSecurityHeadersPlugin = () => ({
  name: 'security-headers',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      Object.entries(securityHeaders).forEach(([key, value]) => {
        if (value) res.setHeader(key, value);
      });
      next();
    });
  },
});

// Netlify _headers file format
export const netlifyHeaders = `/*
${Object.entries(securityHeaders)
  .filter(([_, value]) => value)
  .map(([key, value]) => `  ${key}: ${value}`)
  .join('\n')}
`;

// Vercel vercel.json headers configuration
export const vercelHeaders = {
  headers: [
    {
      source: '/(.*)',
      headers: Object.entries(securityHeaders)
        .filter(([_, value]) => value)
        .map(([key, value]) => ({ key, value }))
    }
  ]
};

// Apache .htaccess format
export const apacheHeaders = `
<IfModule mod_headers.c>
${Object.entries(securityHeaders)
  .filter(([_, value]) => value)
  .map(([key, value]) => `    Header always set "${key}" "${value}"`)
  .join('\n')}
    Header always unset "X-Powered-By"
    Header always unset "Server"
</IfModule>
`;

// Nginx configuration
export const nginxHeaders = Object.entries(securityHeaders)
  .filter(([_, value]) => value)
  .map(([key, value]) => `add_header ${key} "${value}" always;`)
  .join('\n');

// Implementation checklist
export const implementationNotes = {
  vite: 'Add viteSecurityHeadersPlugin to vite.config.ts plugins array',
  netlify: 'Create public/_headers file with netlifyHeaders content',
  vercel: 'Add vercelHeaders to vercel.json configuration',
  apache: 'Add apacheHeaders to .htaccess file',
  nginx: 'Add nginxHeaders to server block in nginx.conf',
  testing: 'Use https://securityheaders.com/ to validate implementation'
};