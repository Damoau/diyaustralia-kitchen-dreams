# Incident Response Runbook

## Emergency Contacts

### Internal Response Team
- **Incident Commander**: security@diyaustralia.com.au | +61 xxx xxx xxx
- **Technical Lead**: tech@diyaustralia.com.au | +61 xxx xxx xxx  
- **Business Continuity**: operations@diyaustralia.com.au | +61 xxx xxx xxx
- **Legal/Compliance**: legal@diyaustralia.com.au | +61 xxx xxx xxx
- **Communications**: comms@diyaustralia.com.au | +61 xxx xxx xxx

### External Contacts
- **OAIC (Privacy Breaches)**: 1300 363 992
- **ACCC (Consumer Issues)**: 1300 302 502
- **AFP Cyber Crime**: 131 AFP (131 237)
- **ACSC (Critical Infrastructure)**: 1300 292 371

## Incident Classification

### Severity Levels

#### P1 - Critical (Response: Immediate)
- Customer payment data potentially exposed
- Complete system outage affecting all customers
- Active data breach in progress
- Ransomware or destructive attack

#### P2 - High (Response: Within 2 hours)
- Partial system outage affecting core functionality
- Suspected unauthorized access to customer data
- Significant performance degradation
- Security vulnerability actively being exploited

#### P3 - Medium (Response: Within 8 hours)
- Limited functionality impact
- Potential security vulnerability discovered
- Suspicious activity detected
- Non-critical data exposure

#### P4 - Low (Response: Within 24 hours)
- Minor performance issues
- Security policy violations
- Non-urgent security updates required

## Response Procedures

### Phase 1: Detection & Initial Response (0-30 minutes)

#### 1.1 Incident Identification
```bash
# Check system health
curl -f https://diyaustralia.lovable.app/health || echo "CRITICAL: Site down"

# Check Supabase status
supabase status

# Review recent logs
supabase logs --type=edge-function --limit=100
```

#### 1.2 Immediate Containment
- **If payment systems compromised**: Disable payment processing immediately
- **If database breached**: Revoke suspicious API keys
- **If user accounts compromised**: Force password resets
- **If malware detected**: Isolate affected systems

#### 1.3 Escalation
- Notify Incident Commander within 15 minutes
- Create incident ticket with initial assessment
- Activate response team via emergency contacts

### Phase 2: Assessment & Analysis (30 minutes - 2 hours)

#### 2.1 Impact Assessment
```markdown
**Incident Impact Checklist**
- [ ] Customer data affected? (Type/Volume)
- [ ] Payment systems compromised?
- [ ] Service availability impact?
- [ ] Regulatory notification required?
- [ ] Media/PR implications?
```

#### 2.2 Evidence Collection
```bash
# Collect system logs
supabase logs --type=auth --start="2024-01-01" --end="2024-01-02" > auth_logs.json
supabase logs --type=postgres --start="2024-01-01" --end="2024-01-02" > db_logs.json

# Database forensics
psql -h db.nqxsfmnvdfdfvndrodvs.supabase.co -c "
  SELECT actor_id, action, created_at, ip_address 
  FROM audit_logs 
  WHERE created_at > NOW() - INTERVAL '24 hours' 
  ORDER BY created_at DESC;"

# Check for unauthorized access
supabase auth list-users --filter="last_sign_in_at>2024-01-01"
```

#### 2.3 Root Cause Analysis
- Review security logs and audit trails
- Identify attack vectors and vulnerabilities
- Determine scope of compromise
- Document timeline of events

### Phase 3: Containment & Eradication (2-8 hours)

#### 3.1 Extended Containment
```bash
# Rotate compromised secrets
supabase secrets set COMPROMISED_KEY="new_secure_value"

# Revoke suspicious sessions
supabase auth admin update-user --user-id=<user_id> --password="temp_password"

# Block suspicious IP addresses (if applicable)
# Implementation depends on hosting provider
```

