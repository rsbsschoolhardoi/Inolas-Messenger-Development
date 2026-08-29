import { build as viteBuild } from 'vite';
import * as esbuild from 'esbuild';

async function buildAll() {
  try {
    console.log('🔨 Building Vite client application...');
    await viteBuild();

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
