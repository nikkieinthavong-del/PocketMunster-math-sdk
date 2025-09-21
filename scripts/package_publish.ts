import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, copyFileSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function main() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const root = resolve(__dirname, '..', '..');
  const dist = resolve(root, 'dist-publish');
  mkdirSync(dist, { recursive: true });

  // Allow overriding source via CLI or env
  const argSrc = process.argv[2];
  const envSrc = process.env.PUBLISH_SRC;
  let src: string | null = null;
  if (argSrc && existsSync(argSrc)) src = resolve(argSrc);
  else if (envSrc && existsSync(envSrc)) src = resolve(envSrc);

  // Auto-detect a single games/*/library/publish_files with index.json
  if (!src) {
    const gamesDir = resolve(root, 'games');
    if (existsSync(gamesDir)) {
      const candidates: string[] = [];
      for (const g of readdirSync(gamesDir)) {
        const p = resolve(gamesDir, g, 'library', 'publish_files');
        if (existsSync(join(p, 'index.json'))) candidates.push(p);
      }
      if (candidates.length === 1) src = candidates[0];
    }
  }

  if (src && existsSync(join(src, 'index.json'))) {
    // Use real outputs: copy index.json and referenced files into dist
    console.log(`[package:publish] Using source: ${src}`);
    const indexPath = resolve(src, 'index.json');
    const indexJson = JSON.parse(readFileSync(indexPath, 'utf-8')) as {
      modes: Array<{ name: string; cost: number; events: string; weights: string }>;
    };
    // Copy referenced files
    for (const m of indexJson.modes) {
      const evSrc = resolve(src, m.events);
      const wtSrc = resolve(src, m.weights);
      if (!existsSync(evSrc)) throw new Error(`Missing events file: ${evSrc}`);
      if (!existsSync(wtSrc)) throw new Error(`Missing weights file: ${wtSrc}`);
      copyFileSync(evSrc, resolve(dist, m.events));
      copyFileSync(wtSrc, resolve(dist, m.weights));
    }
    writeFileSync(resolve(dist, 'index.json'), JSON.stringify(indexJson, null, 2));
    console.log('[package:publish] Prepared dist-publish from real publish_files');
  } else {
    // Fallback: generate minimal valid CSV and JSONL.ZST using Python helper
    const venvPy = resolve(root, 'env', 'Scripts', 'python.exe');
    const pythonExe = existsSync(venvPy) ? venvPy : 'python';
    const pyScript = resolve(root, 'scripts', 'gen_publish_files.py');
    const py = spawnSync(pythonExe, [pyScript, dist], {
      stdio: 'inherit',
      shell: false,
    });
    if (py.status !== 0) {
      throw new Error('Failed to generate publish files. Ensure Python and requirements are installed.');
    }
    // Write index.json following Stake SDK docs (modes array)
    const index: any = {
      modes: [
        {
          name: 'base',
          cost: 1.0,
          events: 'books_base.jsonl.zst',
          weights: 'lookUpTable_base_0.csv',
        },
      ],
    };
    // Optional metadata via env, disabled by default to avoid schema surprises
    const optName = process.env.PUBLISH_NAME;
    const optVersion = process.env.PUBLISH_VERSION;
    if (optName) (index as any).name = optName;
    if (optVersion) (index as any).version = optVersion;
    writeFileSync(resolve(dist, 'index.json'), JSON.stringify(index, null, 2));
    console.log('[package:publish] Prepared dist-publish with index.json, CSV and JSONL.ZST');
  }
}

main();
