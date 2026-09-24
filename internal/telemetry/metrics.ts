/**
 * CardPulse - Prometheus Telemetry & Performance Metrics
 * Exposes real-time throughput, cache efficiency, and latency histograms at /metrics.
 */

interface RenderMetricEvent {
  status: 'success' | 'error';
  format: string;
  template: string;
  cached: boolean;
  durationMs: number;
}

class TelemetryCollector {
  private rendersTotal = new Map<string, number>();
  private cacheHits = 0;
  private cacheMisses = 0;
  private renderDurations: number[] = [];
  private activeRequests = 0;
  private startTime = Date.now();

  public recordRequestStart(): void {
    this.activeRequests++;
  }

  public recordRequestEnd(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
  }

  public recordRender(event: RenderMetricEvent): void {
    const key = `status="${event.status}",format="${event.format}",template="${event.template}"`;
    this.rendersTotal.set(key, (this.rendersTotal.get(key) || 0) + 1);

    if (event.cached) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }

    this.renderDurations.push(event.durationMs);
    if (this.renderDurations.length > 1000) {
      this.renderDurations.shift();
    }
  }

  public getUptimeSeconds(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  public getMetricsAsPrometheusText(): string {
    const lines: string[] = [];

    lines.push('# HELP cardpulse_renders_total Total number of social card render requests.');
    lines.push('# TYPE cardpulse_renders_total counter');
    if (this.rendersTotal.size === 0) {
      lines.push('cardpulse_renders_total{status="success",format="webp",template="default"} 0');
    } else {
      for (const [labels, count] of this.rendersTotal.entries()) {
        lines.push(`cardpulse_renders_total{${labels}} ${count}`);
      }
    }

    lines.push('# HELP cardpulse_cache_hits_total Total number of memory cache hits.');
    lines.push('# TYPE cardpulse_cache_hits_total counter');
    lines.push(`cardpulse_cache_hits_total ${this.cacheHits}`);

    lines.push('# HELP cardpulse_cache_misses_total Total number of memory cache misses.');
    lines.push('# TYPE cardpulse_cache_misses_total counter');
    lines.push(`cardpulse_cache_misses_total ${this.cacheMisses}`);

    lines.push('# HELP cardpulse_active_requests Current number of active image synthesis pipelines.');
    lines.push('# TYPE cardpulse_active_requests gauge');
    lines.push(`cardpulse_active_requests ${this.activeRequests}`);

    // Compute duration summary
    const count = this.renderDurations.length;
    const sum = this.renderDurations.reduce((acc, d) => acc + d, 0) / 1000;
    lines.push('# HELP cardpulse_render_duration_seconds Render duration in seconds.');
    lines.push('# TYPE cardpulse_render_duration_seconds summary');
    lines.push(`cardpulse_render_duration_seconds_count ${count}`);
    lines.push(`cardpulse_render_duration_seconds_sum ${sum.toFixed(6)}`);

    lines.push('# HELP cardpulse_process_uptime_seconds Service uptime in seconds.');
    lines.push('# TYPE cardpulse_process_uptime_seconds gauge');
    lines.push(`cardpulse_process_uptime_seconds ${this.getUptimeSeconds()}`);

    return lines.join('\n') + '\n';
  }
}

export const telemetry = new TelemetryCollector();
