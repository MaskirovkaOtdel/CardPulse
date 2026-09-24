/**
 * CardPulse - Dynamic OpenGraph & Social Card Generator
 * Visual Branding Pipeline.
 * Manages brand color palettes for category pill badges, circular author avatars,
 * publication timestamps, and editorial reading time overlays.
 */

import { CategoryBadgeStyle } from './types.js';

/**
 * Palette mapping for dynamic category pills.
 */
const CATEGORY_PALETTE_MAP: Record<string, CategoryBadgeStyle> = {
  'breaking-news': { bg: '#dc2626', text: '#ffffff', border: '#ef4444' },
  'breaking news': { bg: '#dc2626', text: '#ffffff', border: '#ef4444' },
  'alert': { bg: '#b91c1c', text: '#ffffff', border: '#f87171' },
  'tech': { bg: '#0284c7', text: '#ffffff', border: '#38bdf8' },
  'technology': { bg: '#0284c7', text: '#ffffff', border: '#38bdf8' },
  'engineering': { bg: '#0369a1', text: '#ffffff', border: '#7dd3fc' },
  'culture': { bg: '#7c3aed', text: '#ffffff', border: '#a78bfa' },
  'arts': { bg: '#6d28d9', text: '#ffffff', border: '#c4b5fd' },
  'finance': { bg: '#d97706', text: '#ffffff', border: '#f59e0b' },
  'business': { bg: '#b45309', text: '#ffffff', border: '#fbbf24' },
  'economy': { bg: '#b45309', text: '#ffffff', border: '#fbbf24' },
  'opinion': { bg: '#059669', text: '#ffffff', border: '#34d399' },
  'editorial': { bg: '#047857', text: '#ffffff', border: '#6ee7b7' },
  'science': { bg: '#0d9488', text: '#ffffff', border: '#2dd4bf' },
  'ai': { bg: '#4f46e5', text: '#ffffff', border: '#818cf8' },
  'politics': { bg: '#4338ca', text: '#ffffff', border: '#a5b4fc' },
};

const DEFAULT_CATEGORY_STYLE: CategoryBadgeStyle = {
  bg: '#334155',
  text: '#f8fafc',
  border: '#64748b',
};

/**
 * Returns brand badge styling matching the category name.
 */
export function getCategoryBadgeStyle(category?: string): CategoryBadgeStyle {
  if (!category) return DEFAULT_CATEGORY_STYLE;
  const key = category.trim().toLowerCase();
  return CATEGORY_PALETTE_MAP[key] || DEFAULT_CATEGORY_STYLE;
}

/**
 * Formats publication date into editorial standard (e.g. "Sep 24, 2026").
 */
export function formatPublicationDate(dateInput?: string | Date): string {
  if (!dateInput) {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) {
      return typeof dateInput === 'string' ? dateInput : 'Recent';
    }
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Recent';
  }
}

/**
 * Standardizes editorial reading time overlay.
 * Integrates output from read-time profiler (minutes or word counts).
 */
export function formatReadTime(readTimeInput?: string | number): string {
  if (readTimeInput === undefined || readTimeInput === null || readTimeInput === '') {
    return '3 min read';
  }

  if (typeof readTimeInput === 'number') {
    if (readTimeInput > 60) {
      const minutes = Math.max(1, Math.ceil(readTimeInput / 220));
      return `${minutes} min read`;
    }
    return `${Math.max(1, Math.round(readTimeInput))} min read`;
  }

  const str = String(readTimeInput).trim();
  // Check if already ends with "read" or "min"
  if (/min\s*read/i.test(str)) {
    return str;
  }
  const numeric = parseInt(str, 10);
  if (!isNaN(numeric)) {
    // If input is word count (e.g. 1500)
    if (numeric > 60) {
      const minutes = Math.max(1, Math.ceil(numeric / 220));
      return `${minutes} min read`;
    }
    return `${numeric} min read`;
  }

  return str;
}

/**
 * Generates an SVG Data URI avatar with author initials and a deterministic gradient.
 */
export function generateInitialsAvatar(name?: string, size = 64): string {
  const authorName = (name && name.trim()) ? name.trim() : 'CP';
  const parts = authorName.split(/\s+/);
  const initials = parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : authorName.slice(0, 2).toUpperCase();

  // Deterministic color selection from name
  let hash = 0;
  for (let i = 0; i < authorName.length; i++) {
    hash = authorName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    ['#3b82f6', '#1d4ed8'],
    ['#8b5cf6', '#6d28d9'],
    ['#ec4899', '#be185d'],
    ['#10b981', '#047857'],
    ['#f59e0b', '#b45309'],
    ['#06b6d4', '#0e7490'],
  ];
  const pair = colors[Math.abs(hash) % colors.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${pair[0]}" />
        <stop offset="100%" stop-color="${pair[1]}" />
      </linearGradient>
    </defs>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="url(#grad)" />
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="${Math.round(size * 0.42)}">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
