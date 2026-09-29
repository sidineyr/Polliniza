# Security

[English](SECURITY.en.md) · [Português](SECURITY.md)

## Private reporting

Do not post credentials or personal data in issues. Use GitHub private vulnerability reporting if enabled by the maintainer. Availability was not verified in this review; otherwise the maintainer must enable it or provide a private channel before public operation. No security contact address was verified.

## Extension

Permissions limited to `storage`/`tabs`; no password capture or network script injection. Preview text is escaped; users review and confirm copy/open actions. Editorial rules can become outdated. Compatibility/accessibility need real-browser checks; the current manifest does not establish Firefox support.

## Website: implemented protections and remaining risks

- HttpOnly/SameSite=Lax cookie, Secure on HTTPS; POST requires exact origin and CSRF token.
- OAuth uses random state valid for 10 minutes; external tokens are not delivered to the browser.
- Public origin requires HTTPS; static assets include CSP and framing protection.
- Sessions/tokens remain in memory and expire within 12 hours. This base has no shared storage, encryption at rest, session quota, rate limiting or explicit fetch timeout.
- The body limit is 16 KiB measured as characters in this implementation; malformed JSON returns 400, an oversized body may return 500. Current handling can expose internal messages.
- SurveyMonkey uses a fixed API origin and does not preserve regional `access_url`. Failures can leave partial resources; no idempotency or safe resumption.
- Disconnect removes the session token without revoking the provider grant or deleting resources.

Do not enable continuous public OAuth with this model. Hosting configuration and green CI are not a security audit. Never put secrets in source, images, artifacts, browser or logs; review HTTPS, isolation, abuse and recovery before release.

## Pending change

[PR #5](https://github.com/sidineyr/Polliniza/pull/5) proposes encrypted Redis REST sessions, quotas/locks, timeouts, validated regional origins and publication records. It is separate from this documentation. After integration, validate Lua/TTL/concurrency and durability against real Redis, plus OAuth with authorized accounts; PR tests use mocks. Update this document to the final code and complete [the checklist](docs/EXTERNAL_CHECKLIST.en.md).
