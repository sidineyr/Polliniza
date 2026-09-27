import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { DESTINATIONS, validatePoll } from './core.js';
import { providerConfig, authorizationUrl, exchangeCode, accountProfile, publishPoll } from './providers.js';
const here = dirname(fileURLToPath(import.meta.url));
const id = () => randomBytes(24).toString('base64url');
const TTL = 12 * 60 * 60 * 1000;
function compare(a,b) { const x=Buffer.from(a||''), y=Buffer.from(b||''); return x.length === y.length && timingSafeEqual(x,y); }
function respond(res, status, data, headers={}) { res.writeHead(status, { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', 'x-content-type-options':'nosniff', ...headers }); res.end(JSON.stringify(data)); }
async function body(req) { let raw=''; for await (const chunk of req) { raw += chunk; if (raw.length > 16_384) throw new Error('Pedido muito grande.'); } return JSON.parse(raw || '{}'); }
export function createPollinizaServer({ env=process.env, fetcher=fetch }={}) {
  const config = providerConfig(env);
  const origin = new URL(env.PUBLIC_ORIGIN || env.RENDER_EXTERNAL_URL || (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : `http://localhost:${env.PORT || 3000}`));
  if (origin && (origin.pathname !== '/' || origin.search || origin.hash || !['http:','https:'].includes(origin.protocol))) throw new Error('PUBLIC_ORIGIN deve conter apenas origem HTTP(S).');
  if (origin.protocol !== 'https:' && !['localhost','127.0.0.1'].includes(origin.hostname)) throw new Error('PUBLIC_ORIGIN pública precisa usar HTTPS.');
  const sessions = new Map();
  const server = createServer(async (req,res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) {
        const cookie = /(?:^|;\s*)polliniza=([^;]+)/.exec(req.headers.cookie||'')?.[1];
        let session = cookie && sessions.get(cookie);
        if (session && session.expires < Date.now()) { sessions.delete(cookie); session=null; }
        if (!session) { for (const [key,value] of sessions) if (value.expires < Date.now()) sessions.delete(key); const key=id(); session={key, csrf:id(), accounts:[], pending:null, expires:Date.now()+TTL}; sessions.set(key,session); res.setHeader('set-cookie',`polliniza=${key}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200${origin.protocol === 'https:' ? '; Secure' : ''}`); }
        if (url.pathname === '/api/session' && req.method === 'GET') return respond(res,200,{csrf:session.csrf, accounts:session.accounts.map(({id,provider,label})=>({id,provider,label})), available:Object.fromEntries(Object.entries(config).map(([key,v])=>[key,!!v])), destinations:DESTINATIONS});
        const parts=url.pathname.split('/').filter(Boolean);
        if (parts[1] === 'connect' && parts.length === 3 && req.method === 'GET') {
          const provider=parts[2], cfg=config[provider];
          if (!cfg) return respond(res,503,{error:'Integração ainda não configurada.'});
          if (!origin) return respond(res,503,{error:'Origem pública ausente.'});
          const state=id(); session.pending={provider,state,expires:Date.now()+600_000};
          const redirect=`${origin.origin}/api/callback/${provider}`;
          res.writeHead(302,{location:authorizationUrl(provider,cfg,redirect,state),'cache-control':'no-store'}); return res.end();
        }
        if (parts[1] === 'callback' && parts.length === 3 && req.method === 'GET') {
          const provider=parts[2], pending=session.pending; session.pending=null;
          if (!config[provider] || !pending || pending.provider !== provider || pending.expires < Date.now() || !compare(url.searchParams.get('state'),pending.state)) return respond(res,400,{error:'Autorização expirada ou inválida.'});
          if (url.searchParams.get('error')) return respond(res,400,{error:'A plataforma recusou a autorização.'});
          const code=url.searchParams.get('code'); if (!code) return respond(res,400,{error:'Código de autorização ausente.'});
          const redirect=`${origin.origin}/api/callback/${provider}`;
          const token=await exchangeCode(provider,config[provider],redirect,code,fetcher);
          const profile=await accountProfile(provider,config[provider],token,fetcher);
          const old=session.accounts.find(a=>a.provider===provider && a.remoteId===profile.remoteId);
          if (old) { old.token=token; old.label=profile.label; } else session.accounts.push({id:id(),provider,token,...profile});
          res.writeHead(303,{location:'/?connected=1','cache-control':'no-store'}); return res.end();
        }
        if (req.method === 'POST') {
          if (!origin || req.headers.origin !== origin.origin || !compare(req.headers['x-csrf-token'],session.csrf)) return respond(res,403,{error:'Sessão inválida. Atualize a página.'});
          if (url.pathname === '/api/disconnect') { const data=await body(req); session.accounts=session.accounts.filter(a=>a.id!==data.accountId); return respond(res,200,{ok:true}); }
          if (url.pathname === '/api/publish') {
            const data=await body(req); let poll;
            try { poll=validatePoll(data.poll); } catch (error) { return respond(res,400,{error:error.message}); }
            const selected=Array.isArray(data.accountIds) ? [...new Set(data.accountIds)] : [];
            if (!selected.length || selected.length>10 || selected.some(x=>typeof x!=='string')) return respond(res,400,{error:'Selecione de 1 a 10 contas conectadas.'});
            const accounts=selected.map(x=>session.accounts.find(a=>a.id===x));
            if (accounts.some(a=>!a)) return respond(res,403,{error:'Conta não associada à sessão.'});
            const results=[];
            for (const account of accounts) {
              try { results.push({accountId:account.id,provider:account.provider,ok:true,...await publishPoll(account.provider,config[account.provider],account.token,poll,fetcher)}); }
              catch (error) { results.push({accountId:account.id,provider:account.provider,ok:false,error:error.message}); }
            }
            return respond(res,200,{results});
          }
        }
        return respond(res,404,{error:'Rota não encontrada.'});
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
    } catch (error) { respond(res,error instanceof SyntaxError?400:500,{error:error.message}); }
  });
  return server;
}
if (process.argv[1] && fileURLToPath(import.meta.url)===process.argv[1]) {
  const port=Number(process.env.PORT||3000);createPollinizaServer().listen(port,()=>console.log(`Polliniza: http://localhost:${port}`));
}
