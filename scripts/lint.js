import { readdir, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const files=['app.js','networks.js','background.js','popup.js','server.js',...(await readdir('web')).filter(f=>f.endsWith('.js')).map(f=>`web/${f}`),...(await readdir('scripts')).filter(f=>f.endsWith('.js')).map(f=>`scripts/${f}`)];
for (const file of files) {
  if ((await readFile(file,'utf8')).includes('\t')) throw Error(`${file}: use espaços em vez de tabulação`);
  execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
}
console.log(`Sintaxe verificada: ${files.length} arquivos da extensão, web e scripts.`);
