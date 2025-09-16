# Configuration & Secrets Checklist

## Overview
This document provides a comprehensive checklist for all configuration items and secrets required for the DIY Australia Kitchen Configurator application security and compliance.

## Production Configuration Checklist

### ✅ Security Headers & CSP

#### Content Security Policy (CSP) Reporting
- [ ] **CSP Report Endpoint URL**: `https://nqxsfmnvdfdfvndrodvs.supabase.co/functions/v1/csp-report-handler`
- [ ] **CSP Report Authentication Key**: `CSP_REPORT_AUTH_TOKEN`
  - Type: Bearer token for authenticating CSP violation reports
  - Rotation: Every 90 days
  - Usage: Validates incoming CSP violation reports
  - Location: Supabase Vault

#### CSP Configuration Status
- [ ] Script sources whitelisted for PayPal integration
- [ ] Image sources configured for CDN and user uploads
- [ ] Connect sources restricted to trusted APIs only
- [ ] Report URI configured with authentication

### ✅ Encryption & Key Management

#### KMS Key Aliases for PII Fields
- [ ] **Customer PII Encryption**: `alias/diy-australia-customer-pii`
  - Purpose: Encrypt customer personal information (names, addresses, phone numbers)
  - Algorithm: AES-256-GCM
  - Rotation: Annual automatic rotation
  - Access: Production services only

- [ ] **Payment Data Encryption**: `alias/diy-australia-payment-data`
  - Purpose: Encrypt sensitive payment metadata (not card data - handled by Stripe)
  - Algorithm: AES-256-GCM
  - Rotation: Annual automatic rotation
  - Access: Payment processing services only

- [ ] **Document Encryption**: `alias/diy-australia-document-storage`
  - Purpose: Encrypt uploaded customer documents and files
  - Algorithm: AES-256-GCM
  - Rotation: Annual automatic rotation
  - Access: Document management services only

- [ ] **Audit Log Encryption**: `alias/diy-australia-audit-logs`
  - Purpose: Encrypt audit trail and security logs
  - Algorithm: AES-256-GCM
  - Rotation: Annual automatic rotation
  - Access: Security and compliance services only

### ✅ Communication Service Webhooks

#### SendGrid Email Service
- [ ] **SendGrid API Key**: `SENDGRID_API_KEY`
  - Purpose: Send transactional emails (order confirmations, notifications)
  - Rotation: Every 180 days
  - Permissions: Send email only (no read access)

- [ ] **SendGrid Webhook Secret**: `SENDGRID_WEBHOOK_SECRET`
  - Purpose: Authenticate incoming webhook events (delivery, bounce, spam reports)
  - Rotation: Every 90 days
  - Usage: Validate webhook signature using HMAC-SHA256
  - Endpoint: `/functions/v1/sendgrid-webhook-handler`

#### Twilio SMS Service
- [ ] **Twilio Auth Token**: `TWILIO_AUTH_TOKEN`
  - Purpose: Send SMS notifications and 2FA codes
  - Rotation: Every 180 days
  - Permissions: Send SMS only

- [ ] **Twilio Webhook Secret**: `TWILIO_WEBHOOK_SECRET`
  - Purpose: Authenticate incoming SMS webhook events (delivery status, replies)
  - Rotation: Every 90 days
  - Usage: Validate webhook signature
  - Endpoint: `/functions/v1/twilio-webhook-handler`

### ✅ Payment Processing

#### Stripe Configuration
- [ ] **Stripe API Key**: `STRIPE_SECRET_KEY` (Production)
  - Purpose: Process payments and manage subscriptions
  - Rotation: Every 180 days
  - Permissions: Read/write payments, customers, products

- [ ] **Stripe Webhook Secret**: `STRIPE_WEBHOOK_ENDPOINT_SECRET`
  - Purpose: Authenticate Stripe webhook events (separate from API key)
  - Rotation: Every 90 days
  - Usage: Validate webhook signature using Stripe signature verification
  - Endpoint: `/functions/v1/stripe-webhook-handler`
  - Events: `payment_intent.succeeded`, `customer.subscription.updated`, `invoice.payment_failed`

- [ ] **Stripe Publishable Key**: `STRIPE_PUBLISHABLE_KEY`
  - Purpose: Frontend payment element initialization
  - Security: Public key (safe for client-side use)
  - Rotation: When secret key rotates

#### Payment Security Validation
- [ ] Webhook endpoint uses HTTPS only
- [ ] Webhook signature validation implemented
- [ ] Payment intent confirmation on server-side
- [ ] Customer data encryption at rest

