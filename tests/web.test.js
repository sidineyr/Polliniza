import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { validatePoll } from '../web/core.js';
import { providerConfig, publishPoll } from '../web/providers.js';
import { createPollinizaServer } from '../web/server.js';
const poll={question:'Qual opção?',options:['Uma','Duas'],days:7};
test('validação impede opções repetidas e conteúdo inválido',()=>{assert.deepEqual(validatePoll(poll),poll);assert.throws(()=>validatePoll({...poll,options:['Uma','uma']}));assert.throws(()=>validatePoll({...poll,question:' '}));});
test('publicação Mastodon transmite poll e token ao host configurado',async()=>{let target,init;const fetcher=async(u,i)=>{target=u;init=i;return new Response(JSON.stringify({id:'123',url:'https://social.example/@x/123'}),{status:200});};const result=await publishPoll('mastodon',{base:'https://social.example'},'secret',poll,fetcher);assert.equal(target,'https://social.example/api/v1/statuses');assert.equal(init.headers.authorization,'Bearer secret');assert.deepEqual(new URLSearchParams(init.body).getAll('poll[options][]'),poll.options);assert.equal(result.id,'123');});
test('SurveyMonkey cria pesquisa, pergunta e link',async()=>{const requests=[];const fetcher=async(url,init)=>{requests.push({url,body:JSON.parse(init.body)});return new Response(JSON.stringify({id:String(requests.length),url:requests.length===4?'https://www.surveymonkey.com/r/example':undefined}),{status:200});};const result=await publishPoll('surveymonkey',{},'secret',poll,fetcher);assert.equal(requests.length,4);assert.equal(requests[2].body.answers.choices[1].text,'Duas');assert.equal(requests[3].body.type,'weblink');assert.equal(result.id,'1');});
test('servidor protege publicação e não expõe segredos na sessão',async()=>{const server=createPollinizaServer({env:{PUBLIC_ORIGIN:'http://127.0.0.1:3000',MASTODON_BASE_URL:'https://social.example',MASTODON_CLIENT_ID:'id',MASTODON_CLIENT_SECRET:'secret'}});server.listen(0,'127.0.0.1');await once(server,'listening');try{const base=`http://127.0.0.1:${server.address().port}`;const response=await fetch(`${base}/api/session`);const session=await response.json();assert.equal(session.available.mastodon,false);assert.equal(JSON.stringify(session).includes('secret'),false);const denied=await fetch(`${base}/api/publish`,{method:'POST',headers:{cookie:response.headers.get('set-cookie'),'content-type':'application/json'},body:JSON.stringify({poll,accountIds:['x']})});assert.equal(denied.status,403);}finally{server.close();}});
test('Mastodon requer origem HTTPS fixa',()=>assert.throws(()=>providerConfig({MASTODON_BASE_URL:'http://localhost:8000'})));
test('site local funciona sem configurar PUBLIC_ORIGIN',async()=>{
  const server=createPollinizaServer({env:{}});server.listen(0,'127.0.0.1');await once(server,'listening');
  try { const base=`http://127.0.0.1:${server.address().port}`;
    assert.equal((await fetch(`${base}/healthz`)).status,200);
    assert.equal((await fetch(base)).status,200);
    const sessionResponse=await fetch(`${base}/api/session`);
    const session=await sessionResponse.json();
    assert.equal(session.available.mastodon,false);
  } finally {server.close();}
});
test('origem HTTP pública é recusada',()=>assert.throws(()=>createPollinizaServer({env:{PUBLIC_ORIGIN:'http://example.org'}})));
test('origem HTTPS do Render gera sitemap e libera páginas públicas',async()=>{
  const server=createPollinizaServer({env:{RENDER_EXTERNAL_URL:'https://polliniza.onrender.com'}});server.listen(0,'127.0.0.1');await once(server,'listening');
  try {const base=`http://127.0.0.1:${server.address().port}`;
    const sitemap=await fetch(`${base}/sitemap.xml`);
    assert.equal(sitemap.status,200);
    assert.match(await sitemap.text(),/https:\/\/polliniza\.onrender\.com\/sobre/);
    assert.match(await (await fetch(`${base}/robots.txt`)).text(),/Disallow: \/api\//);
    assert.equal((await fetch(`${base}/privacidade`)).status,200);
  } finally {server.close();}
});
test('origem de produção do Vercel gera sitemap HTTPS',async()=>{
  const server=createPollinizaServer({env:{VERCEL_PROJECT_PRODUCTION_URL:'polliniza.vercel.app'}});server.listen(0,'127.0.0.1');await once(server,'listening');
  try {const sitemap=await fetch(`http://127.0.0.1:${server.address().port}/sitemap.xml`);assert.match(await sitemap.text(),/https:\/\/polliniza\.vercel\.app\/privacidade/);}finally{server.close();}
});

