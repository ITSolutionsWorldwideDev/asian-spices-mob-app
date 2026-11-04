import {
  ASIAN_SPICES_LOGO_BASE64,
  TIKTOK_ICON_BASE64,
  INSTAGRAM_ICON_BASE64,
  FACEBOOK_ICON_BASE64,
  YOUTUBE_ICON_BASE64,
  DEFAULT_LOGO_SRC,
  DEFAULT_TIKTOK_SRC,
  DEFAULT_INSTAGRAM_SRC,
  DEFAULT_FACEBOOK_SRC,
  DEFAULT_YOUTUBE_SRC,
  renderEmailSocialFooter,
} from '../shared';

export interface ProcessedReturnItem {
  name: string;
  sku?: string;
  imageUrl?: string;
  quantity: number | string;
  amount: number | string;
}

export interface ReturnProcessedEmailData {
  orderNumber?: string;
  firstName?: string;
  lastName?: string;
  accountUrl?: string;
  customerFeedback?: string;
  items?: ProcessedReturnItem[];
  totalRefundAmount?: number | string;
  helpPageUrl?: string;
  supportEmail?: string;
  phoneNumber?: string;
  openingHours?: string;
  logoUrl?: string;
  tiktokIconUrl?: string;
  instagramIconUrl?: string;
  facebookIconUrl?: string;
  youtubeIconUrl?: string;
}

/**
 * Generate Order Return Processed Confirmation HTML Email ("Goed nieuws, uw retour is verwerkt").
 * Exact implementation matching design screenshots:
 * - Header with "RETOUR VERWERKT" green badge
 * - Hero with green check circle, Playfair title, CTA button, and 3-pill status row:
 *   [✓ Retour ontvangen] [✓ Artikel gecontroleerd] [✓ Retour goedgekeurd]
 * - "Klantreactie / Waarom deze bestelling werd geannuleerd" box
 * - "Verwerkte artikelen / Dit hebben wij ontvangen" table
 * - Soft green total refunded highlight banner ("€ {{Totaal_Retourbedrag}}")
 * - Financial resolution box ("Wat gebeurt er met uw betaling?") with 3 cards:
 *   1. Vooraf betaald (iDEAL, Bancontact, creditcard) -> TERUGBETALING GESTART
 *   2. Achteraf betalen (Klarna, Riverty) -> FACTUUR AANGEPAST
 *   3. Spaarpunten gebruikt -> PUNTEN BIJGEWERKT
 * - 5–14 werkdagen highlight box
 * - "Goed om te weten" FAQ section
 * - "Alles op één plek" AS green badge card with button to account
 * - Customer Support Banner & Outlook/Gmail bulletproof footer
 */
