/**
 * CardPulse - Dynamic OpenGraph & Social Card Generator
 * Type definitions for rendering engine and card synthesis pipeline.
 */

export type CardTheme = 'dark' | 'light' | 'midnight' | 'sunset';

export type SupportedFormat = 'webp' | 'png' | 'svg';

export type TemplateId = 
  | 'default'
  | 'breaking-news'
  | 'quote-card'
  | 'podcast-episode'
  | 'minimal-editorial';

export interface CardData {
  title: string;
  category?: string;
  author?: string;
  authorAvatarUrl?: string;
  readTime?: string | number;
  publicationDate?: string | Date;
  brandName?: string;
  theme?: CardTheme;
  template?: TemplateId | string;
  backgroundImageUrl?: string;
  blurBackground?: boolean;
  duotone?: boolean;
  tags?: string[];
  subtitle?: string;
  quote?: string;
  episodeNumber?: string | number;
}

export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
export type FontStyle = 'normal' | 'italic';

export interface FontConfig {
  name: string;
  data: Buffer | ArrayBuffer;
  weight: FontWeight;
  style: FontStyle;
}

export interface RenderOptions {
  width?: number;
  height?: number;
  format?: SupportedFormat;
  quality?: number;
  debug?: boolean;
}

export interface RenderResult {
  buffer: Buffer;
  contentType: string;
  width: number;
  height: number;
  format: SupportedFormat;
  renderTimeMs: number;
  cached: boolean;
}

export interface CategoryBadgeStyle {
  bg: string;
  text: string;
  border: string;
}

export interface VNode {
  type: string;
  props: {
    style?: Record<string, any>;
    children?: (VNode | string | number | null | undefined)[] | string | number;
    src?: string;
    width?: number | string;
    height?: number | string;
    xmlns?: string;
    viewBox?: string;
    fill?: string;
    stroke?: string;
    [key: string]: any;
  };
}
