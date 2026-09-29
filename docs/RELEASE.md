# Preparação reproduzível da extensão

[English](RELEASE.en.md) · [Português](RELEASE.md)

Versão da extensão: **0.1.0**, igual em `package.json` e `manifest.json`. As mudanças web de 27/09 não alteram essa versão. Esta preparação inclui licença/NOTICE e empacotamento determinístico, sem mudar o comportamento da extensão e sem criar tag ou release pública.

```sh
npm run check
```

Saídas: `artifacts/polliniza-v0.1.0.zip` e seu arquivo `.sha256`. O script exige versões iguais, ordena nomes, usa ZIP sem compressão e fixa metadados em 1980-01-01. Inclui os oito arquivos de `dist` mais LICENSE/NOTICE. Não exige o utilitário `zip` nem pacote adicional. Para os mesmos arquivos de entrada, duas execuções devem produzir bytes idênticos.

Valide o ZIP com ferramenta de integridade, compare dois hashes, confira manifesto e conteúdo contra a fonte. Instale manualmente em Chromium e teste rascunho, idioma, prévia e copiar/abrir antes de publicar. Firefox permanece pendente: manifesto com service worker não foi validado nesse navegador. Nenhum teste de lógica substitui esse aceite.

As notas estão em [releases/extension-v0.1.0.md](releases/extension-v0.1.0.md). ZIPs históricos em `packages/` permanecem históricos; não foram sobrescritos. O CI mantém o ZIP como artefato do run; o checksum acompanha o ZIP no artefato do CI. Publicação futura deve anexar ZIP e checksum do mesmo commit revisado.

Não substitua silenciosamente uma release/tag pública existente. Se já houver publicação 0.1.0, escolha uma nova versão de manutenção e alinhe package, manifesto, nome e notas antes de publicar. Nenhuma release GitHub foi criada por este PR.
