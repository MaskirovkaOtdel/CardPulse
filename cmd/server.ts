/**
 * CardPulse Server Entrypoint (cmd/server.ts)
 */

import { buildServer } from '../community/server.js';

const port = parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || '0.0.0.0';

const server = buildServer();

server.listen({ port, host }, (err, address) => {
  if (err) {
    console.error('[CardPulse CMD] Fatal startup failure:', err);
    process.exit(1);
  }
  console.log(`[CardPulse] Production OG generator service active at ${address}`);
});
