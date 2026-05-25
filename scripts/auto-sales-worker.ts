#!/usr/bin/env node
/* eslint-disable no-console */
import "dotenv/config";

import { processAutoSalesQueue } from "../src/lib/ai/autoSalesEngine";

async function runOnce() {
  const processed = await processAutoSalesQueue();
  const ts = new Date().toISOString();
  console.log(`[autosales-worker] ${ts} processed ${processed} sequence(s)`);
}

async function main() {
  const loop = process.argv.includes("--loop");
  const delay = Number(process.env.AUTOSALES_WORKER_INTERVAL_MS ?? 5000);

  if (!loop) {
    await runOnce();
    return;
  }

  console.log("[autosales-worker] loop mode ON");
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await runOnce();
    } catch (error) {
      console.error("[autosales-worker] run failed", error);
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

main().catch((error) => {
  console.error("[autosales-worker] fatal", error);
  process.exit(1);
});
