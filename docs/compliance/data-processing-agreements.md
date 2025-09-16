# Data Processing Agreements (DPAs) and Processor Management

## Overview
This document outlines our Data Processing Agreements and compliance requirements for third-party processors handling personal information on our behalf.

## Processor Categories

### Payment Processors

#### PayPal Australia Pty Ltd
**Service:** Payment processing and transaction management
**Data Processed:**
- Customer payment information (handled directly by PayPal)
- Transaction references and amounts
- Delivery addresses for payment verification

**DPA Status:** ✅ Standard DPA in place
**Key Terms:**
- PayPal acts as independent controller for payment data
- We receive only transaction references and status
- PayPal maintains PCI DSS Level 1 compliance
- Data retention: As per PayPal's privacy policy
- Security: Bank-level encryption and fraud protection

**Compliance Documentation:**
- PayPal Privacy Statement: https://www.paypal.com/au/privacy
- PCI DSS Certificate available on request
- Annual compliance certification review

#### Stripe Payments Australia Pty Ltd
**Service:** Alternative payment processing
**Data Processed:**
- Customer payment information (handled directly by Stripe)
- Transaction metadata
- Dispute and chargeback information

**DPA Status:** ✅ Standard DPA in place
**Key Terms:**
- Stripe acts as data processor under GDPR/Australian Privacy Act
- Payment data never stored on our systems
- Stripe maintains PCI DSS Level 1 compliance
- Data retention: 7 years for financial records
- Security: Advanced fraud detection and prevention

**Compliance Documentation:**
- Stripe Privacy Policy: https://stripe.com/au/privacy
- Data Processing Agreement: Available in Stripe Dashboard
- SOC 2 Type II certification

### Communication Processors

#### Resend (Email Service)
**Service:** Transactional email delivery
**Data Processed:**
- Customer email addresses
- Order confirmation content
- Invoice and receipt delivery

**DPA Status:** ✅ Standard terms apply
**Key Terms:**
- Acts as data processor for email delivery
- Email content and addresses processed temporarily
- No marketing use of customer data
- Data retention: 30 days for delivery logs
- Security: TLS encryption for all transmissions

**Compliance Documentation:**
- Privacy Policy: Available at resend.com/privacy
- Security practices documentation
- GDPR compliance statements

#### Twilio SendGrid (Backup Email)
**Service:** Secondary email delivery service
**Data Processed:**
- Customer email addresses
- Transactional email content
- Delivery analytics

**DPA Status:** ⏳ Pending formal DPA execution
**Required Actions:**
- Execute formal DPA through Twilio dashboard
- Configure data retention settings
- Implement data classification labels

**Key Terms:**
- Subprocessor under main Twilio DPA
- Data retention: Configurable (set to 30 days)
- Security: SOC 2 Type II certified
- Location: Data processing in Australia/Singapore

### Shipping and Logistics

#### Australia Post
**Service:** Package delivery and tracking
**Data Processed:**
- Customer delivery addresses
- Contact phone numbers
- Package contents (general description)

**DPA Status:** ✅ Standard terms of service
**Key Terms:**
- Australia Post Privacy Policy applies
- Personal information used only for delivery
- Data sharing with delivery partners as required
- Retention: As per Australia Post records management

**Compliance Documentation:**
- Privacy Policy: https://auspost.com.au/privacy
- Terms and Conditions of postal services
- Australian Government entity - privacy compliance

#### TNT/FedEx Australia
**Service:** Express delivery services
**Data Processed:**
- Delivery addresses and contact details
- Shipment tracking information
- Proof of delivery records

**DPA Status:** ✅ Standard customer agreement
**Key Terms:**
- Customer data used only for delivery purposes
- International transfers governed by FedEx global privacy policy
- Data retention: 7 years for delivery records
- Security: Industry-standard logistics security measures

### Technology and Infrastructure

#### Supabase Inc.
**Service:** Database hosting and backend services
**Data Processed:**
- All customer and business data
- Order history and preferences
- User authentication data

**DPA Status:** ✅ Standard DPA executed
**Key Terms:**
- Acts as data processor under our instructions
- Data stored in Australian AWS regions where possible
- EU-US Data Privacy Framework participant
- Data retention: As per our retention policy
- Security: SOC 2 Type II, ISO 27001 certified

**Compliance Documentation:**
- Privacy Policy: https://supabase.com/privacy
- DPA: Available in Supabase dashboard
- Security certifications updated annually

#### Xero Limited
**Service:** Accounting and invoicing software
**Data Processed:**
- Customer contact and billing information
- Invoice and payment records
- Business financial data

**DPA Status:** ✅ Standard DPA in place
**Key Terms:**
- Xero acts as data processor for accounting functions
- Data stored in Xero's Australian data centers
- Integration limited to necessary business data
- Data retention: 7 years as per Australian tax law
- Security: ISO 27001, SOC 2 certified

**Compliance Documentation:**
- Privacy Policy: https://www.xero.com/au/about/privacy/
- Security Trust Center: https://www.xero.com/au/trust/
- Annual transparency reports

## DPA Management Process

### New Processor Evaluation
1. **Privacy Impact Assessment**
   - Evaluate data processing requirements
   - Assess security and compliance capabilities
   - Review data transfer and storage locations

2. **Due Diligence**
   - Request security certifications
   - Review privacy policies and terms
   - Assess incident response capabilities

3. **DPA Negotiation**
   - Ensure Australian Privacy Act compliance
   - Include data subject rights provisions
   - Specify security requirements and audit rights

4. **Ongoing Monitoring**
   - Annual compliance reviews
   - Security incident notifications
   - Regular assessment of processor performance

### DPA Standard Clauses

#### Data Protection Requirements
- Compliance with Australian Privacy Principles
- Implementation of appropriate security measures
- Limitation of data use to specified purposes
- Data subject rights facilitation

#### Security Obligations
- Encryption of personal information in transit and at rest
- Access controls and authentication requirements
- Regular security assessments and updates
- Incident notification within 24 hours

#### Data Transfer Restrictions
- Approval required for international data transfers
- Adequate protection level requirements
- Subprocessor notification and approval process
- Data localization preferences where applicable

#### Audit and Compliance
- Right to audit processor security practices
- Annual compliance certification requirements
- Documentation of data processing activities
- Cooperation with regulatory investigations

## Annual Review Process

### Q1 Review (January-March)
- Review all DPAs for renewal requirements
- Update processor contact information
- Assess new regulatory requirements

### Q2 Review (April-June)
- Conduct security assessments
- Review incident reports and responses
- Update data flow documentation

### Q3 Review (July-September)
- Evaluate processor performance
- Consider alternative providers if needed
- Update business associate agreements

### Q4 Review (October-December)
- Plan for next year's compliance requirements
- Budget for DPA renewals and new processors
- Update staff training on processor management

## Contact Information
**Data Protection Officer:** privacy@diyaustralia.com.au
**Legal Counsel:** legal@diyaustralia.com.au
**Procurement:** procurement@diyaustralia.com.au

---
*This document is maintained by the Data Protection Officer and reviewed quarterly.*
*Last Updated: 2024*
*Classification: Internal Use*