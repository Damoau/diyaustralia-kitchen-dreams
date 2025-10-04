/**
 * Code Analysis Helper
 * Utilities for preparing code analysis requests
 */

import { FileInfo } from './fileScanner';

export interface AnalysisRequest {
  type: 'security_analysis' | 'code_quality' | 'database_analysis';
  files: Array<{
    path: string;
    content: string;
  }>;
  context?: string;
}

export const PROJECT_CONTEXT = `
This is a React/TypeScript cabinet pricing e-commerce application with the following stack:
- Frontend: React 18, TypeScript, Tailwind CSS, Vite
- Backend: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- Payment: Stripe, PayPal
- Key Features:
  - Complex cabinet configuration system
  - Shopping cart with multi-cart support
  - Quote management and approval workflow
  - Admin panels for managing products, orders, users
  - Customer portal for order tracking
  - Production management system
  - Shipping calculator with zone-based pricing

Security Considerations:
- Must comply with PCI DSS SAQ-A (card data handling)
- Must comply with Australian Privacy Principles (APP)
- Handles sensitive customer data (addresses, payment info)
- Multi-role system (admin, customer, production, etc.)
- Row Level Security (RLS) policies in Supabase
`;

export const createSecurityAnalysisPrompt = (files: FileInfo[]): string => {
  const fileList = files.map(f => `- ${f.path} (${f.category})`).join('\n');
  
  return `
Analyzing ${files.length} security-critical files in a production cabinet pricing application.

FILES TO ANALYZE:
${fileList}

FOCUS AREAS:
1. Authentication & Authorization
   - Proper JWT handling
   - Role-based access control
   - Session management
   - Password/secret handling

2. Data Security
   - SQL injection prevention
   - XSS vulnerabilities
   - CSRF protection
   - Sensitive data exposure

3. API Security
   - Input validation
   - Rate limiting
   - Error handling (no sensitive info leaks)
   - Proper CORS configuration

4. Payment Security (PCI DSS)
   - No card data storage
   - Secure payment flow
   - Transaction logging

5. Supabase RLS Policies
   - Proper row-level security
   - Policy completeness
   - Permission escalation risks

PROJECT CONTEXT:
${PROJECT_CONTEXT}

Provide a detailed security analysis with:
- CRITICAL issues (immediate action required)
- HIGH severity issues (address soon)
- MEDIUM severity issues (plan to fix)
- LOW severity issues (nice to improve)

For each issue, provide:
1. Location (file and line if possible)
2. Description of the vulnerability
3. Potential impact
4. Recommended fix with code example
`;
};

export const createCodeQualityPrompt = (files: FileInfo[]): string => {
  const fileList = files.map(f => `- ${f.path} (${f.category})`).join('\n');
  
  return `
Analyzing ${files.length} files for code quality in a production React/TypeScript application.

FILES TO ANALYZE:
${fileList}

FOCUS AREAS:
1. React Best Practices
   - Proper hook usage
   - Component structure and composition
   - Props validation
   - Performance optimizations (useMemo, useCallback)
   - Error boundaries

2. TypeScript Quality
   - Type safety (avoid 'any')
   - Interface definitions
   - Proper generics usage
   - Null/undefined handling

3. Code Organization
   - Single Responsibility Principle
   - DRY (Don't Repeat Yourself)
   - Proper file structure
   - Import organization

4. Performance
   - Unnecessary re-renders
   - Large bundle sizes
   - Inefficient algorithms
   - Memory leaks

5. Maintainability
   - Code readability
   - Documentation
   - Naming conventions
   - Error handling

PROJECT CONTEXT:
${PROJECT_CONTEXT}

Provide actionable recommendations with:
- Code examples for improvements
- Priority level (High/Medium/Low)
- Expected impact on performance/maintainability
`;
};

export const createDatabaseAnalysisPrompt = (content: string): string => {
  return `
Analyzing database schema and queries for security and performance.

FOCUS AREAS:
1. Row Level Security (RLS)
   - Missing RLS policies
   - Overly permissive policies
   - Policy performance

2. Data Access Patterns
   - Efficient queries
   - Proper indexes
   - N+1 query problems

3. Data Integrity
   - Foreign key constraints
   - Check constraints
   - Unique constraints

4. Security
   - Sensitive data handling
   - Audit logging
   - Data retention policies

5. Performance
   - Query optimization
   - Index coverage
   - Partitioning needs

PROJECT CONTEXT:
${PROJECT_CONTEXT}

DATABASE SCHEMA AND QUERIES:
${content}

Provide specific SQL recommendations with:
- Security issues and fixes
- Performance improvements
- Missing indexes
- RLS policy recommendations
`;
};

export const formatAnalysisResults = (analysis: string): string => {
  // Add syntax highlighting markers for better display
  return analysis
    .replace(/```typescript/g, '```typescript')
    .replace(/```sql/g, '```sql')
    .replace(/```javascript/g, '```javascript');
};
