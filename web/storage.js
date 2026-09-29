import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'node:crypto';
export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function codec(secret) {
  const key = Buffer.from(secret || '', 'base64');
  if (key.length !== 32 || key.toString('base64') !== secret) throw Error('SESSION_ENCRYPTION_KEY deve ser base64 de 32 bytes.');
  return {
    seal(value, context) {
      const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv);
      cipher.setAAD(Buffer.from(context));
      const data = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
      return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64');
    },
    open(value, context) {
      const bytes = Buffer.from(value, 'base64'), decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
      decipher.setAAD(Buffer.from(context)); decipher.setAuthTag(bytes.subarray(12, 28));
      return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString());
    }
  };
}
export class DemoStore {
  secure = false;
  constructor({maxSessions = 1000, clock = Date.now} = {}) { this.rows = new Map(); this.locks = new Set(); this.rates = new Map(); this.maxSessions = maxSessions; this.clock = clock; }
  async rate(key, limit = 120) {
    const now = this.clock();
    for (const [k, v] of this.rates) if (v.until <= now) this.rates.delete(k);
    if (!this.rates.has(key) && this.rates.size >= 2000) throw new HttpError(429, 'Limite de requisições atingido.');
    const v = this.rates.get(key) || {n: 0, until: now + 60000}; v.n++; this.rates.set(key, v);
    if (v.n > limit) throw new HttpError(429, 'Limite de requisições atingido.');
  }
  async withSession(key, fn) {
    if (this.locks.has(key)) throw new HttpError(409, 'Operação em andamento.');
    this.locks.add(key);
    try {
      for (const [k, v] of this.rows) if (v.expires <= this.clock()) this.rows.delete(k);
      const value = this.rows.get(key);
      if (!value && this.rows.size >= this.maxSessions) throw new HttpError(503, 'Capacidade de sessões atingida.');
      const save = async v => { if (v.expires <= this.clock()) throw new HttpError(401, 'Sessão expirada.'); this.rows.set(key, structuredClone(v)); };
      return await fn(value && structuredClone(value), save);
    } finally { this.locks.delete(key); }
  }
}
export class RedisStore {
  secure = true;
  constructor({url, token, encryptionKey, maxSessions = 1000, fetcher = fetch, clock = Date.now}) {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) throw Error('SESSION_REDIS_URL deve ser uma origem HTTPS.');
    this.url = parsed.origin; this.token = token; this.crypto = codec(encryptionKey); this.maxSessions = maxSessions; this.fetcher = fetcher; this.clock = clock;
  }
  async command(...args) {
    try {
      const res = await this.fetcher(this.url, {method: 'POST', redirect: 'error', headers: {authorization: `Bearer ${this.token}`, 'content-type': 'application/json'}, body: JSON.stringify(args), signal: AbortSignal.timeout(5000)});
      const data = await res.json();
      if (!res.ok || data.error) throw Error();
      return data.result;
    } catch { throw new HttpError(503, 'Armazenamento temporariamente indisponível.'); }
  }
  async rate(key, limit = 120) {
    const hash = createHash('sha256').update(key).digest('hex');
    const n = await this.command('EVAL', "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],60) end; return n", 1, `polliniza:rate:${hash}`);
    if (n > limit) throw new HttpError(429, 'Limite de requisições atingido.');
  }
  async withSession(key, fn) {
    const lock = `polliniza:lock:${key}`, row = `polliniza:session:${key}`, owner = randomBytes(24).toString('hex');
    if (await this.command('SET', lock, owner, 'NX', 'PX', 180000) !== 'OK') throw new HttpError(409, 'Operação em andamento.');
    try {
      const raw = await this.command('GET', row);
      const value = raw ? this.crypto.open(raw, row) : null;
      const save = async v => {
        const now = this.clock(), ttl = v.expires - now;
        if (ttl <= 0) throw new HttpError(401, 'Sessão expirada.');
        const result = await this.command('EVAL', `if redis.call('GET',KEYS[3])~=ARGV[6] then return -1 end
redis.call('ZREMRANGEBYSCORE',KEYS[2],'-inf',ARGV[1]);
if not redis.call('ZSCORE',KEYS[2],KEYS[1]) and redis.call('ZCARD',KEYS[2])>=tonumber(ARGV[5]) then return 0 end
redis.call('SET',KEYS[1],ARGV[3],'PX',ARGV[4]); redis.call('ZADD',KEYS[2],ARGV[2],KEYS[1]); redis.call('PEXPIRE',KEYS[2],43200000); return 1`, 3, row, 'polliniza:sessions', lock, now, v.expires, this.crypto.seal(v, row), ttl, this.maxSessions, owner);
        if (result !== 1) throw new HttpError(result === 0 ? 503 : 409, result === 0 ? 'Capacidade de sessões atingida.' : 'Operação expirada.');
      };
      return await fn(value?.expires > this.clock() ? value : null, save);
    } finally {
      await this.command('EVAL', "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0", 1, lock, owner);
    }
  }
}
export function sessionStore(env) {
  const keys = ['SESSION_REDIS_URL', 'SESSION_REDIS_TOKEN', 'SESSION_ENCRYPTION_KEY'];
  if (!keys.some(k => env[k])) return new DemoStore();
  if (!keys.every(k => env[k]) || env.SESSION_STORE_DURABLE !== 'true') throw Error('Configure Redis durável e todas as variáveis de sessão.');
  return new RedisStore({url: env.SESSION_REDIS_URL, token: env.SESSION_REDIS_TOKEN, encryptionKey: env.SESSION_ENCRYPTION_KEY});
}
