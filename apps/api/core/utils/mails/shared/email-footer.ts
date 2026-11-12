import { ASIAN_SPICES_LOGO_BASE64 } from './partner-logo-data';
import {
  TIKTOK_ICON_BASE64,
  INSTAGRAM_ICON_BASE64,
  FACEBOOK_ICON_BASE64,
  YOUTUBE_ICON_BASE64,
} from './partner-icons-data';

export interface EmailFooterOptions {
  logoUrl?: string;
  tiktokIconUrl?: string;
  instagramIconUrl?: string;
  facebookIconUrl?: string;
  youtubeIconUrl?: string;
  signoffText?: string;
  subtext?: string;
}

/**
 * Outlook (Word engine) & Gmail bulletproof social footer.
 * Note: Never wrap <table> with <a> tag because Outlook ignores/strips links on tables.
 * Anchor tags must reside inside <td>.
 */
export function renderEmailSocialFooter(options: EmailFooterOptions = {}): string {
  const logoSrc = options.logoUrl || ASIAN_SPICES_LOGO_BASE64;
  const tiktokIconSrc = options.tiktokIconUrl || TIKTOK_ICON_BASE64;
  const instagramIconSrc = options.instagramIconUrl || INSTAGRAM_ICON_BASE64;
  const facebookIconSrc = options.facebookIconUrl || FACEBOOK_ICON_BASE64;
  const youtubeIconSrc = options.youtubeIconUrl || YOUTUBE_ICON_BASE64;
  const signoff = options.signoffText || 'Hartelijke groet,<br /><strong style="color: #18181b; font-weight: 800;">Het Asian Spices Team</strong>';
  const subtext = options.subtext ?? 'We kijken uit naar een inspirerende, smaakvolle en langdurige samenwerking. Welkom bij de Asian Spices-familie!';

  return `
      <!-- Shared Footer: Rounded container inside email with Brand Logo & Social Icons -->
      <tr>
        <td style="padding: 0 26px 30px 26px; border: 0; border: none; mso-border-alt: none;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 0; border: none; mso-border-alt: none; text-align: center;">
            <tr>
              <td style="background-color: #f8f9fa; border-radius: 16px; border: 1px solid #edf0f3; mso-border-alt: solid #edf0f3 1pt; padding: 28px 24px 26px 24px; text-align: center;">
                <!-- Centered Brand Logo -->
                <div style="text-align: center; margin-bottom: 10px; border: 0;">
                  <img src="${logoSrc}" alt="Asian Spices" width="68" height="68" style="display: block; border: 0; margin: 0 auto; width: 68px; height: 68px; max-width: 68px; outline: none;" />
                </div>

                <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11.5px; color: #71717a; margin-top: 10px; margin-bottom: 16px; border: 0;">
                  Volg ons voor dagelijkse inspiratie
                </div>

                <!-- Social Media Channels (2x2 balanced grid, bulletproof across Outlook & Gmail) -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 20px auto; border-collapse: separate;">
                  <tr>
                    <!-- TikTok -->
                    <td align="center" valign="middle" style="padding: 4px 6px;" width="135">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="135" bgcolor="#ffffff" style="background-color: #ffffff; width: 135px; border: 1px solid #e4e4e7; border-radius: 20px;">
                        <tr>
                          <td align="center" valign="middle" style="padding: 7px 12px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                              <tr>
                                <td valign="middle" style="padding-right: 7px; line-height: 1;">
                                  <a href="https://www.tiktok.com/@asianspices.online?lang=en" target="_blank" style="text-decoration: none; display: inline-block;">
                                    <img src="${tiktokIconSrc}" alt="TikTok" width="16" height="16" style="display: block; width: 16px; height: 16px; border: 0;" />
                                  </a>
                                </td>
                                <td valign="middle" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #18181b; white-space: nowrap;">
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
                    <td align="center" valign="middle" style="padding: 4px 6px;" width="135">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="135" bgcolor="#ffffff" style="background-color: #ffffff; width: 135px; border: 1px solid #e4e4e7; border-radius: 20px;">
                        <tr>
                          <td align="center" valign="middle" style="padding: 7px 12px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                              <tr>
                                <td valign="middle" style="padding-right: 7px; line-height: 1;">
                                  <a href="https://www.instagram.com/asianspicessocial/" target="_blank" style="text-decoration: none; display: inline-block;">
                                    <img src="${instagramIconSrc}" alt="Instagram" width="16" height="16" style="display: block; width: 16px; height: 16px; border: 0;" />
                                  </a>
                                </td>
                                <td valign="middle" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #18181b; white-space: nowrap;">
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
                  </tr>
                  <tr>
                    <!-- Facebook -->
                    <td align="center" valign="middle" style="padding: 4px 6px;" width="135">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="135" bgcolor="#ffffff" style="background-color: #ffffff; width: 135px; border: 1px solid #e4e4e7; border-radius: 20px;">
                        <tr>
                          <td align="center" valign="middle" style="padding: 7px 12px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                              <tr>
                                <td valign="middle" style="padding-right: 7px; line-height: 1;">
                                  <a href="https://www.facebook.com/asianspices.online/" target="_blank" style="text-decoration: none; display: inline-block;">
                                    <img src="${facebookIconSrc}" alt="Facebook" width="16" height="16" style="display: block; width: 16px; height: 16px; border: 0;" />
                                  </a>
                                </td>
                                <td valign="middle" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #18181b; white-space: nowrap;">
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
                    <td align="center" valign="middle" style="padding: 4px 6px;" width="135">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="135" bgcolor="#ffffff" style="background-color: #ffffff; width: 135px; border: 1px solid #e4e4e7; border-radius: 20px;">
                        <tr>
                          <td align="center" valign="middle" style="padding: 7px 12px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                              <tr>
                                <td valign="middle" style="padding-right: 7px; line-height: 1;">
                                  <a href="https://www.youtube.com/@AsianSpices-p5c" target="_blank" style="text-decoration: none; display: inline-block;">
                                    <img src="${youtubeIconSrc}" alt="YouTube" width="16" height="16" style="display: block; width: 16px; height: 16px; border: 0;" />
                                  </a>
                                </td>
                                <td valign="middle" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #18181b; white-space: nowrap;">
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

                <!-- Sign-off with Clean Spacing -->
                <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; line-height: 20px; color: #52525b; border: 0;">
                  ${signoff}
                </div>

                ${subtext ? `
                <p style="margin: 14px auto 0 auto; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 10.5px; line-height: 17px; mso-line-height-rule: exactly; color: #a1a1aa; max-width: 460px; border: 0;">
                  ${subtext}
                </p>
                ` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
  `;
}
