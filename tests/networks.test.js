import test from 'node:test';import assert from 'node:assert/strict';import { adaptPoll, inferPoll, NETWORKS } from '../networks.js';
test('interpreta opções depois de dois pontos',()=>{const p=inferPoll('Pergunte o favorito: Horizonte, QV, Chemical ou Einstein');assert.deepEqual(p.options,['Horizonte','QV','Chemical','Einstein'])});
test('respeita limites da rede',()=>{const p=adaptPoll({question:'Q?',options:['123456789012345678901234567890','B','C','D','E'],caption:'',hashtags:[],duration:7},'x');assert.equal(p.options.length,NETWORKS.x.maxOptions);assert.equal(p.options[0].length,25)});
test('rejeita rede desconhecida',()=>assert.throws(()=>adaptPoll({options:[],hashtags:[]},'narnia')));
test('interpreta instrução em inglês',()=>{const p=inferPoll('Ask the favorite: Music, Books or Cinema','en');assert.deepEqual(p.options,['Music','Books','Cinema']);assert.match(p.caption,/opinion/) });
test('remove hashtags duplicadas e tolera campos ausentes',()=>{const p=adaptPoll({question:'Q?',options:['A','B'],hashtags:['poll','#poll']},'linkedin');assert.equal(p.shareText.match(/#poll/g).length,1);assert.doesNotThrow(()=>adaptPoll({},'linkedin'))});
