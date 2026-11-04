export * from './email-footer';
export * from './email-layout';
export * from './email-attachments';
export {
  CHECK_CIRCLE_ICON_BASE64,
  CLOCK_CIRCLE_ICON_BASE64,
  AS_CIRCLE_ICON_BASE64,
  TIKTOK_ICON_BASE64,
  INSTAGRAM_ICON_BASE64,
  FACEBOOK_ICON_BASE64,
  YOUTUBE_ICON_BASE64,
} from './partner-icons-data';
export { ASIAN_SPICES_LOGO_BASE64 } from './partner-logo-data';

const CDN_BASE = 'https://www.asianspices.online/images';

export const DEFAULT_LOGO_SRC = `${CDN_BASE}/asian-spices-logo.png`;
export const DEFAULT_TIKTOK_SRC = `${CDN_BASE}/tiktok.png`;
export const DEFAULT_INSTAGRAM_SRC = `${CDN_BASE}/instagram.png`;
export const DEFAULT_FACEBOOK_SRC = `${CDN_BASE}/facebook.png`;
export const DEFAULT_YOUTUBE_SRC = `${CDN_BASE}/youtube.png`;
export const DEFAULT_CHECK_SRC = `${CDN_BASE}/check-circle.png`;
export const DEFAULT_CLOCK_SRC = `${CDN_BASE}/clock-circle.png`;

export function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
