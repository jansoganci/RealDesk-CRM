/**
 * Email Templates
 *
 * Professional, bilingual (TR/EN) HTML email templates for organization invitations.
 */

export interface InvitationEmailData {
  orgName: string;
  orgLogo?: string | null;
  inviterName: string;
  role: 'owner' | 'member';
  invitationLink: string;
  expiresAt: string; // ISO date string
  language?: 'tr' | 'en';
}

/**
 * Get invitation email template
 * Returns bilingual HTML email with Turkish and English content
 */
export function getInvitationEmailTemplate(data: InvitationEmailData): string {
  const { orgName, orgLogo, inviterName, role, invitationLink, expiresAt } = data;
  
  // Format expiration date
  const expiresDate = new Date(expiresAt);
  const formattedDate = expiresDate.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Role translations
  const roleText = {
    tr: role === 'owner' ? 'Sahip' : 'Üye',
    en: role === 'owner' ? 'Owner' : 'Member',
  };

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Organizasyon Daveti / Organization Invitation</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f5f5f5;
      padding: 20px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .email-header img {
      max-width: 120px;
      max-height: 60px;
      margin-bottom: 20px;
    }
    .email-header h1 {
      color: #ffffff;
      font-size: 24px;
      font-weight: 600;
      margin: 0;
    }
    .email-body {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .highlight {
      color: #2563eb;
      font-weight: 600;
    }
    .role-badge {
      display: inline-block;
      background-color: #dbeafe;
      color: #1e40af;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      margin: 0 4px;
    }
    .cta-button {
      display: block;
      width: 100%;
      background-color: #2563eb;
      color: #ffffff !important;
      text-align: center;
      padding: 16px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 16px;
      font-weight: 600;
      margin: 30px 0;
      transition: background-color 0.2s;
    }
    .cta-button:hover {
      background-color: #1d4ed8;
    }
    .info-box {
      background-color: #f9fafb;
      border-left: 4px solid #2563eb;
      padding: 16px 20px;
      margin: 30px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
    }
    .expires-info {
      text-align: center;
      font-size: 14px;
      color: #6b7280;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      font-size: 14px;
      color: #6b7280;
      margin: 8px 0;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .language-divider {
      margin: 30px 0;
      text-align: center;
      position: relative;
    }
    .language-divider::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 50%;
      height: 1px;
      background-color: #e5e7eb;
    }
    .language-divider span {
      background-color: #ffffff;
      padding: 0 15px;
      color: #9ca3af;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    @media only screen and (max-width: 600px) {
      .email-body {
        padding: 30px 20px;
      }
      .email-header {
        padding: 30px 20px;
      }
      .cta-button {
        padding: 14px 24px;
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="email-header">
      ${orgLogo ? `<img src="${orgLogo}" alt="${orgName}" />` : ''}
      <h1>Closewell</h1>
    </div>

    <!-- Body -->
    <div class="email-body">
      <!-- Turkish Section -->
      <div class="greeting">Merhaba,</div>
      
      <div class="message">
        <strong>${inviterName}</strong> sizi <span class="highlight">${orgName}</span> organizasyonuna 
        <span class="role-badge">${roleText.tr}</span> olarak davet etti.
      </div>

      <a href="${invitationLink}" class="cta-button">
        Daveti Kabul Et
      </a>

      <div class="info-box">
        <p>
          <strong>Not:</strong> Bu daveti kabul etmek için bir hesabınız olması gerekiyor. 
          Hesabınız yoksa, davet linkine tıkladığınızda kayıt olmanız istenecektir.
        </p>
      </div>

      <div class="expires-info">
        Bu davet <strong>${formattedDate}</strong> tarihine kadar geçerlidir.
      </div>

      <!-- Language Divider -->
      <div class="language-divider">
        <span>English</span>
      </div>

      <!-- English Section -->
      <div class="greeting">Hello,</div>
      
      <div class="message">
        <strong>${inviterName}</strong> has invited you to join <span class="highlight">${orgName}</span> 
        as a <span class="role-badge">${roleText.en}</span>.
      </div>

      <a href="${invitationLink}" class="cta-button">
        Accept Invitation
      </a>

      <div class="info-box">
        <p>
          <strong>Note:</strong> You need to have an account to accept this invitation. 
          If you don't have an account, you'll be prompted to sign up when you click the invitation link.
        </p>
      </div>

      <div class="expires-info">
        This invitation expires on <strong>${formattedDate}</strong>.
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        <strong>Closewell</strong> - Real Estate Management System
      </p>
      <p>
        Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.<br>
        This email was sent automatically. Please do not reply.
      </p>
      <p>
        Sorularınız için: <a href="mailto:support@closewell.app">support@closewell.app</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
