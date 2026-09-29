import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { DESTINATIONS, validatePoll } from './core.js';
import { providerConfig, authorizationUrl, exchangeCode, accountProfile, publishPoll } from './providers.js';
import { HttpError, sessionStore } from './storage.js';
const here = dirname(fileURLToPath(import.meta.url));
const id = () => randomBytes(24).toString('base64url');
const TTL = 12 * 60 * 60 * 1000;
function compare(a,b) { const x=Buffer.from(a||''), y=Buffer.from(b||''); return x.length === y.length && timingSafeEqual(x,y); }
function respond(res, status, data, headers={}) { res.writeHead(status, { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', 'x-content-type-options':'nosniff', ...headers }); res.end(JSON.stringify(data)); }
async function body(req) { let raw='', size=0; for await (const chunk of req) { size += chunk.length; if (size > 16_384) throw new HttpError(413, 'Pedido muito grande.'); raw += chunk; } const data=JSON.parse(raw || '{}'); if (!data || typeof data !== 'object' || Array.isArray(data)) throw new HttpError(400, 'JSON inválido.'); return data; }
export function createPollinizaServer({ env=process.env, fetcher=fetch, store=sessionStore(env) }={}) {
  const config = providerConfig(env);
  const origin = new URL(env.PUBLIC_ORIGIN || env.RENDER_EXTERNAL_URL || (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : `http://localhost:${env.PORT || 3000}`));
  if (origin && (origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash || !['http:','https:'].includes(origin.protocol))) throw new Error('PUBLIC_ORIGIN deve conter apenas origem HTTP(S).');
  if (origin.protocol !== 'https:' && !['localhost','127.0.0.1'].includes(origin.hostname)) throw new Error('PUBLIC_ORIGIN pública precisa usar HTTPS.');
  const oauthEnabled = store.secure;
  const limitedFetch = (deadline) => (url, init) => { if (Date.now() > deadline) throw Error('A plataforma excedeu o tempo de resposta.'); return fetcher(url, {...init, signal: AbortSignal.any([init.signal, AbortSignal.timeout(Math.max(1, deadline-Date.now()))])}); };
  const server = createServer(async (req,res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) {
        const cookie = /(?:^|;\s*)polliniza=([^;]+)/.exec(req.headers.cookie||'')?.[1];
        await store.rate('global', 600);
        await store.rate(`client:${req.socket.remoteAddress}`, 120);
        const key = cookie && /^[A-Za-z0-9_-]{32}$/.test(cookie) ? cookie : id();
        return await store.withSession(key, async (existing, save) => {
          let session = existing;
          if (!session) {
            session={key, csrf:id(), accounts:[], pending:null, operations:{}, expires:Date.now()+TTL};
            await save(session);
            res.setHeader('set-cookie',`polliniza=${key}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200${origin.protocol === 'https:' ? '; Secure' : ''}`);
          }
          if (url.pathname === '/api/session' && req.method === 'GET') return respond(res,200,{csrf:session.csrf, accounts:session.accounts.map(({id,provider,label})=>({id,provider,label})), available:Object.fromEntries(Object.entries(config).map(([key,v])=>[key,oauthEnabled && !!v])), destinations:DESTINATIONS});
          const parts=url.pathname.split('/').filter(Boolean);
          if (parts[1] === 'connect' && parts.length === 3 && req.method === 'GET') {
            const provider=parts[2], cfg=config[provider];
            if (!oauthEnabled || !cfg) return respond(res,503,{error:'Integração ainda não configurada.'});
            if (!origin) return respond(res,503,{error:'Origem pública ausente.'});
            if (session.accounts.length >= 10) return respond(res,400,{error:'Limite de 10 contas atingido.'});
            const state=id(); session.pending={provider,state,expires:Date.now()+600_000};
            const redirect=`${origin.origin}/api/callback/${provider}`;
            await save(session);
            res.writeHead(302,{location:authorizationUrl(provider,cfg,redirect,state),'cache-control':'no-store'}); return res.end();
          }
          if (parts[1] === 'callback' && parts.length === 3 && req.method === 'GET') {
            const provider=parts[2], pending=session.pending; session.pending=null; await save(session);
            if (!oauthEnabled || !config[provider] || !pending || pending.provider !== provider || pending.expires < Date.now() || !compare(url.searchParams.get('state'),pending.state)) return respond(res,400,{error:'Autorização expirada ou inválida.'});
            if (url.searchParams.get('error')) return respond(res,400,{error:'A plataforma recusou a autorização.'});
            const code=url.searchParams.get('code'); if (!code) return respond(res,400,{error:'Código de autorização ausente.'});
            const redirect=`${origin.origin}/api/callback/${provider}`;
            const external=limitedFetch(Date.now()+25000);
            const grant=await exchangeCode(provider,config[provider],redirect,code,external);
            const token=grant.token;
            const profile=await accountProfile(provider,{...config[provider],base:grant.base},token,external);
            const old=session.accounts.find(a=>a.provider===provider && a.remoteId===profile.remoteId);
            if (old) { old.token=token; old.base=grant.base; old.label=profile.label; } else session.accounts.push({id:id(),provider,token,base:grant.base,...profile});
            await save(session);
            res.writeHead(303,{location:'/?connected=1','cache-control':'no-store'}); return res.end();
          }
          if (req.method === 'POST') {
            if (!origin || req.headers.origin !== origin.origin || !compare(req.headers['x-csrf-token'],session.csrf)) return respond(res,403,{error:'Sessão inválida. Atualize a página.'});
            if (url.pathname === '/api/disconnect') { const data=await body(req); session.accounts=session.accounts.filter(a=>a.id!==data.accountId); await save(session); return respond(res,200,{ok:true}); }
            if (url.pathname === '/api/publish') {
              if (!oauthEnabled) return respond(res,503,{error:'OAuth requer armazenamento seguro.'});
              const data=await body(req); let poll;
              try { poll=validatePoll(data.poll); } catch (error) { return respond(res,400,{error:error.message}); }
              const selected=Array.isArray(data.accountIds) ? [...new Set(data.accountIds)].sort() : [];
              if (!selected.length || selected.length>10 || selected.some(x=>typeof x!=='string')) return respond(res,400,{error:'Selecione de 1 a 10 contas conectadas.'});
              const accounts=selected.map(x=>session.accounts.find(a=>a.id===x));
              if (accounts.some(a=>!a)) return respond(res,403,{error:'Conta não associada à sessão.'});
              if (typeof data.operationId !== 'string' || !/^[A-Za-z0-9_-]{16,80}$/.test(data.operationId)) return respond(res,400,{error:'Identificador de publicação ausente ou inválido.'});
              const fingerprint=createHash('sha256').update(JSON.stringify({poll,selected})).digest('hex');
              session.operations ||= {};
              const oldOperation=session.operations[data.operationId] || Object.values(session.operations).find(v=>v.fingerprint===fingerprint);
              if (oldOperation) {
                if (oldOperation.fingerprint !== fingerprint) return respond(res,409,{error:'Identificador já usado para outro conteúdo.'});
                return respond(res,200,{results:oldOperation.results, replay:true, status:oldOperation.status});
              }
              if (Object.keys(session.operations).length >= 100) return respond(res,429,{error:'Limite de publicações desta sessão atingido.'});
              const results=accounts.map(a=>({accountId:a.id,provider:a.provider,ok:false,error:'Operação iniciada; confira a plataforma antes de repetir.',progress:{}}));
              const operation={fingerprint,status:'started',results}; session.operations[data.operationId]=operation;
              await save(session);
              const external=limitedFetch(Date.now()+60000);
              for (let i=0;i<accounts.length;i++) {
                const account=accounts[i];
                try {
                  const output=await publishPoll(account.provider,{...config[account.provider],base:account.base},account.token,poll,external,async progress=>{results[i].progress=progress; await save(session);});
                  Object.assign(results[i],{ok:true,...output}); delete results[i].error;
                } catch (error) {
                  if (error instanceof HttpError) throw error;
                  results[i].error=/^A plataforma /.test(error.message)?error.message:'Não foi possível concluir. Confira os recursos já criados antes de repetir.';
                }
                await save(session);
              }
              operation.status='finished'; await save(session);
              return respond(res,200,{results});
            }
          }
          return respond(res,404,{error:'Rota não encontrada.'});
        });
      }
      if (url.pathname === '/healthz') return respond(res,200,{status:'ok'});
      if (url.pathname === '/robots.txt') {
        res.writeHead(200,{'content-type':'text/plain; charset=utf-8','cache-control':'public, max-age=3600'});
        return res.end(origin.protocol === 'https:' ? `User-agent: *\nDisallow: /api/\nSitemap: ${origin.origin}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
      }
      if (url.pathname === '/sitemap.xml') {
        if (origin.protocol !== 'https:') return respond(res,404,{error:'Disponível após publicação HTTPS.'});
        res.writeHead(200,{'content-type':'application/xml; charset=utf-8','cache-control':'public, max-age=3600'});
        return res.end(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/','/sobre','/privacidade'].map(path=>`<url><loc>${origin.origin}${path}</loc></url>`).join('')}</urlset>`);
      }
      const assets={'/':'index.html','/index.html':'index.html','/sobre':'about.html','/privacidade':'privacy.html','/app.js':'app.js','/style.css':'style.css','/core.js':'core.js'};
      const asset=assets[url.pathname]; if (!asset || req.method !== 'GET') return respond(res,404,{error:'Página não encontrada.'});
      const content=await readFile(join(here,asset));
      res.writeHead(200,{'content-type':asset.endsWith('.js')?'text/javascript; charset=utf-8':asset.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",'referrer-policy':'no-referrer','x-content-type-options':'nosniff'});res.end(content);
    } catch (error) { if (res.headersSent) { res.destroy(); return; } respond(res,error instanceof HttpError?error.status:error instanceof SyntaxError?400:500,{error:error instanceof HttpError?error.message:error instanceof SyntaxError?'JSON inválido.':'Não foi possível concluir a operação.'}); }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return server;
}
if (process.argv[1] && fileURLToPath(import.meta.url)===process.argv[1]) {
  const port=Number(process.env.PORT||3000);createPollinizaServer().listen(port,()=>console.log(`Polliniza: http://localhost:${port}`));
}

