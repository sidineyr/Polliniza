import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {randomBytes} from 'node:crypto';
import {DemoStore, RedisStore, codec, sessionStore} from '../web/storage.js';
import {createPollinizaServer} from '../web/server.js';
import {surveyOrigin, exchangeCode, json} from '../web/providers.js';
const poll={question:'Qual?',options:['Uma','Duas'],days:1};
const env={PUBLIC_ORIGIN:'https://polliniza.example',SURVEYMONKEY_CLIENT_ID:'client',SURVEYMONKEY_CLIENT_SECRET:'client-secret'};
const response=(data,status=200)=>new Response(JSON.stringify(data),{status});
async function start(store,fetcher) {
  const server=createPollinizaServer({env,store,fetcher}); server.listen(0,'127.0.0.1'); await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}`;
  return {server, async request(path,{cookie,body,csrf,...opts}={}) {
    return fetch(base+path,{...opts,redirect:'manual',headers:{cookie:cookie||'',origin:env.PUBLIC_ORIGIN,'content-type':'application/json','x-csrf-token':csrf||''},...(body!==undefined?{method:'POST',body:typeof body==='string'?body:JSON.stringify(body)}:{})});
  }};
}
async function session(app){const r=await app.request('/api/session');return {cookie:r.headers.get('set-cookie').split(';')[0],...await r.json()};}
async function connect(app,s){const r=await app.request('/api/connect/surveymonkey',s);return new URL(r.headers.get('location')).searchParams.get('state');}
function secureDemo(){const s=new DemoStore();s.secure=true;return s;}
function backend() {
  const rows=new Map(),locks=new Map(),members=new Map(),rates=new Map();
  return {rows, async fetcher(url,init) {
    const [cmd,...a]=JSON.parse(init.body); let result;
    if(cmd==='GET') result=rows.get(a[0])?.value||null;
    else if(cmd==='SET') {result=locks.has(a[0])?null:'OK';if(result)locks.set(a[0],a[1]);}
    else if(cmd==='EVAL' && a[0].includes('INCR')) {result=(rates.get(a[2])||0)+1;rates.set(a[2],result);}
    else if(cmd==='EVAL' && a[0].includes('ZADD')) {
      const [, ,row,index,lock,now,expires,value,ttl,max,owner]=a;
      for(const [k,v] of members)if(v<=now)members.delete(k);
      result=locks.get(lock)!==owner?-1:!members.has(row)&&members.size>=max?0:1;
      if(result===1){rows.set(row,{value,expires,ttl});members.set(row,expires);}
    } else {const [, ,lock,owner]=a;result=locks.get(lock)===owner?1:0;if(result)locks.delete(lock);}
    return response({result});
  }};
}
function redis(b,clock=Date.now,maxSessions=1000){return new RedisStore({url:'https://redis.example',token:'redis-secret',encryptionKey:Buffer.alloc(32,7).toString('base64'),fetcher:b.fetcher,clock,maxSessions});}
test('AES-GCM protege conteúdo e detecta alteração/troca de sessão',()=>{
  const c=codec(randomBytes(32).toString('base64')), sealed=c.seal({token:'secret'},'a');
  assert.ok(!sealed.includes('secret'));assert.deepEqual(c.open(sealed,'a'),{token:'secret'});assert.throws(()=>c.open(sealed,'b'));
  const bytes=Buffer.from(sealed,'base64');bytes[30]^=1;assert.throws(()=>c.open(bytes.toString('base64'),'a'));
});
test('Redis REST persiste ciphertext com TTL entre adaptadores e recusa capacidade',async()=>{
  const b=backend();let now=1000;const a=redis(b,()=>now,1), other=redis(b,()=>now,1);
  await a.withSession('one',async(v,save)=>save({expires:2000,token:'oauth-secret'}));
  assert.ok(![...b.rows.values()][0].value.includes('oauth-secret'));assert.equal([...b.rows.values()][0].ttl,1000);
  await other.withSession('one',async v=>assert.equal(v.token,'oauth-secret'));
  await assert.rejects(other.withSession('two',async(v,save)=>save({expires:2000})),e=>e.status===503);
  now=2001;await other.withSession('one',async v=>assert.equal(v,null));
  await other.withSession('two',async(v,save)=>save({expires:3000}));
});
test('bloqueio compartilhado evita duas mutações simultâneas',async()=>{
  const b=backend(),a=redis(b),other=redis(b);let release;const gate=new Promise(r=>release=r);
  const running=a.withSession('one',async()=>{await gate});await new Promise(r=>setImmediate(r));
  await assert.rejects(other.withSession('one',async()=>{}),e=>e.status===409);release();await running;
});
test('configuração incompleta falha fechada; demonstração não habilita OAuth',()=>{
  assert.equal(sessionStore({}).secure,false);assert.throws(()=>sessionStore({SESSION_REDIS_URL:'https://redis.example'}));
});
test('endereços regionais são exatos; redirects de chamadas com token são bloqueados',async()=>{
  for(const u of ['http://api.surveymonkey.com','https://api.surveymonkey.com.evil.test','https://user@api.surveymonkey.com','https://api.surveymonkey.com/path','https://api.surveymonkey.com:444'])assert.throws(()=>surveyOrigin(u));
  const grant=await exchangeCode('surveymonkey',{id:'x',secret:'x'},'https://app.example/callback','x',async(u,i)=>{assert.equal(i.redirect,'error');return response({access_token:'s',access_url:'https://api.eu.surveymonkey.com'});});
  assert.equal(grant.base,'https://api.eu.surveymonkey.com');
  await assert.rejects(exchangeCode('surveymonkey',{id:'x',secret:'x'},'https://app.example','x',async()=>response({access_token:'s',access_url:'https://evil.test'})));
});
test('HTTP 401/429 não repete chamadas nem divulga resposta externa',async()=>{
  for(const status of [401,429]){let calls=0;await assert.rejects(json(async()=>{calls++;return response({secret:'never-visible'},status)},'https://api.example'),new RegExp(`HTTP ${status}`));assert.equal(calls,1);}
});
test('timeout limita chamadas externas',async()=>{
  // Timer real: cobre fetchers que não respeitam AbortSignal.
  const before=Date.now();await assert.rejects(json(()=>new Promise(()=>{}),'https://api.example'),/tempo de resposta/);assert.ok(Date.now()-before<12000);
});
test('OAuth completo, reinício/instâncias, isolamento, replay e desconexão',async()=>{
  const b=backend();const urls=[];const fetcher=async(u)=>{urls.push(u);return response(u.endsWith('/oauth/token')?{access_token:'oauth-secret',access_url:'https://api.eu.surveymonkey.com'}:u.endsWith('/users/me')?{id:'42',username:'Alice'}:{id:'resource',url:'https://www.surveymonkey.com/r/example'});};
  const a=await start(redis(b),fetcher);let c;
  try {
    const s=await session(a);assert.match(s.cookie,/polliniza=/);
    const state=await connect(a,s);
    c=await start(redis(b),fetcher);
    assert.equal((await c.request(`/api/callback/surveymonkey?state=${state}&code=ok`,s)).status,303);
    assert.equal((await a.request(`/api/callback/surveymonkey?state=${state}&code=ok`,s)).status,400);
    const stateResponse=await c.request('/api/session',s),connected=await stateResponse.json();assert.ok(!JSON.stringify(connected).includes('oauth-secret'));
    const isolated=await session(c);assert.equal(isolated.accounts.length,0);
    assert.equal((await c.request('/api/publish',{...isolated,body:{poll,accountIds:[connected.accounts[0].id],operationId:'operation_0000001'}})).status,403);
    const args={...s,csrf:connected.csrf,body:{poll,accountIds:[connected.accounts[0].id],operationId:'operation_0000001'}};
    const published=await (await c.request('/api/publish',args)).json();assert.equal(published.results[0].ok,true);assert.equal(published.results[0].progress.collectorId,'resource');
    const count=urls.length;assert.equal((await (await a.request('/api/publish',args)).json()).replay,true);assert.equal(urls.length,count);
    assert.ok(urls.some(u=>u==='https://api.eu.surveymonkey.com/v3/users/me'));
    await c.request('/api/disconnect',{...s,csrf:connected.csrf,body:{accountId:connected.accounts[0].id}});
    assert.equal((await (await a.request('/api/session',s)).json()).accounts.length,0);
  } finally {a.server.close();c?.server.close();}
});
test('state inválido/expirado é consumido sem trocar código; sessão expira',async()=>{
  const store=secureDemo();let calls=0;const app=await start(store,async()=>{calls++;return response({})});
  try {const s=await session(app);const state=await connect(app,s);const key=s.cookie.split('=')[1];
    assert.equal((await app.request('/api/callback/surveymonkey?state=wrong&code=x',s)).status,400);
    assert.equal((await app.request(`/api/callback/surveymonkey?state=${state}&code=x`,s)).status,400);
    const next=await connect(app,s);store.rows.get(key).pending.expires=0;
    assert.equal((await app.request(`/api/callback/surveymonkey?state=${next}&code=x`,s)).status,400);assert.equal(calls,0);
    store.rows.get(key).expires=0;assert.notEqual((await (await app.request('/api/session',s)).json()).csrf,s.csrf);
  }finally{app.server.close();}
});
test('criação parcial é registrada; repetição e novo id idêntico não duplicam',async()=>{
  const store=secureDemo();let calls=0;
  const app=await start(store,async()=>{calls++;return calls===1?response({id:'survey-1'}):response({secret:'hidden'},429)});
  try {const s=await session(app),key=s.cookie.split('=')[1];store.rows.get(key).accounts.push({id:'account',provider:'surveymonkey',token:'t',base:'https://api.surveymonkey.com'});
    const args={...s,body:{poll,accountIds:['account'],operationId:'partial_00000001'}};
    const data=await (await app.request('/api/publish',args)).json();assert.equal(data.results[0].ok,false);assert.equal(data.results[0].progress.surveyId,'survey-1');assert.equal(data.results[0].progress.uncertain,true);assert.ok(!JSON.stringify(data).includes('hidden'));
    await app.request('/api/publish',args);args.body.operationId='partial_00000002';await app.request('/api/publish',args);assert.equal(calls,2);
  }finally{app.server.close();}
});
test('JSON inválido, corpo excessivo, limite de contas e frequência',async()=>{
  const store=secureDemo(),app=await start(store,async()=>response({}));
  try{const s=await session(app);
    assert.equal((await app.request('/api/disconnect',{...s,body:'{'})).status,400);
    assert.equal((await app.request('/api/disconnect',{...s,body:'x'.repeat(17000)})).status,413);
    store.rows.get(s.cookie.split('=')[1]).accounts=Array.from({length:10},(_,i)=>({id:String(i)}));
    assert.equal((await app.request('/api/connect/surveymonkey',s)).status,400);
    for(let i=0;i<121;i++)await app.request('/api/session',s);
    assert.equal((await app.request('/api/session',s)).status,429);
  }finally{app.server.close();}
});
test('falha Redis retorna erro genérico e nunca degrada para memória',async()=>{
  const s=new RedisStore({url:'https://redis.example',token:'secret',encryptionKey:Buffer.alloc(32,3).toString('base64'),fetcher:async()=>response({error:'internal credentials secret'},500)});
  await assert.rejects(s.withSession('key',async()=>{}),e=>e.status===503&&!e.message.includes('secret'));
});
test('cookies HTTPS incluem HttpOnly, Secure e SameSite; CSRF e origem são exigidos',async()=>{
  const app=await start(secureDemo(),async()=>response({}));
  try{const r=await app.request('/api/session');const cookie=r.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);assert.match(cookie,/SameSite=Lax/);
    const s=await r.json();assert.equal((await app.request('/api/disconnect',{cookie,csrf:'wrong',body:{}})).status,403);
    assert.equal((await app.request('/api/disconnect',{cookie,csrf:s.csrf,body:{}})).status,200);
  }finally{app.server.close();}
});
test('OAuth Mastodon conecta, publicação 401 é registrada sem repetir',async()=>{
  const store=secureDemo();let calls=0;
  const mastodonEnv={...env,MASTODON_BASE_URL:'https://social.example',MASTODON_CLIENT_ID:'id',MASTODON_CLIENT_SECRET:'secret'};
  const server=createPollinizaServer({env:mastodonEnv,store,fetcher:async(u)=>{calls++;return u.endsWith('/oauth/token')?response({access_token:'mastodon-token'}):u.endsWith('verify_credentials')?response({id:'m1',acct:'person'}):response({private:'hidden'},401);}});
  server.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}`;
  try{const r=await fetch(base+'/api/session');const cookie=r.headers.get('set-cookie'),s=await r.json();
    const connectResponse=await fetch(base+'/api/connect/mastodon',{headers:{cookie},redirect:'manual'});const state=new URL(connectResponse.headers.get('location')).searchParams.get('state');
    assert.equal((await fetch(`${base}/api/callback/mastodon?state=${state}&code=x`,{headers:{cookie},redirect:'manual'})).status,303);
    const connected=await (await fetch(base+'/api/session',{headers:{cookie}})).json();
    const args={method:'POST',headers:{cookie,origin:env.PUBLIC_ORIGIN,'x-csrf-token':s.csrf,'content-type':'application/json'},body:JSON.stringify({poll,accountIds:[connected.accounts[0].id],operationId:'mastodon_0000001'})};
    const result=await (await fetch(base+'/api/publish',args)).json();assert.match(result.results[0].error,/HTTP 401/);assert.equal(result.results[0].progress.uncertain,true);
    await fetch(base+'/api/publish',args);assert.equal(calls,3);
  }finally{server.close();}
});
