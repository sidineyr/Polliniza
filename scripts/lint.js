import { readFile } from 'node:fs/promises';
const files=['app.js','networks.js','background.js','popup.js'];for(const file of files){const text=await readFile(file,'utf8');if(text.includes('\t'))throw new Error(`${file}: use espaços em vez de tabulação`);new Function(text.replace(/^import .*$/mg,'').replace(/^export /mg,''));}console.log('Lint estrutural concluído.');
