# Polliniza: publicação, indexação e AdSense

## 1. Hospedagem

O repositório inclui `render.yaml` para um serviço Node no plano gratuito Render. Conecte o repositório `sidineyr/Polliniza` ao Render como Blueprint, confira que o serviço usa `main` e que `/healthz` responde. O Render atribui `RENDER_EXTERNAL_URL`, que o servidor usa como origem HTTPS por padrão. Atribua `PUBLIC_ORIGIN` somente se escolher um domínio próprio e atualize os retornos OAuth cadastrados. Configure os segredos OAuth no painel da hospedagem; nunca no GitHub. Antes de ativar publicação real para terceiros, configure o armazenamento persistente e criptografado descrito em [SESSIONS_SECURITY.md](SESSIONS_SECURITY.md): o plano gratuito suspende serviços inativos e perde as sessões em memória.

## 2. Indexação

1. Após obter a URL pública definitiva, abra `/`, `/sobre`, `/privacidade`, `/robots.txt` e `/sitemap.xml` e confirme HTTP 200, HTTPS e conteúdo correto. O sitemap usa a origem configurada e inclui só três páginas públicas; `/api/` fica fora.
2. Adicione o domínio/propriedade no Google Search Console e valide a propriedade por um método legítimo disponível. Envie `https://DOMINIO/sitemap.xml` e inspecione a página inicial. Indexação e posição não são garantidas.
3. Adicione o site no Bing Webmaster Tools, verifique a propriedade e envie o mesmo sitemap. Mantenha links visíveis para Sobre e Privacidade e inclua o link do site no README e perfis do projeto após confirmar a URL.
4. Acompanhe cobertura e erros de rastreamento mensalmente. Se mudar o domínio, ajuste `PUBLIC_ORIGIN`, faça redirecionamento permanente e envie o novo sitemap.

## 3. AdSense

O AdSense é um programa de anúncios para sites, diferente de uma campanha de Google Ads. Não inclua código, `ads.txt` ou identificador `ca-pub` genérico. Primeiro confirme que o site está publicado, estável, com navegação e conteúdo original suficiente. As páginas Sobre e Privacidade são um começo; acrescente guias úteis de formatos de enquete e documentação de compatibilidade antes de solicitar análise.

No painel da conta real do AdSense, adicione o domínio e obtenha o identificador e o método de verificação fornecidos pelo Google. Inclua somente os dados reais no site, revise política de privacidade e consentimento aplicável, solicite revisão e aguarde o estado **Pronto**. Só então avalie anúncios em páginas informativas, sem interromper o editor, OAuth ou a ação de publicar. A aprovação, receita e indexação dependem das plataformas e não são prometidas por este plano.

## Alternativa sem cartão: Vercel

Importe o repositório público como projeto no plano Hobby e verifique que a branch de produção é `main`. A entrada Node `server.js` inicia o mesmo servidor; `VERCEL_PROJECT_PRODUCTION_URL` fornece a origem HTTPS para sitemap e robots. Configure [armazenamento durável e criptografia](SESSIONS_SECURITY.md) antes dos segredos OAuth, pois funções podem reiniciar entre autorização e publicação. Os passos de indexação e AdSense acima valem para a URL final verificada.

