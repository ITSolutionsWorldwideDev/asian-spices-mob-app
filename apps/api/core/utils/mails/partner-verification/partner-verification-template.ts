import {
  ASIAN_SPICES_LOGO_BASE64,
  CHECK_CIRCLE_ICON_BASE64,
  CLOCK_CIRCLE_ICON_BASE64,
  AS_CIRCLE_ICON_BASE64,
  TIKTOK_ICON_BASE64,
  INSTAGRAM_ICON_BASE64,
  FACEBOOK_ICON_BASE64,
  YOUTUBE_ICON_BASE64,
  DEFAULT_LOGO_SRC,
  DEFAULT_TIKTOK_SRC,
  DEFAULT_INSTAGRAM_SRC,
  DEFAULT_FACEBOOK_SRC,
  DEFAULT_YOUTUBE_SRC,
  DEFAULT_CHECK_SRC,
  DEFAULT_CLOCK_SRC,
  renderEmailSocialFooter,
} from '../shared';

export interface EmailTemplateData {
  fullName?: string;
  lastName?: string;
  email?: string;
  logoUrl?: string;
  checkCircleUrl?: string;
  clockCircleUrl?: string;
  asCircleUrl?: string;
  tiktokIconUrl?: string;
  instagramIconUrl?: string;
  facebookIconUrl?: string;
  youtubeIconUrl?: string;
}

export function generatePartnerVerificationEmailHtml(data: EmailTemplateData): string {
  const lastName = (data.lastName && data.lastName.trim()) || (data.fullName && data.fullName.trim()) || 'partner';
  
  // Use passed URLs (e.g. cid: attachments) or fallback to CID defaults
  const logoSrc = data.logoUrl || DEFAULT_LOGO_SRC;
  const checkCircleSrc = data.checkCircleUrl || DEFAULT_CHECK_SRC;
  const clockCircleSrc = data.clockCircleUrl || DEFAULT_CLOCK_SRC;
  const asCircleSrc = data.asCircleUrl || DEFAULT_LOGO_SRC;
  const tiktokIconSrc = data.tiktokIconUrl || DEFAULT_TIKTOK_SRC;
  const instagramIconSrc = data.instagramIconUrl || DEFAULT_INSTAGRAM_SRC;
  const facebookIconSrc = data.facebookIconUrl || DEFAULT_FACEBOOK_SRC;
  const youtubeIconSrc = data.youtubeIconUrl || DEFAULT_YOUTUBE_SRC;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="nl">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Welkom als goedgekeurde partner - Asian Spices</title>
  <!--[if gte mso 9]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <!--[if mso]>
  <style type="text/css">
    body, table, td, tr, p, div, span, a, strong, b, em {
      font-family: Arial, 'Segoe UI', Helvetica, sans-serif !important;
    }
    table {
      border-collapse: collapse !important;
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
  </style>
  <![endif]-->
  <!-- Web fonts intentionally omitted: @import in email triggers spam filters -->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse !important; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 0; }
    td, tr { border: 0; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      min-width: 100%;
      background-color: #f1f2f5;
      font-family: 'Plus Jakarta Sans', Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif;
      color: #27272a;
    }

    .email-container {
      border: 0;
    }

    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        border-radius: 0px !important;
      }
      .hero-content-table {
        display: block !important;
        width: 100% !important;
      }
      .hero-left-td, .hero-right-td {
        display: block !important;
        width: 100% !important;
        padding-right: 0 !important;
      }
      .hero-right-td {
        margin-top: 18px !important;
      }
      .mobile-padding {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
      .mobile-social-col {
        display: inline-block !important;
        width: 46% !important;
        max-width: 160px !important;
        margin: 4px 1.5% !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }
    }
  </style>
