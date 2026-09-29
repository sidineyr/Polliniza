# Changelog

[English](CHANGELOG.en.md) · [Português](CHANGELOG.md)

## Unreleased: documentation and release preparation

- Equivalent Portuguese/English README and policies; website/extension separation.
- Full AGPL-3.0, NOTICE designating AGPL-3.0-or-later and authorship.
- Deterministic extension 0.1.0 packaging; notes/checklist without creating a public tag or release.
- Vercel/Render guide and external release gates. Secure persistence remains in technical PR #5, not merged into this base.

## Website: 2026-09-27 deliveries

| PR | Commit | Delivery |
|---|---|---|
| #1 | `afb688a` | Node website, Mastodon/SurveyMonkey OAuth, per-account publication and assisted destinations |
| #2 | `15b68ce` | Local startup, required public HTTPS, health check, expired-session cleanup and Docker |
| #3 | `dd2b2a3` | Render Blueprint, About/Privacy, dynamic robots/sitemap and indexing/AdSense guide |
| #4 | `0b77128` | Vercel Node entry/configuration, production HTTPS origin and sitemap test |

These are website deliveries; extension version remains 0.1.0. They do not prove deployment, real OAuth tests, indexing or AdSense. Base sessions remain in memory.

## Extension 0.1.0: 2026-09-18

- Main editor PT-BR/EN, local language/draft persistence.
- Incomplete-content adaptation and duplicate-hashtag removal.
- Installation ZIP and automated build. The historical Firefox verification claim was not reproduced in this review; the current manifest requires specific compatibility validation.

## Extension 0.1.0-alpha: 2026-09-17

- First local editor, ten editorial adapters, drafts, previews, copying and assisted publication.
- Manifest V3 and automated checks. No OAuth connector in the extension.
