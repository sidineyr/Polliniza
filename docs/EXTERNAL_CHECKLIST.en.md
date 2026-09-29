# External checklist and OAuth release gates

[English](EXTERNAL_CHECKLIST.en.md) · [Português](EXTERNAL_CHECKLIST.md)

Unverified items remain unchecked. This PR does not register accounts, purchase services, deploy, use real accounts or configure advertising.

## Assisted demo

- [ ] Connect the hosting account to GitHub and select the approved branch.
- [ ] Confirm plan, quotas and terms fit the intended use.
- [ ] Verify final HTTPS URL, certificate and access without host login protection.
- [ ] Verify editor, copy/open, About/Privacy, health check, robots and sitemap.
- [ ] Verify origin; for a custom domain validate DNS/`PUBLIC_ORIGIN`.
- [ ] Keep OAuth credentials absent for this in-memory-base demo.
- [ ] Fill in operator, contact and logging policy before accepting users.

## Mandatory gates before public OAuth

- [ ] Integrate/review persistence/security fixes (PR #5 or equivalent); reconcile policies/README with the actual chosen code. The current base has no persistent adapter.
- [ ] Provision genuinely durable shared storage without session loss/eviction and protect tokens at rest. Review backups, access and data location for the operation.
- [ ] After integrating PR #5, configure Redis URL/token, a 32-byte base64 key and `SESSION_STORE_DURABLE=true` only in the secure environment. The flag does not prove durability.
- [ ] Validate Lua, TTL, limits, deletion, restart, multiple instances and outages against real Redis. Verify failure blocks OAuth without fallback.
- [ ] Register Mastodon/SurveyMonkey apps and exact HTTPS callbacks `/api/callback/mastodon` and `/api/callback/surveymonkey`.
- [ ] Verify scopes, required approval and SurveyMonkey account plan. Verify compatible Mastodon instance.
- [ ] Set secrets only in the server dashboard; review logs, rotation and credential-free artifacts.
- [ ] Test OAuth with authorized accounts: consent/denial, invalid/reused/expired state, isolation, disconnect and revocation.
- [ ] Test controlled real publication, 401/429, timeout, partial failure and duplicate-free replay; inspect resources in the platform.
- [ ] Check function duration, edge abuse controls, monitoring and final policy/contact.

**Acceptance:** all security items verified with secret-free evidence, tests passing on the final branch and documentation matching the service. Green mock-based CI is insufficient. External resources may be uncertain after failure; do not promise exactly-once or universal automation.

## Search and advertising

- [ ] Verify ownership and submit the real sitemap to Search Console/Bing; report observed results without promising indexing.
- [ ] Update GitHub homepage only after a working URL is verified.
- [ ] If later monetizing, check hosting terms and AdSense rules; use real account/IDs, update policies and wait for approval. This PR executes none of these items.
