import { validatePoll, shareText } from './core.js';
const $=s=>document.querySelector(s);
let session;
let pendingPublication;
const form=$('#poll-form'), results=$('#results');
function pollDraft(){return {question:$('#question').value, options:[...$('#options input')].map(e=>e.value),days:Number($('#days').value)};}
function element(tag,text,cls){const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;}
function message(text){results.replaceChildren(element('p',text));}
function preview(){const draft=pollDraft();$('#count').textContent=`${draft.question.length}/200`;$('#preview').textContent=shareText(draft);}
form.addEventListener('input',preview);
$('#add-option').addEventListener('click',()=>{const count=$('#options').children.length;if(count>=4)return;const label=element('label',`Opção ${count+1}`), input=document.createElement('input');input.maxLength=50;input.required=true;input.placeholder='Outra resposta';label.append(input);$('#options').append(label);if(count===3)$('#add-option').disabled=true;});
async function api(path,body){const response=await fetch(path,{method:'POST',headers:{'content-type':'application/json','x-csrf-token':session.csrf},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw Error(data.error||'Pedido recusado');return data;}
async function refresh(){const response=await fetch('/api/session');session=await response.json();const holder=$('#accounts');holder.replaceChildren();for(const [provider,label] of [['mastodon','Mastodon'],['surveymonkey','SurveyMonkey']]){
 const section=element('div','', 'account');const info=document.createElement('div');info.append(element('strong',label));const associated=session.accounts.filter(a=>a.provider===provider);
 for(const account of associated){const row=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.name='account';check.value=account.id;row.append(check,document.createTextNode(account.label));info.append(row);const disconnect=element('button','Desconectar');disconnect.type='button';disconnect.addEventListener('click',async()=>{try{await api('/api/disconnect',{accountId:account.id});await refresh();}catch(e){message(e.message)}});info.append(disconnect);}
 if(!associated.length) info.append(element('small',session.available[provider]?'Pronto para conectar':'Aguardando configuração do aplicativo'));
 section.append(info);if(session.available[provider]){const link=element('a','Conectar','linkbutton');link.href=`/api/connect/${provider}`;section.append(link);}holder.append(section);
 }
 const assisted=$('#assisted');assisted.replaceChildren();for(const [key,item] of Object.entries(session.destinations)){if(item.kind!=='assisted')continue;const row=element('div','', 'destination'),info=document.createElement('div');info.append(element('strong',item.label),element('small','Publicação assistida'));const copy=element('button','Copiar e abrir');copy.type='button';copy.addEventListener('click',async()=>{try{const poll=validatePoll(pollDraft());await navigator.clipboard.writeText(shareText(poll));window.open(item.url,'_blank','noopener,noreferrer');message(`Enquete copiada. Conclua a publicação no ${item.label}.`);}catch(e){message(e.message)}});row.append(info,copy);assisted.append(row);}
}
form.addEventListener('submit',async event=>{event.preventDefault();try{const poll=validatePoll(pollDraft());const accountIds=[...document.querySelectorAll('input[name="account"]:checked')].map(n=>n.value);if(!accountIds.length)throw Error('Selecione ao menos uma conta conectada.');const button=form.querySelector('.primary');button.disabled=true;message('Publicando…');try{const signature=JSON.stringify({poll,accountIds});
if (!pendingPublication || pendingPublication.signature!==signature) pendingPublication={signature,id:crypto.randomUUID()};
const response=await api('/api/publish',{poll,accountIds,operationId:pendingPublication.id});results.replaceChildren();for(const result of response.results){const name=session.accounts.find(a=>a.id===result.accountId)?.label||result.provider;const line=element('p',`${name}: ${result.ok?'Publicado':'Falha — '+result.error}${result.progress?.surveyId?' (pesquisa '+result.progress.surveyId+')':''}`);if(result.url){const a=element('a',' Abrir enquete');a.href=result.url;a.target='_blank';a.rel='noopener noreferrer';line.append(a);}results.append(line);}}finally{button.disabled=false;}}catch(e){message(e.message)}});
refresh().catch(e=>message(e.message));preview();

