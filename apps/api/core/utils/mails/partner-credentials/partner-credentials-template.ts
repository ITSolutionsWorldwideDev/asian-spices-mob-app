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

export interface PartnerCredentialsEmailData {
  firstName?: string;
  lastName?: string;
  username?: string;
  tempPassword?: string;
  loginUrl?: string;
  contactUrl?: string;
  logoUrl?: string;
  tiktokIconUrl?: string;
  instagramIconUrl?: string;
  facebookIconUrl?: string;
  youtubeIconUrl?: string;
}

/**
 * Generate Partner Credentials Approved HTML Email ("Uw partneromgeving staat voor u klaar").
 * Exact implementation matching design screenshots:
 * - Header with "ACCOUNTREGISTRATIE" right label
 * - Warm hero with title, subtitle, and decorative orange badge
 * - Warm greeting to partner
 * - Mint green "VEILIGE TOEGANG" box with key icon badge, credentials table (username + temp password),
 *   CTA button ("Direct inloggen op uw partneraccount →"), and security disclaimer
 * - "GOED OM TE WETEN" tips (72 uur geldig + Kies uw eigen wachtwoord)
 * - "BLIJF VERBONDEN / Volg wat er speelt in de wereld van smaak" heading
 * - "PERSOONLIJKE ONDERSTEUNING / We helpen u graag op weg" AS avatar banner
 * - Master Outlook & Gmail bulletproof social footer
 */
