/**
 * CardPulse - Dynamic OpenGraph & Social Card Generator
 * Layout & Typography Engine.
 * Handles dynamic Flexbox canvas sizing (1200x630px), multi-line wrapping calculations,
 * and adaptive font sizing to prevent visual clipping or layout collapse.
 */

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 630;
export const MAX_SAFE_TITLE_LENGTH = 240;

export interface TitleTypography {
  fontSize: number;
  lineHeight: number;
  maxLines: number;
  formattedTitle: string;
}

/**
 * Calculates adaptive font size and line height based on measured title character length.
 * Truncates gracefully at the nearest word boundary if character count exceeds safe limits.
 */
export function calculateTitleTypography(rawTitle: string): TitleTypography {
  if (!rawTitle || typeof rawTitle !== 'string') {
    return {
      fontSize: 48,
      lineHeight: 1.2,
      maxLines: 3,
      formattedTitle: 'Untitled Card',
    };
  }

  const cleaned = rawTitle.trim().replace(/\s+/g, ' ');

  let formattedTitle = cleaned;
  if (cleaned.length > MAX_SAFE_TITLE_LENGTH) {
    // Truncate at nearest word boundary before MAX_SAFE_TITLE_LENGTH
    const truncated = cleaned.slice(0, MAX_SAFE_TITLE_LENGTH);
    const lastSpace = truncated.lastIndexOf(' ');
    formattedTitle = (lastSpace > 180 ? truncated.slice(0, lastSpace) : truncated) + '...';
  }

  const len = formattedTitle.length;
  let fontSize = 52;
  let lineHeight = 1.18;
  let maxLines = 3;

  if (len <= 40) {
    fontSize = 58;
    lineHeight = 1.14;
    maxLines = 2;
  } else if (len <= 85) {
    fontSize = 48;
    lineHeight = 1.2;
    maxLines = 3;
  } else if (len <= 150) {
    fontSize = 38;
    lineHeight = 1.25;
    maxLines = 4;
  } else {
    fontSize = 32;
    lineHeight = 1.28;
    maxLines = 4;
  }

  return {
    fontSize,
    lineHeight,
    maxLines,
    formattedTitle,
  };
}

/**
 * Sanitizes text to prevent XML breakage or XSS in SVG generation.
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
