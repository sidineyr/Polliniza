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

**Escopo operacional:** OAuth exige armazenamento Redis REST durável com criptografia e TTL. Sem ele, o site funciona em modo assistido e os conectores ficam bloqueados. Sessões expiram em até 12 horas; não há conta Polliniza própria, administração de usuários ou fila. Publicações registram intenção e progresso para impedir reenvios na mesma sessão. Em falhas parciais ou resultados incertos, confira o painel da plataforma; não há rollback automático. Veja [configuração e limites](docs/SESSIONS_SECURITY.md). O site não solicita senhas das plataformas.

### Executar e hospedar

Para testar a interface localmente, `npm run web` basta: a origem padrão é `http://localhost:3000`. Para testar OAuth local, cadastre essa origem e os caminhos de retorno na plataforma. Fora de `localhost`, configure `PUBLIC_ORIGIN` com a URL HTTPS exata do site. O contêiner pode ser criado com `docker build -t polliniza .` e iniciado com `docker run --rm -p 3000:3000 -e PUBLIC_ORIGIN=https://seu-dominio.example ... polliniza`; injete as credenciais no ambiente do servidor, sem incluí-las na imagem. O caminho `/healthz` retorna um estado simples para monitoramento. Um serviço de hospedagem com Node e HTTPS é necessário: GitHub Pages, sozinho, não executa este servidor OAuth.

### Hospedagem, busca e anúncios

O arquivo `render.yaml` descreve um serviço Node no plano gratuito do Render. Vincule este repositório como Blueprint na sua conta Render; a URL HTTPS atribuída será lida de `RENDER_EXTERNAL_URL`. A publicação inicial não exige credenciais OAuth e oferece o editor e os destinos assistidos. Antes de ativar OAuth, configure armazenamento durável e criptografia; depois configure os aplicativos e segredos **apenas no painel do servidor**. Uma instância gratuita pode suspender após inatividade; a persistência deve ficar em um serviço externo durável. Para indexação, o site expõe `/robots.txt` e `/sitemap.xml` na origem HTTPS. Consulte [o plano de hospedagem, indexação e AdSense](docs/INDEXACAO_ADSENSE.md). Nenhum anúncio é carregado nesta versão.

### Alternativa de hospedagem sem cartão

O arquivo `server.js` na raiz permite importar o repositório no Vercel como um projeto Node, no plano Hobby. O projeto deve servir o servidor como função Node e incluir os arquivos `web/**` na função (`vercel.json`). A origem HTTPS de produção é lida de `VERCEL_PROJECT_PRODUCTION_URL`; para um domínio próprio, configure `PUBLIC_ORIGIN`. O Vercel pode encerrar ou replicar instâncias da função. Por isso, os conectores exigem armazenamento compartilhado durável e criptografia configurados conforme o guia de sessões. A versão pública sem credenciais mantém criação de enquete e publicação assistida.


### Sessões seguras e reenvios

OAuth agora exige Redis REST durável e chave de criptografia, além das credenciais das plataformas. Sem esse armazenamento, os conectores ficam bloqueados e a demonstração assistida continua disponível. A memória de processo não armazena tokens OAuth. Veja [configuração, limites e validação](docs/SESSIONS_SECURITY.md). 
