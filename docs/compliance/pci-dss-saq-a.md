# PCI DSS SAQ-A Self-Assessment Questionnaire

## Company Information
- **Company Name:** DIY Australia Kitchen Dreams
- **Assessment Date:** 2024
- **Assessment Type:** SAQ-A (Card-not-present merchants)
- **Assessor:** Internal Security Team

## Executive Summary
This Self-Assessment Questionnaire (SAQ-A) demonstrates our compliance with PCI DSS requirements as a card-not-present merchant using only hosted payment solutions.

## Merchant Environment
- **Card Data Environment:** No cardholder data stored, processed, or transmitted on our systems
- **Payment Processing:** Fully outsourced to PCI DSS compliant service providers
- **Primary Payment Processor:** PayPal (PCI DSS Level 1 compliant)
- **Secondary Processors:** Stripe (PCI DSS Level 1 compliant)

## SAQ-A Requirements Assessment

### Requirement 2: Do not use vendor-supplied defaults for system passwords and other security parameters
**Status:** ✅ COMPLIANT
- All default passwords changed on administrative systems
- Strong password policies implemented
- Regular password updates enforced

### Requirement 6: Develop and maintain secure systems and applications
**Status:** ✅ COMPLIANT
- Regular security updates applied to all systems
- Web application security best practices followed
- Secure coding practices implemented

### Requirement 8: Identify and authenticate access to system components
**Status:** ✅ COMPLIANT
- Unique user IDs assigned to each person with access
- Multi-factor authentication implemented for admin access
- Regular access reviews conducted

### Requirement 9: Restrict physical access to cardholder data
**Status:** ✅ COMPLIANT
- No cardholder data stored on our premises
- Physical security measures in place for IT infrastructure
- Visitor access controls implemented

### Requirement 12: Maintain a policy that addresses information security for all personnel
**Status:** ✅ COMPLIANT
- Information security policy documented and maintained
- Security awareness training provided to all staff
- Incident response procedures established

## Card Data Flow
**Our Environment:** No card data flows through our systems
- Customer initiates payment on our website
- Payment form hosted by PayPal/Stripe (PCI compliant)
- Payment processed entirely by third-party processors
- We receive only payment confirmation notifications

## Compliance Statement
We certify that we have completed this Self-Assessment Questionnaire and that the responses provided reflect our compliance with PCI DSS requirements as of the assessment date.

**Assessment Valid Until:** December 31, 2024
**Next Assessment Due:** January 2025

## Supporting Documentation
- Vendor compliance certificates (PayPal, Stripe)
- Network security assessments
- Vulnerability scan results
- Security policy documentation

---
*This document should be reviewed annually and updated as needed to maintain compliance.*