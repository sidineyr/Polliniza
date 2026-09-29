# Segurança

[English](SECURITY.en.md) · [Português](SECURITY.md)

## Relato privado

Não publique credenciais ou dados pessoais em issues. Use o relato privado de vulnerabilidades do GitHub se habilitado pelo mantenedor. Sua disponibilidade não foi verificada nesta revisão; se indisponível, o mantenedor deve habilitá-lo ou fornecer um canal privado antes da abertura pública. Não foi verificado um endereço de segurança.

## Extensão

Permissões limitadas a `storage`/`tabs`; sem captura de senha ou injeção em redes. Texto de prévia é exibido com escape; o usuário revisa e confirma copiar/abrir. Regras editoriais podem ficar desatualizadas. Compatibilidade e acessibilidade precisam de teste no navegador real; o manifesto atual não comprova Firefox.

## Site: proteção implementada e riscos restantes

- Cookie HttpOnly/SameSite=Lax, Secure com origem HTTPS; POST exige origem exata e token CSRF.
- OAuth usa estado aleatório com validade de 10 minutos; tokens externos não são entregues ao navegador.
- Origem pública exige HTTPS; recursos estáticos têm CSP e proteção contra enquadramento.
- Sessões/tokens ficam em memória e expiram em até 12 horas. Não há armazenamento compartilhado, criptografia em repouso, quota de sessões, rate limit ou timeout explícito de fetch nesta base.
- O limite de corpo é 16 KiB em caracteres nesta implementação; JSON inválido retorna 400, excesso de corpo pode retornar 500. O tratamento atual pode expor mensagens internas.
- SurveyMonkey usa uma origem API fixa; não conserva o `access_url` regional. Falhas podem criar recursos parciais; não há idempotência ou retomada segura.
- Desconectar remove o token da sessão, sem revogar grant ou apagar recursos no provedor.

Não habilite OAuth público contínuo com esse modelo. Configuração da hospedagem e um CI verde não constituem auditoria de segurança. Nunca inclua segredos em fonte, imagem, artefato, navegador ou log; revise HTTPS, isolamento, abuso e recuperação antes da liberação.

## Mudança pendente

O [PR #5](https://github.com/sidineyr/Polliniza/pull/5) propõe sessões cifradas em Redis REST, quotas/bloqueios, timeouts, origem regional validada e registro de publicações. Ele está separado desta documentação. Após integração, valide Lua/TTL/concorrência e durabilidade no Redis real, além de OAuth com contas autorizadas; os testes do PR usam mocks. Atualize este documento para o código final e confira [o checklist](docs/EXTERNAL_CHECKLIST.md).
