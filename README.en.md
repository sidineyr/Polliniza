# Polliniza

[English](README.en.md) · [Português](README.md)

**Create a poll. Review its destinations. Publish with control.**

A free software tool for preparing polls and completing publication through official APIs or assisted workflows. It contains two independent applications: a local browser extension and a website with a Node server. It does not provide universal integration, automatic social-network login or programmatic publication where a platform does not permit it.

## Verified state

This documentation describes `main` after PRs [#1](https://github.com/sidineyr/Polliniza/pull/1), [#2](https://github.com/sidineyr/Polliniza/pull/2), [#3](https://github.com/sidineyr/Polliniza/pull/3) and [#4](https://github.com/sidineyr/Polliniza/pull/4), merged on 2026-09-27. [Technical PR #5](https://github.com/sidineyr/Polliniza/pull/5) proposes encrypted persistent sessions and replay protection; it is not part of this base. This review has not verified a production URL or OAuth tests with real accounts.

| Product | Implemented | Current limitation |
|---|---|---|
| Extension 0.1.0 | Local draft, destination adaptation, preview, copy and open | All destinations are assisted/manual; no OAuth |
| Website | Editor, account selection, OAuth and Mastodon/SurveyMonkey connectors | Sessions/tokens in memory; external setup required; unsuitable for continuous public OAuth |
| Hosting preparation | Render/Vercel files, health check, robots and sitemap | Configuration files do not prove deployment, indexing or advertising |

## Website

Requires Node.js 20 or later. This base has no production dependencies.

```sh
npm run web
```

Open `http://localhost:3000`. Without credentials, use the editor and assisted publication. The website is in **Brazilian Portuguese** and has no English selector.

| Website destination | Implemented code | Setup and verification |
|---|---|---|
| Mastodon | OAuth, account profile and status creation with poll | One configured HTTPS instance; register an app and test an authorized account |
| SurveyMonkey | OAuth, profile, survey/page/question/weblink collector creation | Credentials, scopes/approval and a compatible account; real tests pending |
| Facebook, LinkedIn, Instagram, X, Reddit, Telegram | Copy text and open the platform | User assembles/completes publication; no API account connection |

Connectors exist in code but have not been verified as configured or tested in production. SurveyMonkey may require scope approval and compatible plans. Assisted destinations do not guarantee native poll availability.

### Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | Node port; defaults to `3000` |
| `PUBLIC_ORIGIN` | Exact origin without a path; HTTPS outside localhost; overrides hosting origin |
| `RENDER_EXTERNAL_URL` | HTTPS origin supplied by Render |
| `VERCEL_PROJECT_PRODUCTION_URL` | Production hostname supplied by Vercel; server adds HTTPS |
| `MASTODON_BASE_URL` | HTTPS origin of the Mastodon instance |
| `MASTODON_CLIENT_ID`, `MASTODON_CLIENT_SECRET` | Mastodon app; `read:accounts write:statuses` scopes |
| `SURVEYMONKEY_CLIENT_ID`, `SURVEYMONKEY_CLIENT_SECRET` | SurveyMonkey app; `users_read surveys_write collectors_write` scopes |

Keep secrets only in the server environment, never in source files, Docker images, extension or issues. Register callbacks on the final origin: `/api/callback/mastodon` and `/api/callback/surveymonkey`. Credentials make a connector available in this base; they do not establish safe public operation.

### Website limits

Questions up to 200 characters, 2–4 options of up to 50 characters, integer duration of 1–7 days and up to 10 accounts per request. Sessions last up to 12 hours; restart or a different instance can lose tokens, OAuth state and CSRF. Expired entries are cleaned during API access, without a periodic job. This base has no persistent storage, Polliniza user accounts, queue or publication idempotency. SurveyMonkey can leave partial resources; retrying may create duplicates. Check the platform before resending.

Cookies are HttpOnly and SameSite=Lax, with Secure on an HTTPS origin. POST requires exact origin and CSRF token. These protections do not solve persistence or all production risks. See [security](SECURITY.en.md), [privacy](PRIVACY.en.md) and [release gates](docs/EXTERNAL_CHECKLIST.en.md).

## Extension

The extension prepares drafts with local rules, without an AI key, server or network passwords. The main editor supports **PT-BR/EN**, saving language and draft in `chrome.storage.local`; popup and manifest metadata remain Portuguese. It does not publish through APIs.

```sh
npm run check
```

For Chrome/Edge/Brave: open the extensions page, enable developer mode and load the unpacked `dist` folder. The prepared ZIP is `artifacts/polliniza-v0.1.0.zip` after running the command. Historical ZIPs under `packages/` do not represent the website or a new release.

The current MV3 manifest uses `background.service_worker`. A Gecko section does not prove Firefox support: this package has no separate Firefox manifest validated in that browser. Firefox compatibility remains pending; the same ZIP is not a confirmed Firefox installation. No extension-store publication was verified.

Extension editorial destinations: LinkedIn, X, Facebook, Instagram, Threads, Bluesky, Mastodon, Reddit, Substack and Telegram. Limits in `networks.js` are application editorial rules, not current platform capability guarantees. Review previews and availability in the target account.

## Architecture and development

| Path | Responsibility |
|---|---|
| `app.*`, `networks.js`, `manifest.json` | Extension, editorial rules and local storage |
| `web/core.js`, `web/app.js` | Website validation and interface |
| `web/providers.js` | Server-side OAuth and external APIs |
| `web/server.js` | Sessions, CSRF, API and public pages |
| `server.js`, `vercel.json`, `render.yaml`, `Dockerfile` | Hosting entry points and preparation |
| `scripts/`, `tests/`, `.github/workflows/ci.yml` | Build, packaging and CI |

```sh
npm test
npm run lint
npm run build
npm run package
```

CI tests logic using mocks and generates an extension artifact. The base lint checks only four extension files; it is not a complete server audit. Passing tests do not prove real OAuth, every-browser compatibility or deployment. Packaging prepared by this PR uses ordered files and fixed ZIP metadata without added dependencies; see [reproducible release](docs/RELEASE.en.md).

GitHub Pages can serve static files but cannot execute this OAuth server. See [Vercel/Render, indexing and AdSense](docs/INDEXACAO_ADSENSE.en.md). No ads, publisher ID, AdSense approval or indexing results have been verified.

## Documentation and license

[Changelog](CHANGELOG.en.md) · [Contributing](CONTRIBUTING.en.md) · [Code of conduct](CODE_OF_CONDUCT.en.md) · [GitHub metadata](docs/GITHUB_METADATA.en.md)

Copyright © 2026 Sidiney Rodrigues. Code is licensed **AGPL-3.0-or-later**; full text in [LICENSE](LICENSE), designation in [NOTICE](NOTICE). Conceived by Sidiney Rodrigues with assistance from artificial intelligence.

[Mozilla: background manifest support](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background)
