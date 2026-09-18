import { NETWORKS, adaptPoll, inferPoll } from './networks.js';
const $ = selector => document.querySelector(selector);
const optionTemplate = $('#optionTemplate');

function addOption(value = '') {
  const row = optionTemplate.content.firstElementChild.cloneNode(true);
  row.querySelector('input').value = value;
  row.querySelector('.remove').addEventListener('click', () => { if (document.querySelectorAll('.option-row').length > 2) row.remove(); });
  $('#options').append(row);
}
function renderNetworks() {
  $('#networks').innerHTML = Object.entries(NETWORKS).map(([id,n]) => `<label class="network-choice"><input type="checkbox" value="${id}" ${['linkedin','substack'].includes(id)?'checked':''}><span>${n.label}<small>${modeLabel(n.mode)}</small></span></label>`).join('');
}
function modeLabel(mode){return ({assisted:'publicação assistida','copy-paste':'copiar e colar','official-api':'API oficial'})[mode] || mode}
function readPoll() {
  return { question: $('#question').value.trim(), options: [...document.querySelectorAll('.option-input')].map(x=>x.value.trim()).filter(Boolean), caption: $('#caption').value.trim(), hashtags: $('#hashtags').value.trim().split(/[\s,]+/).filter(Boolean), duration: Number($('#duration').value) };
}
function writePoll(poll) {
  $('#question').value=poll.question; $('#caption').value=poll.caption; $('#duration').value=String(poll.duration); $('#hashtags').value=poll.hashtags.join(' '); $('#options').innerHTML=''; poll.options.forEach(addOption); updateCount();
}
function selectedNetworks(){return [...document.querySelectorAll('#networks input:checked')].map(x=>x.value)}
function validate(poll){if(!poll.question)return 'Escreva a pergunta.';if(poll.options.length<2)return 'Inclua pelo menos duas opções.';if(!selectedNetworks().length)return 'Selecione ao menos uma rede.';return ''}
function escapeHtml(s){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function prepare(){const poll=readPoll(),error=validate(poll);if(error){setStatus(error,true);return}$('#previews').innerHTML=selectedNetworks().map(id=>{const p=adaptPoll(poll,id),n=p.capability;return `<article class="card"><div class="card-head"><strong>${n.label}</strong><span class="badge">${modeLabel(n.mode)}</span></div><p>${escapeHtml(p.caption)}</p><b>${escapeHtml(p.question)}</b>${p.options.map(o=>`<div class="poll-option">${escapeHtml(o)}</div>`).join('')}<div class="card-actions"><button class="copy secondary" data-network="${id}">Copiar conteúdo</button><a href="${n.url}" target="_blank" rel="noreferrer">Abrir ${n.label}</a></div></article>`}).join('');document.querySelectorAll('.copy').forEach(b=>b.addEventListener('click',()=>copyFor(b.dataset.network)));setStatus('Publicações preparadas. Confira cada prévia antes de abrir as redes.')}
async function copyFor(id){const text=adaptPoll(readPoll(),id).shareText;await navigator.clipboard.writeText(text);setStatus(`Conteúdo para ${NETWORKS[id].label} copiado.`)}
function setStatus(message,isError=false){$('#status').textContent=message;$('#status').style.color=isError?'var(--danger)':'var(--green)'}
function updateCount(){ $('#questionCount').textContent=`${$('#question').value.length}/300` }
async function save(){const poll=readPoll();await chrome.storage.local.set({draft:poll});setStatus('Rascunho salvo neste navegador.')}
async function load(){const {draft}=await chrome.storage.local.get('draft');writePoll(draft||{question:'',options:['',''],caption:'',hashtags:[],duration:7})}
$('#interpret').addEventListener('click',()=>{if(!$('#instruction').value.trim())return setStatus('Escreva uma instrução primeiro.',true);writePoll(inferPoll($('#instruction').value));setStatus('Primeiro rascunho criado. Agora refine sua pergunta.')});
$('#addOption').addEventListener('click',()=>addOption());$('#prepare').addEventListener('click',prepare);$('#save').addEventListener('click',save);$('#question').addEventListener('input',updateCount);$('#newPoll').addEventListener('click',()=>writePoll({question:'',options:['',''],caption:'',hashtags:[],duration:7}));
renderNetworks();load();
