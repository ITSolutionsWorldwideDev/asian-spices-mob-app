// core/utils/mails/partner-application/partner-application-template.ts

import {
  DEFAULT_LOGO_SRC,
  DEFAULT_CLOCK_SRC,
  DEFAULT_TIKTOK_SRC,
  DEFAULT_INSTAGRAM_SRC,
  DEFAULT_FACEBOOK_SRC,
  DEFAULT_YOUTUBE_SRC,
  CLOCK_CIRCLE_ICON_BASE64,
  ASIAN_SPICES_LOGO_BASE64,
  TIKTOK_ICON_BASE64,
  INSTAGRAM_ICON_BASE64,
  FACEBOOK_ICON_BASE64,
  YOUTUBE_ICON_BASE64,
  renderEmailSocialFooter,
  escapeHtml,
} from '../shared';

export interface PartnerApplicationEmailData {
  companyName: string;
  firstName?: string;
  email?: string;
  applicationId: string;
  logoUrl?: string;
  clockCircleUrl?: string;
  tiktokIconUrl?: string;
  instagramIconUrl?: string;
  facebookIconUrl?: string;
  youtubeIconUrl?: string;
}

/**
 * Generate Partner Application Submitted (Under Review) HTML Email in Dutch & English context.
 * Styled matching the brand design system (Plus Jakarta Sans, Playfair, Outlook MSO safe).
 */
