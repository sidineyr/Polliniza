# Reproducible extension preparation

[English](RELEASE.en.md) · [Português](RELEASE.md)

Extension version: **0.1.0**, matching `package.json` and `manifest.json`. Website changes on 2026-09-27 do not change this version. Preparation adds license/NOTICE and deterministic packaging without changing extension behavior or creating a public tag/release.

```sh
npm run check
```

Outputs: `artifacts/polliniza-v0.1.0.zip` and its `.sha256` file. The script requires matching versions, sorts names, stores ZIP entries without compression and fixes metadata at 1980-01-01. It includes eight `dist` files plus LICENSE/NOTICE. No `zip` executable or added package is needed. Identical input files must produce identical bytes across two runs.

Verify ZIP integrity, compare two hashes and check manifest/content against source. Manually install in Chromium and test draft, language, preview and copy/open before publication. Firefox remains pending: the service-worker manifest was not validated there. Logic tests do not replace this acceptance check.

Notes are in [releases/extension-v0.1.0.en.md](releases/extension-v0.1.0.en.md). Historical ZIPs in `packages/` were not overwritten. CI retains the ZIP as a run artifact; the checksum is included alongside the ZIP in the CI artifact. A future release should attach ZIP/checksum from the same reviewed commit.

Never silently replace an existing public release/tag. If 0.1.0 is already published, choose a new maintenance version and align package, manifest, filename and notes before publication. This PR creates no GitHub release.
