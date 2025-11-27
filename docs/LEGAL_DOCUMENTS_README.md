# Legal Documents - Implementation Guide

## 📋 Created Files

All legal documents have been created in HTML format with your app's design language (Tailwind CSS, Inter font, blue color scheme).

### Files Created:

1. **Privacy Policy (Gizlilik Politikası)**
   - `docs/privacy-policy-tr.html` - Turkish version
   - `docs/privacy-policy-en.html` - English version

2. **Terms of Service (Kullanım Koşulları)**
   - `docs/terms-of-service-tr.html` - Turkish version
   - `docs/terms-of-service-en.html` - English version

3. **Cookie Policy (Çerez Politikası)**
   - `docs/cookie-policy-tr.html` - Turkish version
   - `docs/cookie-policy-en.html` - English version

## 🎨 Design Features

All documents use:
- ✅ Your app's color scheme (Blue #2563EB primary, gray backgrounds)
- ✅ Inter font family (matching your app)
- ✅ Tailwind CSS (via CDN)
- ✅ Responsive design (mobile-friendly)
- ✅ Clean, professional layout
- ✅ Language switcher in header
- ✅ Cross-linking between documents
- ✅ Footer with navigation links

## 📝 Next Steps

### 1. Review Content
- ⚠️ **IMPORTANT**: Review all content with a Turkish lawyer familiar with KVKK
- Update placeholder email addresses (`privacy@emlakcrm.com`, `support@emlakcrm.com`)
- Update placeholder company address
- Customize any sections specific to your business model

### 2. Integrate into Your App

#### Option A: Static HTML Files (Current)
- Files are ready to serve as static HTML
- Can be hosted on your server or CDN
- Access via: `https://yourdomain.com/docs/privacy-policy-tr.html`

#### Option B: React Components (Recommended)
Create React components that render these pages:

```typescript
// src/features/legal/PrivacyPolicy.tsx
export const PrivacyPolicy = () => {
  const { language } = useAuth();
  const isTurkish = language === 'tr';
  
  return (
    <iframe 
      src={`/docs/privacy-policy-${isTurkish ? 'tr' : 'en'}.html`}
      className="w-full h-screen border-0"
    />
  );
};
```

Then add routes in `App.tsx`:
```typescript
<Route path="/privacy" element={<PrivacyPolicy />} />
<Route path="/terms" element={<TermsOfService />} />
<Route path="/cookies" element={<CookiePolicy />} />
```

### 3. Update Footer Links

Update `src/features/landing/LandingPage.tsx` footer links:

```typescript
// Change from:
<a href="#" className="hover:text-blue-400 transition-colors">
  {t("footer.privacy")}
</a>

// To:
<a href="/privacy" className="hover:text-blue-400 transition-colors">
  {t("footer.privacy")}
</a>
```

### 4. Add to Registration/Login

Add checkbox and links in registration/login forms:
- "I agree to the Terms of Service and Privacy Policy"
- Links to both documents

## 🔒 Legal Compliance Checklist

- [ ] Review all documents with Turkish lawyer
- [ ] Update contact information (emails, address)
- [ ] Verify KVKK compliance
- [ ] Add to registration/login flow
- [ ] Update footer links
- [ ] Test all language switchers
- [ ] Ensure mobile responsiveness
- [ ] Add to sitemap (if applicable)

## 📧 Contact Information to Update

Replace these placeholders in all files:
- `privacy@emlakcrm.com` → Your actual privacy email
- `support@emlakcrm.com` → Your actual support email
- `kvkk@emlakcrm.com` → Your KVKK contact email
- `[Company Address]` → Your actual company address

## 🌐 Language Switching

Each document has a language switcher in the header that links to the other language version. Make sure both versions are accessible at the same base path.

## ⚠️ Important Notes

1. **Legal Review Required**: These are templates. You MUST have a Turkish lawyer review them for KVKK compliance.

2. **Company Information**: Update all placeholder company information before publishing.

3. **Supabase DPA**: Ensure you have a Data Processing Agreement (DPA) with Supabase. Mention this in your privacy policy.

4. **Regular Updates**: Legal documents should be reviewed and updated regularly, especially when:
   - Laws change
   - You add new features
   - You change data processing practices
   - You add new third-party services

## 📚 Related Documentation

- See `docs/LEGAL_DOCUMENTS_GUIDE.md` for detailed legal requirements
- KVKK Official Website: https://www.kvkk.gov.tr/
- Supabase Privacy: https://supabase.com/privacy

---

**Status**: ✅ All documents created and ready for review
**Last Updated**: January 25, 2025