export function generatePartnerCredentialsEmailHtml(data: PartnerCredentialsEmailData = {}): string {
  const firstName = (data.firstName && data.firstName.trim()) || 'partner';
  const username = (data.username && data.username.trim()) || 'partner';
  const tempPassword = (data.tempPassword && data.tempPassword.trim()) || 'Zie instructies per e-mail';
  const loginUrl = data.loginUrl || 'https://www.asianspices.online/partner/login';
  const contactUrl = data.contactUrl || 'https://www.asianspices.online/contact-us';

  const logoSrc = data.logoUrl || DEFAULT_LOGO_SRC;
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
  <title>Uw partneromgeving staat voor u klaar - Asian Spices</title>
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
      .mobile-tip-col {
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
  <!-- Preheader text -->
  <div style="display: none; font-size: 1px; color: #f1f2f5; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Uw tijdelijke inloggegevens voor uw Asian Spices partneromgeving staan klaar.
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
          
          <!-- 1. Header: Brand Logo & Right "ACCOUNTREGISTRATIE" label -->
          <tr>
            <td style="padding: 22px 34px 18px 34px; border: 0;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" valign="middle">
                    <img src="${logoSrc}" alt="Asian Spices" width="70" height="70" style="display: block; border: 0; width: 70px; height: 70px; max-width: 70px; outline: none;" />
                  </td>
                  <td align="right" valign="middle">
                    <span style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1.6px; color: #71717a; text-transform: uppercase;">
                      ACCOUNTREGISTRATIE
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 2. Hero Section: Warm soft cream background with Title & decorative accent -->
          <tr>
            <td bgcolor="#fffdfa" style="background-color: #fffdfa; padding: 36px 34px 34px 34px; border-top: 1px solid #fef3c7; border-bottom: 1px solid #fef3c7;" class="mobile-padding">
              <!-- Eyebrow -->
              <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #c2410c; text-transform: uppercase; margin-bottom: 8px;">
                WELKOM BIJ DE FAMILIE
              </div>

              <!-- Main Title -->
              <h1 style="margin: 0 0 14px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 30px; line-height: 38px; font-weight: 700; color: #18181b;">
                Uw partneromgeving staat<br />voor u klaar.
              </h1>

              <!-- Subtitle -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td valign="middle">
                    <p style="margin: 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; line-height: 22px; color: #52525b; max-width: 480px;">
                      Samen brengen we de authentieke geuren en smaken van Azi&euml; naar een breder publiek.
                    </p>
                  </td>
                  <!-- Decorative orange circle dot -->
                  <td width="24" align="right" valign="bottom">
                    <div style="width: 14px; height: 14px; background-color: #ea580c; border-radius: 50%;"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 3. Intro Greeting Section -->
          <tr>
            <td style="padding: 30px 34px 18px 34px;" class="mobile-padding">
              <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 15px; font-weight: 800; color: #18181b; margin-bottom: 12px;">
                Beste <strong style="color: #18181b;">${firstName}</strong>,
              </div>
              <p style="margin: 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; line-height: 22px; color: #52525b;">
                Wat ontzettend fijn om u officieel te mogen verwelkomen als partner van Asian Spices! Vanaf vandaag bundelen we onze krachten voor een inspirerende, smaakvolle en langdurige samenwerking.
              </p>
            </td>
          </tr>

          <!-- 4. Section: "VEILIGE TOEGANG / Uw tijdelijke inloggegevens" -->
          <tr>
            <td style="padding: 0 30px 24px 30px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f2f7f4" style="background-color: #f2f7f4; border-radius: 16px; border: 1px solid #dcece2; padding: 24px 22px;">
                <tr>
                  <td>
                    <!-- Key Badge & Title Header -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
                      <tr>
                        <!-- Dark green key circle badge -->
                        <td width="48" valign="middle">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="42" height="42" bgcolor="#1b4332" style="background-color: #1b4332; border-radius: 50%; text-align: center;">
                            <tr>
                              <td align="center" valign="middle" style="font-size: 18px; color: #ffffff;">&#128273;</td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle" style="padding-left: 12px;">
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1.4px; color: #c2410c; text-transform: uppercase;">
                            VEILIGE TOEGANG
                          </div>
                          <h2 style="margin: 2px 0 0 0; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #18181b;">
                            Uw tijdelijke inloggegevens
                          </h2>
                        </td>
                      </tr>
                    </table>

                    <!-- White Credentials Box -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 12px; border: 1px solid #e4e4e7; overflow: hidden; margin-bottom: 18px;">
                      <tr>
                        <td style="padding: 13px 18px; border-bottom: 1px solid #f4f4f5; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; color: #71717a;">
                          Gebruikersnaam
                        </td>
                        <td align="right" style="padding: 13px 18px; border-bottom: 1px solid #f4f4f5; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; font-weight: 800; color: #18181b;">
                          ${username}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 13px 18px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; color: #71717a;">
                          Tijdelijk wachtwoord
                        </td>
                        <td align="right" style="padding: 13px 18px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; font-weight: 800; color: #18181b;">
                          ${tempPassword}
                        </td>
                      </tr>
                    </table>

                    <!-- Big Orange Button -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 auto 10px auto;">
                      <tr>
                        <td align="center" valign="middle" bgcolor="#c2410c" style="background-color: #c2410c; border-radius: 8px; padding: 14px 24px; box-shadow: 0 3px 10px rgba(194, 65, 12, 0.25);">
                          <a href="${loginUrl}" target="_blank" style="display: block; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; font-weight: 700; color: #ffffff; text-decoration: none; line-height: 100%; white-space: nowrap;">
                            Direct inloggen op uw partneraccount &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Security Note -->
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; color: #71717a; text-align: center;">
                      Deel deze inloggegevens niet met anderen.
                    </div>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 5. Section: "GOED OM TE WETEN / Een kleine tip voor de eerste keer" -->
          <tr>
            <td style="padding: 0 30px 28px 30px;" class="mobile-padding">
              <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; font-weight: 800; letter-spacing: 1.5px; color: #ea580c; text-transform: uppercase; margin-bottom: 4px;">
                GOED OM TE WETEN
              </div>
              <h2 style="margin: 0 0 16px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #18181b;">
                Een kleine tip voor de eerste keer
              </h2>

              <!-- Two Cards side-by-side -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <!-- Card 1: 72 uur geldig -->
                  <td width="48%" valign="top" bgcolor="#fdfaf6" style="background-color: #fdfaf6; border-radius: 12px; border: 1px solid #f4ebd9; padding: 18px;" class="mobile-tip-col">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="30" height="30" bgcolor="#e8f5e9" style="background-color: #e8f5e9; border-radius: 50%; text-align: center;">
                      <tr>
                        <td align="center" valign="middle" style="font-size: 14px;">&#9200;</td>
                      </tr>
                    </table>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 800; color: #18181b; margin-top: 10px; margin-bottom: 4px;">
                      72 uur geldig
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11.5px; line-height: 17px; color: #52525b;">
                      Uw tijdelijke wachtwoord is om veiligheidsredenen 72 uur geldig. We raden u aan om vandaag nog even in te loggen.
                    </div>
                  </td>

                  <td width="4%"></td>

                  <!-- Card 2: Kies uw eigen wachtwoord -->
                  <td width="48%" valign="top" bgcolor="#fdfaf6" style="background-color: #fdfaf6; border-radius: 12px; border: 1px solid #f4ebd9; padding: 18px;" class="mobile-tip-col">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="30" height="30" bgcolor="#e8f5e9" style="background-color: #e8f5e9; border-radius: 50%; text-align: center;">
                      <tr>
                        <td align="center" valign="middle" style="font-size: 14px;">&#128737;</td>
                      </tr>
                    </table>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 800; color: #18181b; margin-top: 10px; margin-bottom: 4px;">
                      Kies uw eigen wachtwoord
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11.5px; line-height: 17px; color: #52525b;">
                      Bij uw eerste bezoek vraagt het systeem automatisch om een nieuw wachtwoord voor al uw toekomstige bezoeken.
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- 6. Section: "BLIJF VERBONDEN / Volg wat er speelt in de wereld van smaak." -->
          <tr>
            <td style="padding: 0 34px 26px 34px; text-align: center;" class="mobile-padding">
              <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10.5px; font-weight: 800; letter-spacing: 1.8px; color: #c2410c; text-transform: uppercase; margin-bottom: 6px;">
                BLIJF VERBONDEN
              </div>
              <h2 style="margin: 0 auto 10px auto; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; line-height: 32px; font-weight: 700; color: #18181b; max-width: 440px;">
                Volg wat er speelt in de wereld van smaak.
              </h2>
              <p style="margin: 0 auto; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; line-height: 19px; color: #52525b; max-width: 440px;">
                Laat u inspireren via onze zakelijke kanalen voor de nieuwste producten, culinaire trends en partneracties.
              </p>
            </td>
          </tr>

          <!-- 7. Support Banner: "PERSOONLIJKE ONDERSTEUNING / We helpen u graag op weg" -->
          <tr>
            <td style="padding: 0 30px 30px 30px;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#fff9f0" style="background-color: #fff9f0; border-left: 4px solid #ea580c; border-radius: 0 12px 12px 0; border-top: 1px solid #fef3c7; border-right: 1px solid #fef3c7; border-bottom: 1px solid #fef3c7; padding: 22px;">
                <tr>
                  <td>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <!-- AS Avatar Circle Badge -->
                        <td width="48" valign="top" style="padding-right: 14px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="46" height="46" bgcolor="#1b4332" style="background-color: #1b4332; border-radius: 50%; text-align: center;">
                            <tr>
                              <td align="center" valign="middle" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 14px; font-weight: 800; color: #ffffff;">
                                AS
                              </td>
                            </tr>
                          </table>
                        </td>

                        <!-- Content -->
                        <td valign="top">
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1.4px; color: #c2410c; text-transform: uppercase; margin-bottom: 4px;">
                            PERSOONLIJKE ONDERSTEUNING
                          </div>
                          <h3 style="margin: 0 0 6px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 700; color: #18181b;">
                            We helpen u graag op weg
                          </h3>
                          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; line-height: 18px; color: #52525b; margin-bottom: 14px;">
                            Loopt u ergens tegenaan bij het inrichten van uw account? Aarzel dan niet om contact met ons op te nemen. Ons partnerteam staat voor u klaar.
                          </div>
                          <div>
                            <a href="${contactUrl}" target="_blank" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; font-weight: 800; color: #c2410c; text-decoration: none;">
                              Neem contact op &rarr;
                            </a>
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

/**
 * Plain-text fallback for partner credentials approved email.
 */
export function generatePartnerCredentialsEmailText(data: PartnerCredentialsEmailData = {}): string {
  const firstName = (data.firstName && data.firstName.trim()) || 'partner';
  const username = (data.username && data.username.trim()) || 'partner';
  const tempPassword = (data.tempPassword && data.tempPassword.trim()) || 'Zie instructies per e-mail';
  const loginUrl = data.loginUrl || 'https://www.asianspices.online/partner/login';
  const contactUrl = data.contactUrl || 'https://www.asianspices.online/contact-us';

  return `ASIAN SPICES - UW PARTNEROMGEVING STAAT VOOR U KLAAR
==================================================

Beste ${firstName},

Wat ontzettend fijn om u officieel te mogen verwelkomen als partner van Asian Spices! Vanaf vandaag bundelen we onze krachten voor een inspirerende, smaakvolle en langdurige samenwerking.

UW TIJDELIJKE INLOGGEGEVENS:
--------------------------------------------------
Gebruikersnaam:       ${username}
Tijdelijk wachtwoord: ${tempPassword}

Direct inloggen op uw partneraccount:
${loginUrl}

(Deel deze inloggegevens niet met anderen)

--------------------------------------------------
GOED OM TE WETEN - TIPS VOOR DE EERSTE KEER:
- 72 uur geldig: Uw tijdelijke wachtwoord is om veiligheidsredenen 72 uur geldig.
- Kies uw eigen wachtwoord: Bij uw eerste bezoek vraagt het systeem automatisch om een nieuw wachtwoord.

--------------------------------------------------
PERSOONLIJKE ONDERSTEUNING
Loopt u ergens tegenaan? Neem gerust contact op:
${contactUrl}

Met vriendelijke groet,
Het team van Asian Spices
`;
}