#### 3.2 System Hardening
- Apply security patches
- Update firewall rules
- Strengthen authentication requirements
- Implement additional monitoring

### Phase 4: Recovery & Monitoring (8-24 hours)

#### 4.1 Service Restoration
- Validate system integrity
- Restore services in controlled manner
- Monitor for continued threats
- Verify business functionality

#### 4.2 Enhanced Monitoring
```bash
# Set up additional alerting
supabase functions create incident-monitor
# Deploy monitoring function with enhanced logging
```

### Phase 5: Post-Incident Activities (24-72 hours)

#### 5.1 Notification Requirements

**Australian Privacy Act Requirements**
- Notify OAIC within 72 hours if:
  - Likely to result in serious harm
  - Involves personal information
- Notify affected individuals if serious harm likely

**Template Notifications**
```
OAIC Notification:
- Date/time of breach
- Description of personal information involved  
- Circumstances of breach
- Steps taken to address breach
- Contact information
```

#### 5.2 Documentation
- Complete incident report
- Update threat intelligence
- Review and update procedures
- Conduct lessons learned session

## Incident Response Tools & Scripts

### Emergency Response Script
```bash
#!/bin/bash
# emergency-response.sh

echo "=== DIY Australia Emergency Response ==="
echo "Incident ID: INC-$(date +%Y%m%d-%H%M%S)"

# System health check
echo "Checking system health..."
curl -f https://diyaustralia.lovable.app/health

# Collect critical logs
echo "Collecting logs..."
mkdir -p /tmp/incident-logs
supabase logs --type=all --limit=1000 > /tmp/incident-logs/supabase.log

# Check for active threats
echo "Scanning for threats..."
grep -i "error\|unauthorized\|failed" /tmp/incident-logs/supabase.log

echo "Emergency assessment complete. Results in /tmp/incident-logs/"
```

### Database Forensics Queries
```sql
-- Recent suspicious authentication attempts
SELECT 
  id, 
  event_message,
  timestamp,
  metadata
FROM auth_logs 
WHERE event_message LIKE '%failed%' 
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Admin actions review
SELECT 
  actor_id,
  action,
  scope,
  created_at,
  ip_address
FROM audit_logs 
WHERE scope = 'admin'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Payment transaction anomalies
SELECT 
  id,
  order_number,
  total_amount,
  status,
  created_at
FROM orders 
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND (total_amount > 50000 OR status = 'failed')
ORDER BY created_at DESC;
```

## Communication Templates

### Internal Alert
```
SUBJECT: [P1 INCIDENT] Security Incident - Immediate Action Required

Team,

A P1 security incident has been declared:
- Incident ID: INC-20240115-1234
- Detection Time: 2024-01-15 14:30 AEDT
- Initial Assessment: [Brief description]
- Impact: [Customer/business impact]

Response team activated. Join incident channel: #incident-response

Incident Commander: [Name]
Next Update: [Time]
```

### Customer Communication
```
SUBJECT: Important Security Update - DIY Australia

Dear Valued Customer,

We are writing to inform you of a security incident that may have affected your account information. We detected [brief description] on [date].

What happened: [Clear explanation]
What information was involved: [Specific details]
What we are doing: [Response actions]
What you should do: [Customer actions]

We sincerely apologize for this incident and any inconvenience caused.

Contact us: security@diyaustralia.com.au
```

## Legal & Regulatory Requirements

### Evidence Preservation
- Preserve all logs for minimum 7 years
- Maintain chain of custody documentation
- Encrypt all forensic evidence
- Store copies in separate secure location

### Regulatory Reporting
- **OAIC**: Within 72 hours for notifiable breaches
- **ACSC**: For critical infrastructure incidents
- **AFP**: For criminal activity
- **Insurance**: Within 24 hours per policy terms

---
**Document Classification**: Internal - Security Team Only  
**Last Updated**: 2024-01-15  
**Next Review**: 2024-07-15  
**Version**: 2.1