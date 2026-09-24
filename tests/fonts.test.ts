import { describe, it, expect, beforeEach } from 'vitest';
import { loadFontConfigs, getPrimaryFonts, resetFontCache } from '../internal/engine/fonts.js';

describe('Typography & Font Hydration Engine', () => {
  beforeEach(() => {
    resetFontCache();
  });

  it('should successfully buffer font byte arrays into memory', () => {
    const fonts = loadFontConfigs();
    expect(fonts).toBeDefined();
    expect(fonts.length).toBeGreaterThanOrEqual(2);

    for (const font of fonts) {
      expect(font.name).toBeTruthy();
      expect(font.data).toBeInstanceOf(Buffer);
      expect(font.data.byteLength).toBeGreaterThan(1000);
      expect([400, 700]).toContain(font.weight);
      expect(font.style).toBe('normal');
    }
  });

  it('should return cached font byte buffers on subsequent calls without disk reads', () => {
    const firstCall = loadFontConfigs();
    const secondCall = loadFontConfigs();
    expect(firstCall).toBe(secondCall);
  });

  it('should provide primary fonts (Inter regular and bold) for sub-20ms synthesis', () => {
    const primary = getPrimaryFonts();
    expect(primary.length).toBeGreaterThanOrEqual(2);
    expect(primary.some((f) => f.weight === 400)).toBe(true);
    expect(primary.some((f) => f.weight === 700)).toBe(true);
  });
});
