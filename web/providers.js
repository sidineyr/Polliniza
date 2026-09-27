const SM = 'https://api.surveymonkey.com';
async function json(fetcher, url, init = {}) {
  const response = await fetcher(url, init);
  const raw = await response.text();
  let body;
  try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }
  if (!response.ok) throw new Error(`A plataforma recusou a operação (HTTP ${response.status}).`);
  return body;
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
  return data.access_token;
}
export async function accountProfile(provider, config, token, fetcher = fetch) {
  const url = provider === 'mastodon' ? `${config.base}/api/v1/accounts/verify_credentials` : `${SM}/v3/users/me`;
  const data = await json(fetcher, url, { headers: { authorization: `Bearer ${token}` } });
  return { label: String(provider === 'mastodon' ? (data.acct || data.username) : (data.username || data.email || data.id)).slice(0, 100), remoteId: String(data.id) };
}
export async function publishPoll(provider, config, token, poll, fetcher = fetch) {
  if (provider === 'mastodon') {
    const form = new URLSearchParams({ status: poll.question, 'poll[expires_in]': String(poll.days * 86400) });
    poll.options.forEach(option => form.append('poll[options][]', option));
    const result = await json(fetcher, `${config.base}/api/v1/statuses`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/x-www-form-urlencoded' }, body: form });
    return { id: String(result.id), url: result.url || null };
  }
  const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
  const post = (path, body) => json(fetcher, `${SM}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const survey = await post('/v3/surveys', { title: poll.question });
  if (!survey.id) throw new Error('A plataforma não retornou a pesquisa criada.');
  const page = await post(`/v3/surveys/${encodeURIComponent(survey.id)}/pages`, { title: poll.question });
  if (!page.id) throw new Error(`Pesquisa ${survey.id} criada, mas sem página.`);
  await post(`/v3/surveys/${encodeURIComponent(survey.id)}/pages/${encodeURIComponent(page.id)}/questions`, { headings: [{ heading: poll.question }], family: 'single_choice', subtype: 'vertical', answers: { choices: poll.options.map(text => ({ text })) } });
  const collector = await post(`/v3/surveys/${encodeURIComponent(survey.id)}/collectors`, { type: 'weblink', name: 'Link Polliniza' });
  return { id: String(survey.id), url: collector.url || null };
}