export function generatePartnerApplicationEmailHtml(data: PartnerApplicationEmailData): string {
  const safeFirstName = escapeHtml((data.firstName && data.firstName.trim()) || 'Partner');
  const safeCompanyName = escapeHtml((data.companyName && data.companyName.trim()) || 'uw onderneming');
  const safeAppId = escapeHtml(data.applicationId || 'APP-PENDING');

  const logoSrc = data.logoUrl || DEFAULT_LOGO_SRC || ASIAN_SPICES_LOGO_BASE64;
  const clockCircleSrc = data.clockCircleUrl || DEFAULT_CLOCK_SRC || CLOCK_CIRCLE_ICON_BASE64;
  const tiktokIconSrc = data.tiktokIconUrl || DEFAULT_TIKTOK_SRC || TIKTOK_ICON_BASE64;
  const instagramIconSrc = data.instagramIconUrl || DEFAULT_INSTAGRAM_SRC || INSTAGRAM_ICON_BASE64;
  const facebookIconSrc = data.facebookIconUrl || DEFAULT_FACEBOOK_SRC || FACEBOOK_ICON_BASE64;
  const youtubeIconSrc = data.youtubeIconUrl || DEFAULT_YOUTUBE_SRC || YOUTUBE_ICON_BASE64;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="nl">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Aanvraag Partneraccount Ontvangen - Asian Spices</title>
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
<body style="margin: 0; padding: 0; background-color: #f1f2f5; -webkit-font-smoothing: antialiased; word-break: break-word;">
  <!-- Outer Canvas -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f1f2f5" style="background-color: #f1f2f5; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
    <tr>
      <td align="center" style="padding: 28px 12px 40px 12px; border: 0;">
        <!--[if (gte mso 9)|(IE)]>
        <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" width="600">
          <tr>
            <td align="center" valign="top" width="600">
        <![endif]-->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
          
          <!-- 1. Header with Logo -->
          <tr>
            <td style="background-color: #ffffff; padding: 26px 34px 20px 34px; border-bottom: 1px solid #f4f4f5; text-align: left;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                <tr>
                  <td valign="middle" align="left" style="border: 0;">
                    <a href="https://www.asianspices.online" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${logoSrc}" alt="Asian Spices" width="138" style="display: block; width: 138px; max-width: 138px; height: auto; border: 0;" />
                    </a>
                  </td>
                  <td valign="middle" align="right" style="border: 0;">
                    <span style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.8px;">
                      Partner Netwerk
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 2. Hero Banner: Amber / Pending Review -->
          <tr>
            <td style="padding: 0; border: 0; background-color: #fbf7ee;">
              <div style="padding: 34px 34px 34px 34px;" class="mobile-padding">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="hero-content-table" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                  <tr>
                    <td valign="middle" align="left" style="padding-right: 20px; border: 0;" class="hero-left-td">
                      <div style="margin-bottom: 12px;">
                        <span style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 1.2px; color: #b45309; text-transform: uppercase; background-color: #fef3c7; padding: 5px 10px; border-radius: 6px; display: inline-block;">
                          AANVRAAG IN BEHANDELING
                        </span>
                      </div>
                      <h1 style="margin: 0 0 12px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; line-height: 1.25; font-weight: 700; color: #18181b; letter-spacing: -0.3px;">
                        Aanvraag succesvol ontvangen!
                      </h1>
                      <p style="margin: 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; line-height: 22px; color: #52525b; max-width: 320px;">
                        Hartelijk dank voor uw registratie als partner bij Asian Spices. Onze onboardingdesk beoordeelt momenteel uw bedrijfsgegevens.
                      </p>
                    </td>

                    <td valign="middle" align="center" width="165" style="border: 0;" class="hero-right-td">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="150" style="border-collapse: collapse; margin: 0 auto;">
                        <tr>
                          <td style="background-color: #ffffff; border-radius: 14px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); border: 1px solid #e4e4e7; text-align: center; padding: 22px 14px;">
                            <div style="text-align: center; margin-bottom: 12px;">
                              <img src="${clockCircleSrc}" alt="In beoordeling" width="46" height="46" style="display: block; width: 46px; height: 46px; border: 0; margin: 0 auto;" />
                            </div>
                            <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 9.5px; font-weight: 800; letter-spacing: 1.2px; color: #71717a; text-transform: uppercase; margin-bottom: 4px;">
                              STATUS
                            </div>
                            <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; font-weight: 800; color: #d97706;">
                              In Behandeling
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- 3. Salutation & Context -->
          <tr>
            <td style="padding: 34px 34px 20px 34px; border: 0;" class="mobile-padding">
              <p style="margin: 0 0 16px 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #18181b; line-height: 24px;">
                Beste <span style="color: #ea580c; font-weight: 700;">${safeFirstName}</span>,
              </p>
              <p style="margin: 0 0 16px 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; line-height: 24px; color: #3f3f46;">
                Wij hebben uw partneraanvraag voor <strong>${safeCompanyName}</strong> in goede orde ontvangen. We verheugen ons op een succesvolle samenwerking binnen het zakelijke Asian Spices-verkopersnetwerk.
              </p>
              <p style="margin: 0 0 20px 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; line-height: 24px; color: #3f3f46;">
                Uw aanvraag wordt op dit moment gecontroleerd door ons onboarding-team. U kunt uw dossier volgen met uw unieke referentienummer:
              </p>

              <!-- Application ID Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fffaf5; border: 1px solid #fed7aa; border-left: 4px solid #ea580c; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 18px;">
                    <div style="font-size: 12px; font-weight: 700; color: #9a3412; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">
                      Aanvraag Referentienummer
                    </div>
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 18px; font-weight: 800; color: #ea580c; letter-spacing: 0.5px;">
                      ${safeAppId}
                    </div>
                    <div style="font-size: 12px; color: #71717a; margin-top: 4px;">
                      Bedrijfsnaam: <strong style="color: #27272a;">${safeCompanyName}</strong>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 4. Next Steps -->
          <tr>
            <td style="padding: 0 34px 28px 34px; border: 0;" class="mobile-padding">
              <div style="padding-bottom: 12px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 15px; font-weight: 800; color: #18181b;">
                Wat gebeurt er nu?
              </div>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px 22px;">
                    <!-- Step 1 -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px;">
                      <tr>
                        <td valign="top" width="22" style="font-size: 16px; color: #ea580c; line-height: 22px;">&bull;</td>
                        <td valign="top" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; line-height: 22px; color: #27272a;">
                          <strong>KVK- &amp; Btw-verificatie:</strong> Onze afdeling controleert uw Kamer van Koophandel-uittreksel en btw-gegevens.
                        </td>
                      </tr>
                    </table>

                    <!-- Step 2 -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px;">
                      <tr>
                        <td valign="top" width="22" style="font-size: 16px; color: #ea580c; line-height: 22px;">&bull;</td>
                        <td valign="top" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; line-height: 22px; color: #27272a;">
                          <strong>Goedkeuring &amp; Toegang:</strong> Zodra uw dossier is goedgekeurd, ontvangt u een aparte e-mail met uw persoonlijke inloggegevens voor het B2B-partnerportaal.
                        </td>
                      </tr>
                    </table>

                    <!-- Step 3 -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td valign="top" width="22" style="font-size: 16px; color: #ea580c; line-height: 22px;">&bull;</td>
                        <td valign="top" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; line-height: 22px; color: #27272a;">
                          <strong>Starten met Verkopen:</strong> Na activatie kunt u direct uw assortiment beheren en bestellingen verwerken.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 5. Support / Contact Card -->
          <tr>
            <td style="padding: 0 34px 28px 34px; border: 0;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; border-radius: 12px;">
                <tr>
                  <td style="padding: 18px 22px;">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; font-weight: 700; color: #18181b; margin-bottom: 4px;">
                      Vragen over uw aanvraag of documenten?
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; line-height: 20px; color: #52525b;">
                      Reageer gerust direct op deze e-mail of neem contact op via <a href="mailto:partners@asianspices.com" style="color: #ea580c; text-decoration: underline; font-weight: 600;">partners@asianspices.com</a>.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 6. Footer -->
          ${renderEmailSocialFooter({
            logoUrl: logoSrc,
            tiktokIconUrl: tiktokIconSrc,
            instagramIconUrl: instagramIconSrc,
            facebookIconUrl: facebookIconSrc,
            youtubeIconUrl: youtubeIconSrc,
            signoffText: 'Met vriendelijke groet,<br /><strong style="color: #18181b; font-weight: 800;">Het team van Asian Spices</strong>',
            subtext: 'We kijken uit naar een succesvolle samenwerking binnen het Asian Spices Partner Netwerk.',
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

export function generatePartnerApplicationEmailText(data: PartnerApplicationEmailData): string {
  const safeFirstName = (data.firstName && data.firstName.trim()) || 'Partner';
  const safeCompanyName = (data.companyName && data.companyName.trim()) || 'uw onderneming';
  const safeAppId = data.applicationId || 'APP-PENDING';

  return `ASIAN SPICES - PARTNERAANVRAAG ONTVANGEN
==================================================

Aanvraag succesvol ontvangen!
Status: In Behandeling [Aanvraag in review]

--------------------------------------------------
Beste ${safeFirstName},

Wij hebben uw partneraanvraag voor ${safeCompanyName} in goede orde ontvangen.
Hartelijk dank voor uw registratie. We verheugen ons op een succesvolle samenwerking binnen ons netwerk.

Uw aanvraag wordt op dit moment gecontroleerd door ons onboarding-team.

REFERENTIEDETAILS:
• Bedrijfsnaam: ${safeCompanyName}
• Aanvraag Referentienummer: ${safeAppId}

WAT GEBEURT ER NU?
• KVK- & Btw-verificatie: Onze afdeling controleert uw Kamer van Koophandel-uittreksel en btw-gegevens.
• Goedkeuring & Toegang: Zodra uw dossier is goedgekeurd, ontvangt u een aparte e-mail met uw persoonlijke inloggegevens voor het B2B-partnerportaal.
• Starten met Verkopen: Na activatie kunt u direct uw assortiment beheren en bestellingen verwerken.

Vragen over uw aanvraag of documenten?
Reageer direct op deze e-mail of neem contact op via:
partners@asianspices.com | https://www.asianspices.online/contact-us

--------------------------------------------------
Met vriendelijke groet,
Het team van Asian Spices

Volg ons op TikTok, Instagram, Facebook en YouTube.
© 2026 Asian Spices Merchant Network. All rights reserved.
`;
}
