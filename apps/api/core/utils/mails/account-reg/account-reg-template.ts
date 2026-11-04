import {
  ASIAN_SPICES_LOGO_BASE64,
  DEFAULT_LOGO_SRC,
  DEFAULT_TIKTOK_SRC,
  DEFAULT_INSTAGRAM_SRC,
  DEFAULT_FACEBOOK_SRC,
  DEFAULT_YOUTUBE_SRC,
  TIKTOK_ICON_BASE64,
  INSTAGRAM_ICON_BASE64,
  FACEBOOK_ICON_BASE64,
  YOUTUBE_ICON_BASE64,
  escapeHtml,
} from '../shared';

export interface AccountRegistrationEmailData {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  temporaryPassword?: string;
  accountType?: string;
  loginUrl?: string;
  supportEmail?: string;
  phoneNumber?: string;
  logoUrl?: string;
  tiktokIconUrl?: string;
  instagramIconUrl?: string;
  facebookIconUrl?: string;
  youtubeIconUrl?: string;
}

/**
 * Generate Account Registration Confirmation HTML Email.
 * Layout and styling exactly match the deliverable order confirmation email.
 */
export function generateAccountRegistrationEmailHtml(data: AccountRegistrationEmailData = {}): string {
  let firstName = data.firstName?.trim();
  let lastName = data.lastName?.trim();
  if (!firstName && !lastName && data.fullName?.trim()) {
    const parts = data.fullName.trim().split(/\s+/);
    if (parts.length > 1) {
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    } else {
      firstName = parts[0];
    }
  }

  const email = (data.email && data.email.trim()) || '';
  const temporaryPassword = data.temporaryPassword?.trim() || '';
  const accountType = (data.accountType && data.accountType.trim()) || 'Klantaccount';
  const loginUrl = (data.loginUrl && data.loginUrl.trim()) || 'https://asianspices.online/login';
  const logoSrc = data.logoUrl || DEFAULT_LOGO_SRC || ASIAN_SPICES_LOGO_BASE64;
  const tiktokIconSrc = data.tiktokIconUrl || DEFAULT_TIKTOK_SRC || TIKTOK_ICON_BASE64;
  const instagramIconSrc = data.instagramIconUrl || DEFAULT_INSTAGRAM_SRC || INSTAGRAM_ICON_BASE64;
  const facebookIconSrc = data.facebookIconUrl || DEFAULT_FACEBOOK_SRC || FACEBOOK_ICON_BASE64;
  const youtubeIconSrc = data.youtubeIconUrl || DEFAULT_YOUTUBE_SRC || YOUTUBE_ICON_BASE64;

  const greetingTitle = firstName
    ? `Welkom, ${escapeHtml(firstName)}!`
    : 'Welkom bij Asian Spices!';

  const headerBadge = temporaryPassword ? 'ACCOUNT AANGEMAAKT' : 'ACCOUNTREGISTRATIE';
  const eyebrowText = temporaryPassword ? 'ACCOUNT AANGEMAAKT' : 'REGISTRATIE SUCCESVOL';
  const pageTitle = temporaryPassword
    ? 'Uw Asian Spices Account is Aangemaakt'
    : 'Bevestiging Accountregistratie - Asian Spices';
  const subtitleText = temporaryPassword
    ? 'Hartelijk dank voor uw bestelling bij Asian Spices. Er is automatisch een account voor u aangemaakt zodat u uw bestelling 24/7 kunt volgen en in de toekomst sneller kunt bestellen.'
    : 'Hartelijk dank voor uw registratie bij Asian Spices. Uw account is succesvol aangemaakt en direct klaar voor gebruik.';
  const detailsHeading = temporaryPassword ? 'Inloggegevens van uw account' : 'Overzicht van uw account';

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="nl">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${pageTitle}</title>
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
      .mobile-stack-col {
        display: block !important;
        width: 100% !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        margin-bottom: 12px !important;
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

          <!-- 1. Top Bar: Brand Logo & Label -->
          <tr>
            <td style="padding: 22px 34px 18px 34px; border: 0; border: none; mso-border-alt: none;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 0; border: none; mso-border-alt: none;">
                <tr>
                  <td align="left" valign="middle" style="border: 0; border: none; mso-border-alt: none;">
                    <img src="${logoSrc}" alt="Asian Spices" width="70" height="70" style="display: block; border: 0; width: 70px; height: 70px; max-width: 70px; outline: none;" />
                  </td>
                  <td align="right" valign="middle" style="border: 0; border: none; mso-border-alt: none;">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #ea580c; text-transform: uppercase;">
                      ${headerBadge}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 2. Hero Section (Matches Order Confirmation) -->
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
                ${eyebrowText}
              </div>

              <!-- Main Greeting Title -->
              <h1 style="margin: 0 0 10px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; line-height: 36px; font-weight: 700; color: #18181b;">
                ${greetingTitle}
              </h1>

              <!-- Subtitle -->
              <p style="margin: 0 auto 10px auto; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; line-height: 20px; color: #52525b; max-width: 440px;">
                ${subtitleText}
              </p>
            </td>
          </tr>

          <!-- 3. Account Details Section -->
          <tr>
            <td style="padding: 28px 30px 20px 30px;" class="mobile-padding">

              <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; font-weight: 800; letter-spacing: 1.6px; color: #ea580c; text-transform: uppercase; margin-bottom: 6px;">
                ${temporaryPassword ? 'UW INLOGGEGEVENS' : 'UW GEGEVENS'}
              </div>
              <h2 style="margin: 0 0 16px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; line-height: 28px; font-weight: 700; color: #18181b;">
                ${detailsHeading}
              </h2>

              <!-- Account Info Table -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f8f9fa" style="background-color: #f8f9fa; border-radius: 12px; border: 1px solid #edf0f3; margin-bottom: ${temporaryPassword ? '14px' : '22px'};">
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #edf0f3; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 0.8px; color: #71717a; text-transform: uppercase;">
                    E-mailadres
                  </td>
                  <td align="right" style="padding: 14px 18px; border-bottom: 1px solid #edf0f3; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 700; color: #18181b;">
                    ${escapeHtml(email)}
                  </td>
                </tr>
                ${temporaryPassword ? `
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #edf0f3; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 0.8px; color: #71717a; text-transform: uppercase;">
                    Tijdelijk wachtwoord
                  </td>
                  <td align="right" style="padding: 14px 18px; border-bottom: 1px solid #edf0f3;">
                    <span style="font-family: monospace; font-size: 14px; font-weight: 700; color: #ea580c; background-color: #fff1e6; padding: 3px 8px; border-radius: 4px; display: inline-block;">
                      ${escapeHtml(temporaryPassword)}
                    </span>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 14px 18px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 0.8px; color: #71717a; text-transform: uppercase;">
                    Accounttype
                  </td>
                  <td align="right" style="padding: 14px 18px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 700; color: #ea580c;">
                    ${escapeHtml(accountType)}
                  </td>
                </tr>
              </table>

              ${temporaryPassword ? `
              <!-- Security Tip Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#fff7ed" style="background-color: #fff7ed; border-radius: 10px; border: 1px solid #fed7aa; margin-bottom: 22px;">
                <tr>
                  <td style="padding: 12px 16px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; line-height: 18px; color: #9a3412;">
                    <strong>Veiligheidstip:</strong> Wij raden u aan om na het inloggen dit tijdelijke wachtwoord te wijzigen via uw profielpagina.
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- CTA: Direct inloggen op uw account -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 4px 0 22px 0;">
                <tr>
                  <td align="center" style="padding: 4px 0 14px 0;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td align="center" bgcolor="#ea580c" style="background-color: #ea580c; border-radius: 9999px; padding: 14px 34px; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.35);">
                          <a href="${loginUrl}" target="_blank" style="display: inline-block; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; letter-spacing: 0.3px; line-height: 100%;">
                            Inloggen op uw account &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11.5px; color: #71717a; text-align: center; margin-top: 12px; line-height: 18px;">
                      Werkt de knop niet? Ga direct naar:<br />
                      <a href="${loginUrl}" target="_blank" style="color: #ea580c; text-decoration: underline; font-weight: 600; word-break: break-all;">
                        ${escapeHtml(loginUrl)}
                      </a>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Benefits Card (Matches How Nu Verder style) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 12px; border: 1px solid #edf0f3; padding: 20px; margin-bottom: 8px;">
                <tr>
                  <td>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 800; color: #18181b; margin-bottom: 14px;">
                      Met uw account heeft u direct toegang tot:
                    </div>

                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 10px;">
                      <tr>
                        <td valign="top" width="22" style="font-family: Arial, sans-serif; font-size: 13px; color: #ea580c; font-weight: bold; line-height: 20px;">
                          &#10003;
                        </td>
                        <td style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; line-height: 20px; color: #52525b;">
                          <strong style="color: #18181b;">Bestellingen &amp; Facturen:</strong> Overzicht van al uw actuele en eerdere bestellingen 24/7 inzien.
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 10px;">
                      <tr>
                        <td valign="top" width="22" style="font-family: Arial, sans-serif; font-size: 13px; color: #ea580c; font-weight: bold; line-height: 20px;">
                          &#10003;
                        </td>
                        <td style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; line-height: 20px; color: #52525b;">
                          <strong style="color: #18181b;">Snelle Verwerking:</strong> Gegevens vooraf ingevuld voor een soepele en veilige checkout.
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td valign="top" width="22" style="font-family: Arial, sans-serif; font-size: 13px; color: #ea580c; font-weight: bold; line-height: 20px;">
                          &#10003;
                        </td>
                        <td style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; line-height: 20px; color: #52525b;">
                          <strong style="color: #18181b;">Spaarpunten:</strong> Automatisch punten sparen bij elke bestelling voor exclusieve kortingen.
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- 4. Community: Asian Spices Kitchen (Matches Order Confirmation) -->
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
                      Bent u trots op uw culinaire creaties? Deel uw talent met onze community en inspireer andere liefhebbers van de Aziatische keuken!
                    </p>

                    <!-- Two white cards -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
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

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 5. Support Banner (Matches Order Confirmation) -->
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
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1.2px; color: #c2410c; text-transform: uppercase;">
                            ONZE E-MAILSERVICE IS 24/7 BESCHIKBAAR.
                          </div>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; color: #71717a; margin-top: 2px;">
                            Reactietijd binnen 24 uur.
                          </div>
                        </td>

                        <!-- Right Hours Info -->
                        <td valign="top" align="right" class="mobile-stack-col" style="text-align: right;">
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; color: #71717a;">
                            Ma t/m vr &middot; 07:00&ndash;15:00
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 6. Footer (Matches Order Confirmation) -->
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
                      ${temporaryPassword
      ? 'U ontvangt deze e-mail omdat u recent een bestelling heeft geplaatst bij Asian Spices. &copy; 2026 Asian Spices. Alle rechten voorbehouden.'
      : 'U ontvangt deze e-mail omdat u recent een account heeft aangemaakt bij Asian Spices. &copy; 2026 Asian Spices. Alle rechten voorbehouden.'
    }
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
 * Plain-text fallback for email clients that do not render HTML.
 */
export function generateAccountRegistrationEmailText(data: AccountRegistrationEmailData = {}): string {
  let firstName = data.firstName?.trim();
  let lastName = data.lastName?.trim();
  if (!firstName && !lastName && data.fullName?.trim()) {
    const parts = data.fullName.trim().split(/\s+/);
    if (parts.length > 1) {
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    } else {
      firstName = parts[0];
    }
  }

  const email = (data.email && data.email.trim()) || '';
  const temporaryPassword = data.temporaryPassword?.trim() || '';
  const accountType = (data.accountType && data.accountType.trim()) || 'Klantaccount';
  const loginUrl = (data.loginUrl && data.loginUrl.trim()) || 'https://asianspices.online/login';

  const greetingLine = firstName
    ? `Welkom bij Asian Spices, ${firstName}!`
    : 'Welkom bij Asian Spices!';

  const headerTitle = temporaryPassword
    ? 'ASIAN SPICES - ACCOUNT AANGEMAAKT'
    : 'ASIAN SPICES - BEVESTIGING ACCOUNTREGISTRATIE';

  const introText = temporaryPassword
    ? 'Hartelijk dank voor uw bestelling bij Asian Spices. Er is automatisch een account voor u aangemaakt zodat u uw bestelling 24/7 kunt volgen en beheren.'
    : 'Hartelijk dank voor uw registratie bij Asian Spices. Hierbij bevestigen wij dat uw account succesvol is aangemaakt.';

  return `${headerTitle}
==================================================

${greetingLine}

${introText}

UW ACCOUNTGEGEVENS:
--------------------------------------------------
E-mailadres: ${email}
${temporaryPassword ? `Tijdelijk wachtwoord: ${temporaryPassword}\n` : ''}Accounttype: ${accountType}
${temporaryPassword ? '\nVeiligheidstip: Wij raden u aan om na het inloggen dit tijdelijke wachtwoord te wijzigen via uw profielinstellingen.\n' : ''}
DIRECT INLOGGEN:
--------------------------------------------------
U kunt direct inloggen op uw account via onderstaande link:
${loginUrl}

--------------------------------------------------
Met uw account heeft u direct toegang tot:
- Overzicht van uw actuele en eerdere bestellingen
- Inzicht en beheer van uw contact- en factuurgegevens
- Snelle en veilige verwerking van bestellingen
- Automatisch sparen van punten bij elke aankoop

--------------------------------------------------
ASIAN SPICES KITCHEN
Deel uw kookcreaties met hashtag #AsianSpicesKitchen op Instagram of TikTok en spaar voor cadeaus!

--------------------------------------------------
HULP NODIG?
Onze klantenservice helpt u graag.
Openingstijden: Ma t/m vr · 07:00–15:00
Reactietijd via e-mail binnen 24 uur.

--------------------------------------------------
Met vriendelijke groet,
Het team van Asian Spices
© 2026 Asian Spices. Alle rechten voorbehouden.
`;
}