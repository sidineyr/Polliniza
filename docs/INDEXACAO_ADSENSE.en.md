# Hosting, indexing and advertising

[English](INDEXACAO_ADSENSE.en.md) · [Português](INDEXACAO_ADSENSE.md)

Official documentation checked on 2026-09-29. Limits can change; verify the dashboard before purchasing or publishing.

| Aspect | Vercel Hobby | Render Free (Web Service) |
|---|---|---|
| Existing configuration | `server.js`, `vercel.json`, includes `web/**` | `render.yaml`, `npm run web`, `/healthz` |
| HTTPS | Automatic certificate; custom domain needs valid DNS | Service URL and managed TLS; custom domain optional |
| Server origin | `VERCEL_PROJECT_PRODUCTION_URL` or `PUBLIC_ORIGIN` | `RENDER_EXTERNAL_URL` or `PUBLIC_ORIGIN` |
| Base sessions | Function memory can disappear/diverge between instances | Restart/spindown loses memory; disk is temporary |
| Relevant free limits | 1 million invocations, 4 CPU-h, 360 GB-h memory and 100 GB transfer included; personal/non-commercial only | 750 hours/workspace/month; sleeps after 15 idle minutes; wakes in roughly 1 minute; quotas can suspend service/build |
| Crawling | Verify public access without login protection | While asleep, `/robots.txt` returns disallow-all without waking the service |

With Fluid Compute, current documentation permits up to 300 seconds for Hobby functions; without it, limits differ. Check the actual runtime/configuration rather than assuming one universal limit. Render does not recommend Free instances for production. Free Postgres expires after 30 days and Free Key Value loses data on restart: neither is proposed here as durable storage.

**Recommended next step:** a personal Vercel Hobby demo, without OAuth or ads, after deployment verification. Render Free is a testing alternative with availability/crawling consequences. Public OAuth first requires integrated/tested technical fixes and durable shared storage. Environment variables alone are insufficient: current `main` still uses Map with no persistent adapter. For AdSense, reconsider hosting that permits commercial use.

## Publication and indexing

Connect GitHub to the host, select the approved branch and obtain the final HTTPS origin. Verify `/`, `/sobre`, `/privacidade`, `/healthz`, `/robots.txt` and `/sitemap.xml`; the sitemap contains only three public pages and uses the configured origin. `/api/` is excluded from crawling. A custom domain is optional; if used, configure DNS/`PUBLIC_ORIGIN` and update OAuth callbacks.

Verify ownership in Google Search Console and Bing Webmaster Tools using an available legitimate method, then submit the real sitemap. Check coverage/URLs, including after Render spindown or a domain change. Never invent verification tokens. Crawling, indexing and rankings are not guaranteed. Leave GitHub homepage empty until a working URL is verified.

## AdSense

AdSense monetizes a website; Google Ads purchases promotion. No ads or publisher ID are installed. Only after stable operation, useful content and a policy naming the operator/contact, assess the program through the real dashboard. Use account-issued identifiers/instructions, update privacy/consent and confirm approval before activating ads. Do not claim approval or revenue. This PR neither publishes ads nor requests approval.

[External checklist](EXTERNAL_CHECKLIST.en.md)

## Official sources

- [Vercel Hobby](https://vercel.com/docs/plans/hobby)
- [Function duration](https://vercel.com/docs/functions/configuring-functions/duration)
- [Vercel certificates](https://vercel.com/docs/domains/working-with-ssl)
- [Render Free: spindown, quotas, robots and storage](https://render.com/docs/free)
- [Google Search Console: sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Bing Webmaster Tools](https://www.bing.com/webmasters/)
- [AdSense](https://support.google.com/adsense/answer/9724)
