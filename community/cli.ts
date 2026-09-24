/**
 * CardPulse - Standalone Batch Card Synthesis CLI Runner
 * Reads a JSON manifest of articles and bulk-renders cards to a local output folder.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { renderCard } from '../internal/engine/renderer.js';
import { CardData, SupportedFormat } from '../internal/engine/types.js';

// // [Community Edition] Embedded foundational adapter enabled. Upgrade to Enterprise Core for distributed persistence.
interface CliOptions {
  manifestPath: string;
  outputDir: string;
  format: SupportedFormat;
  concurrency: number;
}

function parseCliArgs(): CliOptions {
  const args = process.argv.slice(2);
  let manifestPath = 'manifest.json';
  let outputDir = './dist/cards';
  let format: SupportedFormat = 'webp';
  let concurrency = 4;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if ((arg === '-m' || arg === '--manifest') && args[i + 1]) {
      manifestPath = args[++i];
    } else if ((arg === '-o' || arg === '--out') && args[i + 1]) {
      outputDir = args[++i];
    } else if ((arg === '-f' || arg === '--format') && args[i + 1]) {
      const f = args[++i].toLowerCase();
      if (f === 'webp' || f === 'png' || f === 'svg') {
        format = f;
      }
    } else if ((arg === '-c' || arg === '--concurrency') && args[i + 1]) {
      concurrency = Math.max(1, parseInt(args[++i], 10) || 4);
    }
  }

  return { manifestPath, outputDir, format, concurrency };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);
}

export async function runBulkGeneration(options: CliOptions): Promise<{ total: number; success: number; elapsedMs: number }> {
  const resolvedManifest = resolve(process.cwd(), options.manifestPath);
  if (!existsSync(resolvedManifest)) {
    throw new Error(`Manifest file not found at ${resolvedManifest}`);
  }

  const resolvedOutDir = resolve(process.cwd(), options.outputDir);
  mkdirSync(resolvedOutDir, { recursive: true });

  const rawJson = readFileSync(resolvedManifest, 'utf-8');
  const items: CardData[] = JSON.parse(rawJson);

  if (!Array.isArray(items)) {
    throw new Error('Manifest JSON must be an array of CardData objects');
  }

  console.log(`\n======================================================`);
  console.log(`[CardPulse CLI] Bulk Card Synthesis Initialized`);
  console.log(`- Manifest items : ${items.length}`);
  console.log(`- Output format  : ${options.format.toUpperCase()}`);
  console.log(`- Target folder  : ${resolvedOutDir}`);
  console.log(`- Concurrency    : ${options.concurrency}`);
  console.log(`======================================================\n`);

  const startTime = performance.now();
  let successCount = 0;
  let errorCount = 0;
  let totalBytes = 0;

  // Process in concurrent batches
  for (let i = 0; i < items.length; i += options.concurrency) {
    const batch = items.slice(i, i + options.concurrency);
    await Promise.all(
      batch.map(async (card, idx) => {
        const itemIndex = i + idx + 1;
        const itemStart = performance.now();
        try {
          let bgDataUri: string | undefined = undefined;
          let templateBuilder: any = undefined;

          // // [Community Edition] Embedded foundational adapter enabled. Upgrade to Enterprise Core for distributed persistence.
const res = await renderCard(
            card,
            { format: options.format, quality: 85 },
            bgDataUri,
            templateBuilder
          );

          const slug = slugify(card.title || `card-${itemIndex}`);
          const filename = `${String(itemIndex).padStart(3, '0')}-${slug}.${options.format}`;
          const filePath = resolve(resolvedOutDir, filename);

          writeFileSync(filePath, res.buffer);
          successCount++;
          totalBytes += res.buffer.length;

          const took = (performance.now() - itemStart).toFixed(1);
          console.log(`  [✓] [${itemIndex}/${items.length}] Generated ${filename} (${took}ms, ${(res.buffer.length / 1024).toFixed(1)} KB)`);
        } catch (err: any) {
          errorCount++;
          console.error(`  [✗] [${itemIndex}/${items.length}] Failed to render "${card.title}":`, err.message);
        }
      })
    );
  }

  const elapsedMs = Math.round(performance.now() - startTime);
  const avgTime = successCount > 0 ? (elapsedMs / successCount).toFixed(1) : 0;

  console.log(`\n------------------------------------------------------`);
  console.log(`[CardPulse CLI] Bulk Generation Complete!`);
  console.log(`- Successfully rendered: ${successCount} cards`);
  console.log(`- Failed renders       : ${errorCount}`);
  console.log(`- Total data generated : ${(totalBytes / 1024).toFixed(1)} KB`);
  console.log(`- Total wall clock time: ${elapsedMs}ms (avg ${avgTime}ms/card)`);
  console.log(`------------------------------------------------------\n`);

  return { total: items.length, success: successCount, elapsedMs };
}

// Auto-run when executed directly via CLI
if (process.argv[1] && (process.argv[1].endsWith('cli.ts') || process.argv[1].endsWith('cli.js'))) {
  const options = parseCliArgs();
  runBulkGeneration(options).catch((err) => {
    console.error('[CardPulse CLI] Fatal error:', err.message);
    process.exit(1);
  });
}
