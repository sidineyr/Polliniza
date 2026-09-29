# Hospedagem, indexação e anúncios

[English](INDEXACAO_ADSENSE.en.md) · [Português](INDEXACAO_ADSENSE.md)

Documentação oficial conferida em 29/09/2026. Valores podem mudar; confirme no painel antes de contratar ou publicar.

| Aspecto | Vercel Hobby | Render Free (Web Service) |
|---|---|---|
| Configuração existente | `server.js`, `vercel.json`, inclui `web/**` | `render.yaml`, `npm run web`, `/healthz` |
| HTTPS | Certificado automático; domínio próprio exige DNS válido | URL do serviço e TLS gerenciado; domínio próprio opcional |
| Origem no servidor | `VERCEL_PROJECT_PRODUCTION_URL` ou `PUBLIC_ORIGIN` | `RENDER_EXTERNAL_URL` ou `PUBLIC_ORIGIN` |
| Sessões da base | Memória da função pode desaparecer/divergir entre instâncias | Reinício/suspensão perde memória; disco é temporário |
| Limites gratuitos relevantes | 1 milhão de invocações, 4 CPU-h, 360 GB-h de memória e 100 GB de transferência incluídos; Hobby pessoal/não comercial | 750 horas/workspace/mês; dorme após 15 min ocioso; volta em cerca de 1 min; quotas podem suspender serviço/build |
| Rastreamento | Confirme acesso público sem proteção de login | Dormindo, `/robots.txt` recebe bloqueio geral sem despertar o serviço |

Com Fluid Compute, a documentação atual informa até 300 segundos para funções Hobby; sem ele, os limites diferem. Confira runtime e configuração efetivos, não suponha um limite único. Render não recomenda instâncias Free para produção. Postgres Free expira em 30 dias e Key Value Free perde dados ao reiniciar: nenhum deles é indicado aqui como solução durável.

**Próximo passo recomendado:** demonstração pessoal no Vercel Hobby, sem OAuth nem anúncios, após validar o deploy. Render Free é alternativa de teste, com impacto de suspensão sobre acesso e busca. Para OAuth público, primeiro integre/valide as correções técnicas e escolha armazenamento compartilhado durável. Não basta preencher variáveis: a `main` atual ainda usa Map e não implementa persistência. Para AdSense, reveja hospedagem compatível com uso comercial.

## Publicação e indexação

Conecte o GitHub à hospedagem, selecione a branch aprovada e obtenha a origem HTTPS definitiva. Valide `/`, `/sobre`, `/privacidade`, `/healthz`, `/robots.txt` e `/sitemap.xml`; o sitemap atual inclui somente três páginas públicas e usa a origem configurada. `/api/` é excluído do rastreamento. Domínio próprio é opcional; se usado, configure DNS e `PUBLIC_ORIGIN` e atualize callbacks OAuth.

No Google Search Console e Bing Webmaster Tools, comprove propriedade por um método disponível e envie o sitemap real. Confira cobertura e URLs, inclusive após suspensão no Render ou mudança de domínio. Não publique tokens de verificação inventados. Rastreamento, indexação e posição não são garantidos. Mantenha homepage GitHub vazia até comprovar a URL funcional.

## AdSense

AdSense monetiza um site; Google Ads compra divulgação. Nenhum anúncio ou ID de editor está instalado. Somente depois de operação estável, conteúdo útil e política com operador/contato definidos, avalie o programa no painel real. Use apenas identificadores e instruções fornecidos à conta, atualize privacidade/consentimento e confirme aprovação antes de ativar anúncios. Não anuncie aprovação ou receita. Este PR não publica anúncios nem solicita aprovação.

[Checklist externo](EXTERNAL_CHECKLIST.md)

## Fontes oficiais

- [Vercel Hobby](https://vercel.com/docs/plans/hobby)
- [Duração de funções](https://vercel.com/docs/functions/configuring-functions/duration)
- [Certificados Vercel](https://vercel.com/docs/domains/working-with-ssl)
- [Render Free: suspensão, quotas, robots e dados](https://render.com/docs/free)
- [Google Search Console: sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Bing Webmaster Tools](https://www.bing.com/webmasters/)
- [AdSense](https://support.google.com/adsense/answer/9724)
