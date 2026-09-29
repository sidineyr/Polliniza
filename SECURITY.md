# Segurança

## Modelo resumido de ameaças

- **Publicação acidental:** toda publicação exige revisão e ação explícita do usuário.
- **Roubo de credenciais:** a extensão não solicita senhas nem injeta scripts em páginas.
- **Excesso de permissões:** somente `storage` e `tabs` são solicitadas.
- **Conteúdo malicioso:** texto exibido nas prévias é escapado antes da inserção no HTML.
- **Mudanças nas redes:** integrações são assistidas e suas limitações ficam visíveis.

Relate vulnerabilidades pelo recurso privado de security advisories do GitHub. Não publique segredos em issues.


## Aplicativo web

OAuth exige armazenamento compartilhado durável, criptografia AES-256-GCM, TTL, cookies protegidos e CSRF. Há limites de requisições, sessões e contas. Falhas de armazenamento bloqueiam operações; não há fallback OAuth para memória. Publicações registram intenção e checkpoints para evitar repetição na mesma sessão. Veja [modelo operacional e limitações](docs/SESSIONS_SECURITY.md). O modo assistido continua sem credenciais.
