# Privacidade

[English](PRIVACY.en.md) · [Português](PRIVACY.md)

Esta política técnica descreve a base `main` de 27/09/2026. Não declara uma operação pública já existente. O operador deve informar identidade, contato, hospedagem, tratamento de logs e provedores efetivos antes de receber usuários.

## Extensão

O editor salva rascunho e idioma em `chrome.storage.local`. Não solicita senhas, tokens OAuth, histórico ou conteúdo das páginas; não injeta scripts nas redes. As permissões são `storage` e `tabs`. A cópia usa a área de transferência; abrir um destino inicia navegação sujeita à política da plataforma. Limpe os dados da extensão ou remova-a para apagar o armazenamento local.

## Site

O servidor cria um cookie `polliniza` HttpOnly, SameSite=Lax e Secure em origem HTTPS, com prazo de até 12 horas. A sessão contém token CSRF, estado OAuth pendente por até 10 minutos, identificadores, nomes de contas e tokens OAuth em memória. O navegador recebe nomes e identificadores locais, não os tokens externos. Não há banco persistente ou criptografia de tokens em repouso nesta base. Não use este modelo para OAuth público contínuo.

OAuth ocorre no provedor, sem envio de senha ao Polliniza. Mastodon recebe status/pergunta, opções e prazo da enquete; SurveyMonkey recebe título, pergunta, opções e dados necessários ao coletor. O código atual não aplica o prazo da enquete ao fechamento do coletor SurveyMonkey. O site não salva rascunhos em armazenamento local; o estado do formulário é mantido durante a página aberta.

## Retenção e desconexão

Sessões vencem em até 12 horas e reiniciar o servidor perde seus dados. Entradas expiradas são removidas durante acessos à API; não há tarefa periódica que apague imediatamente toda entrada no instante da expiração. Desconectar remove a conta/token desta sessão. Revogue a autorização separadamente nas configurações do provedor. Desconectar ou expirar sessão não apaga enquetes já publicadas.

Não há histórico persistente de publicações nesta base. Falhas SurveyMonkey podem deixar pesquisas parciais; repetição pode criar novas pesquisas. Cada plataforma aplica sua própria retenção e política de privacidade.

## Logs, anúncios e limites

O código não instala telemetria ou anúncios. A hospedagem pode manter logs de requisição, inclusive IP e caminhos: o operador deve revisar retenção e evitar registro de códigos OAuth, cookies e segredos. Não afirmamos ausência de logs do provedor. Publicidade/análise futura exige atualização desta política e controles aplicáveis antes da ativação.

O [PR #5](https://github.com/sidineyr/Polliniza/pull/5) propõe armazenamento compartilhado cifrado, expiração e registros temporários de publicação. Não descreva esses recursos como ativos na `main` antes de integração e validação. Após qualquer mudança de armazenamento, atualize esta política e a página `/privacidade` conforme o código efetivamente publicado.
