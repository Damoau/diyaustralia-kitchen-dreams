/**
 * File Scanner Utility
 * Scans project structure and categorizes files for AI analysis
 */

export interface FileInfo {
  path: string;
  name: string;
  category: string;
  type: 'component' | 'page' | 'hook' | 'lib' | 'util' | 'edge-function' | 'types' | 'other';
  securityCritical: boolean;
}

const SECURITY_CRITICAL_PATTERNS = [
  /auth/i,
  /secure/i,
  /password/i,
  /token/i,
  /api/i,
  /payment/i,
  /invoice/i,
  /admin/i,
  /rls/i,
  /policy/i
];

const FILE_CATEGORIES = {
  components: {
    pattern: /^src\/components\/.*\.tsx?$/,
    type: 'component' as const,
    category: 'Components'
  },
  pages: {
    pattern: /^src\/pages\/.*\.tsx?$/,
    type: 'page' as const,
    category: 'Pages'
  },
  hooks: {
    pattern: /^src\/hooks\/.*\.ts$/,
    type: 'hook' as const,
    category: 'Hooks'
  },
  lib: {
    pattern: /^src\/lib\/.*\.ts$/,
    type: 'lib' as const,
    category: 'Libraries'
  },
  utils: {
    pattern: /^src\/utils\/.*\.ts$/,
    type: 'util' as const,
    category: 'Utilities'
  },
  edgeFunctions: {
    pattern: /^supabase\/functions\/.*\/index\.ts$/,
    type: 'edge-function' as const,
    category: 'Edge Functions'
  },
  types: {
    pattern: /^src\/integrations\/supabase\/types\.ts$/,
    type: 'types' as const,
    category: 'Type Definitions'
  }
};

export const categorizeFile = (filePath: string): FileInfo | null => {
  for (const [key, config] of Object.entries(FILE_CATEGORIES)) {
    if (config.pattern.test(filePath)) {
      const name = filePath.split('/').pop() || filePath;
      const securityCritical = SECURITY_CRITICAL_PATTERNS.some(pattern => 
        pattern.test(filePath) || pattern.test(name)
      );

      return {
        path: filePath,
        name,
        category: config.category,
        type: config.type,
        securityCritical
      };
    }
  }
  return null;
};

export const getSecurityCriticalFiles = (files: string[]): FileInfo[] => {
  return files
    .map(categorizeFile)
    .filter((file): file is FileInfo => 
      file !== null && file.securityCritical
    );
};

export const getFilesByCategory = (files: string[], category: string): FileInfo[] => {
  return files
    .map(categorizeFile)
    .filter((file): file is FileInfo => 
      file !== null && file.category === category
    );
};

export const getFilesByType = (files: string[], type: FileInfo['type']): FileInfo[] => {
  return files
    .map(categorizeFile)
    .filter((file): file is FileInfo => 
      file !== null && file.type === type
    );
};

// Predefined file lists for common scans
export const SECURITY_SCAN_FILES = [
  'src/hooks/useAuth.ts',
  'src/hooks/useSecureAuth.ts',
  'src/hooks/useAuditLog.ts',
  'src/components/admin/AdminProtectedRoute.tsx',
  'src/components/authentication/AuthGuard.tsx',
  'supabase/functions/admin-delete-user/index.ts',
  'supabase/functions/admin-get-users/index.ts',
  'supabase/functions/admin-invite-user/index.ts',
  'supabase/functions/create-stripe-checkout/index.ts',
  'supabase/functions/create-paypal-order/index.ts',
  'supabase/functions/capture-paypal-order/index.ts',
  'supabase/functions/verify-stripe-payment/index.ts'
];

export const CODE_QUALITY_SCAN_FILES = [
  'src/components/admin/AdminAnalytics.tsx',
  'src/components/admin/AdminOrders.tsx',
  'src/components/admin/QuoteEditor.tsx',
  'src/components/cart/OptimizedCartDrawer.tsx',
  'src/components/product/ProductConfigurator.tsx',
  'src/hooks/useCart.ts',
  'src/hooks/useOptimizedCart.ts',
  'src/hooks/usePricing.ts',
  'src/lib/pricingCalculator.ts',
  'src/lib/volumeCalculator.ts'
];

export const DATABASE_SCAN_FILES = [
  'src/integrations/supabase/types.ts',
  'supabase/functions/cart-cleanup/index.ts',
  'supabase/functions/cart-consolidation/index.ts',
  'supabase/functions/data-retention-job/index.ts'
];
