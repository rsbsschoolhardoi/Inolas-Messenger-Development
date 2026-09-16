import { build as viteBuild } from 'vite';
import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

async function buildAll() {
  try {
    console.log('🔨 Building Vite client application...');
    await viteBuild();

    // Ensure hidden dot directories like .well-known are preserved in production dist
    const publicWellKnown = path.join(process.cwd(), 'public', '.well-known');
    const distWellKnown = path.join(process.cwd(), 'dist', '.well-known');
    if (fs.existsSync(publicWellKnown)) {
      fs.cpSync(publicWellKnown, distWellKnown, { recursive: true });
      console.log('📋 Mirrored public/.well-known to dist/.well-known for agent discovery');
    }

    console.log('📦 Bundling Express server with esbuild...');
    await esbuild.build({
      entryPoints: ['server.ts'],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      external: ['express', 'cors', 'firebase-admin'],
      sourcemap: true,
      outfile: 'dist/server.cjs',
    });

    console.log('✨ Full-stack build completed successfully!');
  } catch (err) {
    console.error('❌ Build failed:', err);
    process.exit(1);
  }
}

buildAll();
