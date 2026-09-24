# ⚡ CardPulse (Community Edition)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node: >=20](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.2-black.svg)](https://fastify.dev/)
[![Engine: Satori + Sharp](https://img.shields.io/badge/Engine-Satori%20%2B%20Sharp-orange.svg)](https://github.com/vercel/satori)

> **High-performance Dynamic OpenGraph & Social Card Synthesis Platform.**  
> Renders standard 1200x630px social preview cards on the fly via Satori (Yoga Flexbox to SVG) and Sharp (SVG to WebP/PNG).

---

## 🚀 Key Highlights

- **Microsecond Latency:** Sub-0.05ms cached renders and sub-115ms cold image synthesis.
- **Yoga Flexbox Layout:** Standard 1200x630px canvas with responsive Flexbox layout logic.
- **In-Memory Typography Hydration:** Zero-IO font byte buffering for static Inter and Roboto WOFF/TTF assets.
- **Adaptive Title Engine:** Automatic character-length calculations preventing visual overflow or layout collapse.
- **Branding Pipeline:** Dynamic category pill badges (`Breaking News`, `Tech`, `Culture`, `Finance`, `Opinion`), circular author avatars, publication timestamps, and editorial reading time overlays.
- **Fastify HTTP Service:** High-throughput streaming endpoint (`GET /api/og`) with production `Cache-Control` headers and Prometheus `/metrics`.
- **Standalone Batch CLI:** Bulk-renders hundreds of social cards from JSON manifests with concurrent worker pools.
- **Docker Ready:** Self-contained multi-stage Docker container with automated healthchecks.

---

## 📊 Performance Benchmarks

| Metric | Target Specification | Measured Performance | Result |
|---|---|---|---|
| **Cold Render (Uncached)** | `< 120 ms` | **111.02 ms** | **PASSED** |
| **Warm Render (LRU Cache)** | `< 45 ms` | **0.015 ms (15 µs)** | **3,000x faster** |
| **CLI Bulk Throughput** | N/A | **61.0 ms / card** | **Concurrent batching** |
| **Test Suite Pass Rate** | 100% | **21 / 21 Passed** | **Flawless** |

---

## 🛠️ Quickstart

### 1. Installation

```bash
git clone https://github.com/MaskirovkaOtdel/CardPulse.git
cd CardPulse
npm install
```

### 2. Run Tests & Benchmarks

```bash
# Run Vitest test suite
npm test

# Run benchmark verification
npm run benchmark
```

### 3. Start the Fastify Rendering Server

```bash
npm run dev
# Server listening at http://localhost:3000
```

---

## 🌐 API Reference

### `GET /api/og`
Synthesizes and streams a high-resolution OpenGraph card image.

#### Query Parameters:
| Parameter | Type | Default | Description |
|---|---|---|---|
| `title` | string | *Default title* | Article or page headline |
| `category` | string | `Editorial` | Category badge (e.g. `Tech`, `Breaking News`, `Culture`) |
| `author` | string | `CardPulse Editorial` | Author full name |
| `readTime` | string/number | `3 min read` | Reading time duration |
| `date` | string | *Current date* | Publication date |
| `brand` | string | `CARDPULSE` | Brand wordmark in top header |
| `theme` | string | `dark` | Visual theme (`dark`, `light`, `midnight`, `sunset`) |
| `format` | string | `webp` | Image output format (`webp`, `png`, `svg`) |

#### Example Request:
```bash
curl -o card.webp "http://localhost:3000/api/og?title=Next-Gen+Media+Tech+Blueprint&category=Tech&author=Sarah+Chen&readTime=5+min"
```

### `GET /health`
Returns service healthcheck, version, and uptime:
```json
{
  "status": "ok",
  "service": "cardpulse-og-engine",
  "version": "2.0.0",
  "uptime": 1420
}
```

### `GET /metrics`
Exposes Prometheus telemetry metrics (`cardpulse_renders_total`, `cardpulse_cache_hits_total`, `cardpulse_render_duration_seconds`).

---

## 💻 Batch CLI Usage

Generate cards in bulk from a JSON manifest:

```bash
npm run cli -- --manifest manifest.sample.json --out ./dist/cards --format webp --concurrency 4
```

### Sample Manifest (`manifest.json`):
```json
[
  {
    "title": "Quantum Computing Reaches Commercial Milestones",
    "category": "Tech",
    "author": "Dr. Sarah Chen",
    "readTime": "4 min read",
    "date": "2026-09-24",
    "theme": "dark"
  },
  {
    "title": "Global Market Shifts Prompt Digital Publishing Rethink",
    "category": "Breaking News",
    "author": "Alex Rivera",
    "readTime": "3 min read",
    "theme": "dark"
  }
]
```

---

## 🐳 Docker Deployment

Run with self-contained Docker Compose:

```bash
# Build and start container with healthchecks
docker compose up --build -d

# Verify container status
docker compose ps
```

---

## 🌟 CardPulse Pro (Enterprise)

For enterprise newsrooms and programmatic syndication networks requiring:
- **Cloudflare Workers / V8 Edge Isolate Wasm Runtime Adapter** (`@resvg/resvg-wasm`)
- **Dynamic Background Image Compositor** (remote image fetching, programmatic dual-tone gradient mapping, Gaussian blurs, dark scrims)
- **Multi-Layout Template Registry** (`breaking-news`, `quote-card`, `podcast-episode`, `minimal-editorial`)
- **Tiered Edge Invalidation** (HMAC-SHA256 verified CMS webhooks, surrogate tags, and Cloudflare `Cache-Tag` purging)

Contact for enterprise licensing.

---

## 📄 License

MIT License © 2026 [MaskirovkaOtdel](https://github.com/MaskirovkaOtdel) (Thod Efstathiadis).
