import { mkdir, rm } from 'node:fs/promises';import { execFileSync } from 'node:child_process';
await mkdir('artifacts',{recursive:true});await rm('artifacts/polliniza-v0.1.0-alpha.zip',{force:true});execFileSync('zip',['-qr','../artifacts/polliniza-v0.1.0-alpha.zip','.'],{cwd:'dist'});console.log('Pacote criado: artifacts/polliniza-v0.1.0-alpha.zip');
