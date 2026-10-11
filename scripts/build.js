import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const output = path.resolve(root, 'dist');
if (path.dirname(output) !== root || path.basename(output) !== 'dist') {
  throw new Error('Build output must be the project dist directory.');
}
await rm(output, { recursive: true, force: true });
await mkdir(output);
await Promise.all(
  ['index.html', 'js', 'css', 'assets'].map((file) =>
    cp(path.join(root, file), path.join(output, file), { recursive: true }),
  ),
);
console.info('Static site built in dist/.');
