# Polliniza

[English](README.en.md) · [Português](README.md)

**Crie uma enquete. Revise os destinos. Publique com controle.**

Ferramenta livre para preparar enquetes e concluir sua publicação por APIs oficiais ou por fluxo assistido. Há dois aplicativos independentes: uma extensão local e um site com servidor Node. Não há integração universal, login automático nas redes ou publicação programática onde a plataforma não a permite.

## Estado verificável

Esta documentação acompanha a `main` com os PRs [#1](https://github.com/sidineyr/Polliniza/pull/1), [#2](https://github.com/sidineyr/Polliniza/pull/2), [#3](https://github.com/sidineyr/Polliniza/pull/3) e [#4](https://github.com/sidineyr/Polliniza/pull/4), integrados em 27/09/2026. O [PR técnico #5](https://github.com/sidineyr/Polliniza/pull/5) propõe sessões persistentes cifradas e proteção de reenvios; ainda não faz parte desta base. Não há URL de produção nem teste OAuth com contas reais comprovados nesta revisão.

| Produto | Implementado | Limite atual |
|---|---|---|
| Extensão 0.1.0 | Rascunho local, adaptação por destino, prévia, copiar e abrir | Todos os destinos são assistidos ou manuais; não usa OAuth |
| Site | Editor, seleção de contas, OAuth e conectores Mastodon/SurveyMonkey | Sessões e tokens em memória; requer configuração externa; não liberar OAuth público contínuo |
| Publicação | Arquivos Render/Vercel, health check, robots e sitemap | Arquivos preparados não comprovam deploy, indexação ou anúncios |

## Site

Requer Node.js 20 ou superior. Não há dependências de produção nesta base.

```sh
npm run web
```

Abra `http://localhost:3000`. Sem credenciais, use o editor e a publicação assistida. O site está em **português brasileiro**; não possui seletor inglês.

| Destino web | Código implementado | Configuração e validação |
|---|---|---|
| Mastodon | OAuth, leitura de perfil e criação de status com enquete | Uma instância HTTPS configurada; registrar app e testar com conta autorizada |
| SurveyMonkey | OAuth, perfil, criação de pesquisa, página, pergunta e coletor weblink | Credenciais, escopos/aprovação e conta compatível; teste real pendente |
| Facebook, LinkedIn, Instagram, X, Reddit, Telegram | Copiar texto e abrir a plataforma | O usuário monta/conclui a publicação; não conecta contas por API |

Os conectores estão implementados, mas não foram comprovados como configurados ou testados em produção. SurveyMonkey pode exigir aprovação de escopos e planos compatíveis. Não extrapole a disponibilidade de enquetes nativas dos destinos assistidos.

### Variáveis de ambiente

| Variável | Uso |
|---|---|
| `PORT` | Porta Node; padrão `3000` |
| `PUBLIC_ORIGIN` | Origem exata, sem caminho; HTTPS fora de localhost; prevalece sobre origem da hospedagem |
| `RENDER_EXTERNAL_URL` | Origem HTTPS fornecida pelo Render |
| `VERCEL_PROJECT_PRODUCTION_URL` | Host de produção fornecido pelo Vercel; o servidor acrescenta HTTPS |
| `MASTODON_BASE_URL` | Origem HTTPS da instância Mastodon |
| `MASTODON_CLIENT_ID`, `MASTODON_CLIENT_SECRET` | Aplicativo Mastodon, escopos `read:accounts write:statuses` |
| `SURVEYMONKEY_CLIENT_ID`, `SURVEYMONKEY_CLIENT_SECRET` | Aplicativo SurveyMonkey, escopos `users_read surveys_write collectors_write` |

Guarde segredos exclusivamente no ambiente do servidor. Não os publique em arquivos, imagens Docker, extensão ou issues. Cadastre os callbacks na origem definitiva: `/api/callback/mastodon` e `/api/callback/surveymonkey`. A simples presença de credenciais torna um conector disponível nesta base; não constitui liberação segura para terceiros.

### Limites web

Pergunta até 200 caracteres, 2–4 opções de até 50 caracteres, duração inteira de 1–7 dias e até 10 contas por pedido. Sessões têm prazo de até 12 horas; reinício ou outra instância pode perder tokens, estado OAuth e CSRF. A limpeza de entradas vencidas ocorre em acessos à API, sem job periódico. Não há armazenamento persistente, conta Polliniza própria, fila ou idempotência de publicação nesta base. SurveyMonkey pode deixar recursos parciais; repetir pode criar duplicatas. Confira a plataforma antes de reenviar.

Cookies são HttpOnly e SameSite=Lax, com Secure quando a origem é HTTPS. POST exige origem exata e token CSRF. Essas proteções não resolvem persistência nem todos os riscos de produção. Consulte [segurança](SECURITY.md), [privacidade](PRIVACY.md) e [checklist de liberação](docs/EXTERNAL_CHECKLIST.md).

## Extensão

A extensão prepara rascunhos por regras locais, sem chave de IA, servidor ou senha de rede. A tela principal possui **PT-BR/EN**, com idioma e rascunho salvos em `chrome.storage.local`; popup e metadados do manifesto permanecem em português. Não há publicação por API na extensão.

```sh
npm run check
```

Para Chrome/Edge/Brave: abra a página de extensões, ative modo de desenvolvedor e carregue a pasta `dist` sem compactação. Para obter o pacote preparado, use `artifacts/polliniza-v0.1.0.zip` após o comando. Os ZIPs históricos em `packages/` não representam o site nem uma release nova.

O manifesto atual é MV3 com `background.service_worker`. A presença de um bloco Gecko não comprova suporte Firefox: este pacote não inclui um manifesto específico validado nesse navegador. Trate Firefox como compatibilidade pendente, sem recomendar o mesmo ZIP como instalação confirmada. Não há publicação comprovada nas lojas de extensões.

Destinos editoriais da extensão: LinkedIn, X, Facebook, Instagram, Threads, Bluesky, Mastodon, Reddit, Substack e Telegram. Os limites em `networks.js` são regras editoriais do aplicativo, não garantias atualizadas de capacidade das plataformas. Revise a prévia e a disponibilidade na conta de destino.

## Arquitetura e desenvolvimento

| Caminho | Responsabilidade |
|---|---|
| `app.*`, `networks.js`, `manifest.json` | Extensão, regras editoriais e armazenamento local |
| `web/core.js`, `web/app.js` | Validação compartilhada do site e interface |
| `web/providers.js` | OAuth e APIs externas no servidor |
| `web/server.js` | Sessões, CSRF, API e páginas públicas |
| `server.js`, `vercel.json`, `render.yaml`, `Dockerfile` | Entradas e preparação de hospedagem |
| `scripts/`, `tests/`, `.github/workflows/ci.yml` | Build, empacotamento e CI |

```sh
npm test
npm run lint
npm run build
npm run package
```

O CI testa lógica com mocks e gera um artefato da extensão. O lint desta base verifica apenas quatro arquivos da extensão; não é auditoria integral do servidor. Testes aprovados não comprovam OAuth real, compatibilidade de todos os navegadores ou implantação. O empacotamento preparado neste PR usa arquivos ordenados e metadados ZIP fixos, sem dependências adicionais; veja [release reproduzível](docs/RELEASE.md).

GitHub Pages pode servir arquivos estáticos, mas não executa este servidor OAuth. Veja [Vercel/Render, indexação e AdSense](docs/INDEXACAO_ADSENSE.md). Não há anúncio, ID de editor, aprovação AdSense ou resultado de indexação comprovado.

## Documentação e licença

[Changelog](CHANGELOG.md) · [Contribuição](CONTRIBUTING.md) · [Código de conduta](CODE_OF_CONDUCT.md) · [Metadados GitHub](docs/GITHUB_METADATA.md)

Copyright © 2026 Sidiney Rodrigues. Código licenciado sob **AGPL-3.0-or-later**; texto integral em [LICENSE](LICENSE), identificação em [NOTICE](NOTICE). Idealizado por Sidiney Rodrigues, com auxílio de inteligência artificial.

[Mozilla: background manifest support](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background)
