#!/usr/bin/env node

/**
 * Zenoa CLI Executable Entrypoint
 * Target: https://zenoa-inolas.vercel.app
 */

const { ZenoaCliRunner } = require('../dist/cli.js') || require('../index.js');

async function main() {
  const args = process.argv.slice(2);
  const runner = new ZenoaCliRunner('https://zenoa-inolas.vercel.app');
  
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
