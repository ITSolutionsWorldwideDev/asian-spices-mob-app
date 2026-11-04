import {
  DEFAULT_LOGO_SRC,
  DEFAULT_TIKTOK_SRC,
  DEFAULT_INSTAGRAM_SRC,
  DEFAULT_FACEBOOK_SRC,
  DEFAULT_YOUTUBE_SRC,
  escapeHtml,
} from '../shared';

export interface OrderItem {
  name: string;
  sku?: string;
  imageUrl?: string;
  quantity: number | string;
  price: number | string;
}

export interface OrderConfirmationEmailData {
  orderNumber?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  orderDate?: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  postalCode?: string;
  city?: string;
  items?: OrderItem[];
  subtotal?: number | string;
  shippingCost?: number | string;
  rewardPoints?: number | string;
  totalAmount?: number | string;
  orderStatusUrl?: string;
  helpPageUrl?: string;
  supportEmail?: string;
  phoneNumber?: string;
  openingHours?: string;
  guestPassword?: string;
  loginUrl?: string;
  logoUrl?: string;
  checkCircleUrl?: string;
  tiktokIconUrl?: string;
  instagramIconUrl?: string;
  facebookIconUrl?: string;
  youtubeIconUrl?: string;
}

/**
 * Generate Order Confirmation HTML Email.
 * NOTE: hidden preheader div intentionally removed (spam filters flag it).
 */