</head>
<body bgcolor="#f1f2f5" style="margin: 0; padding: 0; background-color: #f1f2f5; -webkit-font-smoothing: antialiased;">
  <!-- Full-width background wrapper table for Outlook/Webmail -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f1f2f5" style="background-color: #f1f2f5; width: 100%; margin: 0; padding: 24px 0 32px 0;">
    <tr>
      <td align="center" valign="top" style="padding: 0 10px;">
        <!--[if (gte mso 9)|(IE)]>
        <table role="presentation" width="620" align="center" cellpadding="0" cellspacing="0" border="0" style="width: 620px;">
          <tr>
            <td width="620" align="center" valign="top">
        <![endif]-->
        <!-- Outer Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" align="center" style="max-width: 620px; width: 100%; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;" class="email-container">
          
          <!-- 1. Header: Brand Logo & Partnerverificatie label -->
          <tr>
            <td style="padding: 20px 34px 16px 34px; border: 0; border: none; mso-border-alt: none;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 0; border: none; mso-border-alt: none;">
                <tr>
                  <td align="left" valign="middle" style="border: 0; border: none; mso-border-alt: none;">
                    <!-- User's Official Asian Spices Logo -->
                    <img src="${logoSrc}" alt="Asian Spices" width="70" height="70" style="display: block; border: 0; width: 70px; height: 70px; max-width: 70px; outline: none;" />
                  </td>
                  <td align="right" valign="middle" style="border: 0; border: none; mso-border-alt: none;">
                <span style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1.6px; color: #71717a; text-transform: uppercase;">
                  PARTNERVERIFICATIE
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- 2. Hero Banner: Clean Light Warm Beige Background -->
      <tr>
        <td style="padding: 0; border: 0; border: none; mso-border-alt: none;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 0; border: none; mso-border-alt: none; background-color: #faf6ef;">
            <tr>
              <td style="padding: 36px 34px 38px 34px; border: 0; border: none; mso-border-alt: none;" class="mobile-padding">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 0; border: none; mso-border-alt: none;" class="hero-content-table">
                  <tr>
                    <!-- Hero Left: Text & Badges (Standard semantic tags, no unnecessary nested tables) -->
                    <td valign="middle" align="left" style="padding-right: 20px; border: 0; border: none; mso-border-alt: none;" class="hero-left-td">
                      <div style="margin-bottom: 12px; border: 0; outline: none;">
                        <span style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 10.5px; font-weight: 800; letter-spacing: 1.4px; color: #c2410c; text-transform: uppercase; background-color: #ffedd5; padding: 5px 9px; border-radius: 5px; display: inline-block; border: 0;">
                          PARTNERVERIFICATIE VOLTOOID
                        </span>
                      </div>
                      <h1 style="margin: 0 0 14px 0; font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 30px; line-height: 1.22; font-weight: 700; color: #18181b; letter-spacing: -0.4px; border: 0;">
                        Welkom als<br />
                        goedgekeurde<br />
                        partner.
                      </h1>
                      <p style="margin: 0; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13.5px; line-height: 21px; mso-line-height-rule: exactly; color: #52525b; max-width: 320px; border: 0;">
                        Uw Asian Spices partneraccount is succesvol geverifieerd en gereed voor gebruik.
                      </p>
                    </td>

                    <!-- Hero Right: Account Status Floating Card -->
                    <td valign="middle" align="center" width="165" style="border: 0; border: none; mso-border-alt: none;" class="hero-right-td">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="150" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 0; border: none; mso-border-alt: none; margin: 0 auto;">
                        <tr>
                          <td style="background-color: #ffffff; border-radius: 14px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); border: 1px solid #e4e4e7; mso-border-alt: solid #e4e4e7 1pt; text-align: center; padding: 22px 14px;">
                            <div style="text-align: center; margin-bottom: 12px; border: 0;">
                              <img src="${checkCircleSrc}" alt="Geverifieerd" width="46" height="46" style="display: block; width: 46px; height: 46px; border: 0; margin: 0 auto; outline: none;" />
                            </div>
                            <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 9.5px; font-weight: 800; letter-spacing: 1.2px; color: #71717a; text-transform: uppercase; margin-bottom: 4px; border: 0;">
                              ACCOUNTSTATUS
                            </div>
                            <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 14.5px; font-weight: 800; color: #18181b; border: 0;">
                              Geverifieerd
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- 3. Salutation & Main Body Paragraphs (Spacious breathing room) -->
      <tr>
        <td style="padding: 36px 34px 26px 34px; border: 0; border: none; mso-border-alt: none;" class="mobile-padding">
          <p style="margin: 0 0 16px 0; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 15px; font-weight: 600; color: #18181b; line-height: 24px; mso-line-height-rule: exactly; border: 0;">
            Geachte heer/mevrouw <span style="color: #c2410c; font-weight: 700; border: none; border-style: none; mso-border-alt: none;">${lastName}</span>,
          </p>
          <p style="margin: 0 0 16px 0; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13.5px; line-height: 24px; mso-line-height-rule: exactly; color: #3f3f46; border: 0;">
            Wij informeren u graag dat de verificatie van uw partneraccount bij Asian Spices succesvol is afgerond.
          </p>
          <p style="margin: 0 0 24px 0; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13.5px; line-height: 24px; mso-line-height-rule: exactly; color: #3f3f46; border: 0;">
            Hartelijk dank voor het tijdig aanleveren van de benodigde gegevens en bedrijfsdocumenten. Uw account is hiermee goedgekeurd en gereed voor gebruik.
          </p>
        </td>
      </tr>

      <!-- 4. Vervolgstappen (Next Steps) - Unified Spacious Card -->
      <tr>
        <td style="padding: 0 34px 24px 34px; border: 0; border: none; mso-border-alt: none;" class="mobile-padding">
          <div style="padding-bottom: 12px; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 15px; font-weight: 800; color: #18181b; border: 0;">
            Vervolgstappen:
          </div>

          <!-- Unified Card for All 3 Steps with Clear Breathing Room -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fffaf5; border: 1px solid #fed7aa; mso-border-alt: solid #fed7aa 1pt; border-radius: 12px; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
            <tr>
              <td style="padding: 20px 22px; border: 0; border: none; mso-border-alt: none;">
                
                <!-- Step 1: Inloggegevens -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                  <tr>
                    <td valign="top" width="22" style="font-size: 16px; color: #c2410c; line-height: 22px; border: 0; border: none; mso-border-alt: none;">&bull;</td>
                    <td valign="top" style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; line-height: 22px; mso-line-height-rule: exactly; color: #27272a; border: 0; border: none; mso-border-alt: none;">
                      <strong style="border: none; border-style: none; mso-border-alt: none;">Inloggegevens:</strong> Om veiligheidsredenen ontvangt u uw definitieve inloggegevens <strong style="color: #9a3412; border: none; border-style: none; mso-border-alt: none;">binnen 24 uur</strong> in een <strong style="color: #9a3412; border: none; border-style: none; mso-border-alt: none;">afzonderlijke e-mail</strong>.
                    </td>
                  </tr>
                </table>

                <!-- Step 2: Toegang -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                  <tr>
                    <td valign="top" width="22" style="font-size: 16px; color: #ea580c; line-height: 22px; border: 0; border: none; mso-border-alt: none;">&bull;</td>
                    <td valign="top" style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; line-height: 22px; mso-line-height-rule: exactly; color: #3f3f46; border: 0; border: none; mso-border-alt: none;">
                      <strong style="border: none; border-style: none; mso-border-alt: none;">Toegang:</strong> Zodra u deze gegevens heeft ontvangen, kunt u direct inloggen op ons B2B-partnerportaal.
                    </td>
                  </tr>
                </table>

                <!-- Step 3: Controle -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                  <tr>
                    <td valign="top" width="22" style="font-size: 16px; color: #ea580c; line-height: 22px; border: 0; border: none; mso-border-alt: none;">&bull;</td>
                    <td valign="top" style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; line-height: 22px; mso-line-height-rule: exactly; color: #3f3f46; border: 0; border: none; mso-border-alt: none;">
                      <strong style="border: none; border-style: none; mso-border-alt: none;">Controle:</strong> Mocht u de e-mail na 24 uur nog niet hebben ontvangen, controleer dan voor de zekerheid uw map met ongewenste e-mail (spam).
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- 5. Timer / Inbox Notice Box -->
      <tr>
        <td style="padding: 0 34px 22px 34px; border: 0; border: none; mso-border-alt: none;" class="mobile-padding">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 0; border: none; mso-border-alt: none;">
            <tr>
              <td style="background-color: #fff1f2; border: 1px solid #ffe4e6; mso-border-alt: solid #ffe4e6 1pt; border-radius: 10px; padding: 16px 20px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 0; border: none; mso-border-alt: none;">
                  <tr>
                    <td valign="middle" width="34" align="left" style="border: 0; border: none; mso-border-alt: none;">
                      <img src="${clockCircleSrc}" alt="24u" width="28" height="28" style="display: block; width: 28px; height: 28px; border: 0; outline: none;" />
                    </td>
                    <td valign="middle" style="padding-left: 12px; border: 0; border: none; mso-border-alt: none;">
                      <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12.5px; font-weight: 800; color: #18181b; border: 0;">
                        Binnen 24 uur in uw inbox
                      </div>
                      <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; line-height: 17px; mso-line-height-rule: exactly; color: #71717a; margin-top: 3px; border: 0;">
                        Uw inloggegevens worden apart verzonden. Asian Spices zal u nooit per e-mail om uw wachtwoord vragen.
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- 6. Support Banner with AS avatar circle badge & Bulletproof Big Button -->
      <tr>
        <td style="padding: 0 34px 32px 34px; border: 0; border: none; mso-border-alt: none;" class="mobile-padding">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef9ee; border-left: 4px solid #d97706; border-radius: 0 12px 12px 0; border-top: 1px solid #fef3c7; border-right: 1px solid #fef3c7; border-bottom: 1px solid #fef3c7; mso-border-left-alt: solid #d97706 3.5pt; mso-border-top-alt: solid #fef3c7 1pt; mso-border-right-alt: solid #fef3c7 1pt; mso-border-bottom-alt: solid #fef3c7 1pt; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
            <tr>
              <td style="padding: 24px 26px; border: 0; border: none; mso-border-alt: none;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 0; border: none; mso-border-alt: none;">
                  <tr>
                    <!-- AS Avatar Badge -->
                    <td valign="top" width="48" align="left" style="padding-right: 18px; border: 0; border: none; mso-border-alt: none;">
                      <img src="${asCircleSrc}" alt="AS" width="46" height="46" style="display: block; width: 46px; height: 46px; border: 0; outline: none;" />
                    </td>
                    <!-- Questions, Copy & Spacious Large Button (Full width breathing room) -->
                    <td valign="top" align="left" style="border: 0; border: none; mso-border-alt: none;">
                      <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1.4px; color: #b45309; text-transform: uppercase; margin-bottom: 4px; border: 0;">
                        PARTNERBEHEER
                      </div>
                      <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 15.5px; font-weight: 800; color: #18181b; margin-bottom: 6px; border: 0;">
                        Kunnen wij u ergens mee helpen?
                      </div>
                      <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12.5px; line-height: 20px; color: #52525b; margin-bottom: 16px; border: 0;">
                        Heeft u vragen over het onboardingsproces of onze zakelijke voorwaarden? Ons team helpt u graag verder.
                      </div>
                      
                      <!-- Prominent Bulletproof Button: Renders full size with padding across all Outlook & Word clients -->
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                        <tr>
                          <td align="center" valign="middle" bgcolor="#c2410c" style="background-color: #c2410c; border-radius: 8px; padding: 12px 24px; mso-padding-alt: 12px 24px; box-shadow: 0 2px 6px rgba(194, 65, 12, 0.25);">
                            <a href="https://www.asianspices.online/contact-us" target="_blank" style="display: block; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, Arial, sans-serif; font-size: 13px; font-weight: 700; color: #ffffff; text-decoration: none; line-height: 100%; white-space: nowrap;">
                              Neem contact op &rarr;
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      ${renderEmailSocialFooter({
        logoUrl: logoSrc,
        tiktokIconUrl: tiktokIconSrc,
        instagramIconUrl: instagramIconSrc,
        facebookIconUrl: facebookIconSrc,
        youtubeIconUrl: youtubeIconSrc,
        signoffText: 'Met vriendelijke groet,<br /><strong style="color: #18181b; font-weight: 800;">Het team van Asian Spices</strong>',
        subtext: 'We kijken uit naar een inspirerende, smaakvolle en langdurige samenwerking. Welkom bij de Asian Spices-familie!',
      })}

        </table>
        <!--[if (gte mso 9)|(IE)]>
            </td>
          </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function generatePartnerVerificationEmailText(data: EmailTemplateData): string {
  const lastName = (data.lastName && data.lastName.trim()) || (data.fullName && data.fullName.trim()) || 'partner';

  return `ASIAN SPICES - PARTNERVERIFICATIE
==================================================

Welkom als goedgekeurde partner.
Uw Asian Spices partneraccount is succesvol geverifieerd en gereed voor gebruik.

Accountstatus: Geverifieerd [✓]

--------------------------------------------------
Geachte heer/mevrouw ${lastName},

Wij informeren u graag dat de verificatie van uw partneraccount bij Asian Spices succesvol is afgerond.

Hartelijk dank voor het tijdig aanleveren van de benodigde gegevens en bedrijfsdocumenten. Uw account is hiermee goedgekeurd en gereed voor gebruik.

VERVOLGSTAPPEN:
• Inloggegevens: Om veiligheidsredenen ontvangt u uw definitieve inloggegevens binnen 24 uur in een afzonderlijke e-mail.
• Toegang: Zodra u deze gegevens heeft ontvangen, kunt u direct inloggen op ons B2B-partnerportaal.
• Controle: Mocht u de e-mail na 24 uur nog niet hebben ontvangen, controleer dan voor de zekerheid uw map met ongewenste e-mail (spam).

Binnen 24 uur in uw inbox:
Uw inloggegevens worden apart verzonden. Asian Spices zal u nooit per e-mail om uw wachtwoord vragen.

PARTNERBEHEER:
Kunnen wij u ergens mee helpen?
Heeft u vragen over het onboardingsproces of onze zakelijke voorwaarden? Ons team helpt u graag verder.
Neem contact op: https://www.asianspices.online/contact-us

--------------------------------------------------
Met vriendelijke groet,
Het team van Asian Spices

Volg ons voor dagelijkse inspiratie op TikTok, Instagram, Facebook en YouTube.
We kijken uit naar een inspirerende, smaakvolle en langdurige samenwerking. Welkom bij de Asian Spices-familie!
`;
}
