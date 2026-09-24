import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { renderCard, clearRenderCache } from '../internal/engine/renderer.js';
import { calculateTitleTypography, CANVAS_WIDTH, CANVAS_HEIGHT } from '../internal/engine/layout.js';
import { getCategoryBadgeStyle, formatReadTime, formatPublicationDate, generateInitialsAvatar } from '../internal/engine/branding.js';

describe('Core Rendering & Layout Engine', () => {
  it('should calculate adaptive typography for varied headline lengths', () => {
    const shortTitle = calculateTitleTypography('Short Headline');
    expect(shortTitle.fontSize).toBe(58);

    const mediumTitle = calculateTitleTypography('A moderately sized headline covering an interesting technical update');
    expect(mediumTitle.fontSize).toBe(48);

    const longTitle = calculateTitleTypography('A very extensive headline that spans across multiple sentences and provides full detailed context about the entire software release architecture');
    expect(longTitle.fontSize).toBe(38);
  });

  it('should map brand color palettes correctly for dynamic category badges', () => {
    const breaking = getCategoryBadgeStyle('Breaking News');
    expect(breaking.bg).toBe('#dc2626');

    const tech = getCategoryBadgeStyle('Tech');
    expect(tech.bg).toBe('#0284c7');

    const culture = getCategoryBadgeStyle('Culture');
    expect(culture.bg).toBe('#7c3aed');

    const unknown = getCategoryBadgeStyle('CustomCategory');
    expect(unknown.bg).toBe('#334155');
  });

  it('should format publication timestamps and reading times reliably', () => {
    expect(formatReadTime(5)).toBe('5 min read');
    expect(formatReadTime('4 min read')).toBe('4 min read');
    expect(formatReadTime(1200)).toBe('6 min read'); // 1200 words / 220 wpm = 6 min
    expect(formatReadTime('')).toBe('3 min read');

    expect(formatPublicationDate(new Date('2026-09-24T12:00:00Z'))).toContain('2026');
  });

  it('should generate circular initials avatar SVG Data URI', () => {
    const avatar = generateInitialsAvatar('Jane Doe');
    expect(avatar).toMatch(/^data:image\/svg\+xml;base64,/);
    const decoded = Buffer.from(avatar.replace('data:image/svg+xml;base64,', ''), 'base64').toString('utf-8');
    expect(decoded).toContain('<svg');
    expect(decoded).toContain('JD');
  });

  it('should render a valid 1200x630 WebP card with correct metadata', async () => {
    clearRenderCache();
    const result = await renderCard({
      title: 'Validating OpenGraph Canvas Output Dimensions',
      category: 'Tech',
      author: 'Test Engineer',
      readTime: '3 min read',
    }, { format: 'webp' });

    expect(result.format).toBe('webp');
    expect(result.contentType).toBe('image/webp');
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(5000);

    const metadata = await sharp(result.buffer).metadata();
    expect(metadata.width).toBe(CANVAS_WIDTH);
    expect(metadata.height).toBe(CANVAS_HEIGHT);
    expect(metadata.format).toBe('webp');
  });

  it('should render PNG and SVG formats when requested', async () => {
    const pngResult = await renderCard({
      title: 'Testing PNG Rasterization',
    }, { format: 'png' });
    expect(pngResult.contentType).toBe('image/png');
    const pngMeta = await sharp(pngResult.buffer).metadata();
    expect(pngMeta.format).toBe('png');

    const svgResult = await renderCard({
      title: 'Testing SVG Output',
    }, { format: 'svg' });
    expect(svgResult.contentType).toBe('image/svg+xml');
    const svgText = svgResult.buffer.toString('utf-8');
    expect(svgText).toContain('<svg');
    expect(svgText).toContain('</svg>');
    expect(svgResult.buffer.length).toBeGreaterThan(1000);
  });
});
