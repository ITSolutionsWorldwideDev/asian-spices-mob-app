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

export interface CancelledItem {
  name: string;
  sku?: string;
  imageUrl?: string;
  quantity: number | string;
  price: number | string;
}

export interface OrderCancelEmailData {
  orderNumber?: string;
  firstName?: string;
  lastName?: string;
  orderOverviewUrl?: string;
  shopUrl?: string;
  items?: CancelledItem[];
  paymentMethod?: string;
  totalAmount?: number | string;
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
 * Generate Product/Order Cancellation Confirmation HTML Email ("Uw annulering is verwerkt").
 * Exact implementation matching design screenshots:
 * - Header with "ANNULERING BEVESTIGD" badge
 * - Hero with dark orange/brown checkmark circle, title, CTA, and 3-column status bar
 * - Cancelled Order Items Table ("Geannuleerde order / Overzicht van uw bestelling")
 * - Payment method & "Totaal geannuleerd" breakdown
 * - Financial resolution box ("Wat gebeurt er met uw betaling?") with 3 cards:
 *   1. Al betaald (iDEAL, Bancontact, creditcard) -> TERUGBETALING GESTART
 *   2. Achteraf betalen (Klarna, Riverty) -> NIETS MEER BETALEN
 *   3. Punten of kortingscode -> SALDO BIJGEWERKT
 * - Binnen 7 dagen highlight banner
 * - "Altijd welkom terug" invitation card with dark green button to webshop
 * - Customer Support Banner & Outlook/Gmail bulletproof footer
 */
export function generateOrderCancelEmailHtml(data: OrderCancelEmailData = {}): string {
  const orderNumber = (data.orderNumber && data.orderNumber.trim()) || '{{Bestelnummer}}';
  const rawFirstName = (data.firstName && data.firstName.trim()) || '';
  const firstName = rawFirstName && rawFirstName.toLowerCase() !== 'klant' && !rawFirstName.includes('{{') ? rawFirstName : '';
  const greetingTitle = firstName ? `Uw annulering is verwerkt,<br />${escapeHtml(firstName)}.` : `Uw annulering is verwerkt.`;
  const paymentMethod = (data.paymentMethod && data.paymentMethod.trim()) || 'Online betaling';
  const totalAmount = data.totalAmount !== undefined ? `${data.totalAmount}` : '0.00';

  const orderOverviewUrl = data.orderOverviewUrl || 'https://www.asianspices.online/account/orders';
  const shopUrl = data.shopUrl || 'https://www.asianspices.online/shop';
  const helpPageUrl = data.helpPageUrl || 'https://www.asianspices.online/contact-us';
  const supportEmail = data.supportEmail || 'klantenservice@asianspices.nl';
  const phoneNumber = data.phoneNumber || '06 44844844';
  const openingHours = data.openingHours || 'Ma t/m vr &middot; 07:00&ndash;15:00';

  const logoSrc = data.logoUrl || DEFAULT_LOGO_SRC || ASIAN_SPICES_LOGO_BASE64;
  const tiktokIconSrc = data.tiktokIconUrl || DEFAULT_TIKTOK_SRC || TIKTOK_ICON_BASE64;
  const instagramIconSrc = data.instagramIconUrl || DEFAULT_INSTAGRAM_SRC || INSTAGRAM_ICON_BASE64;
  const facebookIconSrc = data.facebookIconUrl || DEFAULT_FACEBOOK_SRC || FACEBOOK_ICON_BASE64;
  const youtubeIconSrc = data.youtubeIconUrl || DEFAULT_YOUTUBE_SRC || YOUTUBE_ICON_BASE64;

  const items: CancelledItem[] = (data.items && data.items.length > 0) ? data.items : [
    {
      name: '{{Productnaam}}',
      sku: '{{SKU}}',
      quantity: '{{Aantal}}',
      price: '{{Prijs}}',
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
          &euro; ${item.price}
        </td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="nl">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Uw annulering is verwerkt, ${firstName} - Asian Spices</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
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
          
          <!-- 1. Header: Brand Logo & Right "ANNULERING BEVESTIGD" badge -->
          <tr>
            <td style="padding: 22px 34px 18px 34px; border: 0; border: none; mso-border-alt: none;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 0; border: none; mso-border-alt: none;">
                <tr>
                  <td align="left" valign="middle" style="border: 0; border: none; mso-border-alt: none;">
                    <img src="${logoSrc}" alt="Asian Spices" width="70" height="70" style="display: block; border: 0; width: 70px; height: 70px; max-width: 70px; outline: none;" />
                  </td>
                  <td align="right" valign="middle" style="border: 0; border: none; mso-border-alt: none;">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #ea580c; text-transform: uppercase;">
                      ANNULERING BEVESTIGD
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 2. Hero Section: Matches Order Confirmation -->
          <tr>
            <td bgcolor="#fffdfa" style="background-color: #fffdfa; padding: 34px 30px 32px 30px; text-align: center; border-top: 1px solid #fef3c7; border-bottom: 1px solid #fef3c7;" class="mobile-padding">
              
              <!-- Check Badge (Dark Green Circle) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 14px auto; border-collapse: separate;">
                <tr>
                  <td align="center" valign="middle" width="46" height="46" bgcolor="#1b4332" style="background-color: #1b4332; width: 46px; height: 46px; border-radius: 50%; text-align: center;">
                    <span style="color: #ffffff; font-size: 20px; font-weight: 800; line-height: 46px;">&#10003;</span>
                  </td>
                </tr>
              </table>

              <!-- Eyebrow -->
              <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #ea580c; text-transform: uppercase; margin-bottom: 8px;">
                BESTELLING STOPGEZET
              </div>

              <!-- Main Title -->
              <h1 style="margin: 0 0 10px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; line-height: 36px; font-weight: 700; color: #18181b;">
                ${greetingTitle}
              </h1>

              <!-- Subtitle -->
              <p style="margin: 0 auto 20px auto; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; line-height: 20px; color: #52525b; max-width: 440px;">
                Bestelling <strong style="color: #18181b;">#${orderNumber}</strong> wordt niet meer verzonden. Hieronder vindt u het overzicht en alle informatie over uw betaling.
              </p>

              <!-- CTA Button commented out
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 26px auto;">
                <tr>
                  <td align="center" valign="middle" bgcolor="#ea580c" style="background-color: #ea580c; border-radius: 8px; padding: 13px 28px;">
                    <a href="${orderOverviewUrl}" target="_blank" style="display: block; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; font-weight: 700; color: #ffffff; text-decoration: none; line-height: 100%; white-space: nowrap;">
                      Bekijk uw besteloverzicht &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              -->

              <!-- 3-Column Summary Status Card -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #edf0f3; border-radius: 12px; padding: 16px 14px; text-align: left;">
                <tr>
                  <!-- Col 1: Bestelstatus -->
                  <td width="33%" valign="top" style="padding: 0 10px; border-right: 1px solid #f1f2f5;" class="mobile-status-col">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 9.5px; font-weight: 800; letter-spacing: 1px; color: #71717a; text-transform: uppercase; margin-bottom: 4px;">
                      BESTELSTATUS
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; font-weight: 800; color: #c2410c;">
                      Geannuleerd
                    </div>
                  </td>

                  <!-- Col 2: Referentie -->
                  <td width="33%" valign="top" style="padding: 0 10px; border-right: 1px solid #f1f2f5;" class="mobile-status-col">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 9.5px; font-weight: 800; letter-spacing: 1px; color: #71717a; text-transform: uppercase; margin-bottom: 4px;">
                      REFERENTIE
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; font-weight: 800; color: #18181b;">
                      #${orderNumber}
                    </div>
                  </td>

                  <!-- Col 3: Vervolgactie -->
                  <td width="33%" valign="top" style="padding: 0 10px;" class="mobile-status-col">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 9.5px; font-weight: 800; letter-spacing: 1px; color: #71717a; text-transform: uppercase; margin-bottom: 4px;">
                      VERVOLGACTIE
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; font-weight: 800; color: #18181b;">
                      Geen actie nodig
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- 3. Section: "GEANNULEERDE ORDER / Overzicht van uw bestelling" -->
          <tr>
            <td style="padding: 28px 30px 20px 30px;" class="mobile-padding">
              
              <!-- Section Header -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px;">
                <tr>
                  <td align="left" valign="bottom">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; font-weight: 800; letter-spacing: 1.6px; color: #ea580c; text-transform: uppercase;">
                      GEANNULEERDE ORDER
                    </div>
                    <h2 style="margin: 4px 0 0 0; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #18181b;">
                      Overzicht van uw bestelling
                    </h2>
                  </td>
                  <td align="right" valign="bottom" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #71717a;">
                    #${orderNumber}
                  </td>
                </tr>
              </table>

              <!-- Order Products Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 14px; border: 1px solid #edf0f3; overflow: hidden; margin-bottom: 18px;">
                <tr bgcolor="#fafafa" style="background-color: #fafafa; border-bottom: 1px solid #edf0f3;">
                  <th align="left" style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1px; color: #71717a; text-transform: uppercase;">
                    ARTIKEL
                  </th>
                  <th align="center" style="padding: 10px 12px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1px; color: #71717a; text-transform: uppercase;">
                    AANTAL
                  </th>
                  <th align="right" style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1px; color: #71717a; text-transform: uppercase;">
                    PRIJS
                  </th>
                </tr>
                ${itemsHtml}
              </table>

              <!-- Totals Breakdown -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" style="padding: 6px 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; color: #71717a;">
                    Betaalwijze
                  </td>
                  <td align="right" style="padding: 6px 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 700; color: #18181b;">
                    ${paymentMethod}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 6px 0 10px 0;">
                    <div style="border-top: 1px solid #e4e4e7; width: 100%;"></div>
                  </td>
                </tr>
                <tr>
                  <td align="left" valign="middle" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; font-weight: 800; color: #18181b;">
                    Totaal geannuleerd
                  </td>
                  <td align="right" valign="middle" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 20px; font-weight: 800; color: #c2410c; white-space: nowrap;">
                    &euro; ${totalAmount}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- 4. Section: "FINANCIËLE AFHANDELING / Wat gebeurt er met uw betaling?" -->
          <tr>
            <td style="padding: 0 30px 24px 30px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#fffdfa" style="background-color: #fffdfa; border-radius: 16px; border: 1px solid #fef3c7; padding: 22px;">
                <tr>
                  <td>
                    <!-- Section Title -->
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; font-weight: 800; letter-spacing: 1.5px; color: #ea580c; text-transform: uppercase; margin-bottom: 4px;">
                      FINANCI&Euml;LE AFHANDELING
                    </div>
                    <h2 style="margin: 0 0 18px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #18181b;">
                      Wat gebeurt er met uw betaling?
                    </h2>

                    <!-- Card 1: Al betaald -->
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
                            Al betaald
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; color: #71717a; margin-top: 1px; margin-bottom: 6px;">
                            iDEAL, Bancontact of creditcard
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; line-height: 18px; color: #52525b; margin-bottom: 8px;">
                            &euro; ${totalAmount} wordt binnen 7 dagen automatisch teruggestort op de rekening waarmee u heeft betaald.
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
                            De factuur is direct geannuleerd. Een ontvangen factuuroverzicht komt binnen 24 uur automatisch te vervallen.
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; color: #166534; letter-spacing: 0.5px;">
                            &#10003; NIETS MEER BETALEN
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Card 3: Punten of kortingscode -->
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
                            Punten of kortingscode
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; color: #71717a; margin-top: 1px; margin-bottom: 6px;">
                            Gebruikt bij deze bestelling
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; line-height: 18px; color: #52525b; margin-bottom: 8px;">
                            Ingezette spaarpunten zijn automatisch teruggezet op uw accountsaldo en kunnen direct opnieuw worden gebruikt.
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; color: #166534; letter-spacing: 0.5px;">
                            &#10003; SALDO BIJGEWERKT
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- 7 dagen verwerkingstijd Box -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#fff7ed" style="background-color: #fff7ed; border-radius: 10px; border: 1px solid #fed7aa; padding: 14px 16px;">
                      <tr>
                        <td width="36" valign="middle" style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 700; color: #b45309; line-height: 1;">
                          7
                        </td>
                        <td valign="middle" style="padding-left: 10px;">
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 800; color: #18181b;">
                            dagen verwerkingstijd
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; color: #71717a; margin-top: 2px;">
                            De zichtbaarheid van de terugbetaling kan per bank verschillen.
                          </div>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 5. Section: "ALTIJD WELKOM TERUG / Toch nog trek in authentieke Aziatische gerechten?" -->
          <tr>
            <td style="padding: 0 30px 24px 30px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f1f5f3" style="background-color: #f1f5f3; border-radius: 16px; border: 1px solid #e0eae4; padding: 24px;">
                <tr>
                  <td>
                    <!-- Eyebrow -->
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1.6px; color: #ea580c; text-transform: uppercase; margin-bottom: 6px;">
                      ALTIJD WELKOM TERUG
                    </div>

                    <!-- Title -->
                    <h2 style="margin: 0 0 10px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; line-height: 28px; font-weight: 700; color: #18181b;">
                      Toch nog trek in authentieke Aziatische gerechten?
                    </h2>

                    <!-- Subtitle -->
                    <p style="margin: 0 0 20px 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; line-height: 19px; color: #52525b;">
                      Per ongeluk geannuleerd of wilt u iets aanpassen? U kunt op ieder moment een nieuwe bestelling plaatsen. Onze kruiden, sauzen en verse ingredi&euml;nten staan direct weer voor u klaar.
                    </p>

                    <!-- Green Webshop CTA Button commented out
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" valign="middle" bgcolor="#1b4332" style="background-color: #1b4332; border-radius: 8px; padding: 12px 24px;">
                          <a href="${shopUrl}" target="_blank" style="display: block; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 700; color: #ffffff; text-decoration: none; line-height: 100%; white-space: nowrap;">
                            Naar de webshop van Asian Spices &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                    -->

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 6. Customer Support Banner: Matches Order Confirmation -->
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
                            HULP NODIG?
                          </div>
                          <h3 style="margin: 0 0 6px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 700; color: #18181b;">
                            Onze klantenservice helpt u graag.
                          </h3>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; color: #52525b; margin-bottom: 14px;">
                            Is de annulering niet volgens verwachting verlopen? Vermeld bij contact altijd bestelnummer <strong style="color: #18181b;">#${orderNumber}</strong>.
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

          <!-- 7. Footer: Matches Order Confirmation & Account Registration -->
          <tr>
            <td style="padding: 0 26px 30px 26px; border: 0; border: none; mso-border-alt: none;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 0; border: none; mso-border-alt: none; text-align: center;">
                <tr>
                  <td style="background-color: #f8f9fa; border-radius: 16px; border: 1px solid #edf0f3; mso-border-alt: solid #edf0f3 1pt; padding: 28px 24px 26px 24px; text-align: center;">
                    <!-- Brand Logo -->
                    <div style="text-align: center; margin-bottom: 10px; border: 0;">
                      <img src="${logoSrc}" alt="Asian Spices" width="68" height="68" style="display: block; border: 0; margin: 0 auto; width: 68px; height: 68px; max-width: 68px; outline: none;" />
                    </div>

                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11.5px; color: #71717a; margin-top: 10px; margin-bottom: 16px; border: 0;">
                      Volg ons voor dagelijkse inspiratie
                    </div>

                    <!-- Social Icons -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 22px auto; border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                      <tr>
                        <!-- TikTok -->
                        <td align="center" valign="middle" style="padding: 4px 5px;" class="mobile-social-col">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 20px; border-collapse: separate; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                            <tr>
                              <td align="center" valign="middle" style="padding: 7px 14px;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="border-collapse: collapse;">
                                  <tr>
                                    <td valign="middle" align="center" style="padding-right: 7px; line-height: 1;">
                                      <a href="https://www.tiktok.com/@asianspices.online?lang=en" target="_blank" style="text-decoration: none; display: inline-block;">
                                        <img src="${tiktokIconSrc}" alt="TikTok" width="16" height="16" style="display: block; outline: none; width: 16px; height: 16px;" />
                                      </a>
                                    </td>
                                    <td valign="middle" align="left" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #18181b; line-height: 16px; white-space: nowrap;">
                                      <a href="https://www.tiktok.com/@asianspices.online?lang=en" target="_blank" style="text-decoration: none; color: #18181b; display: inline-block;">
                                        TikTok
                                      </a>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>

                        <!-- Instagram -->
                        <td align="center" valign="middle" style="padding: 4px 5px;" class="mobile-social-col">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 20px; border-collapse: separate; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                            <tr>
                              <td align="center" valign="middle" style="padding: 7px 14px;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="border-collapse: collapse;">
                                  <tr>
                                    <td valign="middle" align="center" style="padding-right: 7px; line-height: 1;">
                                      <a href="https://www.instagram.com/asianspicessocial/" target="_blank" style="text-decoration: none; display: inline-block;">
                                        <img src="${instagramIconSrc}" alt="Instagram" width="16" height="16" style="display: block; outline: none; width: 16px; height: 16px;" />
                                      </a>
                                    </td>
                                    <td valign="middle" align="left" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #18181b; line-height: 16px; white-space: nowrap;">
                                      <a href="https://www.instagram.com/asianspicessocial/" target="_blank" style="text-decoration: none; color: #18181b; display: inline-block;">
                                        Instagram
                                      </a>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>

                        <!-- Facebook -->
                        <td align="center" valign="middle" style="padding: 4px 5px;" class="mobile-social-col">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 20px; border-collapse: separate; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                            <tr>
                              <td align="center" valign="middle" style="padding: 7px 14px;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="border-collapse: collapse;">
                                  <tr>
                                    <td valign="middle" align="center" style="padding-right: 7px; line-height: 1;">
                                      <a href="https://www.facebook.com/asianspices.online/" target="_blank" style="text-decoration: none; display: inline-block;">
                                        <img src="${facebookIconSrc}" alt="Facebook" width="16" height="16" style="display: block; outline: none; width: 16px; height: 16px;" />
                                      </a>
                                    </td>
                                    <td valign="middle" align="left" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #18181b; line-height: 16px; white-space: nowrap;">
                                      <a href="https://www.facebook.com/asianspices.online/" target="_blank" style="text-decoration: none; color: #18181b; display: inline-block;">
                                        Facebook
                                      </a>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>

                        <!-- YouTube -->
                        <td align="center" valign="middle" style="padding: 4px 5px;" class="mobile-social-col">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 20px; border-collapse: separate; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                            <tr>
                              <td align="center" valign="middle" style="padding: 7px 14px;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="border-collapse: collapse;">
                                  <tr>
                                    <td valign="middle" align="center" style="padding-right: 7px; line-height: 1;">
                                      <a href="https://www.youtube.com/@AsianSpices-p5c" target="_blank" style="text-decoration: none; display: inline-block;">
                                        <img src="${youtubeIconSrc}" alt="YouTube" width="16" height="16" style="display: block; outline: none; width: 16px; height: 16px;" />
                                      </a>
                                    </td>
                                    <td valign="middle" align="left" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #18181b; line-height: 16px; white-space: nowrap;">
                                      <a href="https://www.youtube.com/@AsianSpices-p5c" target="_blank" style="text-decoration: none; color: #18181b; display: inline-block;">
                                        YouTube
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

                    <!-- Divider -->
                    <div style="border-top: 1px solid #e5e7eb; width: 85%; margin: 0 auto 18px auto;"></div>

                    <!-- Sign-off -->
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; line-height: 20px; color: #52525b;">
                      Met vriendelijke groet,<br />
                      <strong style="color: #18181b; font-weight: 800;">Het team van Asian Spices</strong>
                    </div>

                    <!-- Disclaimer -->
                    <p style="margin: 14px auto 0 auto; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; line-height: 17px; color: #a1a1aa; max-width: 480px;">
                      U ontvangt deze e-mail ter bevestiging van de annulering van uw bestelling. &copy; 2026 Asian Spices. Alle rechten voorbehouden.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

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
 * Plain-text fallback for cancellation confirmation email.
 */
export function generateOrderCancelEmailText(data: OrderCancelEmailData = {}): string {
  const orderNumber = (data.orderNumber && data.orderNumber.trim()) || '{{Bestelnummer}}';
  const rawFirstName = (data.firstName && data.firstName.trim()) || '';
  const firstName = rawFirstName && rawFirstName.toLowerCase() !== 'klant' && !rawFirstName.includes('{{') ? rawFirstName : '';
  const greetingLine = firstName ? `Uw annulering is verwerkt, ${firstName}.` : `Uw annulering is verwerkt.`;
  const paymentMethod = (data.paymentMethod && data.paymentMethod.trim()) || 'Online betaling';
  const totalAmount = data.totalAmount !== undefined ? `${data.totalAmount}` : '0.00';
  const orderOverviewUrl = data.orderOverviewUrl || 'https://www.asianspices.online/account/orders';
  const shopUrl = data.shopUrl || 'https://www.asianspices.online/shop';
  const supportEmail = data.supportEmail || 'klantenservice@asianspices.nl';
  const phoneNumber = data.phoneNumber || '06 44844844';

  const items = data.items && data.items.length > 0 ? data.items : [];

  const itemsText = items.length > 0
    ? items.map(item => `- ${item.name} (${item.quantity}x) - € ${item.price}`).join('\n')
    : '- Geannuleerde artikelen';

  return `ASIAN SPICES - BESTELLING GEANNULEERD (#${orderNumber})
==================================================

${greetingLine}
Bestelling #${orderNumber} wordt niet meer verzonden.

Bestelstatus: Geannuleerd
Referentie: #${orderNumber}
Vervolgactie: Geen actie nodig

Besteloverzicht bekijken:
${orderOverviewUrl}

--------------------------------------------------
GEANNULEERDE ORDER
${itemsText}

Betaalwijze: ${paymentMethod}
--------------------------------------------------
TOTAAL GEANNULEERD: € ${totalAmount}

--------------------------------------------------
WAT GEBEURT ER MET UW BETALING?
1. Al betaald (iDEAL, Bancontact, creditcard):
   € ${totalAmount} wordt binnen 7 dagen automatisch teruggestort.
   [✓ Terugbetaling gestart]

2. Achteraf betalen (Klarna, Riverty):
   De factuur is direct geannuleerd.
   [✓ Niets meer betalen]

3. Punten of kortingscode:
   Ingezette spaarpunten zijn automatisch teruggezet op uw accountsaldo.
   [✓ Saldo bijgewerkt]

Verwerkingstijd: binnen 7 dagen.

--------------------------------------------------
TOCH NOG TREK IN AZIATISCHE GERECHTEN?
Plaats op ieder moment een nieuwe bestelling:
${shopUrl}

--------------------------------------------------
HULP NODIG?
Klantenservice: ${supportEmail}
Telefoon: ${phoneNumber} (Ma t/m vr · 07:00–15:00)
Vermeld altijd bestelnummer #${orderNumber}.

Met vriendelijke groet,
Het team van Asian Spices
`;
}