### ✅ Administrative Security

#### Admin 2FA Enforcement
- [ ] **Admin 2FA Enforcement Toggle**: `ADMIN_2FA_REQUIRED`
  - Type: Boolean configuration flag
  - Default: `true` (enforced)
  - Purpose: Mandate 2FA for all admin accounts
  - Override: Emergency admin access procedure documented

- [ ] **2FA Backup Codes**: Generated per admin user
  - Count: 10 single-use codes per admin
  - Storage: Encrypted in user_security_settings table
  - Regeneration: Available in admin security settings

- [ ] **Admin Session Configuration**:
  - Session timeout: 30 minutes of inactivity
  - Concurrent session limit: 3 per admin user
  - IP restriction: Optional per admin user
  - Device registration: Required for new devices

### ✅ Security Monitoring

#### Antivirus Engine Configuration
- [ ] **AV Engine**: ClamAV integration
- [ ] **Signature Update Schedule**: 
  - Frequency: Every 4 hours
  - Cron: `0 */4 * * *`
  - Backup source: Multiple mirror servers configured
  - Failure handling: Alert security team if updates fail > 12 hours

- [ ] **AV Engine Configuration**:
  - Max file size scan: 100MB
  - Quarantine location: Secure isolated storage bucket
  - Scan timeout: 60 seconds per file
  - Alert threshold: Any malware detection = immediate alert

#### Security Monitoring Endpoints
- [ ] **Security Event Webhook**: `https://nqxsfmnvdfdfvndrodvs.supabase.co/functions/v1/security-event-handler`
- [ ] **Failed Login Alert Threshold**: 5 attempts per IP in 10 minutes
- [ ] **Admin Activity Monitoring**: All admin actions logged and monitored
- [ ] **Anomaly Detection**: Unusual access patterns trigger security review

## Environment-Specific Configuration

### Production Environment
- [ ] All secrets stored in Supabase Vault
- [ ] Database encryption at rest enabled
- [ ] SSL/TLS certificates valid and auto-renewing
- [ ] VPC security groups configured
- [ ] Access logging enabled for all services

### Staging Environment
- [ ] Separate secrets for staging (lower privilege)
- [ ] Test webhook endpoints configured
- [ ] Limited data retention (30 days)
- [ ] Development team access only

## Compliance Configuration

### Australian Privacy Act Compliance
- [ ] Data retention policies configured (7 years for financial records)
- [ ] Cross-border data transfer controls enabled
- [ ] Customer consent management system active
- [ ] Data breach notification procedures configured (72 hours)

### PCI DSS SAQ-A Compliance
- [ ] No cardholder data stored (confirmed Stripe tokenization only)
- [ ] Network segmentation documented
- [ ] Vendor compliance certificates current
- [ ] Quarterly vulnerability scans scheduled

## Emergency Procedures

### Secret Compromise Response
1. **Immediate Actions** (Within 5 minutes):
   - [ ] Disable compromised secret in provider system
   - [ ] Alert security team via Slack channel
   - [ ] Document incident start time

2. **Short-term Actions** (Within 30 minutes):
   - [ ] Generate new secret/key
   - [ ] Update secret in Supabase Vault
   - [ ] Test all dependent services
   - [ ] Monitor for service disruptions

3. **Follow-up Actions** (Within 24 hours):
   - [ ] Complete incident report
   - [ ] Review access logs for unauthorized usage
   - [ ] Update security procedures if needed
   - [ ] Notify stakeholders of resolution

### Configuration Validation

#### Pre-Production Checklist
- [ ] All secrets present and valid
- [ ] Webhook endpoints responding correctly
- [ ] Encryption keys accessible and functional
- [ ] 2FA enforcement working as expected
- [ ] AV signatures current
- [ ] Monitoring alerts functional

#### Quarterly Review Items
- [ ] Secret rotation status check
- [ ] Unused secrets cleanup
- [ ] Access permission review
- [ ] Configuration drift analysis
- [ ] Compliance audit preparation

---

**Document Owner**: Security Team  
**Last Updated**: 2024-01-15  
**Next Review**: 2024-04-15  
**Classification**: Internal - Restricted Access

## Related Documents
- [Secrets Inventory](./secrets-inventory.md)
- [Incident Response Runbook](./incident-response-runbook.md)
- [Security Architecture Diagram](./security-architecture-diagram.png)
- [Penetration Test Report](./penetration-test-report.md)