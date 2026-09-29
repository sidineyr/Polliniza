# Privacy

[English](PRIVACY.en.md) · [Português](PRIVACY.md)

This technical policy describes the 2026-09-27 `main` base. It does not claim an existing public operation. Before accepting users, the operator must identify the responsible party, contact, hosting, log handling and actual providers.

## Extension

The editor saves draft and language in `chrome.storage.local`. It does not request passwords, OAuth tokens, history or page content, and does not inject scripts into social networks. Permissions are `storage` and `tabs`. Copying uses the clipboard; opening a destination starts navigation subject to that platform's policy. Clear extension data or uninstall it to delete local storage.

## Website

The server creates a `polliniza` cookie: HttpOnly, SameSite=Lax and Secure on HTTPS, lasting up to 12 hours. In-memory sessions contain a CSRF token, pending OAuth state for up to 10 minutes, account identifiers/names and OAuth tokens. The browser receives names and local identifiers, not external tokens. This base has no persistent database or token encryption at rest. Do not use this model for continuous public OAuth.

OAuth takes place at the provider; passwords are not sent to Polliniza. Mastodon receives status/question, options and poll duration; SurveyMonkey receives title, question, options and collector data. Current code does not apply the poll duration to SurveyMonkey collector closing. The website does not save drafts in local storage; form state lasts while the page remains open.

## Retention and disconnect

Sessions expire within 12 hours; restarting the server loses their data. Expired entries are removed during API access; no periodic task immediately deletes every entry at its expiry instant. Disconnect removes the account/token from this session. Revoke the grant separately in the provider settings. Disconnect or session expiry does not delete published polls.

This base has no persistent publication history. SurveyMonkey failures may leave partial surveys; retrying may create additional surveys. Each platform applies its own retention and privacy policy.

## Logs, advertising and limitations

The code installs no telemetry or ads. Hosting may retain request logs including IP and paths: the operator must review retention and prevent logging of OAuth codes, cookies and secrets. We do not claim that hosting logs are absent. Future advertising/analytics requires a policy update and applicable controls before activation.

[PR #5](https://github.com/sidineyr/Polliniza/pull/5) proposes encrypted shared storage, expiry and temporary publication records. Do not describe these as active on `main` before integration and validation. After storage changes, update this policy and `/privacidade` to match the deployed code.
