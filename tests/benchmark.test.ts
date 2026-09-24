import { describe, it, expect, beforeAll } from 'vitest';
import { renderCard, clearRenderCache } from '../internal/engine/renderer.js';

describe('Performance & Latency Benchmarks', () => {
  beforeAll(async () => {
    // Warmup V8 runtime and font memory caches
    await renderCard({ title: 'Warmup Card for JIT compiler' });
  });

  it('should complete cold uncached dynamic image generation under 120ms', async () => {
    clearRenderCache();

    const uniqueTitle = `Cold Render Benchmark Title ${Date.now()}-${Math.random()}`;
    const startTime = performance.now();
    const result = await renderCard({
      title: uniqueTitle,
      category: 'Tech',
      author: 'Benchmark Runner',
      readTime: '4 min read',
    });
    const elapsed = performance.now() - startTime;

    expect(result.cached).toBe(false);
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(1000);

    console.log(`[Benchmark] Cold render execution time: ${elapsed.toFixed(2)}ms (target: < 120ms)`);
    expect(elapsed).toBeLessThan(120);
  });

  it('should complete cached image generation under 45ms (target: sub-5ms)', async () => {
    const cardData = {
      title: 'Fixed Benchmark Cached Headline For Speed Testing',
      category: 'Finance',
      author: 'Quant Analyst',
      readTime: '2 min read',
    };

    // Ensure it is cached
    await renderCard(cardData);

    // Measure multiple cached iterations
    const latencies: number[] = [];
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      const res = await renderCard(cardData);
      const took = performance.now() - start;
      expect(res.cached).toBe(true);
      latencies.push(took);
    }

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    console.log(`[Benchmark] Cached render average latency: ${avgLatency.toFixed(3)}ms (target: < 45ms)`);

    expect(avgLatency).toBeLessThan(45);
    for (const lat of latencies) {
      expect(lat).toBeLessThan(45);
    }
  });
});
