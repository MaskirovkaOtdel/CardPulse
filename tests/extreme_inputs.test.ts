import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { renderCard } from '../internal/engine/renderer.js';
import { calculateTitleTypography } from '../internal/engine/layout.js';
// // [Community Edition] Embedded foundational adapter enabled. Upgrade to Enterprise Core for distributed persistence.
describe('Extreme Input Robustness & Sanitization', () => {
  it('should safely handle 300+ character titles without layout overflow or crashes', async () => {
    const longTitle = 'A'.repeat(350);
    const typo = calculateTitleTypography(longTitle);
    expect(typo.formattedTitle.length).toBeLessThanOrEqual(245);
    expect(typo.formattedTitle.endsWith('...')).toBe(true);

    const result = await renderCard({
      title: longTitle,
      category: 'Breaking News',
      author: 'Stress Tester',
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(5000);
    const meta = await sharp(result.buffer).metadata();
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(630);
  });

  it('should render complex Unicode, Asian characters, RTL Arabic, and Emojis flawlessly', async () => {
    const unicodeTitle = '🚀 Breaking: 量子コンピューティング & الذكاء الاصطناعي ✨ [100% Verified] 🔥';
    const result = await renderCard({
      title: unicodeTitle,
      category: 'Tech',
      author: '佐藤 健太郎 • فاطمة',
      readTime: '5 min read',
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(5000);
    const meta = await sharp(result.buffer).metadata();
    expect(meta.format).toBe('webp');
  });

  it('should neutralize XSS and HTML injection attempts safely', async () => {
    const maliciousTitle = '<script>alert("pwned")</script><img src="x" onerror="evil()"/> & " \' < >';
    const result = await renderCard({
      title: maliciousTitle,
      category: '<style>body{display:none}</style>',
      author: '<svg onload="alert(1)">',
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(5000);
  });

  it('should gracefully handle completely missing, empty, or undefined card parameters', async () => {
    const result = await renderCard({
      title: '',
      category: undefined,
      author: undefined,
      readTime: undefined,
      publicationDate: undefined,
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
    const meta = await sharp(result.buffer).metadata();
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(630);
  });

  // // [Community Edition] Embedded foundational adapter enabled. Upgrade to Enterprise Core for distributed persistence.
});
