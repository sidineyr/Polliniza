const SM = 'https://api.surveymonkey.com';
export async function json(fetcher, url, init = {}) {
  const controller = new AbortController();
  const signal = init.signal ? AbortSignal.any([init.signal, controller.signal]) : controller.signal;
  let timer;
  try {
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(Error('A plataforma excedeu o tempo de resposta.')); }, 10000); });
    return await Promise.race([timeout, (async () => {
      const response = await fetcher(url, {...init, redirect: 'error', signal});
      if (!response.ok) throw Error(`A plataforma recusou a operação (HTTP ${response.status}).`);
      const body = await response.json();
      if (!body || typeof body !== 'object') throw Error();
      return body;
    })()]);
  } catch (error) {
    if (/^A plataforma /.test(error.message)) throw error;
    throw Error('Resposta inválida ou conexão indisponível na plataforma.');
  } finally { clearTimeout(timer); }
}
export function surveyOrigin(value = SM) {
  const url = new URL(value);
  const allowed = ['api.surveymonkey.com', 'api.eu.surveymonkey.com', 'api.surveymonkey.ca'];
  if (url.protocol !== 'https:' || !allowed.includes(url.hostname) || url.port || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw Error('Destino regional SurveyMonkey não permitido.');
  return url.origin;
}
export function providerConfig(env = process.env) {
  const mastodon = env.MASTODON_BASE_URL;
  let base = null;
  if (mastodon) {
    const parsed = new URL(mastodon);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') throw new Error('MASTODON_BASE_URL deve ser uma origem HTTPS.');
    base = parsed.origin;
  }
  return {
    mastodon: base && env.MASTODON_CLIENT_ID && env.MASTODON_CLIENT_SECRET ? { base, id: env.MASTODON_CLIENT_ID, secret: env.MASTODON_CLIENT_SECRET, scope: 'read:accounts write:statuses' } : null,
    surveymonkey: env.SURVEYMONKEY_CLIENT_ID && env.SURVEYMONKEY_CLIENT_SECRET ? { base: SM, id: env.SURVEYMONKEY_CLIENT_ID, secret: env.SURVEYMONKEY_CLIENT_SECRET, scope: 'users_read surveys_write collectors_write' } : null
  };
}
export function authorizationUrl(provider, config, redirect, state) {
  const url = new URL(provider === 'mastodon' ? '/oauth/authorize' : '/oauth/authorize', config.base);
  url.search = new URLSearchParams({ client_id: config.id, redirect_uri: redirect, response_type: 'code', scope: config.scope, state }).toString();
  return url.href;
}
export async function exchangeCode(provider, config, redirect, code, fetcher = fetch) {
  const url = provider === 'mastodon' ? `${config.base}/oauth/token` : `${SM}/oauth/token`;
  const data = await json(fetcher, url, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code, client_id: config.id, client_secret: config.secret, redirect_uri: redirect }) });
  if (typeof data.access_token !== 'string' || !data.access_token) throw new Error('Token de acesso ausente.');
  return {token: data.access_token, base: provider === 'surveymonkey' ? surveyOrigin(data.access_url || SM) : config.base};
}
export async function accountProfile(provider, config, token, fetcher = fetch) {
  const url = provider === 'mastodon' ? `${config.base}/api/v1/accounts/verify_credentials` : `${surveyOrigin(config.base)}/v3/users/me`;
  const data = await json(fetcher, url, { headers: { authorization: `Bearer ${token}` } });
  if (typeof data.id !== 'string' && typeof data.id !== 'number') throw Error('Perfil sem identificador.');
  return { label: String(provider === 'mastodon' ? (data.acct || data.username) : (data.username || data.email || data.id)).slice(0, 100), remoteId: String(data.id) };
}
export async function publishPoll(provider, config, token, poll, fetcher = fetch, checkpoint = async () => {}) {
  const progress = {};
  const step = async (name, operation) => {
    progress.stage = name; progress.uncertain = true; await checkpoint({...progress});
    const result = await operation();
    if (!result.id) throw Error('A plataforma não retornou o identificador criado.');
    progress[name] = String(result.id); progress.uncertain = false; await checkpoint({...progress});
    return result;
  };
  if (provider === 'mastodon') {
    const form = new URLSearchParams({ status: poll.question, 'poll[expires_in]': String(poll.days * 86400) });
    poll.options.forEach(option => form.append('poll[options][]', option));
    const result = await step('statusId', () => json(fetcher, `${config.base}/api/v1/statuses`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/x-www-form-urlencoded' }, body: form }));
    return { id: String(result.id), url: result.url || null };
  }
  const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
  const post = (path, body) => json(fetcher, `${surveyOrigin(config.base)}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const survey = await step('surveyId', () => post('/v3/surveys', { title: poll.question }));
  if (!survey.id) throw new Error('A plataforma não retornou a pesquisa criada.');
  const page = await step('pageId', () => post(`/v3/surveys/${encodeURIComponent(survey.id)}/pages`, { title: poll.question }));
  if (!page.id) throw new Error(`Pesquisa ${survey.id} criada, mas sem página.`);
  await step('questionId', () => post(`/v3/surveys/${encodeURIComponent(survey.id)}/pages/${encodeURIComponent(page.id)}/questions`, { headings: [{ heading: poll.question }], family: 'single_choice', subtype: 'vertical', answers: { choices: poll.options.map(text => ({ text })) } }));
  const collector = await step('collectorId', () => post(`/v3/surveys/${encodeURIComponent(survey.id)}/collectors`, { type: 'weblink', name: 'Link Polliniza' }));
  return { id: String(survey.id), url: collector.url || null };
}

