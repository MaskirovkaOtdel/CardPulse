import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import sharp from 'sharp';
import { buildServer } from '../community/server.js';

describe('Fastify Community & Enterprise HTTP Interface', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    server = buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should return healthcheck telemetry at GET /health', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/health',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.status).toBe('ok');
    expect(body.service).toBe('cardpulse-og-engine');
    expect(typeof body.uptime).toBe('number');
  });

  it('should export Prometheus metrics at GET /metrics', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/metrics',
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.payload).toContain('cardpulse_renders_total');
    expect(res.payload).toContain('cardpulse_cache_hits_total');
    expect(res.payload).toContain('cardpulse_cache_misses_total');
  });

  it('should synthesize and stream WebP card image at GET /api/og', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/og?title=Testing+Fastify+Endpoint&category=Tech&author=Sarah+Connor&readTime=5+min',
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('image/webp');
    expect(res.headers['cache-control']).toBe('public, max-age=86400, stale-while-revalidate=3600');
    expect(res.headers['x-cardpulse-cache']).toBeDefined();
    expect(res.headers['x-cardpulse-render-time']).toBeDefined();

    const buffer = res.rawPayload;
    expect(buffer.length).toBeGreaterThan(5000);

    const meta = await sharp(buffer).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(630);
  });

  it('should support PNG format via query parameter', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/og?title=Testing+PNG+Output&format=png',
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    const meta = await sharp(res.rawPayload).metadata();
    expect(meta.format).toBe('png');
  });

  it('should support cache purge webhook at POST /api/purge', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/purge',
      payload: {
        action: 'update',
        articleId: '42',
        tags: ['breaking', 'markets'],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
  });
});
