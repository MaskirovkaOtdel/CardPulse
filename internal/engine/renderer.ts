/**
 * CardPulse - Dynamic OpenGraph & Social Card Generator
 * Core Image Synthesis Engine.
 * Integrates Satori (Yoga Flexbox HTML/JSX to SVG) and Sharp (SVG to WebP/PNG)
 * with in-memory LRU caching for ultra-low latency rendering.
 */

import satori from 'satori';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import {
  CardData,
  RenderOptions,
  RenderResult,
  SupportedFormat,
  VNode,
} from './types.js';
import { loadFontConfigs, getPrimaryFonts } from './fonts.js';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  calculateTitleTypography,
} from './layout.js';
import {
  getCategoryBadgeStyle,
  formatPublicationDate,
  formatReadTime,
  generateInitialsAvatar,
} from './branding.js';

interface CacheEntry {
  buffer: Buffer;
  contentType: string;
  format: SupportedFormat;
  timestamp: number;
}

const LRU_MAX_ENTRIES = 500;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL
const renderCache = new Map<string, CacheEntry>();

/**
 * Generates a deterministic SHA-256 cache key from card inputs and render options.
 */
export function generateCacheKey(data: CardData, options: RenderOptions): string {
  const payload = JSON.stringify({ data, options });
  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Evicts expired or LRU entries if the cache size exceeds capacity.
 */
function pruneCacheIfNeeded(): void {
  const now = Date.now();
  for (const [key, entry] of renderCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      renderCache.delete(key);
    }
  }

  if (renderCache.size >= LRU_MAX_ENTRIES) {
    const oldestKey = renderCache.keys().next().value;
    if (oldestKey) {
      renderCache.delete(oldestKey);
    }
  }
}

/**
 * Builds the default high-performance OpenGraph VNode layout tree.
 */
export function buildDefaultCardVNode(
  data: CardData,
  width: number,
  height: number,
  bgDataUri?: string
): VNode {
  const typography = calculateTitleTypography(data.title);
  const badgeStyle = getCategoryBadgeStyle(data.category);
  const pubDate = formatPublicationDate(data.publicationDate);
  const readTimeStr = formatReadTime(data.readTime);
  const avatarUri = data.authorAvatarUrl || generateInitialsAvatar(data.author, 64);
  const authorName = data.author || 'CardPulse Editorial';
  const brandName = (data.brandName || 'CARDPULSE').toUpperCase();
  const theme = data.theme || 'dark';

  const isLight = theme === 'light';
  const isSunset = theme === 'sunset';
  const isMidnight = theme === 'midnight';

  let bgGradient = 'linear-gradient(135deg, #0b0f19 0%, #111827 50%, #030712 100%)';
  let textColor = '#ffffff';
  let subtitleColor = '#94a3b8';
  let borderColor = 'rgba(255, 255, 255, 0.12)';
  let footerBorderColor = 'rgba(255, 255, 255, 0.1)';
  let accentDot = '#10b981';

  if (isLight) {
    bgGradient = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)';
    textColor = '#0f172a';
    subtitleColor = '#475569';
    borderColor = 'rgba(15, 23, 42, 0.12)';
    footerBorderColor = 'rgba(15, 23, 42, 0.1)';
    accentDot = '#0284c7';
  } else if (isMidnight) {
    bgGradient = 'linear-gradient(135deg, #020617 0%, #09090b 60%, #000000 100%)';
    accentDot = '#06b6d4';
  } else if (isSunset) {
    bgGradient = 'linear-gradient(135deg, #180b15 0%, #2e1065 60%, #4c0519 100%)';
    accentDot = '#f43f5e';
  }

  const children: any[] = [];

  // If a background composite image is supplied, insert it as the bottom layer
  if (bgDataUri) {
    children.push({
      type: 'img',
      props: {
        src: bgDataUri,
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${width}px`,
          height: `${height}px`,
          objectFit: 'cover',
        },
      },
    });

    // Dark scrim overlay for readability
    children.push({
      type: 'div',
      props: {
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${width}px`,
          height: `${height}px`,
          background: 'linear-gradient(180deg, rgba(11, 15, 25, 0.75) 0%, rgba(11, 15, 25, 0.92) 100%)',
        },
      },
    });
  }

  // Inner Content Container
  const innerContent: VNode = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '56px 64px',
        position: 'relative',
      },
      children: [
        // Header Row: Category pill & Brand
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            },
            children: [
              // Pill badge
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 20px',
                    borderRadius: '9999px',
                    backgroundColor: badgeStyle.bg,
                    border: `1.5px solid ${badgeStyle.border}`,
                    color: badgeStyle.text,
                    fontSize: '16px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  },
                  children: data.category || 'Editorial',
                },
              },
              // Brand indicator with glowing pulse dot
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: accentDot,
                          boxShadow: `0 0 12px ${accentDot}`,
                        },
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '18px',
                          fontWeight: 800,
                          letterSpacing: '0.15em',
                          color: textColor,
                          opacity: 0.85,
                        },
                        children: brandName,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },

        // Main Center Body: Title & optional subtitle
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              flex: 1,
              marginTop: '28px',
              marginBottom: '28px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: `${typography.fontSize}px`,
                    lineHeight: typography.lineHeight,
                    fontWeight: 700,
                    color: textColor,
                    letterSpacing: '-0.025em',
                    maxHeight: `${typography.fontSize * typography.lineHeight * typography.maxLines + 10}px`,
                    overflow: 'hidden',
                  },
                  children: typography.formattedTitle,
                },
              },
              data.subtitle
                ? {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        fontSize: '22px',
                        color: subtitleColor,
                        marginTop: '16px',
                        lineHeight: 1.3,
                        fontWeight: 400,
                      },
                      children: data.subtitle,
                    },
                  }
                : null,
            ].filter(Boolean),
          },
        },

        // Footer Row: Author & Read Time overlay
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              paddingTop: '24px',
              borderTop: `1px solid ${footerBorderColor}`,
            },
            children: [
              // Author details with circular avatar
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  },
                  children: [
                    {
                      type: 'img',
                      props: {
                        src: avatarUri,
                        width: '52',
                        height: '52',
                        style: {
                          width: '52px',
                          height: '52px',
                          borderRadius: '50%',
                          border: `2px solid ${borderColor}`,
                        },
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          flexDirection: 'column',
                        },
                        children: [
                          {
                            type: 'div',
                            props: {
                              style: {
                                fontSize: '19px',
                                fontWeight: 700,
                                color: textColor,
                              },
                              children: authorName,
                            },
                          },
                          {
                            type: 'div',
                            props: {
                              style: {
                                fontSize: '15px',
                                color: subtitleColor,
                                marginTop: '2px',
                              },
                              children: pubDate,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },

              // Read time & pill badge
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.08)',
                    color: subtitleColor,
                    fontSize: '15px',
                    fontWeight: 600,
                    gap: '8px',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: { display: 'flex' },
                        children: '⏱',
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: { display: 'flex' },
                        children: readTimeStr,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };

  children.push(innerContent);

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: `${width}px`,
        height: `${height}px`,
        background: bgGradient,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter, Roboto, sans-serif',
      },
      children,
    },
  };
}

