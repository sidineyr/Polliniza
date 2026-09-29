# Changelog

[English](CHANGELOG.en.md) · [Português](CHANGELOG.md)

## Não publicado: documentação e preparação de release

- README e políticas equivalentes em português/inglês; separação entre site e extensão.
- AGPL-3.0 integral, NOTICE com AGPL-3.0-or-later e autoria.
- Empacotamento determinístico da extensão 0.1.0; notas e checklist, sem criar tag ou release pública.
- Guia Vercel/Render e critérios externos de liberação. Persistência segura continua no PR técnico #5, não integrada nesta base.

## Site: entregas de 2026-09-27

| PR | Commit | Entrega |
|---|---|---|
| #1 | `afb688a` | Site Node, OAuth Mastodon/SurveyMonkey, publicação por conta e destinos assistidos |
| #2 | `15b68ce` | Inicialização local, exigência de HTTPS público, health check, limpeza de sessões vencidas e Docker |
| #3 | `dd2b2a3` | Render Blueprint, Sobre/Privacidade, robots/sitemap dinâmicos e guia de indexação/AdSense |
| #4 | `0b77128` | Entrada Node e configuração Vercel, origem HTTPS de produção e teste de sitemap |

Essas entregas são do site; não alteram a versão 0.1.0 da extensão. Não comprovam deploy, testes OAuth reais, indexação ou AdSense. Sessões da base permanecem em memória.

## Extensão 0.1.0: 2026-09-18

- Editor principal PT-BR/EN, idioma e rascunho locais.
- Adaptação de conteúdo incompleto e remoção de hashtags repetidas.
- ZIP de instalação e build automatizado. A declaração histórica de verificação Firefox não foi reproduzida nesta revisão; o manifesto atual exige validação específica de compatibilidade.

## Extensão 0.1.0-alpha: 2026-09-17

- Primeiro editor local, dez adaptadores editoriais, rascunhos, prévias, cópia e publicação assistida.
- Manifest V3 e verificações automatizadas. Não há conector OAuth na extensão.
