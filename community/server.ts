/**
 * CardPulse - High-Performance Fastify Image Synthesis Server
 * Serves real-time dynamic OpenGraph cards via GET /api/og.
 */

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import { renderCard, clearRenderCache } from '../internal/engine/renderer.js';
import { CardData, SupportedFormat } from '../internal/engine/types.js';
import { telemetry } from '../internal/telemetry/metrics.js';

// // [Community Edition] Embedded foundational adapter enabled. Upgrade to Enterprise Core for distributed persistence.
interface OgQueryParams {
  title?: string;
  category?: string;
  author?: string;
  authorAvatarUrl?: string;
  readTime?: string;
  date?: string;
  brand?: string;
  theme?: 'dark' | 'light' | 'midnight' | 'sunset';
  template?: string;
  format?: 'webp' | 'png' | 'svg';
  bg?: string;
  blur?: string;
  duotone?: string;
  subtitle?: string;
  quote?: string;
  episode?: string;
}

export function buildServer(): FastifyInstance {
  const server = Fastify({
    logger: process.env.NODE_ENV !== 'test',
    disableRequestLogging: process.env.NODE_ENV === 'test',
  });

  server.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  // Healthcheck endpoint for Docker & Kubernetes
  server.get('/health', async () => {
    return {
      status: 'ok',
      service: 'cardpulse-og-engine',
      version: '2.0.0',
      uptime: telemetry.getUptimeSeconds(),
      timestamp: new Date().toISOString(),
    };
  });

  // Prometheus Metrics endpoint
  server.get('/metrics', async (req: FastifyRequest, reply: FastifyReply) => {
    reply.header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    return reply.send(telemetry.getMetricsAsPrometheusText());
  });

  // Primary OpenGraph Card Synthesis Endpoint
  server.get('/api/og', async (req: FastifyRequest<{ Querystring: OgQueryParams }>, reply: FastifyReply) => {
    telemetry.recordRequestStart();
    const startTime = performance.now();

    try {
      const q = req.query;
      const title = q.title || 'Dynamic OpenGraph & Social Card Generator';
      const category = q.category || 'Engineering';
      const author = q.author || 'CardPulse Engine';
      const readTime = q.readTime || '3 min read';
      const format: SupportedFormat = q.format === 'png' || q.format === 'svg' ? q.format : 'webp';
      const template = q.template;

      const cardData: CardData = {
        title,
        category,
        author,
        authorAvatarUrl: q.authorAvatarUrl,
        readTime,
        publicationDate: q.date,
        brandName: q.brand || 'CardPulse',
        theme: q.theme || 'dark',
        template,
        subtitle: q.subtitle,
        quote: q.quote,
        episodeNumber: q.episode,
        backgroundImageUrl: q.bg,
      };

      let bgDataUri: string | undefined = undefined;
      let templateBuilder: any = undefined;

      // // [Community Edition] Embedded foundational adapter enabled. Upgrade to Enterprise Core for distributed persistence.
const renderResult = await renderCard(
        cardData,
        { format, quality: 85 },
        bgDataUri,
        templateBuilder
      );

      const elapsed = performance.now() - startTime;

      telemetry.recordRender({
        status: 'success',
        format,
        template: template || 'default',
        cached: renderResult.cached,
        durationMs: elapsed,
      });

      // Stream binary buffer with production cache headers
      reply
        .header('Content-Type', renderResult.contentType)
        .header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600')
        .header('X-CardPulse-Render-Time', `${renderResult.renderTimeMs}ms`)
        .header('X-CardPulse-Cache', renderResult.cached ? 'HIT' : 'MISS')
        .header('X-CardPulse-Format', renderResult.format);

      return reply.send(renderResult.buffer);
    } catch (err: any) {
      telemetry.recordRender({
        status: 'error',
        format: 'webp',
        template: req.query.template || 'default',
        cached: false,
        durationMs: performance.now() - startTime,
      });

      req.log.error(err, 'Failed to synthesize OG image card');
      return reply.status(500).send({
        error: 'Image synthesis failed',
        message: err.message || 'Internal rendering error',
      });
    } finally {
      telemetry.recordRequestEnd();
    }
  });

  // Cache purge webhook route (CMS webhooks)
  server.post('/api/purge', async (req: FastifyRequest, reply: FastifyReply) => {
    // // [Community Edition] Embedded foundational adapter enabled. Upgrade to Enterprise Core for distributed persistence.
clearRenderCache();
    return reply.send({ success: true, message: 'Local cache cleared' });
  });

  return server;
}

// Server entry point when invoked directly
if (process.argv[1] && process.argv[1].endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.HOST || '0.0.0.0';
  const server = buildServer();

  server.listen({ port, host }, (err, address) => {
    if (err) {
      console.error('[CardPulse Server] Fatal startup error:', err);
      process.exit(1);
    }
    console.log(`[CardPulse Server] High-performance OG engine listening at ${address}`);
  });
}
