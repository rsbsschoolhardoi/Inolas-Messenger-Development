#!/usr/bin/env node

/**
 * Zenoa CLI Executable Entrypoint
 * Target: https://zenoa-inolas.vercel.app
 */

let ZenoaCliRunner;
try {
  ZenoaCliRunner = require('../dist/cli.js').ZenoaCliRunner;
} catch (e1) {
  try {
    ZenoaCliRunner = require('../index.js').ZenoaCliRunner;
  } catch (e2) {
    try {
      ZenoaCliRunner = require('../cli.js').ZenoaCliRunner;
    } catch (e3) {
      // fallback
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const targetHost = process.env.ZENOA_API_HOST || 'https://zenoa-inolas.vercel.app';
  
  if (!ZenoaCliRunner) {
    console.error('Error: Failed to load Zenoa CLI Runner module.');
    process.exit(1);
  }

  const runner = new ZenoaCliRunner(targetHost);
  
  try {
    const result = await runner.execute(args);
    if (result.output) {
      console.log(result.output);
    }
    process.exit(result.success ? 0 : 1);
  } catch (err) {
    console.error('Zenoa CLI Execution Error:', err.message || err);
    process.exit(1);
  }
}

main();

