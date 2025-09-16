# Card Data Flow Diagram

## Overview
This diagram illustrates how payment card data flows through our system, demonstrating that no cardholder data enters our environment.

## Data Flow Process

```
Customer Browser
        ↓
   [Payment Request]
        ↓
DIY Australia Website
        ↓
[Redirect to Payment Processor]
        ↓
    PayPal/Stripe
   Hosted Payment Page
        ↓
   [Card Data Entry]
        ↓
Payment Processor Network
        ↓
    Bank/Card Issuer
        ↓
[Authorization Response]
        ↓
    PayPal/Stripe
        ↓
[Payment Confirmation]
        ↓
DIY Australia Website
        ↓
    Customer Browser
```

## Data Classification

### RED ZONE - Cardholder Data Environment (CDE)
**Location:** PayPal/Stripe servers only
**Data Types:**
- Primary Account Number (PAN)
- Cardholder Name
- Expiration Date
- Service Code
- CVV/CVV2

### GREEN ZONE - Our Environment
**Location:** DIY Australia servers
**Data Types:**
- Payment reference IDs
- Transaction amounts
- Payment status
- Order details (non-card related)

## Security Boundaries

### External Payment Processors (PCI DSS Level 1)
- **PayPal:** Handles all card data processing
- **Stripe:** Alternative payment processor
- Both maintain PCI DSS compliance
- Encrypted data transmission to/from processors

### Our Web Application
- **No card data storage**
- **No card data processing**
- **No card data transmission** (except redirect to processors)
- Payment tokens only (non-sensitive)

## Data Protection Measures

### In Transit
- TLS 1.2+ encryption for all communications
- Certificate pinning for processor communications
- HTTPS enforcement across entire application

### At Rest
- No cardholder data stored in our systems
- Payment reference tokens only
- Database encryption for non-card sensitive data

### In Processing
- No card data processing in our application
- Immediate redirect to PCI compliant processors
- Server-side validation of payment responses only

## Compliance Notes
- **Scope Reduction:** By not handling card data, we significantly reduce PCI DSS scope
- **Risk Mitigation:** Eliminates risk of card data breach from our systems
- **Processor Dependency:** Compliance relies on processor certifications

## Annual Review
This diagram should be reviewed annually and updated when:
- New payment processors are added
- System architecture changes
- Payment flow modifications occur

---
*Last Updated: 2024*
*Next Review: 2025*