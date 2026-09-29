# Sessões, OAuth e publicação segura

## Operação

Sem configuração de armazenamento, o site oferece editor e destinos assistidos. OAuth fica indisponível, mesmo que existam credenciais das plataformas. O armazenamento em memória é limitado e serve exclusivamente à demonstração sem tokens OAuth.

Para OAuth, configure no ambiente do servidor:

- `SESSION_REDIS_URL`: origem HTTPS de um Redis REST compatível com o protocolo Upstash, com suporte a EVAL.
- `SESSION_REDIS_TOKEN`: credencial REST exclusiva do servidor.
- `SESSION_ENCRYPTION_KEY`: chave aleatória de 32 bytes em base64. Gere no seu ambiente seguro, por exemplo com `openssl rand -base64 32`; não publique a saída.
- `SESSION_STORE_DURABLE=true`: confirmação operacional de que o Redis escolhido oferece persistência real, sem descarte de sessões por eviction. Essa variável não transforma um serviço volátil em durável.
- Origem HTTPS e credenciais OAuth descritas no README.

A aplicação não provisiona armazenamento. Escolha uma instância durável, política de não evicção, região adequada e acesso restrito. Não use Render Key Value Free como persistência durável. Todas as instâncias do aplicativo devem usar o mesmo Redis e chave. Alterar a chave invalida dados existentes: a rotação requer estratégia de migração ou exclusão controlada. Não compartilhar esse banco/prefixo com outros aplicativos.

## Proteções e limites

Os registros completos de sessão são cifrados com AES-256-GCM, IV aleatório e autenticação vinculada à chave do registro. Tokens nunca são enviados ao navegador. Cookies são HttpOnly e SameSite=Lax, com Secure em HTTPS; operações POST exigem origem exata e token CSRF. O estado OAuth é consumido antes de trocar o código, inclusive quando inválido.

A interface do armazenamento oferece `withSession(key, callback)` com carregamento, bloqueio exclusivo e gravação. Redis executa quotas, bloqueios e gravações condicionadas ao dono do bloqueio usando Lua. Expiração física usa PX; o índice de quota remove membros expirados na gravação e expira após inatividade. Não há job periódico necessário. Sessões duram até 12 horas sem renovação automática, com até 1.000 sessões, 10 contas e 100 registros de publicação por sessão.

Limites de API: 600 requisições/minuto globais e 120/minuto por endereço de conexão. Atrás de proxies, o endereço pode ser compartilhado: não confiamos em X-Forwarded-For arbitrário. Configure proteção de abuso na borda para identificação correta do cliente. Limites são conservadores e podem limitar usuários legítimos.

Chamadas às plataformas têm timeout de 10 segundos, sem retries automáticos e sem seguir redirecionamentos com credenciais. Há orçamento de 60 segundos para chamadas de publicação e 25 segundos para OAuth; o orçamento não inclui todas as gravações Redis. Cada requisição Redis tem timeout de 5 segundos. O bloqueio dura 180 segundos e as gravações verificam seu proprietário; perda de bloqueio interrompe a operação. Não existe renovação de lease. Adeque a duração da função da hospedagem; encerramento precoce pode deixar resultado incerto, que não será reenviado automaticamente.

Corpos de requisição acima de 16 KiB recebem 413; JSON inválido recebe 400. Falhas internas retornam mensagens genéricas. Uma indisponibilidade Redis bloqueia operações, sem fallback para memória.

## Reenvios e resultados parciais

`POST /api/publish` exige `operationId` de 16–80 caracteres alfanuméricos, hífen ou sublinhado. O servidor grava a intenção antes de acessar a plataforma e checkpoints antes/depois de cada recurso criado. Resultado inclui `progress` com identificadores conhecidos e `uncertain` para etapa sem confirmação. SurveyMonkey registra pesquisa, página, pergunta e coletor; Mastodon registra status.

Reenvio com o mesmo identificador retorna o registro existente; outro conteúdo com o mesmo identificador recebe 409. Conteúdo idêntico para as mesmas contas também é deduplicado durante a sessão, mesmo com novo identificador. A interface conserva o identificador ao repetir o envio. Não oferece um botão para repetir intencionalmente a mesma enquete na mesma sessão.

Após falha parcial, timeout, perda de conexão ou encerramento do processo, confira os recursos na plataforma. Não há retomada automática, rollback ou garantia de exactly-once da API externa. Se um recurso foi criado, mas a resposta ou checkpoint se perdeu, seu identificador pode ser desconhecido. Proteção contra reenvio termina com a expiração/exclusão da sessão; não repita automaticamente após esse prazo. Não há fila nem histórico permanente. Desconectar remove o token da sessão, mas não revoga autorização na plataforma nem apaga enquetes.

## SurveyMonkey regional

O `access_url` da troca OAuth é conservado e usado em perfil e publicação. São aceitas apenas origens HTTPS exatas: `api.surveymonkey.com`, `api.eu.surveymonkey.com`, `api.surveymonkey.ca`, sem credenciais, porta alternativa, caminho, query ou fragmento. Novas regiões exigem revisão da documentação oficial antes de ampliar a lista.

Fontes: https://api.surveymonkey.com/v3/docs (OAuth, Access URL e recursos) e https://upstash.com/docs/redis/features/restapi (protocolo Redis REST).

## Validação

`npm run check` verifica sintaxe de extensão/web/scripts, testes Node e empacotamento da extensão. Testes cobrem OAuth com mocks, criptografia, protocolo REST com mock, quotas, TTL, duas instâncias, exclusão de sessão expirada, replay de state, desconexão, falhas parciais, 401/429, timeout e deduplicação.

O mock Redis não executa Lua em um Redis real e não demonstra durabilidade do provedor. Antes de liberar contas reais, valide EVAL, TTL, quotas, concorrência e reinício com a instância contratada/provisionada; valide OAuth e publicação com contas de teste autorizadas. CI não comprova deploy, indexação ou permissões das plataformas.
