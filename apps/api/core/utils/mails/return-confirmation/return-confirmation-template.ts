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
  escapeHtml,
} from '../shared';

export interface ReturnItem {
  name: string;
  sku?: string;
  imageUrl?: string;
  quantity: number | string;
  reason?: string;
}

export interface ReturnConfirmationEmailData {
  orderNumber?: string;
  returnNumber?: string;
  firstName?: string;
  lastName?: string;
  barcodeNumber?: string;
  barcodeUrl?: string;
  items?: ReturnItem[];
  returnInstructionsUrl?: string;
  packagePointsUrl?: string;
  printLabelUrl?: string;
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
 * Generate Return Request Confirmation HTML Email ("Uw retour is aangemeld").
 * Complete implementation matching screenshot:
 * - Header with "RETOUR BEVESTIGD" badge
 * - Hero with green check, title, CTA, and 4-step progress timeline
 * - Digital Barcode Box with 3-step return instructions & package point finder
 * - Return Overview ("Dit stuurt u terug") with products & reasons
 * - "Liever een fysiek label?" dashed card
 * - 3-step refund timeline ("Van controle tot terugbetaling")
 * - Comprehensive FAQ accordion section ("Alles over uw retour")
 * - Customer Support Banner & Outlook/Gmail bulletproof footer
 */
export function generateReturnConfirmationEmailHtml(data: ReturnConfirmationEmailData = {}): string {
  const orderNumber = (data.orderNumber && data.orderNumber.trim()) || '{{Bestelnummer}}';
  const rawFirstName = (data.firstName && data.firstName.trim()) || '';
  const firstName = rawFirstName && rawFirstName.toLowerCase() !== 'klant' && !rawFirstName.includes('{{') ? rawFirstName : '';
  const greetingTitle = firstName ? `Uw retour is aangemeld,<br />${escapeHtml(firstName)}.` : `Uw retour is aangemeld.`;
  const barcodeNumber = data.barcodeNumber || '[Digitale barcode voor smartphone]';

  const returnInstructionsUrl = data.returnInstructionsUrl || 'https://www.asianspices.online/returns/instructions';
  const packagePointsUrl = data.packagePointsUrl || 'https://www.asianspices.online/returns/locations';
  const printLabelUrl = data.printLabelUrl || 'https://www.asianspices.online/account/returns';
  const helpPageUrl = data.helpPageUrl || 'https://www.asianspices.online/contact-us';
  const supportEmail = data.supportEmail || 'klantenservice@asianspices.nl';
  const phoneNumber = data.phoneNumber || '06 44844844';
  const openingHours = data.openingHours || 'Ma t/m vr &middot; 07:00&ndash;15:00';

  const logoSrc = data.logoUrl || DEFAULT_LOGO_SRC || ASIAN_SPICES_LOGO_BASE64;
  const tiktokIconSrc = data.tiktokIconUrl || DEFAULT_TIKTOK_SRC || TIKTOK_ICON_BASE64;
  const instagramIconSrc = data.instagramIconUrl || DEFAULT_INSTAGRAM_SRC || INSTAGRAM_ICON_BASE64;
  const facebookIconSrc = data.facebookIconUrl || DEFAULT_FACEBOOK_SRC || FACEBOOK_ICON_BASE64;
  const youtubeIconSrc = data.youtubeIconUrl || DEFAULT_YOUTUBE_SRC || YOUTUBE_ICON_BASE64;

  const items: ReturnItem[] = (data.items && data.items.length > 0) ? data.items : [
    {
      name: '{{Productnaam}}',
      sku: '{{SKU}}',
      quantity: '{{Aantal}}',
      reason: '{{Retourreden}}',
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
        <td align="right" style="padding: 14px 16px; ${borderStyle} font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; font-weight: 600; color: #52525b; vertical-align: middle; white-space: nowrap;">
          ${item.reason || '{{Retourreden}}'}
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
  <title>Uw retour is aangemeld, ${firstName} - Asian Spices</title>
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
      .mobile-step-col {
        display: block !important;
        width: 100% !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
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
    Uw retour voor bestelling #${orderNumber} is succesvol aangemeld. Hier vindt u alle instructies om uw pakket kosteloos terug te sturen.
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
          
          <!-- 1. Header: Brand Logo & Right "RETOUR BEVESTIGD" pill badge -->
          <tr>
            <td style="padding: 22px 34px 18px 34px; border: 0;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" valign="middle">
                    <img src="${logoSrc}" alt="Asian Spices" width="70" height="70" style="display: block; border: 0; width: 70px; height: 70px; max-width: 70px; outline: none;" />
                  </td>
                  <td align="right" valign="middle">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" bgcolor="#fef2f2" style="background-color: #fff7ed; border-radius: 14px; border: 1px solid #ffedd5;">
                      <tr>
                        <td style="padding: 6px 14px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1.2px; color: #c2410c; text-transform: uppercase;">
                          RETOUR BEVESTIGD
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 2. Hero Section: Warm background with green check, title, CTA, and 4-step timeline -->
          <tr>
            <td bgcolor="#fffdfa" style="background-color: #fffdfa; padding: 36px 30px 36px 30px; text-align: center; border-top: 1px solid #fef3c7; border-bottom: 1px solid #fef3c7;" class="mobile-padding">
              
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
                AANVRAAG SUCCESVOL ONTVANGEN
              </div>

              <!-- Main Title -->
              <h1 style="margin: 0 0 10px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; line-height: 36px; font-weight: 700; color: #18181b;">
                ${greetingTitle}
              </h1>

              <!-- Subtitle -->
              <p style="margin: 0 auto 24px auto; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; line-height: 20px; color: #52525b; max-width: 440px;">
                Hieronder vindt u alles wat u nodig heeft om uw pakket snel en kosteloos terug te sturen.
              </p>

              <!-- Prominent CTA Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 30px auto;">
                <tr>
                  <td align="center" valign="middle" bgcolor="#c2410c" style="background-color: #c2410c; border-radius: 8px; padding: 13px 28px; box-shadow: 0 3px 10px rgba(194, 65, 12, 0.25);">
                    <a href="${returnInstructionsUrl}" target="_blank" style="display: block; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; font-weight: 700; color: #ffffff; text-decoration: none; line-height: 100%; white-space: nowrap;">
                      Bekijk de volledige retourinstructies &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- 4-Step Progress Tracker: Aangemeld -> Ingeleverd -> Gecontroleerd -> Terugbetaald -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" width="100%" style="max-width: 440px; margin: 0 auto;">
                <tr>
                  <!-- Step 1: Aangemeld (Active) -->
                  <td width="16" align="center" valign="middle">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="16" height="16" bgcolor="#1b4332" style="background-color: #1b4332; border-radius: 50%;">
                      <tr><td></td></tr>
                    </table>
                  </td>
                  <!-- Line 1 to 2 -->
                  <td valign="middle" style="padding: 0 2px;">
                    <div style="height: 2px; background-color: #e4e4e7; width: 100%;"></div>
                  </td>
                  <!-- Step 2: Ingeleverd -->
                  <td width="16" align="center" valign="middle">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="16" height="16" bgcolor="#ffffff" style="background-color: #ffffff; border: 2px solid #d4d4d8; border-radius: 50%;">
                      <tr><td></td></tr>
                    </table>
                  </td>
                  <!-- Line 2 to 3 -->
                  <td valign="middle" style="padding: 0 2px;">
                    <div style="height: 2px; background-color: #e4e4e7; width: 100%;"></div>
                  </td>
                  <!-- Step 3: Gecontroleerd -->
                  <td width="16" align="center" valign="middle">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="16" height="16" bgcolor="#ffffff" style="background-color: #ffffff; border: 2px solid #d4d4d8; border-radius: 50%;">
                      <tr><td></td></tr>
                    </table>
                  </td>
                  <!-- Line 3 to 4 -->
                  <td valign="middle" style="padding: 0 2px;">
                    <div style="height: 2px; background-color: #e4e4e7; width: 100%;"></div>
                  </td>
                  <!-- Step 4: Terugbetaald -->
                  <td width="16" align="center" valign="middle">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="16" height="16" bgcolor="#ffffff" style="background-color: #ffffff; border: 2px solid #d4d4d8; border-radius: 50%;">
                      <tr><td></td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 8px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; color: #1b4332;">
                    Aangemeld
                  </td>
                  <td></td>
                  <td align="center" style="padding-top: 8px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 500; color: #a1a1aa;">
                    Ingeleverd
                  </td>
                  <td></td>
                  <td align="center" style="padding-top: 8px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 500; color: #a1a1aa;">
                    Gecontroleerd
                  </td>
                  <td></td>
                  <td align="center" style="padding-top: 8px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 500; color: #a1a1aa;">
                    Terugbetaald
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ========================================================
               3. Section: "PRINTEN IS NIET NODIG / Pakket inleveren met barcode"
               (TIJDELIJK VERBORGEN / COMMENTED OUT PER USER REQUEST)
          ======================================================== -->
          <!--
          <tr>
            <td style="padding: 28px 30px 20px 30px;" class="mobile-padding">
              
              <!-- Title with Phone Icon Badge on Right -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px;">
                <tr>
                  <td valign="middle">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; font-weight: 800; letter-spacing: 1.6px; color: #ea580c; text-transform: uppercase;">
                      PRINTEN IS NIET NODIG
                    </div>
                    <h2 style="margin: 4px 0 0 0; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #18181b;">
                      Pakket inleveren met barcode
                    </h2>
                  </td>
                  <td width="42" align="right" valign="middle">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="36" height="36" bgcolor="#e8f5e9" style="background-color: #e8f5e9; border-radius: 50%; text-align: center;">
                      <tr>
                        <td align="center" valign="middle" style="font-size: 16px;">&#128241;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Intro Instruction -->
              <p style="margin: 0 0 18px 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; line-height: 19px; color: #52525b;">
                Laat onderstaande digitale barcode op uw smartphone scannen bij een PostNL- of DHL-punt bij u in de buurt.
              </p>

              <!-- Digital Barcode Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #fed7aa; border-radius: 12px; padding: 22px 18px; text-align: center; margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; font-weight: 700; color: #18181b; margin-bottom: 12px;">
                      Barcode: ${barcodeNumber}
                    </div>

                    <!-- Clean CSS/HTML Barcode Visual Lines -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 12px auto; height: 50px;">
                      <tr>
                        <td style="width: 4px; background: #18181b;"></td>
                        <td style="width: 2px;"></td>
                        <td style="width: 2px; background: #18181b;"></td>
                        <td style="width: 3px;"></td>
                        <td style="width: 5px; background: #18181b;"></td>
                        <td style="width: 2px;"></td>
                        <td style="width: 3px; background: #18181b;"></td>
                        <td style="width: 4px;"></td>
                        <td style="width: 2px; background: #18181b;"></td>
                        <td style="width: 2px;"></td>
                        <td style="width: 6px; background: #18181b;"></td>
                        <td style="width: 3px;"></td>
                        <td style="width: 3px; background: #18181b;"></td>
                        <td style="width: 2px;"></td>
                        <td style="width: 5px; background: #18181b;"></td>
                        <td style="width: 4px;"></td>
                        <td style="width: 2px; background: #18181b;"></td>
                        <td style="width: 3px;"></td>
                        <td style="width: 4px; background: #18181b;"></td>
                        <td style="width: 2px;"></td>
                        <td style="width: 6px; background: #18181b;"></td>
                        <td style="width: 3px;"></td>
                        <td style="width: 3px; background: #18181b;"></td>
                        <td style="width: 2px;"></td>
                        <td style="width: 4px; background: #18181b;"></td>
                      </tr>
                    </table>

                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 9.5px; font-weight: 800; letter-spacing: 1px; color: #b45309; text-transform: uppercase;">
                      PLACEHOLDER &middot; GEEN WERKENDE VERZENDBARCODE
                    </div>
                  </td>
                </tr>
              </table>

              <!-- 3 Column Cards: Toon uw barcode, Lever uw pakket in, Bewaar uw afgiftebewijs -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
                <tr>
                  <!-- Card 1 -->
                  <td width="31%" valign="top" bgcolor="#f2f7f4" style="background-color: #f2f7f4; border: 1px solid #dcece2; border-radius: 12px; padding: 14px;" class="mobile-step-col">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="22" height="22" bgcolor="#1b4332" style="background-color: #1b4332; border-radius: 50%; margin-bottom: 8px;">
                      <tr>
                        <td align="center" valign="middle" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; font-weight: 800; color: #ffffff; line-height: 22px;">1</td>
                      </tr>
                    </table>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 800; color: #18181b; margin-bottom: 4px;">
                      Toon uw barcode
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; line-height: 16px; color: #52525b;">
                      Open deze e-mail op uw smartphone en laat de barcode scannen bij een PostNL- of DHL-punt.
                    </div>
                  </td>

                  <td width="3%"></td>

                  <!-- Card 2 -->
                  <td width="31%" valign="top" bgcolor="#f2f7f4" style="background-color: #f2f7f4; border: 1px solid #dcece2; border-radius: 12px; padding: 14px;" class="mobile-step-col">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="22" height="22" bgcolor="#1b4332" style="background-color: #1b4332; border-radius: 50%; margin-bottom: 8px;">
                      <tr>
                        <td align="center" valign="middle" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; font-weight: 800; color: #ffffff; line-height: 22px;">2</td>
                      </tr>
                    </table>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 800; color: #18181b; margin-bottom: 4px;">
                      Lever uw pakket in
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; line-height: 16px; color: #52525b;">
                      Geef het goed gesloten pakket af. U hoeft geen retourlabel te printen of op te plakken.
                    </div>
                  </td>

                  <td width="3%"></td>

                  <!-- Card 3 -->
                  <td width="31%" valign="top" bgcolor="#f2f7f4" style="background-color: #f2f7f4; border: 1px solid #dcece2; border-radius: 12px; padding: 14px;" class="mobile-step-col">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="22" height="22" bgcolor="#1b4332" style="background-color: #1b4332; border-radius: 50%; margin-bottom: 8px;">
                      <tr>
                        <td align="center" valign="middle" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; font-weight: 800; color: #ffffff; line-height: 22px;">3</td>
                      </tr>
                    </table>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 800; color: #18181b; margin-bottom: 4px;">
                      Bewaar uw afgiftebewijs
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; line-height: 16px; color: #52525b;">
                      Bewaar het bewijs op papier of per e-mail totdat uw retour volledig door ons is verwerkt.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Location Pin Banner -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #dcece2; border-radius: 10px;">
                <tr>
                  <td style="padding: 12px 16px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="24" valign="middle" style="font-size: 14px;">&#128205;</td>
                        <td valign="middle" style="padding-left: 6px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; font-weight: 700;">
                          <a href="${packagePointsUrl}" target="_blank" style="color: #166534; text-decoration: none;">
                            Vind een pakketpunt bij u in de buurt
                          </a>
                        </td>
                        <td align="right" valign="middle">
                          <a href="${packagePointsUrl}" target="_blank" style="color: #166534; text-decoration: none; font-size: 14px; font-weight: 800;">
                            &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
          -->

          <!-- 4. Section: "RETOUROVERZICHT / Dit stuurt u terug" -->
          <tr>
            <td style="padding: 28px 30px 24px 30px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#fffdfa" style="background-color: #fffdfa; border-radius: 16px; border: 1px solid #fef3c7; padding: 22px;">
                <tr>
                  <td>
                    <!-- Section Header -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px;">
                      <tr>
                        <td align="left" valign="bottom">
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; font-weight: 800; letter-spacing: 1.5px; color: #ea580c; text-transform: uppercase;">
                            RETOUROVERZICHT
                          </div>
                          <h2 style="margin: 4px 0 0 0; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #18181b;">
                            Dit stuurt u terug
                          </h2>
                        </td>
                        <td align="right" valign="bottom" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #71717a;">
                          Bestelling #${orderNumber}
                        </td>
                      </tr>
                    </table>

                    <!-- Returned Products Box -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 12px; border: 1px solid #edf0f3; overflow: hidden; margin-bottom: 16px;">
                      <tr bgcolor="#fafafa" style="background-color: #fafafa; border-bottom: 1px solid #edf0f3;">
                        <th align="left" style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1px; color: #71717a; text-transform: uppercase;">
                          ARTIKEL
                        </th>
                        <th align="center" style="padding: 10px 12px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1px; color: #71717a; text-transform: uppercase;">
                          AANTAL
                        </th>
                        <th align="right" style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1px; color: #71717a; text-transform: uppercase;">
                          REDEN
                        </th>
                      </tr>
                      ${itemsHtml}
                    </table>

                    <!-- "Liever een fysiek label?" dashed card -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 10px; border: 1px dashed #d4d4d8; padding: 14px 16px;">
                      <tr>
                        <td valign="middle">
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 800; color: #18181b;">
                            Liever een fysiek label?
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; color: #71717a; margin-top: 2px;">
                            Download het retouretiket via uw account en plak dit stevig over het oude adreslabel.
                          </div>
                        </td>
                        <td align="right" valign="middle" style="padding-left: 14px; white-space: nowrap;">
                          <a href="${printLabelUrl}" target="_blank" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 800; color: #c2410c; text-decoration: none;">
                            Print retouretiket
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 5. Section: "NA ONTVANGST IN ONS MAGAZIJN / Van controle tot terugbetaling" -->
          <tr>
            <td style="padding: 0 30px 24px 30px;" class="mobile-padding">
              <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; font-weight: 800; letter-spacing: 1.5px; color: #ea580c; text-transform: uppercase; margin-bottom: 4px;">
                NA ONTVANGST IN ONS MAGAZIJN
              </div>
              <h2 style="margin: 0 0 16px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #18181b;">
                Van controle tot terugbetaling
              </h2>

              <!-- 3 Columns Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #edf0f3; border-radius: 14px; padding: 18px 12px;">
                <tr>
                  <!-- Col 1 -->
                  <td width="33%" valign="top" style="padding: 0 10px; border-right: 1px solid #f1f2f5;" class="mobile-step-col">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; font-weight: 800; color: #c2410c; margin-bottom: 4px;">
                      01
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 800; color: #18181b; margin-bottom: 4px;">
                      Ontvangst &amp; controle
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; line-height: 16px; color: #71717a;">
                      We controleren uw retour zodra deze bij ons binnenkomt.
                    </div>
                  </td>

                  <!-- Col 2 -->
                  <td width="33%" valign="top" style="padding: 0 10px; border-right: 1px solid #f1f2f5;" class="mobile-step-col">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; font-weight: 800; color: #c2410c; margin-bottom: 4px;">
                      02
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 800; color: #18181b; margin-bottom: 4px;">
                      Bevestiging per e-mail
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; line-height: 16px; color: #71717a;">
                      U ontvangt bericht zodra de terugbetaling is gestart.
                    </div>
                  </td>

                  <!-- Col 3 -->
                  <td width="33%" valign="top" style="padding: 0 10px;" class="mobile-step-col">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; font-weight: 800; color: #c2410c; margin-bottom: 4px;">
                      03
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 800; color: #18181b; margin-bottom: 4px;">
                      5&ndash;14 werkdagen
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; line-height: 16px; color: #71717a;">
                      Het bedrag gaat terug via uw oorspronkelijke betaalmethode.
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- 6. Section: "VEELGESTELDE VRAGEN / Alles over uw retour" -->
          <tr>
            <td style="padding: 0 30px 24px 30px;" class="mobile-padding">
              <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; font-weight: 800; letter-spacing: 1.5px; color: #ea580c; text-transform: uppercase; margin-bottom: 4px;">
                VEELGESTELDE VRAGEN
              </div>
              <h2 style="margin: 0 0 16px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #18181b;">
                Alles over uw retour
              </h2>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <!-- FAQ Item 1 -->
                <tr>
                  <td style="padding: 12px 0; border-top: 1px solid #f1f2f5;">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; line-height: 19px; color: #52525b;">
                      Na ontvangst en controle storten we het aankoopbedrag binnen 5 tot 14 werkdagen terug via de oorspronkelijk gekozen betaalmethode. U ontvangt een bevestiging zodra dit is gestart.
                    </div>
                  </td>
                </tr>

                <!-- FAQ Item 2 -->
                <tr>
                  <td style="padding: 14px 0 10px 0; border-top: 1px solid #f1f2f5;">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 800; color: #18181b; margin-bottom: 6px;">
                      <span style="color: #71717a; margin-right: 4px;">&#9662;</span> Wat gebeurt er bij achteraf betalen?
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; line-height: 18px; color: #52525b;">
                      Na verwerking vervalt de betalingsverplichting voor het geretourneerde artikel automatisch. Voor artikelen die u houdt, blijft het resterende saldo van kracht.
                    </div>
                  </td>
                </tr>

                <!-- FAQ Item 3 -->
                <tr>
                  <td style="padding: 14px 0 10px 0; border-top: 1px solid #f1f2f5;">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 800; color: #18181b; margin-bottom: 6px;">
                      <span style="color: #71717a; margin-right: 4px;">&#9662;</span> Wat als ik het artikel toch wil houden?
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; line-height: 18px; color: #52525b;">
                      U hoeft het artikel dan niet in te leveren. De retourmelding verloopt na 14 dagen automatisch en een eventuele betalingsverplichting blijft bestaan.
                    </div>
                  </td>
                </tr>

                <!-- FAQ Item 4 -->
                <tr>
                  <td style="padding: 14px 0 10px 0; border-top: 1px solid #f1f2f5;">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 800; color: #18181b; margin-bottom: 6px;">
                      <span style="color: #71717a; margin-right: 4px;">&#9662;</span> Wat geldt voor levensmiddelen en specerijen?
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; line-height: 18px; color: #52525b;">
                      Vanwege voedselveiligheid kunnen aangebroken verpakkingen van specerijen, sauzen en verse ingredi&euml;nten niet worden geretourneerd, tenzij sprake is van een kwaliteitsafwijking.
                    </div>
                  </td>
                </tr>

                <!-- FAQ Item 5 -->
                <tr>
                  <td style="padding: 14px 0 10px 0; border-top: 1px solid #f1f2f5; border-bottom: 1px solid #f1f2f5;">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 800; color: #18181b; margin-bottom: 6px;">
                      <span style="color: #71717a; margin-right: 4px;">&#9662;</span> Kan ik mijn retourzending volgen?
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; line-height: 18px; color: #52525b;">
                      Ja, volg de actuele status via Mijn bestellingen in uw persoonlijke account.
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- 7. Support Banner: "Onze klantenservice staat voor u klaar." -->
          <tr>
            <td style="padding: 0 30px 30px 30px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#fff9f0" style="background-color: #fff9f0; border-left: 4px solid #ea580c; border-radius: 0 12px 12px 0; border-top: 1px solid #fef3c7; border-right: 1px solid #fef3c7; border-bottom: 1px solid #fef3c7; padding: 22px;">
                <tr>
                  <td>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <!-- Left Details -->
                        <td valign="top" class="mobile-step-col">
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1.4px; color: #c2410c; text-transform: uppercase; margin-bottom: 4px;">
                            HULP NODIG?
                          </div>
                          <h3 style="margin: 0 0 6px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 700; color: #18181b;">
                            Onze klantenservice staat voor u klaar.
                          </h3>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; color: #52525b; margin-bottom: 14px;">
                            Houd voor een snelle afhandeling uw bestelnummer <strong style="color: #18181b;">#${orderNumber}</strong> bij de hand.
                          </div>
                          <div style="margin-bottom: 16px;">
                            <a href="${helpPageUrl}" target="_blank" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; font-weight: 800; color: #c2410c; text-decoration: none;">
                              Naar onze hulppagina &rarr;
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
                        <td valign="top" align="right" class="mobile-step-col" style="text-align: right;">
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

          <!-- 8. Shared Bulletproof Social Footer -->
          ${renderEmailSocialFooter({
            logoUrl: logoSrc,
            tiktokIconUrl: tiktokIconSrc,
            instagramIconUrl: instagramIconSrc,
            facebookIconUrl: facebookIconSrc,
            youtubeIconUrl: youtubeIconSrc,
            signoffText: 'Met vriendelijke groet,<br /><strong style="color: #18181b; font-weight: 800;">Het team van Asian Spices</strong>',
            subtext: 'U ontvangt deze e-mail ter bevestiging van uw retouraanvraag. &copy; 2026 Asian Spices. Alle rechten voorbehouden.',
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
 * Plain-text fallback for return request confirmation email.
 */
export function generateReturnConfirmationEmailText(data: ReturnConfirmationEmailData = {}): string {
  const orderNumber = (data.orderNumber && data.orderNumber.trim()) || '{{Bestelnummer}}';
  const rawFirstName = (data.firstName && data.firstName.trim()) || '';
  const firstName = rawFirstName && rawFirstName.toLowerCase() !== 'klant' && !rawFirstName.includes('{{') ? rawFirstName : '';
  const greetingLine = firstName ? `Uw retour is aangemeld, ${firstName}.` : `Uw retour is aangemeld.`;
  const barcodeNumber = data.barcodeNumber || '[Digitale barcode voor smartphone]';
  const returnInstructionsUrl = data.returnInstructionsUrl || 'https://www.asianspices.online/returns/instructions';
  const packagePointsUrl = data.packagePointsUrl || 'https://www.asianspices.online/returns/locations';
  const printLabelUrl = data.printLabelUrl || 'https://www.asianspices.online/account/returns';
  const supportEmail = data.supportEmail || 'klantenservice@asianspices.nl';
  const phoneNumber = data.phoneNumber || '06 44844844';

  const items = data.items && data.items.length > 0 ? data.items : [];

  const itemsText = items.length > 0
    ? items.map(item => `- ${item.name} (${item.quantity}x) - Reden: ${item.reason || 'Geen'}`).join('\n')
    : '- Geretourneerde artikelen';

  return `ASIAN SPICES - RETOUR BEVESTIGD (BESTELLING #${orderNumber})
==================================================

${greetingLine}
Hieronder vindt u alles wat u nodig heeft om uw pakket snel en kosteloos terug te sturen.

Retourinstructies bekijken:
${returnInstructionsUrl}

Status: Aangemeld -> Ingeleverd -> Gecontroleerd -> Terugbetaald

--------------------------------------------------
RETOUROVERZICHT - DIT STUURT U TERUG
Bestelling #${orderNumber}

${itemsText}

Liever een fysiek retouretiket printen?
${printLabelUrl}

--------------------------------------------------
VAN CONTROLE TOT TERUGBETALING
01. Ontvangst & controle: We controleren uw retour zodra deze bij ons binnenkomt.
02. Bevestiging per e-mail: U ontvangt bericht zodra de terugbetaling is gestart.
03. 5-14 werkdagen: Het bedrag gaat terug via uw oorspronkelijke betaalmethode.

--------------------------------------------------
VEELGESTELDE VRAGEN
- Terugbetalingstermijn: 5 tot 14 werkdagen na controle.
- Achteraf betalen: Betalingsverplichting voor het geretourneerde artikel vervalt automatisch.
- Artikel toch houden? U hoeft niets te doen, retourmelding vervalt na 14 dagen.
- Levensmiddelen: Aangebroken verpakkingen kunnen niet geretourneerd worden i.v.m. voedselveiligheid.
- Volgen: Volg de status via uw account.

--------------------------------------------------
HULP NODIG?
Klantenservice: ${supportEmail}
Telefoon: ${phoneNumber} (Ma t/m vr · 07:00–15:00)
Vermeld altijd bestelnummer #${orderNumber}.

Met vriendelijke groet,
Het team van Asian Spices
`;
}
