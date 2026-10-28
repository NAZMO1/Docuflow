import {build} from 'esbuild';
import {cp,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true}); await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true});
await cp('node_modules/pdfjs-dist/build/pdf.worker.min.mjs','dist/assets/pdf.worker.min.mjs');
await build({entryPoints:['src/app.js'],bundle:true,format:'esm',outfile:'dist/assets/app.js',minify:true,target:['es2022'],legalComments:'linked'});
