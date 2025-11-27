# Legal Documents Guide for Real Estate CRM

## 📋 Overview

This guide outlines the legal documents required for the Real Estate CRM SaaS application, especially considering it handles sensitive personal data (Turkish ID numbers, IBANs, addresses, etc.).

## ⚠️ Important Disclaimer

**These templates are starting points only. You MUST:**
1. Review with a Turkish lawyer familiar with KVKK (Turkey's data protection law)
2. Customize for your specific business model
3. Ensure compliance with Turkish regulations
4. Update regularly as laws change

---

## Required Documents

### 1. Privacy Policy (Gizlilik Politikası) 🔴 REQUIRED

**Why Required:**
- You collect sensitive personal data (TC Kimlik No, IBAN, addresses, phone numbers)
- KVKK (Kişisel Verilerin Korunması Kanunu) requires privacy policies
- GDPR compliance if you have EU users
- Builds user trust

**Key Sections Needed:**
- What data you collect
- How you use the data
- Data storage and security
- User rights (access, deletion, correction)
- Third-party services (Supabase)
- Data retention policies
- Contact information for data protection inquiries

**Location:** Should be accessible at `/privacy` or `/privacy-policy`

---

### 2. Terms of Service (Kullanım Koşulları) 🔴 REQUIRED

**Why Required:**
- Defines user rights and responsibilities
- Limits liability
- Sets service rules
- Protects your business

**Key Sections Needed:**
- Service description
- User obligations
- Prohibited activities
- Account termination policies
- Intellectual property rights
- Limitation of liability
- Dispute resolution
- Governing law (Turkish law)

**Location:** Should be accessible at `/terms` or `/terms-of-service`

---

### 3. Cookie Policy (Çerez Politikası) 🟡 RECOMMENDED

**Why Recommended:**
- You likely use cookies for authentication (Supabase)
- Required by many jurisdictions
- Transparency with users

**Key Sections Needed:**
- Types of cookies used
- Purpose of each cookie
- How to manage cookies
- Third-party cookies (if any)

**Location:** Can be part of Privacy Policy or separate at `/cookies`

---

## Implementation Checklist

- [ ] Create Privacy Policy page component
- [ ] Create Terms of Service page component
- [ ] Create Cookie Policy (or include in Privacy Policy)
- [ ] Add routes in `App.tsx`
- [ ] Update footer links in `LandingPage.tsx`
- [ ] Add translations (TR/EN)
- [ ] Add links in registration/login flows
- [ ] Review with Turkish lawyer
- [ ] Publish and make accessible

---

## Legal Considerations for Turkish SaaS

### KVKK Compliance (Turkey)

1. **Data Controller Registration**: May need to register with KVKK if processing significant amounts of personal data
2. **Explicit Consent**: Required for sensitive data (TC ID, IBAN)
3. **Data Processing Agreement**: Required with Supabase (your data processor)
4. **Data Breach Notification**: Must notify KVKK within 72 hours of a breach
5. **User Rights**: Right to access, correct, delete, and object to processing

### Data You Collect (Based on Your App)

- **Personal Identifiers**: Names, TC Kimlik No (encrypted)
- **Contact Information**: Phone numbers, email addresses
- **Financial Data**: IBANs (encrypted)
- **Location Data**: Addresses, city, district
- **Contract Data**: Rental agreements, financial transactions
- **Authentication Data**: Email, password (via Supabase Auth)

### Third-Party Services

- **Supabase**: Database, authentication, storage (data processor)
- **Exchange Rate APIs**: May collect IP addresses
- **Analytics**: If you add analytics (Google Analytics, etc.)

---

## Next Steps

1. **Create basic templates** (I can help with this)
2. **Review with lawyer** (Essential!)
3. **Customize for your business**
4. **Implement in the app**
5. **Keep updated** as laws change

---

## Resources

- [KVKK Official Website](https://www.kvkk.gov.tr/)
- [KVKK Law (Turkish)](https://www.kvkk.gov.tr/SharedFolderServer/CMS/File/3322/6698sayiliKisiselVerilerinKorunmasiKanunu.pdf)
- [Supabase Data Processing Agreement](https://supabase.com/legal/dpa)
- [GDPR Compliance Guide](https://gdpr.eu/)

---

**Last Updated**: 2025-01-25
**Status**: Planning Document