export function generateReturnProcessedEmailHtml(data: ReturnProcessedEmailData = {}): string {
  const orderNumber = (data.orderNumber && data.orderNumber.trim()) || '{{Bestelnummer}}';
  const rawFirstName = (data.firstName && data.firstName.trim()) || '';
  const firstName = rawFirstName && rawFirstName.toLowerCase() !== 'klant' && !rawFirstName.includes('{{') ? rawFirstName : '';
  const totalRefundAmount = data.totalRefundAmount !== undefined ? `${data.totalRefundAmount}` : '0.00';
  const customerFeedback = data.customerFeedback || '';

  const accountUrl = data.accountUrl || 'https://www.asianspices.online/account';
  const helpPageUrl = data.helpPageUrl || 'https://www.asianspices.online/contact-us';
  const supportEmail = data.supportEmail || 'klantenservice@asianspices.nl';
  const phoneNumber = data.phoneNumber || '06 44844844';
  const openingHours = data.openingHours || 'Ma t/m vr &middot; 07:00&ndash;15:00';

  const logoSrc = data.logoUrl || DEFAULT_LOGO_SRC || ASIAN_SPICES_LOGO_BASE64;
  const tiktokIconSrc = data.tiktokIconUrl || DEFAULT_TIKTOK_SRC || TIKTOK_ICON_BASE64;
  const instagramIconSrc = data.instagramIconUrl || DEFAULT_INSTAGRAM_SRC || INSTAGRAM_ICON_BASE64;
  const facebookIconSrc = data.facebookIconUrl || DEFAULT_FACEBOOK_SRC || FACEBOOK_ICON_BASE64;
  const youtubeIconSrc = data.youtubeIconUrl || DEFAULT_YOUTUBE_SRC || YOUTUBE_ICON_BASE64;

  const items: ProcessedReturnItem[] = (data.items && data.items.length > 0) ? data.items : [
    {
      name: '{{Productnaam}}',
      sku: '{{SKU}}',
      quantity: '{{Aantal}}',
      amount: '{{Bedrag}}',
    },
  ];

  const itemsHtml = items.map((item, index) => {
    const isLast = index === items.length - 1;
    const borderStyle = isLast ? '' : 'border-bottom: 1px solid #f4f4f5;';
    const itemImg = item.imageUrl || null;
    return `
      <tr>
        <td style="padding: 14px 16px; ${borderStyle} vertical-align: middle;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              ${itemImg ? `<td width="48" valign="middle" style="padding-right: 12px;"><img src="${itemImg}" alt="${item.name}" width="46" height="46" style="display: block; width: 46px; height: 46px; border-radius: 8px; object-fit: cover; border: 1px solid #e4e4e7;" /></td>` : ''}
              <td valign="middle">
                <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; font-weight: 700; color: #18181b; line-height: 18px;">
                  ${item.name}
                </div>
                ${item.sku ? `
                <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; color: #71717a; margin-top: 3px;">
                  Artikelnummer: ${item.sku}
                </div>
                ` : ''}
              </td>
            </tr>
          </table>
        </td>
        <td align="center" style="padding: 14px 12px; ${borderStyle} font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 500; color: #27272a; vertical-align: middle; white-space: nowrap;">
          ${item.quantity}x
        </td>
        <td align="right" style="padding: 14px 16px; ${borderStyle} font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; font-weight: 800; color: #18181b; vertical-align: middle; white-space: nowrap;">
          &euro; ${item.amount}
        </td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="nl">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Goed nieuws, uw retour is verwerkt - Asian Spices</title>
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
      .mobile-padding {
        padding-left: 18px !important;
        padding-right: 18px !important;
      }
      .mobile-pill-col {
        display: block !important;
        width: 100% !important;
        margin-bottom: 8px !important;
        padding: 0 !important;
      }
      .mobile-status-col {
        display: block !important;
        width: 100% !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        border-right: none !important;
        border-bottom: 1px solid #f1f2f5 !important;
        padding-bottom: 10px !important;
        margin-bottom: 10px !important;
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
<body bgcolor="#f1f2f5" style="margin: 0; padding: 0; background-color: #f1f2f5; -webkit-font-smoothing: antialiased; word-break: break-word;">
  <!-- Preheader text -->
  <div style="display: none; font-size: 1px; color: #f1f2f5; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Goed nieuws! Uw retour voor bestelling #${orderNumber} is succesvol gecontroleerd en verwerkt.
  </div>

  <!-- Full-width Canvas -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f1f2f5" style="background-color: #f1f2f5; width: 100%; margin: 0; padding: 24px 0 32px 0;">
    <tr>
      <td align="center" valign="top" style="padding: 0 10px;">
        <!--[if (gte mso 9)|(IE)]>
        <table role="presentation" width="620" align="center" cellpadding="0" cellspacing="0" border="0" style="width: 620px;">
          <tr>
            <td width="620" align="center" valign="top">
        <![endif]-->
        
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" align="center" style="max-width: 620px; width: 100%; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;" class="email-container">
          
          <!-- 1. Header: Brand Logo & Right "RETOUR VERWERKT" badge -->
          <tr>
            <td style="padding: 22px 34px 18px 34px; border: 0;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" valign="middle">
                    <img src="${logoSrc}" alt="Asian Spices" width="70" height="70" style="display: block; border: 0; width: 70px; height: 70px; max-width: 70px; outline: none;" />
                  </td>
                  <td align="right" valign="middle">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" bgcolor="#e8f5e9" style="background-color: #e8f5e9; border-radius: 14px; border: 1px solid #dcece2;">
                      <tr>
                        <td style="padding: 6px 14px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1.2px; color: #166534; text-transform: uppercase;">
                          RETOUR VERWERKT
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 2. Hero Section: Warm background with Green Check Circle, Title & 3-Pill Status row -->
          <tr>
            <td bgcolor="#fffdfa" style="background-color: #fffdfa; padding: 36px 30px 32px 30px; text-align: center; border-top: 1px solid #fef3c7; border-bottom: 1px solid #fef3c7;" class="mobile-padding">
              
              <!-- Check Badge (Dark Green Circle) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 14px auto;">
                <tr>
                  <td align="center" valign="middle" width="46" height="46" bgcolor="#1b4332" style="background-color: #1b4332; width: 46px; height: 46px; border-radius: 50%; text-align: center;">
                    <span style="color: #ffffff; font-size: 20px; font-weight: 800; line-height: 46px;">&#10003;</span>
                  </td>
                </tr>
              </table>

              <!-- Eyebrow -->
              <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #c2410c; text-transform: uppercase; margin-bottom: 8px;">
                CONTROLE SUCCESVOL AFGEROND
              </div>

              <!-- Main Title -->
              <h1 style="margin: 0 0 10px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; line-height: 36px; font-weight: 700; color: #18181b;">
                Goed nieuws, uw retour is<br />verwerkt.
              </h1>

              <!-- Subtitle -->
              <p style="margin: 0 auto 24px auto; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; line-height: 20px; color: #52525b; max-width: 460px;">
                Beste <strong style="color: #18181b;">${firstName}</strong>, we hebben uw retourzending ontvangen en gecontroleerd in ons distributiecentrum. De retouraanvraag is hiermee succesvol afgehandeld.
              </p>

              <!-- CTA Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 28px auto;">
                <tr>
                  <td align="center" valign="middle" bgcolor="#c2410c" style="background-color: #c2410c; border-radius: 8px; padding: 13px 28px; box-shadow: 0 3px 10px rgba(194, 65, 12, 0.25);">
                    <a href="${accountUrl}" target="_blank" style="display: block; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; font-weight: 700; color: #ffffff; text-decoration: none; line-height: 100%; white-space: nowrap;">
                      Bekijk de status in uw account &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- 3-Pill Status Row: [✓ Retour ontvangen] [✓ Artikel gecontroleerd] [✓ Retour goedgekeurd] -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" width="100%" style="max-width: 520px; margin: 0 auto;">
                <tr>
                  <!-- Pill 1 -->
                  <td width="32%" valign="middle" class="mobile-pill-col">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 20px; padding: 8px 10px;">
                      <tr>
                        <td width="18" valign="middle" align="center">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="16" height="16" bgcolor="#1b4332" style="background-color: #1b4332; border-radius: 50%; text-align: center;">
                            <tr>
                              <td align="center" valign="middle" style="color: #ffffff; font-size: 9px; line-height: 16px; font-weight: 800;">&#10003;</td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle" style="padding-left: 6px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; font-weight: 700; color: #18181b; white-space: nowrap;">
                          Retour ontvangen
                        </td>
                      </tr>
                    </table>
                  </td>

                  <td width="2%"></td>

                  <!-- Pill 2 -->
                  <td width="32%" valign="middle" class="mobile-pill-col">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 20px; padding: 8px 10px;">
                      <tr>
                        <td width="18" valign="middle" align="center">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="16" height="16" bgcolor="#1b4332" style="background-color: #1b4332; border-radius: 50%; text-align: center;">
                            <tr>
                              <td align="center" valign="middle" style="color: #ffffff; font-size: 9px; line-height: 16px; font-weight: 800;">&#10003;</td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle" style="padding-left: 6px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; font-weight: 700; color: #18181b; white-space: nowrap;">
                          Artikel gecontroleerd
                        </td>
                      </tr>
                    </table>
                  </td>

                  <td width="2%"></td>

                  <!-- Pill 3 -->
                  <td width="32%" valign="middle" class="mobile-pill-col">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 20px; padding: 8px 10px;">
                      <tr>
                        <td width="18" valign="middle" align="center">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="16" height="16" bgcolor="#1b4332" style="background-color: #1b4332; border-radius: 50%; text-align: center;">
                            <tr>
                              <td align="center" valign="middle" style="color: #ffffff; font-size: 9px; line-height: 16px; font-weight: 800;">&#10003;</td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle" style="padding-left: 6px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; font-weight: 700; color: #18181b; white-space: nowrap;">
                          Retour goedgekeurd
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- 3. Section: "KLANTREACTIE / Waarom deze bestelling werd geannuleerd" -->
          <tr>
            <td style="padding: 28px 30px 20px 30px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border: 1px solid #edf0f3; border-radius: 16px; padding: 22px;">
                <tr>
                  <td>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #ea580c; text-transform: uppercase; margin-bottom: 4px;">
                      KLANTREACTIE
                    </div>
                    <h2 style="margin: 0 0 16px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #18181b;">
                      Waarom deze bestelling werd geannuleerd
                    </h2>

                    <!-- Quote box -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#fdfaf6" style="background-color: #fdfaf6; border-radius: 10px; border: 1px solid #f4ebd9; padding: 16px; margin-bottom: 10px;">
                      <tr>
                        <td>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1px; color: #c2410c; text-transform: uppercase; margin-bottom: 6px;">
                            VOORBEELDREACTIE
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; line-height: 19px; color: #52525b; font-style: italic;">
                            &ldquo;${customerFeedback}&rdquo;
                          </div>
                        </td>
                      </tr>
                    </table>

                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; color: #a1a1aa;">
                      Dit is een illustratief voorbeeld van een klantreactie en niet een echte beoordeling.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 4. Section: "VERWERKTE ARTIKELEN / Dit hebben wij ontvangen" -->
          <tr>
            <td style="padding: 0 30px 24px 30px;" class="mobile-padding">
              
              <!-- Section Header -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px;">
                <tr>
                  <td align="left" valign="bottom">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; font-weight: 800; letter-spacing: 1.6px; color: #ea580c; text-transform: uppercase;">
                      VERWERKTE ARTIKELEN
                    </div>
                    <h2 style="margin: 4px 0 0 0; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #18181b;">
                      Dit hebben wij ontvangen
                    </h2>
                  </td>
                  <td align="right" valign="bottom" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #71717a;">
                    #${orderNumber}
                  </td>
                </tr>
              </table>

              <!-- Products Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 14px; border: 1px solid #edf0f3; overflow: hidden; margin-bottom: 16px;">
                <tr bgcolor="#fafafa" style="background-color: #fafafa; border-bottom: 1px solid #edf0f3;">
                  <th align="left" style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1px; color: #71717a; text-transform: uppercase;">
                    ARTIKEL
                  </th>
                  <th align="center" style="padding: 10px 12px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1px; color: #71717a; text-transform: uppercase;">
                    AANTAL
                  </th>
                  <th align="right" style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1px; color: #71717a; text-transform: uppercase;">
                    VERWERKT BEDRAG
                  </th>
                </tr>
                ${itemsHtml}
              </table>

              <!-- Soft Green Total Returned Banner -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f2f7f4" style="background-color: #f2f7f4; border-radius: 12px; border: 1px solid #dcece2; padding: 14px 18px;">
                <tr>
                  <td align="left" valign="middle">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 800; color: #18181b;">
                      Totaal verwerkt retourbedrag
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; color: #71717a; margin-top: 2px;">
                      Voor bestelling #${orderNumber}
                    </div>
                  </td>
                  <td align="right" valign="middle" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 20px; font-weight: 800; color: #166534; white-space: nowrap;">
                    &euro; ${totalRefundAmount}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- 5. Section: "DE FINANCIËLE AFHANDELING / Wat gebeurt er met uw betaling?" -->
          <tr>
            <td style="padding: 0 30px 24px 30px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#fffdfa" style="background-color: #fffdfa; border-radius: 16px; border: 1px solid #fef3c7; padding: 22px;">
                <tr>
                  <td>
                    <!-- Section Title -->
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; font-weight: 800; letter-spacing: 1.5px; color: #ea580c; text-transform: uppercase; margin-bottom: 4px;">
                      DE FINANCI&Euml;LE AFHANDELING
                    </div>
                    <h2 style="margin: 0 0 18px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #18181b;">
                      Wat gebeurt er met uw betaling?
                    </h2>

                    <!-- Card 1: Vooraf betaald -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 12px; border: 1px solid #edf0f3; padding: 16px; margin-bottom: 12px;">
                      <tr>
                        <td width="38" valign="top">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="32" height="32" bgcolor="#e8f5e9" style="background-color: #e8f5e9; border-radius: 50%; text-align: center;">
                            <tr>
                              <td align="center" valign="middle" style="font-size: 14px;">&#128179;</td>
                            </tr>
                          </table>
                        </td>
                        <td valign="top" style="padding-left: 10px;">
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 800; color: #18181b;">
                            Vooraf betaald
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; color: #71717a; margin-top: 1px; margin-bottom: 6px;">
                            iDEAL, Bancontact of creditcard
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; line-height: 18px; color: #52525b; margin-bottom: 8px;">
                            &euro; ${totalRefundAmount} wordt binnen 5 tot 14 werkdagen teruggestort op de rekening of creditcard waarmee u heeft afgerekend.
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; color: #166534; letter-spacing: 0.5px;">
                            &#10003; TERUGBETALING GESTART
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Card 2: Achteraf betalen -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 12px; border: 1px solid #edf0f3; padding: 16px; margin-bottom: 12px;">
                      <tr>
                        <td width="38" valign="top">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="32" height="32" bgcolor="#e8f5e9" style="background-color: #e8f5e9; border-radius: 50%; text-align: center;">
                            <tr>
                              <td align="center" valign="middle" style="font-size: 14px;">&#128196;</td>
                            </tr>
                          </table>
                        </td>
                        <td valign="top" style="padding-left: 10px;">
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 800; color: #18181b;">
                            Achteraf betalen
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; color: #71717a; margin-top: 1px; margin-bottom: 6px;">
                            Klarna of Riverty
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; line-height: 18px; color: #52525b; margin-bottom: 8px;">
                            U hoeft het geretourneerde artikel niet meer te betalen. De factuur is automatisch aangepast; alleen een eventueel restbedrag blijft actief.
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; color: #166534; letter-spacing: 0.5px;">
                            &#10003; FACTUUR AANGEPAST
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Card 3: Spaarpunten gebruikt -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 12px; border: 1px solid #edf0f3; padding: 16px; margin-bottom: 16px;">
                      <tr>
                        <td width="38" valign="top">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="32" height="32" bgcolor="#e8f5e9" style="background-color: #e8f5e9; border-radius: 50%; text-align: center;">
                            <tr>
                              <td align="center" valign="middle" style="font-size: 14px;">&#11088;</td>
                            </tr>
                          </table>
                        </td>
                        <td valign="top" style="padding-left: 10px;">
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 800; color: #18181b;">
                            Spaarpunten gebruikt
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; color: #71717a; margin-top: 1px; margin-bottom: 6px;">
                            Asian Spices spaarprogramma
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; line-height: 18px; color: #52525b; margin-bottom: 8px;">
                            De bij deze aankoop ingezette punten zijn weer netjes bijgeschreven op uw accountsaldo en direct opnieuw te gebruiken.
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; color: #166534; letter-spacing: 0.5px;">
                            &#10003; PUNTEN BIJGEWERKT
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- 5-14 werkdagen highlight box -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#fff7ed" style="background-color: #fff7ed; border-radius: 10px; border: 1px solid #fed7aa; padding: 14px 16px;">
                      <tr>
                        <td width="60" valign="middle" style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 700; color: #b45309; line-height: 1;">
                          5&ndash;14
                        </td>
                        <td valign="middle" style="padding-left: 10px;">
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 800; color: #18181b;">
                            werkdagen tot het bedrag zichtbaar is
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; color: #71717a; margin-top: 2px;">
                            De precieze verwerkingstijd hangt af van uw bank of creditcardmaatschappij.
                          </div>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 6. Section: "VEELGESTELDE VRAGEN / Goed om te weten" -->
          <tr>
            <td style="padding: 0 30px 24px 30px;" class="mobile-padding">
              <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; font-weight: 800; letter-spacing: 1.5px; color: #ea580c; text-transform: uppercase; margin-bottom: 4px;">
                VEELGESTELDE VRAGEN
              </div>
              <h2 style="margin: 0 0 16px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #18181b;">
                Goed om te weten
              </h2>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <!-- FAQ Item 1 -->
                <tr>
                  <td style="padding: 12px 0 8px 0; border-top: 1px solid #f1f2f5;">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 800; color: #18181b; margin-bottom: 6px;">
                      <span style="color: #71717a; margin-right: 4px;">&#9662;</span> Ik heb meer artikelen teruggestuurd dan in dit overzicht staan
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; line-height: 18px; color: #52525b;">
                      Artikelen worden soms per stuk uitgepakt en gecontroleerd. Zodra een volgend artikel is goedgekeurd, ontvangt u daarvoor direct een aparte e-mailbevestiging.
                    </div>
                  </td>
                </tr>

                <!-- FAQ Item 2 -->
                <tr>
                  <td style="padding: 12px 0; border-top: 1px solid #f1f2f5; border-bottom: 1px solid #f1f2f5;">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 800; color: #18181b; margin-bottom: 4px;">
                      <span style="color: #71717a; margin-right: 4px;">&#9662;</span> Waar vind ik mijn bijgewerkte factuur?
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; line-height: 18px; color: #52525b;">
                      U vindt uw bijgewerkte factuur direct in uw persoonlijke account onder &apos;Bestellingen &amp; Facturen&apos;.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 7. Section: "ALLES OP ÉÉN PLEK / Uw retourstatus en factuur staan in uw account" -->
          <tr>
            <td style="padding: 0 30px 24px 30px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f0fdf4" style="background-color: #f0fdf4; border-left: 4px solid #166534; border-radius: 0 12px 12px 0; border-top: 1px solid #dcece2; border-right: 1px solid #dcece2; border-bottom: 1px solid #dcece2; padding: 18px 20px;">
                <tr>
                  <td>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <!-- AS Badge -->
                        <td width="48" valign="middle">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="44" height="44" bgcolor="#1b4332" style="background-color: #1b4332; border-radius: 50%; text-align: center;">
                            <tr>
                              <td align="center" valign="middle" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 14px; font-weight: 800; color: #ffffff;">
                                AS
                              </td>
                            </tr>
                          </table>
                        </td>

                        <!-- Text -->
                        <td valign="middle" style="padding-left: 14px;">
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1.4px; color: #ea580c; text-transform: uppercase;">
                            ALLES OP &Eacute;&Eacute;N PLEK
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 14px; font-weight: 800; color: #18181b; margin-top: 2px;">
                            Uw retourstatus en factuur staan in uw account.
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; color: #52525b; margin-top: 2px;">
                            Bekijk de actuele verwerking, uw bijgewerkte factuur en eerdere bestellingen wanneer het u uitkomt.
                          </div>
                        </td>

                        <!-- Button -->
                        <td width="150" align="right" valign="middle" style="padding-left: 12px; white-space: nowrap;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" valign="middle" bgcolor="#c2410c" style="background-color: #c2410c; border-radius: 8px; padding: 10px 18px;">
                                <a href="${accountUrl}" target="_blank" style="display: block; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #ffffff; text-decoration: none; line-height: 100%; white-space: nowrap;">
                                  Naar mijn account &rarr;
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

          <!-- 8. Customer Support Banner: "HEEFT U ONS NODIG? / Onze klantenservice staat voor u klaar." -->
          <tr>
            <td style="padding: 0 30px 30px 30px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#fff9f0" style="background-color: #fff9f0; border-left: 4px solid #ea580c; border-radius: 0 12px 12px 0; border-top: 1px solid #fef3c7; border-right: 1px solid #fef3c7; border-bottom: 1px solid #fef3c7; padding: 22px;">
                <tr>
                  <td>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <!-- Left Details -->
                        <td valign="top" class="mobile-status-col">
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1.4px; color: #c2410c; text-transform: uppercase; margin-bottom: 4px;">
                            HEEFT U ONS NODIG?
                          </div>
                          <h3 style="margin: 0 0 6px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 700; color: #18181b;">
                            Onze klantenservice staat voor u klaar.
                          </h3>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; color: #52525b; margin-bottom: 14px;">
                            Heeft u vragen over uw terugbetaling of een vervangend product? Vermeld altijd bestelnummer <strong style="color: #18181b;">#${orderNumber}</strong>.
                          </div>
                          <div style="margin-bottom: 16px;">
                            <a href="${helpPageUrl}" target="_blank" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; font-weight: 800; color: #c2410c; text-decoration: none;">
                              Naar de klantenservicepagina &rarr;
                            </a>
                          </div>

                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1.2px; color: #c2410c; text-transform: uppercase;">
                            ONZE E-MAILSERVICE IS 24/7 BESCHIKBAAR.
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; color: #71717a; margin-top: 2px;">
                            Reactietijd binnen 24 uur.
                          </div>
                        </td>

                        <!-- Right Contact Info -->
                        <td valign="top" align="right" class="mobile-status-col" style="text-align: right;">
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; font-weight: 800; color: #166534; margin-bottom: 4px;">
                            <a href="mailto:${supportEmail}" style="color: #166534; text-decoration: none;">${supportEmail}</a>
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; font-weight: 800; color: #166534; margin-bottom: 6px;">
                            <a href="tel:${phoneNumber.replace(/[^0-9+]/g, '')}" style="color: #166534; text-decoration: none;">${phoneNumber}</a>
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; color: #71717a;">
                            ${openingHours}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 9. Shared Bulletproof Social Footer -->
          ${renderEmailSocialFooter({
            logoUrl: logoSrc,
            tiktokIconUrl: tiktokIconSrc,
            instagramIconUrl: instagramIconSrc,
            facebookIconUrl: facebookIconSrc,
            youtubeIconUrl: youtubeIconSrc,
            signoffText: 'Met vriendelijke groet,<br /><strong style="color: #18181b; font-weight: 800;">Het team van Asian Spices</strong>',
            subtext: 'U ontvangt deze e-mail ter bevestiging van de afhandeling van uw retourzending. &copy; 2026 Asian Spices. Alle rechten voorbehouden.',
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

/**
 * Plain-text fallback for return processed confirmation email.
 */
export function generateReturnProcessedEmailText(data: ReturnProcessedEmailData = {}): string {
  const orderNumber = (data.orderNumber && data.orderNumber.trim()) || '{{Bestelnummer}}';
  const rawFirstName = (data.firstName && data.firstName.trim()) || '';
  const firstName = rawFirstName && rawFirstName.toLowerCase() !== 'klant' && !rawFirstName.includes('{{') ? rawFirstName : '';
  const totalRefundAmount = data.totalRefundAmount !== undefined ? `${data.totalRefundAmount}` : '0.00';
  const accountUrl = data.accountUrl || 'https://www.asianspices.online/account';
  const supportEmail = data.supportEmail || 'klantenservice@asianspices.nl';
  const phoneNumber = data.phoneNumber || '06 44844844';

  const items = data.items && data.items.length > 0 ? data.items : [];

  const itemsText = items.length > 0
    ? items.map(item => `- ${item.name} (${item.quantity}x) - € ${item.amount}`).join('\n')
    : '- Geretourneerde artikelen';

  const greetingLine = firstName ? `Beste ${firstName}, we hebben` : 'We hebben';

  return `ASIAN SPICES - RETOUR VERWERKT (BESTELLING #${orderNumber})
==================================================

Goed nieuws, uw retour is verwerkt.
${greetingLine} uw retourzending ontvangen en gecontroleerd. De retouraanvraag is hiermee succesvol afgehandeld.

Status: [✓ Retour ontvangen] [✓ Artikel gecontroleerd] [✓ Retour goedgekeurd]

Bekijk de status in uw account:
${accountUrl}

--------------------------------------------------
VERWERKTE ARTIKELEN
${itemsText}

TOTAAL VERWERKT RETOURBEDRAG: € ${totalRefundAmount}

--------------------------------------------------
WAT GEBEURT ER MET UW BETALING?
1. Vooraf betaald (iDEAL, Bancontact, creditcard):
   € ${totalRefundAmount} wordt binnen 5 tot 14 werkdagen teruggestort.
   [✓ Terugbetaling gestart]

2. Achteraf betalen (Klarna, Riverty):
   U hoeft het geretourneerde artikel niet meer te betalen. Factuur is aangepast.
   [✓ Factuur aangepast]

3. Spaarpunten gebruikt:
   Ingezette punten zijn weer bijgeschreven op uw accountsaldo.
   [✓ Punten bijgewerkt]

Verwerkingstijd: 5-14 werkdagen tot het bedrag zichtbaar is.

--------------------------------------------------
ALLES OP ÉÉN PLEK
Uw retourstatus en factuur staan in uw account:
${accountUrl}

--------------------------------------------------
HEEFT U ONS NODIG?
Klantenservice: ${supportEmail}
Telefoon: ${phoneNumber} (Ma t/m vr · 07:00–15:00)
Vermeld altijd bestelnummer #${orderNumber}.

Met vriendelijke groet,
Het team van Asian Spices
`;
}
