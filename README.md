# Polliniza

**Crie uma vez. Adapte com inteligência. Publique com controle.**

Polliniza é uma extensão livre para preparar uma enquete e adaptar suas versões para diferentes redes sociais. O projeto não promete uma automação inexistente: quando uma API oficial não permite criar enquetes, a extensão oferece publicação assistida ou conteúdo pronto para copiar.

## O que a versão 0.1.0 faz

- transforma uma instrução simples em um primeiro rascunho local;
- permite editar pergunta, opções, legenda, duração e hashtags;
- salva o rascunho no navegador;
- adapta quantidade e tamanho das opções por rede;
- mostra uma prévia antes de qualquer ação;
- copia o conteúdo e abre o compositor da rede escolhida;
- funciona sem servidor, conta própria ou chave de IA;
- oferece a interface completa em português brasileiro e inglês;
- preserva a escolha de idioma e o rascunho apenas no navegador.

## Instalação local

Baixe o pacote pronto [polliniza-v0.1.0.zip](packages/polliniza-v0.1.0.zip), descompacte-o e carregue a pasta no navegador.

```bash
npm run check
```

No Chrome, Edge ou Brave, abra `chrome://extensions`, ative o modo de desenvolvedor, escolha **Carregar sem compactação** e selecione a pasta `dist`.

No Firefox, abra `about:debugging#/runtime/this-firefox`, escolha **Carregar extensão temporária** e selecione `dist/manifest.json`.

## Modos de integração

| Modo | Significado |
|---|---|
| API oficial | A plataforma autoriza publicação programática. Ainda não habilitado nesta versão. |
| Assistida | Polliniza prepara o conteúdo e abre a rede para conclusão pelo usuário. |
| Copiar e colar | Polliniza adapta e copia o texto; a enquete é montada manualmente. |

Os dados de capacidade em `networks.js` são limites editoriais conservadores e precisam ser revisados periodicamente conforme a documentação oficial das plataformas.

## Privacidade

O rascunho permanece em `chrome.storage.local`. A extensão não lê senhas, histórico ou páginas, não injeta scripts em redes sociais e não possui telemetria. Veja [PRIVACY.md](PRIVACY.md) e [SECURITY.md](SECURITY.md).

## Desenvolvimento

Requer Node.js 20 ou superior e não possui dependências de produção.

```bash
npm test
npm run lint
npm run build
npm run package
```

## Próximas versões

- revisar capacidades com documentação oficial;
- provedores opcionais Ollama e LM Studio;
- OAuth e APIs oficiais onde permitido;
- ícones finais e submissão às lojas;
- testes de interface com leitores de tela.

## Licença

AGPL-3.0-or-later. Idealizado por Sidiney Rodrigues e desenvolvido de forma aberta com auxílio de inteligência artificial.

## Site de publicação (nova interface)

O diretório `web/` contém um site e um servidor Node.js, independentes da extensão. Execute `npm run web` e acesse `http://localhost:3000`. A interface permite criar uma enquete, associar contas por OAuth, selecionar os destinos conectados e ver o resultado de cada publicação. Facebook, LinkedIn, Instagram, X, Reddit e Telegram aparecem como destinos assistidos: o texto é copiado, e a publicação é concluída pelo usuário na plataforma.

Para habilitar publicação via API, registre seus próprios aplicativos nas plataformas e configure no servidor:

```env
PUBLIC_ORIGIN=https://seu-dominio.example
MASTODON_BASE_URL=https://sua-instancia.example
MASTODON_CLIENT_ID=...
MASTODON_CLIENT_SECRET=...
SURVEYMONKEY_CLIENT_ID=...
SURVEYMONKEY_CLIENT_SECRET=...
PORT=3000
```

Cadastre as URLs de retorno `https://seu-dominio.example/api/callback/mastodon` e `/api/callback/surveymonkey` nos respectivos aplicativos. Mastodon requer `read:accounts write:statuses`; SurveyMonkey requer `users_read surveys_write collectors_write`. A liberação de `surveys_write` para aplicativos públicos depende da aprovação do SurveyMonkey, e permissões/planos podem restringir coletores. O servidor deve estar atrás de HTTPS e receber a origem exata em `PUBLIC_ORIGIN`. Não coloque segredos em código, páginas estáticas ou extensões.

**Escopo operacional:** as sessões e os tokens OAuth ficam somente na memória do processo e expiram em até 12 horas; uma reinicialização desconecta todas as contas. Esta versão serve como base funcional e demonstrável, ainda sem persistência, conta Polliniza própria, administração de usuários, filas ou hospedagem configurada. Enquetes já criadas no SurveyMonkey podem ficar parcialmente prontas se uma etapa posterior falhar; verifique o painel antes de repetir. A publicação em múltiplas contas não é uma transação: confirme cada resultado antes de reenviar para evitar duplicatas. O site não solicita senhas das plataformas.
