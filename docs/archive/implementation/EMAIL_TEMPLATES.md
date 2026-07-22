# Bilingual Email Templates for Supabase

Since Supabase email templates are static, the most reliable way to support both Turkish and English users is to use a **Bilingual Template** (containing both languages) or a design that clearly shows the action button in both languages.

## 1. Confirm Your Email (E-posta Adresini Onayla)

**Subject Line:** `Emlak CRM - E-postanızı Onaylayın / Confirm Your Email`

**Template Code:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px; border-radius: 8px; margin-top: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #2563eb; text-decoration: none; }
    .content { margin-bottom: 30px; text-align: left; }
    .button { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 20px; text-align: center; }
    .divider { border-top: 1px solid #e5e7eb; margin: 30px 0; }
    .footer { font-size: 12px; color: #6b7280; text-align: center; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="{{ .SiteURL }}" class="logo">Emlak CRM</a>
    </div>
    
    <!-- Turkish Section -->
    <div class="content">
      <h2 style="margin-top: 0; color: #111827;">E-posta Adresinizi Onaylayın</h2>
      <p>Merhaba,</p>
      <p>Emlak CRM hesabınızı oluşturmak için son bir adım kaldı. Aşağıdaki butona tıklayarak e-posta adresinizi doğrulayabilirsiniz:</p>
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">E-postayı Onayla</a>
      </div>
    </div>

    <div class="divider"></div>

    <!-- English Section -->
    <div class="content">
      <h2 style="margin-top: 0; color: #111827;">Confirm Your Email</h2>
      <p>Hello,</p>
      <p>You are one step away from creating your Emlak CRM account. Please verify your email address by clicking the button below:</p>
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Confirm Email</a>
      </div>
    </div>

    <div class="footer">
      <p>© 2025 Jans Trade, LLC. All rights reserved.</p>
      <p>30 N Gould St, STE 4000, Sheridan, Wyoming, 82801, United States</p>
    </div>
  </div>
</body>
</html>
```

---

## 2. Reset Password (Şifre Sıfırlama)

**Subject Line:** `Emlak CRM - Şifre Sıfırlama / Reset Password`

**Template Code:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px; border-radius: 8px; margin-top: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #2563eb; text-decoration: none; }
    .content { margin-bottom: 30px; text-align: left; }
    .button { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 20px; text-align: center; }
    .divider { border-top: 1px solid #e5e7eb; margin: 30px 0; }
    .footer { font-size: 12px; color: #6b7280; text-align: center; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="{{ .SiteURL }}" class="logo">Emlak CRM</a>
    </div>
    
    <!-- Turkish Section -->
    <div class="content">
      <h2 style="margin-top: 0; color: #111827;">Şifrenizi Sıfırlayın</h2>
      <p>Hesabınız için şifre sıfırlama talebinde bulundunuz. Yeni şifrenizi belirlemek için aşağıdaki butona tıklayın:</p>
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Şifremi Sıfırla</a>
      </div>
      <p style="font-size: 14px; color: #666; margin-top: 20px;">Bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
    </div>

    <div class="divider"></div>

    <!-- English Section -->
    <div class="content">
      <h2 style="margin-top: 0; color: #111827;">Reset Your Password</h2>
      <p>You requested a password reset for your account. Click the button below to set a new password:</p>
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
      </div>
      <p style="font-size: 14px; color: #666; margin-top: 20px;">If you didn't request this, you can safely ignore this email.</p>
    </div>

    <div class="footer">
      <p>© 2025 Jans Trade, LLC. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
```

## How to Apply
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/_/auth/templates).
2. Select **Authentication** > **Configuration** > **Email Templates**.
3. Paste the code above into the respective "Source" tabs.
