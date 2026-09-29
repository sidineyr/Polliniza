import {mkdir, readdir, readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const metadata=JSON.parse(await readFile('package.json','utf8'));
const manifest=JSON.parse(await readFile('dist/manifest.json','utf8'));
if(metadata.version!==manifest.version || !/^\d+\.\d+\.\d+$/.test(manifest.version)) throw Error('Versões package/manifest divergentes.');
// ZIP stored: ordenação estável, data 1980-01-01, sem timestamps do sistema.
function crc32(data){let crc=0xffffffff;for(const byte of data){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
const names=(await readdir('dist')).concat(['LICENSE','NOTICE']).sort();
const locals=[],central=[];let offset=0;
for(const name of names){
  const data=await readFile(['LICENSE','NOTICE'].includes(name)?name:`dist/${name}`),filename=Buffer.from(name);
  const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50,0);header.writeUInt16LE(20,4);header.writeUInt16LE(0x21,12);header.writeUInt32LE(crc32(data),14);header.writeUInt32LE(data.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(filename.length,26);
  locals.push(header,filename,data);
  const entry=Buffer.alloc(46);entry.writeUInt32LE(0x02014b50,0);entry.writeUInt16LE(20,4);entry.writeUInt16LE(20,6);entry.writeUInt16LE(0x21,14);entry.writeUInt32LE(crc32(data),16);entry.writeUInt32LE(data.length,20);entry.writeUInt32LE(data.length,24);entry.writeUInt16LE(filename.length,28);entry.writeUInt32LE(offset,42);central.push(entry,filename);
  offset+=header.length+filename.length+data.length;
}
const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(names.length,8);end.writeUInt16LE(names.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
const zip=Buffer.concat([...locals,directory,end]),filename=`polliniza-v${manifest.version}.zip`;
await mkdir('artifacts',{recursive:true});await writeFile(`artifacts/${filename}`,zip);
await writeFile(`artifacts/${filename}.sha256`,`${createHash('sha256').update(zip).digest('hex')}  ${filename}\n`);
console.log(`Pacote determinístico: artifacts/${filename}`);