export function generateOrderConfirmationEmailHtml(data: OrderConfirmationEmailData = {}): string {
  const orderNumber = (data.orderNumber && data.orderNumber.trim()) || '{{BESTELNUMMER}}';
  const rawFirstName = (data.firstName && data.firstName.trim()) || '';
  const firstName = rawFirstName && rawFirstName !== 'Klant' && rawFirstName !== '{{Voornaam}}' ? rawFirstName : '';
  const greetingHeading = firstName ? `Bedankt voor uw bestelling,<br />${escapeHtml(firstName)}!` : `Bedankt voor uw bestelling!`;
  const deliveryDate = (data.deliveryDate && data.deliveryDate.trim()) || '{{Bezorgdatum}}';
  const deliveryAddress = (data.deliveryAddress && data.deliveryAddress.trim()) || '{{Bezorgadres}}';
  const postalCode = (data.postalCode && data.postalCode.trim()) || '{{Postcode}}';
  const city = (data.city && data.city.trim()) || '{{Plaats}}';

  const subtotal = data.subtotal !== undefined ? `${data.subtotal}` : '{{Subtotaal}}';
  const shippingCost = data.shippingCost !== undefined ? (data.shippingCost === 0 || data.shippingCost === '0' || data.shippingCost === 'Gratis' ? 'Gratis' : `€ ${data.shippingCost}`) : 'Gratis';
  const rewardPoints = data.rewardPoints !== undefined ? `${data.rewardPoints}` : '{{Aantal_Punten}}';
  const totalAmount = data.totalAmount !== undefined ? `${data.totalAmount}` : '{{Totaalbedrag}}';

  const orderStatusUrl = data.orderStatusUrl || 'https://www.asianspices.online/account/orders';
  const helpPageUrl = data.helpPageUrl || 'https://www.asianspices.online/contact-us';
  const supportEmail = data.supportEmail || 'klantenservice@asianspices.nl';
  const phoneNumber = data.phoneNumber || '06 44844844';
  const openingHours = data.openingHours || 'Ma t/m vr &middot; 07:00&ndash;15:00';
  const guestPassword = data.guestPassword ? data.guestPassword.trim() : null;
  const loginUrl = data.loginUrl || 'https://www.asianspices.online/login';

  const logoSrc = data.logoUrl || DEFAULT_LOGO_SRC;
  const tiktokIconSrc = data.tiktokIconUrl || DEFAULT_TIKTOK_SRC;
  const instagramIconSrc = data.instagramIconUrl || DEFAULT_INSTAGRAM_SRC;
  const facebookIconSrc = data.facebookIconUrl || DEFAULT_FACEBOOK_SRC;
  const youtubeIconSrc = data.youtubeIconUrl || DEFAULT_YOUTUBE_SRC;

  // Default demo items if none passed
  const items: OrderItem[] = (data.items && data.items.length > 0) ? data.items : [
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
              <!-- Product Image -->
              ${itemImg ? `<td width="52" valign="middle" style="padding-right: 14px;"><img src="${itemImg}" alt="${item.name}" width="50" height="50" style="display: block; width: 50px; height: 50px; border-radius: 8px; object-fit: cover; border: 1px solid #e4e4e7;" /></td>` : ''}
              <!-- Product Details -->
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
        <!-- Quantity -->
        <td align="center" style="padding: 14px 12px; ${borderStyle} font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 500; color: #27272a; vertical-align: middle; white-space: nowrap;">
          ${item.quantity}x
        </td>
        <!-- Price -->
        <td align="right" style="padding: 14px 16px; ${borderStyle} font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; font-weight: 800; color: #18181b; vertical-align: middle; white-space: nowrap;">
          &euro; ${item.price}
        </td>
      </tr>
    `;
  }).join('');

  const pageTitle = firstName ? `Bedankt voor uw bestelling, ${escapeHtml(firstName)}! - Asian Spices` : `Bedankt voor uw bestelling! - Asian Spices`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="nl">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${pageTitle}</title>
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
      .mobile-stack-col {
        display: block !important;
        width: 100% !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        margin-bottom: 12px !important;
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

          <!-- 1. Top Bar: Brand Logo & Order Number -->
          <tr>
            <td style="padding: 22px 34px 18px 34px; border: 0; border: none; mso-border-alt: none;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 0; border: none; mso-border-alt: none;">
                <tr>
                  <td align="left" valign="middle" style="border: 0; border: none; mso-border-alt: none;">
                    <img src="${logoSrc}" alt="Asian Spices" width="70" height="70" style="display: block; border: 0; width: 70px; height: 70px; max-width: 70px; outline: none;" />
                  </td>
                  <td align="right" valign="middle" style="border: 0; border: none; mso-border-alt: none;">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #71717a; text-transform: uppercase;">
                      BESTELLING
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; font-weight: 800; color: #ea580c; margin-top: 3px;">
                      #${orderNumber}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 2. Hero Section -->
          <tr>
            <td bgcolor="#fffdfa" style="background-color: #fffdfa; padding: 34px 30px 36px 30px; text-align: center; border-top: 1px solid #fef3c7; border-bottom: 1px solid #fef3c7;" class="mobile-padding">

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
                BESTELLING ONTVANGEN
              </div>

              <!-- Main Greeting Title -->
              <h1 style="margin: 0 0 10px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; line-height: 36px; font-weight: 700; color: #18181b;">
                ${greetingHeading}
              </h1>

              <!-- Subtitle -->
              <p style="margin: 0 auto 26px auto; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; line-height: 20px; color: #52525b; max-width: 440px;">
                Fijn dat u kiest voor Asian Spices. We gaan direct aan de slag om uw specerijen en ingredi&euml;nten met zorg in te pakken.
              </p>

              <!-- Progress Tracker (Besteld - Verzonden - Opgeleverd) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" width="100%" style="max-width: 360px; margin: 0 auto; border-collapse: collapse;">
                <tr>
                  <!-- Step 1: Besteld -->
                  <td width="33%" align="center" valign="top">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="50%"></td>
                        <td width="16" align="center" valign="middle">
                          <div style="width: 16px; height: 16px; background-color: #1b4332; border-radius: 50%;"></div>
                        </td>
                        <td width="50%" valign="middle" style="padding-left: 2px;">
                          <div style="height: 3px; background-color: #1b4332; width: 100%;"></div>
                        </td>
                      </tr>
                    </table>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11.5px; font-weight: 800; color: #18181b; padding-top: 6px; white-space: nowrap;">
                      Besteld
                    </div>
                  </td>

                  <!-- Step 2: Verzonden -->
                  <td width="34%" align="center" valign="top">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="50%" valign="middle" style="padding-right: 2px;">
                          <div style="height: 3px; background-color: #1b4332; width: 100%;"></div>
                        </td>
                        <td width="16" align="center" valign="middle">
                          <div style="width: 16px; height: 16px; background-color: #1b4332; border-radius: 50%;"></div>
                        </td>
                        <td width="50%" valign="middle" style="padding-left: 2px;">
                          <div style="height: 3px; background-color: #e4e4e7; width: 100%;"></div>
                        </td>
                      </tr>
                    </table>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11.5px; font-weight: 700; color: #1b4332; padding-top: 6px; white-space: nowrap;">
                      Verzonden
                    </div>
                  </td>

                  <!-- Step 3: Opgeleverd -->
                  <td width="33%" align="center" valign="top">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="50%" valign="middle" style="padding-right: 2px;">
                          <div style="height: 3px; background-color: #e4e4e7; width: 100%;"></div>
                        </td>
                        <td width="16" align="center" valign="middle">
                          <div style="width: 16px; height: 16px; background-color: #ffffff; border: 2px solid #d4d4d8; border-radius: 50%; box-sizing: border-box;"></div>
                        </td>
                        <td width="50%"></td>
                      </tr>
                    </table>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11.5px; font-weight: 500; color: #a1a1aa; padding-top: 6px; white-space: nowrap;">
                      Opgeleverd
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          ${guestPassword ? `
          <!-- Guest Account Credentials Card -->
          <tr>
            <td style="padding: 22px 30px 4px 30px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#fff7ed" style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 14px; padding: 18px 20px;">
                <tr>
                  <td>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 14px; font-weight: 800; color: #ea580c; margin-bottom: 6px;">
                      Uw Asian Spices-account is automatisch aangemaakt!
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; color: #4b5563; line-height: 1.5; margin-bottom: 12px;">
                      Er is automatisch een account voor u aangemaakt zodat u uw bestelling 24/7 kunt volgen en in de toekomst sneller kunt bestellen.
                    </div>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #fed7aa; border-radius: 8px; padding: 12px 14px; margin-bottom: 14px;">
                      <tr>
                        <td style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; color: #18181b; padding: 2px 0;">
                          <strong>E-mail:</strong> ${data.email || ''}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; color: #18181b; padding: 4px 0;">
                          <strong>Tijdelijk wachtwoord:</strong> <span style="font-family: monospace; font-size: 14px; font-weight: 700; color: #ea580c; background-color: #fff1e6; padding: 2px 8px; border-radius: 4px;">${guestPassword}</span>
                        </td>
                      </tr>
                    </table>
                                        <div style="text-align: center; margin: 12px 0 6px 0;">
                      <a href="${loginUrl}" target="_blank" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 11px 26px; border-radius: 9999px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 700;">
                        Inloggen op uw account &rarr;
                      </a>
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; color: #6b7280; text-align: center; margin-top: 10px;">
                      Voor uw veiligheid raden wij aan uw wachtwoord na het inloggen te wijzigen.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- 3. Order Overview (Uw Aankoop) -->
          <tr>
            <td style="padding: 28px 30px 18px 30px;" class="mobile-padding">

              <!-- Section Header -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px;">
                <tr>
                  <td align="left" valign="bottom">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; font-weight: 800; letter-spacing: 1.6px; color: #ea580c; text-transform: uppercase;">
                      UW AANKOOP
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

              <!-- Products Card Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 14px; border: 1px solid #edf0f3; mso-border-alt: solid #edf0f3 1pt; overflow: hidden; margin-bottom: 20px;">
                <!-- Table Header -->
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
                <!-- Product Rows -->
                ${itemsHtml}
              </table>

              <!-- Totals Breakdown -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="50%"></td>
                  <td width="50%" align="right">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 280px; margin-left: auto;">
                      <tr>
                        <td align="left" style="padding: 4px 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; color: #71717a;">
                          Subtotaal
                        </td>
                        <td align="right" style="padding: 4px 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 800; color: #18181b;">
                          &euro; ${subtotal}
                        </td>
                      </tr>
                      <tr>
                        <td align="left" style="padding: 4px 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; color: #71717a;">
                          Verzendkosten
                        </td>
                        <td align="right" style="padding: 4px 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 700; color: #16a34a;">
                          ${shippingCost}
                        </td>
                      </tr>
                      <tr>
                        <td align="left" style="padding: 4px 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; color: #71717a;">
                          Gespaarde punten
                        </td>
                        <td align="right" style="padding: 4px 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; font-weight: 700; color: #16a34a;">
                          +${rewardPoints} punten
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 10px 0 8px 0;">
                          <div style="border-top: 1px solid #e4e4e7; width: 100%;"></div>
                        </td>
                      </tr>
                      <tr>
                        <td align="left" valign="top">
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 14px; font-weight: 800; color: #18181b;">
                            Totaalbedrag
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; color: #a1a1aa; margin-top: 2px;">
                            inclusief btw
                          </div>
                        </td>
                        <td align="right" valign="top" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 20px; font-weight: 800; color: #ea580c; white-space: nowrap;">
                          &euro; ${totalAmount}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- 4. Delivery & Address Cards (Side by side) -->
          <tr>
            <td style="padding: 0 30px 22px 30px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <!-- Card 1: Verwachte bezorging -->
                  <td width="48%" valign="top" bgcolor="#f2f7f4" style="background-color: #f2f7f4; border-radius: 12px; border: 1px solid #dcece2; padding: 16px;" class="mobile-stack-col">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="36" valign="middle">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="32" height="32" bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 50%; text-align: center;">
                            <tr>
                              <td align="center" valign="middle" style="font-size: 15px;">&#128666;</td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle" style="padding-left: 10px;">
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 9.5px; font-weight: 800; letter-spacing: 1px; color: #71717a; text-transform: uppercase;">
                            VERWACHTE BEZORGING
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; font-weight: 800; color: #18181b; margin-top: 3px;">
                            Uiterlijk ${deliveryDate}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <td width="4%"></td>

                  <!-- Card 2: Bezorgadres -->
                  <td width="48%" valign="top" bgcolor="#f2f7f4" style="background-color: #f2f7f4; border-radius: 12px; border: 1px solid #dcece2; padding: 16px;" class="mobile-stack-col">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="36" valign="middle">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="32" height="32" bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 50%; text-align: center;">
                            <tr>
                              <td align="center" valign="middle" style="font-size: 15px;">&#128205;</td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle" style="padding-left: 10px;">
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 9.5px; font-weight: 800; letter-spacing: 1px; color: #71717a; text-transform: uppercase;">
                            BEZORGADRES
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; font-weight: 800; color: #18181b; margin-top: 3px; line-height: 17px;">
                            ${deliveryAddress}<br />${postalCode} ${city}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 5. "Hoe nu verder?" Steps & Button -->
          <tr>
            <td style="padding: 0 30px 24px 30px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 16px; border: 1px solid #edf0f3; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                <tr>
                  <td>
                    <!-- Heading -->
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 15.5px; font-weight: 800; color: #18181b; margin-bottom: 16px;">
                      Hoe nu verder?
                    </div>

                    <!-- Step 1 -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px;">
                      <tr>
                        <td width="28" valign="top">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="22" height="22" bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #fdba74; border-radius: 50%;">
                            <tr>
                              <td align="center" valign="middle" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; font-weight: 800; color: #ea580c; line-height: 22px;">
                                1
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td valign="top" style="padding-left: 10px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; line-height: 19px; color: #52525b;">
                          <strong style="color: #18181b;">Verzending:</strong> Zodra uw bestelling ons magazijn verlaat, ontvangt u een e-mail met een Track &amp; Trace-code om uw pakket te volgen.
                        </td>
                      </tr>
                    </table>

                    <!-- Step 2 -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px;">
                      <tr>
                        <td width="28" valign="top">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="22" height="22" bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #fdba74; border-radius: 50%;">
                            <tr>
                              <td align="center" valign="middle" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; font-weight: 800; color: #ea580c; line-height: 22px;">
                                2
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td valign="top" style="padding-left: 10px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; line-height: 19px; color: #52525b;">
                          <strong style="color: #18181b;">Factuur:</strong> Uw btw-factuur is beschikbaar in uw account zodra het pakket is overgedragen aan de bezorgdienst.
                        </td>
                      </tr>
                    </table>

                    <!-- Step 3 -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 22px;">
                      <tr>
                        <td width="28" valign="top">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="22" height="22" bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #fdba74; border-radius: 50%;">
                            <tr>
                              <td align="center" valign="middle" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; font-weight: 800; color: #ea580c; line-height: 22px;">
                                3
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td valign="top" style="padding-left: 10px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; line-height: 19px; color: #52525b;">
                          <strong style="color: #18181b;">Status inzien:</strong> U kunt de voortgang van uw bestelling 24/7 bekijken via uw persoonlijke accountomgeving.
                        </td>
                      </tr>
                    </table>

                    <!-- Button commented out
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto; border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                      <tr>
                        <td align="center" valign="middle" bgcolor="#ea580c" style="background-color: #ea580c; border-radius: 26px; padding: 13px 36px; mso-padding-alt: 13px 36px; box-shadow: 0 3px 10px rgba(234, 88, 12, 0.3);">
                          <a href="${orderStatusUrl}" target="_blank" style="display: block; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; font-weight: 800; color: #ffffff; text-decoration: none; line-height: 100%; white-space: nowrap;">
                            Naar uw account &amp; bestelstatus
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

          <!-- 6. Community: Asian Spices Kitchen -->
          <tr>
            <td style="padding: 0 30px 24px 30px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f1f5f3" style="background-color: #f1f5f3; border-radius: 16px; border: 1px solid #e0eae4; padding: 24px;">
                <tr>
                  <td>
                    <!-- Eyebrow -->
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1.6px; color: #ea580c; text-transform: uppercase; margin-bottom: 6px;">
                      ASIAN SPICES KITCHEN
                    </div>

                    <!-- Title -->
                    <h2 style="margin: 0 0 10px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; line-height: 28px; font-weight: 700; color: #18181b;">
                      Deel uw kookcreaties &amp; spaar voor cadeaus!
                    </h2>

                    <!-- Subtitle -->
                    <p style="margin: 0 0 20px 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; line-height: 19px; color: #52525b;">
                      Heeft u al kookplannen met uw nieuwe ingredi&euml;nten? Deel uw culinaire talent met onze community en verdien extra punten.
                    </p>

                    <!-- Two white cards -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 18px;">
                      <tr>
                        <!-- Card A -->
                        <td width="48%" valign="top" bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 10px; border: 1px solid #e4e4e7; padding: 14px 16px;" class="mobile-stack-col">
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 800; color: #18181b; margin-bottom: 4px;">
                            Upload via de website
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11.5px; line-height: 17px; color: #52525b;">
                            Voeg foto&apos;s of video&apos;s van uw gerecht toe via Kookkunsten Delen en spaar voor gratis producten en cadeaus.
                          </div>
                        </td>

                        <td width="4%"></td>

                        <!-- Card B -->
                        <td width="48%" valign="top" bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 10px; border: 1px solid #e4e4e7; padding: 14px 16px;" class="mobile-stack-col">
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 800; color: #18181b; margin-bottom: 4px;">
                            Deel via social media
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11.5px; line-height: 17px; color: #52525b;">
                            Gebruik <strong style="color: #ea580c;">#AsianSpicesKitchen</strong> op Instagram of TikTok en tag ons account.
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Social text links commented out
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 700;">
                      <a href="https://www.instagram.com/asianspicessocial/" target="_blank" style="color: #0284c7; text-decoration: underline; margin-right: 14px;">Instagram</a>
                      <a href="https://www.tiktok.com/@asianspices.online?lang=en" target="_blank" style="color: #0284c7; text-decoration: underline; margin-right: 14px;">TikTok</a>
                      <a href="https://www.facebook.com/asianspices.online/" target="_blank" style="color: #0284c7; text-decoration: underline; margin-right: 14px;">Facebook</a>
                      <a href="https://www.youtube.com/@AsianSpices-p5c" target="_blank" style="color: #0284c7; text-decoration: underline;">YouTube</a>
                    </div>
                    -->

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 7. FAQ Preview -->
          <tr>
            <td style="padding: 0 30px 24px 30px;" class="mobile-padding">
              <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; font-weight: 800; letter-spacing: 1.6px; color: #ea580c; text-transform: uppercase; margin-bottom: 4px;">
                VEELGESTELDE VRAGEN
              </div>
              <h2 style="margin: 0 0 16px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #18181b;">
                Goed om te weten
              </h2>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 12px 0; border-top: 1px solid #f1f2f5; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 700; color: #18181b;">
                    <span style="color: #71717a; margin-right: 6px;">&#9656;</span> Kan ik mijn bestelling nog wijzigen of annuleren?
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-top: 1px solid #f1f2f5; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 700; color: #18181b;">
                    <span style="color: #71717a; margin-right: 6px;">&#9656;</span> Kan ik het bezorgadres nog aanpassen?
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 8. Support Banner -->
          <tr>
            <td style="padding: 0 30px 30px 30px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#fff9f0" style="background-color: #fff9f0; border-left: 4px solid #ea580c; border-radius: 0 12px 12px 0; border-top: 1px solid #fef3c7; border-right: 1px solid #fef3c7; border-bottom: 1px solid #fef3c7; padding: 22px;">
                <tr>
                  <td>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <!-- Left Details -->
                        <td valign="top" class="mobile-stack-col">
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1.4px; color: #c2410c; text-transform: uppercase; margin-bottom: 4px;">
                            HULP NODIG?
                          </div>
                          <h3 style="margin: 0 0 6px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 700; color: #18181b;">
                            Onze klantenservice helpt u graag.
                          </h3>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; color: #52525b; margin-bottom: 14px;">
                            Vermeld bij contact altijd uw bestelnummer <strong style="color: #18181b;">#${orderNumber}</strong>.
                          </div>
                          <!-- Help page link commented out to prevent spam triggers
                          <div style="margin-bottom: 16px;">
                            <a href="${helpPageUrl}" target="_blank" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; font-weight: 800; color: #c2410c; text-decoration: none;">
                              Naar onze hulppagina &rarr;
                            </a>
                          </div>
                          -->

                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1.2px; color: #c2410c; text-transform: uppercase;">
                            ONZE E-MAILSERVICE IS 24/7 BESCHIKBAAR.
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; color: #71717a; margin-top: 2px;">
                            Reactietijd binnen 24 uur.
                          </div>
                        </td>

                        <!-- Right Contact Info -->
                        <td valign="top" align="right" class="mobile-stack-col" style="text-align: right;">
                          <!-- Contact info commented out
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; font-weight: 800; color: #166534; margin-bottom: 4px;">
                            ${supportEmail}
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; font-weight: 800; color: #166534; margin-bottom: 6px;">
                            ${phoneNumber}
                          </div>
                          -->
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

          <!-- 9. Social Footer -->
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
                      U ontvangt deze e-mail omdat u een bestelling heeft geplaatst bij Asian Spices. &copy; 2026 Asian Spices. Alle rechten voorbehouden.
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
 * Plain-text fallback for order confirmation email.
 */
export function generateOrderConfirmationEmailText(data: OrderConfirmationEmailData = {}): string {
  const orderNumber = (data.orderNumber && data.orderNumber.trim()) || '{{BESTELNUMMER}}';
  const rawFirstName = (data.firstName && data.firstName.trim()) || '';
  const firstName = rawFirstName && rawFirstName.toLowerCase() !== 'klant' && !rawFirstName.includes('{{') ? rawFirstName : '';
  const greetingLine = firstName ? `Bedankt voor uw bestelling, ${firstName}!` : `Bedankt voor uw bestelling!`;
  const deliveryDate = (data.deliveryDate && data.deliveryDate.trim()) || '{{Bezorgdatum}}';
  const deliveryAddress = (data.deliveryAddress && data.deliveryAddress.trim()) || '{{Bezorgadres}}';
  const postalCode = (data.postalCode && data.postalCode.trim()) || '{{Postcode}}';
  const city = (data.city && data.city.trim()) || '{{Plaats}}';
  const subtotal = data.subtotal !== undefined ? `${data.subtotal}` : '{{Subtotaal}}';
  const shippingCost = data.shippingCost !== undefined ? (data.shippingCost === 0 || data.shippingCost === '0' || data.shippingCost === 'Gratis' ? 'Gratis' : `€ ${data.shippingCost}`) : 'Gratis';
  const rewardPoints = data.rewardPoints !== undefined ? `${data.rewardPoints}` : '{{Aantal_Punten}}';
  const totalAmount = data.totalAmount !== undefined ? `${data.totalAmount}` : '{{Totaalbedrag}}';
  const supportEmail = data.supportEmail || 'klantenservice@asianspices.nl';
  const phoneNumber = data.phoneNumber || '06 44844844';

  const guestPassword = data.guestPassword ? data.guestPassword.trim() : null;
  const loginUrl = data.loginUrl || 'https://www.asianspices.online/login';

  const items = data.items && data.items.length > 0 ? data.items : [
    { name: '{{Productnaam}}', sku: '{{SKU}}', quantity: '{{Aantal}}', price: '{{Prijs}}' }
  ];

  const itemsText = items.map(item => `- ${item.name} (${item.quantity}x) - € ${item.price}`).join('\n');

  return `ASIAN SPICES - BESTELLING #${orderNumber}
==================================================

${greetingLine}
Fijn dat u kiest voor Asian Spices. We gaan direct aan de slag om uw bestelling met zorg in te pakken.
${guestPassword ? `
--------------------------------------------------
UW ACCOUNT IS AANGEMAAKT
Er is automatisch een account voor u aangemaakt:
E-mail: ${data.email || ''}
Tijdelijk wachtwoord: ${guestPassword}
Inloggen: ${loginUrl}
` : ''}

Status: Besteld -> Verzonden -> Opgeleverd

--------------------------------------------------
OVERZICHT VAN UW BESTELLING
${itemsText}

Subtotaal: € ${subtotal}
Verzendkosten: ${shippingCost}
Gespaarde punten: +${rewardPoints} punten
--------------------------------------------------
TOTAALBEDRAG: € ${totalAmount} (inclusief btw)

--------------------------------------------------
VERWACHTE BEZORGING:
Uiterlijk ${deliveryDate}

BEZORGADRES:
${deliveryAddress}
${postalCode} ${city}

--------------------------------------------------
HOE NU VERDER?
1. Verzending: Zodra uw bestelling ons magazijn verlaat, ontvangt u een e-mail met Track & Trace-code.
2. Factuur: Uw btw-factuur is beschikbaar in uw account zodra het pakket is overgedragen.
3. Status inzien: Bekijk de voortgang 24/7 via uw persoonlijke accountomgeving.

--------------------------------------------------
ASIAN SPICES KITCHEN
Deel uw kookcreaties met hashtag #AsianSpicesKitchen op Instagram of TikTok en spaar voor cadeaus!

--------------------------------------------------
HULP NODIG?
<!-- Klantenservice: ${supportEmail} -->
<!-- Telefoon: ${phoneNumber} (Ma t/m vr · 07:00–15:00) -->
Vermeld altijd bestelnummer #${orderNumber}.

Met vriendelijke groet,
Het team van Asian Spices
© 2026 Asian Spices. Alle rechten voorbehouden.
`;
}