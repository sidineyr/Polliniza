# Checklist externo e liberação OAuth

[English](EXTERNAL_CHECKLIST.en.md) · [Português](EXTERNAL_CHECKLIST.md)

Itens não comprovados permanecem desmarcados. Este PR não faz cadastro, contratação, deploy, uso de contas reais ou configuração de anúncios.

## Demonstração assistida

- [ ] Conectar a conta de hospedagem ao GitHub e selecionar a branch aprovada.
- [ ] Confirmar plano, quotas e termos compatíveis com o uso pretendido.
- [ ] Confirmar URL HTTPS final, certificado e acesso sem login da hospedagem.
- [ ] Validar editor, copiar/abrir, Sobre/Privacidade, health check, robots e sitemap.
- [ ] Confirmar origem; se houver domínio próprio, validar DNS/`PUBLIC_ORIGIN`.
- [ ] Manter credenciais OAuth ausentes nesta demonstração da base em memória.
- [ ] Preencher operador, contato e política dos logs antes de aceitar usuários.

## Critérios obrigatórios antes de OAuth público

- [ ] Integrar e revisar a correção de persistência/segurança (PR #5 ou equivalente); reconciliar políticas e README com o código efetivamente escolhido. A base atual não contém esse adaptador.
- [ ] Provisionar armazenamento compartilhado realmente durável, sem perda/evicção de sessões, e proteger tokens em repouso. Conferir backups, acesso e localização de dados conforme a operação.
- [ ] Após integrar o PR #5, configurar URL/token Redis, chave de 32 bytes em base64 e `SESSION_STORE_DURABLE=true` exclusivamente no ambiente seguro. Esse sinalizador não prova durabilidade.
- [ ] Validar Lua, TTL, limites, exclusão, reinício, múltiplas instâncias e indisponibilidade no Redis real. Confirmar que falha bloqueia OAuth sem fallback.
- [ ] Registrar aplicativos Mastodon/SurveyMonkey e cadastrar callbacks HTTPS exatos `/api/callback/mastodon` e `/api/callback/surveymonkey`.
- [ ] Confirmar escopos, aprovação quando exigida e plano da conta SurveyMonkey. Confirmar instância Mastodon compatível.
- [ ] Inserir segredos apenas no painel do servidor; revisar logs, rotação e ausência de credenciais em artefatos.
- [ ] Testar OAuth com contas autorizadas: consentimento/recusa, state inválido/reutilizado/expirado, isolamento, desconexão e revogação.
- [ ] Testar publicação real controlada, resposta 401/429, timeout, falha parcial e reenvio sem duplicar; conferir recursos na plataforma.
- [ ] Conferir duração da função, limites de abuso na borda, monitoramento e política/contato finais.

**Aceite:** todos os itens de segurança validados com evidência sem segredos, testes aprovados na branch final e documentação coerente com o serviço. Um CI verde com mocks não basta. Recursos externos podem ficar incertos após falha; não prometa exactly-once ou automação universal.

## Busca e anúncios

- [ ] Verificar propriedade e enviar sitemap real ao Search Console/Bing; registrar os resultados observados, sem prometer indexação.
- [ ] Atualizar homepage GitHub somente depois de comprovar a URL funcional.
- [ ] Se decidir monetizar futuramente, conferir termos da hospedagem e regras AdSense; usar conta/ID reais, atualizar políticas e aguardar aprovação. Nenhum item foi executado por este PR.
