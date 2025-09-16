# Secrets Inventory & Rotation Schedule

## Secret Classification

### Production Secrets Inventory

| Secret Name | Type | Criticality | Current Location | Rotation Frequency | Last Rotated | Next Due |
|-------------|------|-------------|------------------|-------------------|--------------|----------|
| SUPABASE_SERVICE_ROLE_KEY | Database Admin | Critical | Supabase Vault | 90 days | 2024-01-15 | 2024-04-15 |
| PAYPAL_CLIENT_SECRET | Payment API | Critical | Supabase Vault | 180 days | 2024-01-01 | 2024-07-01 |
| OPENAI_API_KEY | AI Service | High | Supabase Vault | 90 days | 2024-02-01 | 2024-05-01 |
| RESEND_API_KEY | Email Service | Medium | Supabase Vault | 180 days | 2024-01-20 | 2024-07-20 |
| SUPABASE_DB_URL | Database Connection | Critical | Supabase Vault | On-demand | - | - |
| SUPABASE_ANON_KEY | Public API | Low | Code/Public | Never | - | - |
| PAYPAL_CLIENT_ID | Payment ID | Low | Code/Public | Never | - | - |
| PAYPAL_API_URL | API Endpoint | Low | Code/Public | Never | - | - |

### Development/Staging Secrets

| Secret Name | Environment | Notes |
|-------------|-------------|-------|
| DEV_SUPABASE_SERVICE_KEY | Development | Separate key for dev environment |
| STAGING_PAYPAL_SANDBOX | Staging | PayPal sandbox credentials |
| TEST_OPENAI_KEY | Testing | Limited quota test key |

## Rotation Procedures

### Automated Rotation (Recommended)
```bash
# Example rotation script
#!/bin/bash
# rotate-secrets.sh

SECRET_NAME=$1
NEW_VALUE=$2

# Validate secret exists
supabase secrets list | grep -q "$SECRET_NAME" || exit 1

# Update secret
supabase secrets set "$SECRET_NAME=$NEW_VALUE"

# Test new secret
npm run test:secrets

# Log rotation
echo "$(date): Rotated $SECRET_NAME" >> /var/log/secret-rotations.log
```

### Manual Rotation Steps

#### 1. SUPABASE_SERVICE_ROLE_KEY
- Generate new service role key in Supabase dashboard
- Update secret in vault
- Test all edge functions
- Monitor for 24 hours
- Deactivate old key

#### 2. PAYPAL_CLIENT_SECRET
- Generate new API credentials in PayPal dashboard
- Update secret in vault
- Test payment flows
- Update webhook configurations
- Deactivate old credentials

#### 3. OPENAI_API_KEY
- Generate new API key in OpenAI dashboard
- Update secret in vault
- Test AI assistant functionality
- Monitor usage/billing
- Deactivate old key

#### 4. RESEND_API_KEY
- Generate new API key in Resend dashboard
- Update secret in vault
- Test email sending
- Update webhook configurations
- Deactivate old key

## Security Controls

### Access Controls
- **Principle of Least Privilege**: Each service uses minimal required permissions
- **Secret Segmentation**: Production/staging/development environments isolated
- **Role-Based Access**: Only designated personnel can rotate secrets

### Monitoring & Alerting
- Secret usage monitoring via Supabase analytics
- Failed authentication alerts
- Rotation due date notifications
- Unusual access pattern detection

### Backup & Recovery
- Encrypted secret backups stored separately
- Recovery procedures documented
- Test recovery quarterly

## Compliance Requirements

### Australian Privacy Principles (APP)
- **APP 11**: Secrets containing personal information encrypted at rest
- **APP 6**: Access logging for all secret operations
- **APP 1**: Privacy impact assessment for new secrets

### PCI DSS (SAQ-A)
- Payment secrets (PayPal) managed by Level 1 provider
- No cardholder data secrets in our environment
- Quarterly secret inventory review

## Emergency Procedures

### Compromised Secret Response
1. **Immediate**: Deactivate compromised secret
2. **Within 1 hour**: Generate and deploy replacement
3. **Within 24 hours**: Complete incident report
4. **Within 72 hours**: Review access logs and update procedures

### Secret Rotation Failure
1. Rollback to previous working secret
2. Investigate root cause
3. Fix underlying issue
4. Re-attempt rotation
5. Update procedures to prevent recurrence

## Quarterly Review Checklist

- [ ] Verify all secrets are still required
- [ ] Check rotation schedules are being followed
- [ ] Review access logs for anomalies
- [ ] Test emergency rotation procedures
- [ ] Update inventory with any new secrets
- [ ] Validate backup/recovery procedures

---
**Document Owner**: Security Team  
**Last Updated**: 2024-01-15  
**Next Review**: 2024-04-15  
**Classification**: Internal - Restricted Access