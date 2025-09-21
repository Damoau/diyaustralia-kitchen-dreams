# Production Security Checklist

This checklist ensures all security configurations are properly set for production deployment.

## Critical Manual Configurations Required

### 1. Supabase Authentication Settings
**⚠️ REQUIRED BEFORE PRODUCTION**

1. **Enable Leaked Password Protection:**
   - Go to: https://supabase.com/dashboard/project/nqxsfmnvdfdfvndrodvs/auth/providers
   - Enable "Leaked password protection"
   - This prevents users from using passwords found in data breaches

2. **Update PostgreSQL Database:**
   - Go to: https://supabase.com/dashboard/project/nqxsfmnvdfdfvndrodvs/settings/infrastructure
   - Schedule PostgreSQL update during maintenance window
   - Current version has security updates available

3. **Configure Site URLs:**
   - Go to: https://supabase.com/dashboard/project/nqxsfmnvdfdfvndrodvs/auth/url-configuration
   - Set **Site URL** to your production domain (e.g., `https://yourdomain.com`)
   - Add redirect URLs for all environments:
     - Development: `https://nqxsfmnvdfdfvndrodvs.supabase.co`
     - Production: `https://yourdomain.com`

### 2. CORS Headers Update
**⚠️ UPDATE BEFORE PRODUCTION**

Update the following edge functions with your production domain:

```typescript
// Replace this in both files:
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // TODO: Replace with specific domain
  // Should become:
  "Access-Control-Allow-Origin": "https://yourdomain.com",
}
```

**Files to update:**
- `supabase/functions/create-paypal-order/index.ts` (line 6)
- `supabase/functions/capture-paypal-order/index.ts` (line 6)

### 3. Email Configuration
Update the notification service with your domain:
- File: `supabase/functions/send-notifications/index.ts` (line 89)
- Change: `from: 'Kitchen Cabinets <noreply@yourdomain.com>'`

## Security Status ✅

### Implemented Security Features
- ✅ **Row Level Security (RLS)** - All tables protected
- ✅ **Input Validation** - Comprehensive validation on all forms
- ✅ **Rate Limiting** - Protection against brute force attacks
- ✅ **Audit Logging** - Complete activity tracking
- ✅ **Security Headers** - Full OWASP recommended headers
- ✅ **HTTPS Enforcement** - Strict Transport Security enabled
- ✅ **XSS Protection** - Content Security Policy configured
- ✅ **CSRF Protection** - SameSite cookies and origin validation
- ✅ **SQL Injection Prevention** - Parameterized queries only
- ✅ **Error Handling** - No sensitive data exposure
- ✅ **Authentication Security** - Account lockout and session management

### Monitoring & Alerting
- ✅ **Audit Trail** - All sensitive operations logged
- ✅ **Failed Login Tracking** - Suspicious activity detection
- ✅ **Data Access Monitoring** - PII access audited
- ✅ **Security Event Logging** - Comprehensive security logs

## Pre-Production Testing

### Security Tests to Run
1. **Authentication Flow:**
   ```bash
   # Test sign up/sign in flows
   # Verify email confirmation works
   # Test account lockout after failed attempts
   ```

2. **CORS Configuration:**
   ```bash
   # Test API calls from production domain
   curl -H "Origin: https://yourdomain.com" \
        https://nqxsfmnvdfdfvndrodvs.supabase.co/functions/v1/create-paypal-order
   ```

3. **Security Headers:**
   ```bash
   # Verify security headers are present
   curl -I https://yourdomain.com
   ```

## Compliance Status

### Australian Privacy Principles (APP)
- ✅ Data collection notices implemented
- ✅ Consent mechanisms in place
- ✅ Data access controls configured
- ✅ Breach notification procedures documented

### PCI DSS SAQ-A
- ✅ No card data stored locally
- ✅ PayPal integration for payments
- ✅ Secure transmission protocols
- ✅ Access controls implemented

## Emergency Contacts

**Security Incident Response:**
- Primary: [Your security contact]
- Backup: [Backup contact]
- Supabase Support: https://supabase.com/support

## Next Review Date
**Quarterly Security Review:** [Set date 3 months from now]

---

**Document Status:** Active  
**Last Updated:** [Today's date]  
**Next Review:** [3 months from today]