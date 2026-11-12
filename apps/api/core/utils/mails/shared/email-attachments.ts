import path from 'path';
import fs from 'fs';

export interface EmailAttachment {
  filename: string;
  path?: string;
  cid?: string;
  contentType?: string;
  contentDisposition?: 'inline' | 'attachment';
}

/**
 * Returns branding attachments.
 * Configured to return empty array because images are now hosted on CDN, completely eliminating attachment chips in Gmail.
 */
export function getEmailBrandingAttachments(): EmailAttachment[] {
  return [];
}