/**
 * Main Card Rendering Function.
 * Synthesizes HTML/JSX to SVG via Satori, then compresses to WebP or PNG via Sharp.
 */
export async function renderCard(
  data: CardData,
  options: RenderOptions = {},
  bgDataUri?: string,
  customVNodeBuilder?: (data: CardData, width: number, height: number, bgDataUri?: string) => VNode
): Promise<RenderResult> {
  const startTime = performance.now();
  const width = options.width || CANVAS_WIDTH;
  const height = options.height || CANVAS_HEIGHT;
  const format: SupportedFormat = options.format || 'webp';
  const quality = options.quality || 85;

  // Check LRU Cache
  const cacheKey = generateCacheKey(data, { width, height, format, quality });
  const cached = renderCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp <= CACHE_TTL_MS)) {
    const elapsed = performance.now() - startTime;
    return {
      buffer: cached.buffer,
      contentType: cached.contentType,
      width,
      height,
      format: cached.format,
      renderTimeMs: Math.round(elapsed * 100) / 100,
      cached: true,
    };
  }

  // Hydrate fonts into memory (using primary font set for maximum throughput)
  const fonts = getPrimaryFonts();

  // Build Layout VNode
  const vnode = customVNodeBuilder
    ? customVNodeBuilder(data, width, height, bgDataUri)
    : buildDefaultCardVNode(data, width, height, bgDataUri);

  // Satori: JSX/VNode -> SVG string
  const svg = await satori(vnode as any, {
    width,
    height,
    fonts: fonts.map((f) => ({
      name: f.name,
      data: f.data,
      weight: f.weight,
      style: f.style,
    })),
  });

  // Rasterize SVG -> Output format
  let outputBuffer: Buffer;
  let contentType: string;

  if (format === 'svg') {
    outputBuffer = Buffer.from(svg);
    contentType = 'image/svg+xml';
  } else if (format === 'png') {
    outputBuffer = await sharp(Buffer.from(svg))
      .png({ compressionLevel: 6 })
      .toBuffer();
    contentType = 'image/png';
  } else {
    // Default: WebP with fast compression effort
    outputBuffer = await sharp(Buffer.from(svg))
      .webp({ quality, effort: 1 })
      .toBuffer();
    contentType = 'image/webp';
  }

  const elapsed = performance.now() - startTime;
  const renderTimeMs = Math.round(elapsed * 100) / 100;

  // Store in cache
  pruneCacheIfNeeded();
  renderCache.set(cacheKey, {
    buffer: outputBuffer,
    contentType,
    format,
    timestamp: Date.now(),
  });

  return {
    buffer: outputBuffer,
    contentType,
    width,
    height,
    format,
    renderTimeMs,
    cached: false,
  };
}

/**
 * Clears the in-memory render cache (for testing and cache purge hooks).
 */
export function clearRenderCache(): void {
  renderCache.clear();
}

/**
 * Returns current cache statistics.
 */
export function getCacheStats(): { size: number; maxEntries: number } {
  return {
    size: renderCache.size,
    maxEntries: LRU_MAX_ENTRIES,
  };
}
