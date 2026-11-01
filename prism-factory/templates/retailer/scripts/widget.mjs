import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
const origin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? 'http://localhost:3200';
await build({ entryPoints:['widget/entry.tsx'],bundle:true,minify:true,format:'iife',platform:'browser',jsx:'automatic',outfile:'public/widget.js',define:{'process.env.NODE_ENV':'"production"','process.env.NEXT_PUBLIC_APP_ORIGIN':JSON.stringify(origin)} });
await writeFile('public/widget.css', (await readFile('app/globals.css','utf8'))+'\n'+(await readFile('app/merchant.css','utf8')));
