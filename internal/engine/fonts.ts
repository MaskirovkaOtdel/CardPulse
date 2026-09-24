/**
 * CardPulse - Dynamic OpenGraph & Social Card Generator
 * Typography & Font Hydration Module.
 * Buffers TTF/WOFF font bytes into memory buffers for high-throughput Satori rendering.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { FontConfig } from './types.js';

// In-memory cache for buffered font byte arrays
let cachedFontConfigs: FontConfig[] | null = null;

// Search candidate directories for asset fonts
function resolveFontPath(filename: string): string | null {
  const candidates = [
    resolve(process.cwd(), 'assets', 'fonts', filename),
    resolve(process.cwd(), 'projects', 'dynamic-og-generator', 'master', 'assets', 'fonts', filename),
    resolve(new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), '..', '..', 'assets', 'fonts', filename),
    resolve(new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), '..', 'assets', 'fonts', filename),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Loads and buffers TTF/WOFF fonts into memory.
 * Caches buffers globally to guarantee sub-millisecond font hydration during Satori execution.
 */
export function loadFontConfigs(): FontConfig[] {
  if (cachedFontConfigs && cachedFontConfigs.length > 0) {
    return cachedFontConfigs;
  }

  const fontsToLoad: Array<{ name: string; files: string[]; weight: FontConfig['weight']; style: FontConfig['style'] }> = [
    { name: 'Inter', files: ['Inter-Regular.woff', 'Inter-Regular.ttf'], weight: 400, style: 'normal' },
    { name: 'Inter', files: ['Inter-Bold.woff', 'Inter-Bold.ttf'], weight: 700, style: 'normal' },
    { name: 'Roboto', files: ['Roboto-Regular.woff', 'Roboto-Regular.ttf'], weight: 400, style: 'normal' },
    { name: 'Roboto', files: ['Roboto-Bold.woff', 'Roboto-Bold.ttf'], weight: 700, style: 'normal' },
  ];

  const loaded: FontConfig[] = [];

  for (const item of fontsToLoad) {
    let loadedFont = false;
    for (const file of item.files) {
      const fontPath = resolveFontPath(file);
      if (fontPath && existsSync(fontPath)) {
        try {
          const buffer = readFileSync(fontPath);
          if (buffer.length > 0) {
            loaded.push({
              name: item.name,
              data: buffer,
              weight: item.weight,
              style: item.style,
            });
            loadedFont = true;
            break;
          }
        } catch (err) {
          console.warn(`[CardPulse Fonts] Warning: Failed to read font at ${fontPath}:`, err);
        }
      }
    }
  }

  if (loaded.length === 0) {
    throw new Error('[CardPulse Fonts] Fatal: No font files could be found or loaded from assets/fonts/');
  }

  cachedFontConfigs = loaded;
  return cachedFontConfigs;
}

/**
 * Returns primary fonts (Inter Regular & Bold) for standard renders.
 * Minimizes font parsing overhead to achieve sub-20ms cold renders.
 */
export function getPrimaryFonts(): FontConfig[] {
  const all = loadFontConfigs();
  const inter = all.filter((f) => f.name === 'Inter');
  return inter.length > 0 ? inter : all.slice(0, 2);
}

/**
 * Resets the in-memory font cache (primarily used in testing).
 */
export function resetFontCache(): void {
  cachedFontConfigs = null;
}
