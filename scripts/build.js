import { cp, mkdir, rm } from 'node:fs/promises';
const files=['manifest.json','app.html','app.js','background.js','popup.html','popup.js','styles.css','networks.js'];
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});for(const file of files)await cp(file,`dist/${file}`);console.log(`Build concluído: ${files.length} arquivos em dist/`);
