import { NETWORKS, adaptPoll, inferPoll } from './networks.js';

const $ = selector => document.querySelector(selector);
const optionTemplate = $('#optionTemplate');
let language = 'pt-BR';

const messages = {
  'pt-BR': {
    tagline: 'Crie uma vez. Publique com controle.', language: 'Idioma', newPoll: 'Nova enquete', studio: 'Estúdio de enquetes', headline: 'Qual pergunta merece viajar?', instruction: 'Instrução simples', instructionPlaceholder: 'Ex.: Pergunte qual projeto educacional desperta mais curiosidade: Horizonte, QV, Chemical ou Einstein Física.', transform: 'Transformar em enquete', review: 'revise os detalhes', question: 'Pergunta', questionPlaceholder: 'O que você quer descobrir?', options: 'Opções', addOption: '+ Adicionar opção', caption: 'Legenda', captionPlaceholder: 'Um convite breve para participar', duration: 'Duração', oneDay: '1 dia', threeDays: '3 dias', sevenDays: '7 dias', fourteenDays: '14 dias', hashtags: 'Hashtags', networks: 'Redes', save: 'Salvar rascunho', prepare: 'Preparar publicação', preview: 'Prévia por rede', previewTitle: 'Antes de publicar, confira tudo.', emptyPreview: 'Selecione redes e prepare a publicação.', assisted: 'publicação assistida', copyPaste: 'copiar e colar', officialApi: 'API oficial', writeQuestion: 'Escreva a pergunta.', twoOptions: 'Inclua pelo menos duas opções.', selectNetwork: 'Selecione ao menos uma rede.', copy: 'Copiar conteúdo', open: 'Abrir', ready: 'Publicações preparadas. Confira cada prévia antes de abrir as redes.', copied: 'Conteúdo para {network} copiado.', saved: 'Rascunho salvo neste navegador.', instructionFirst: 'Escreva uma instrução primeiro.', draftCreated: 'Primeiro rascunho criado. Agora refine sua pergunta.', optionLabel: 'Opção da enquete', removeOption: 'Remover opção'
  },
  en: {
    tagline: 'Create once. Publish with control.', language: 'Language', newPoll: 'New poll', studio: 'Poll studio', headline: 'Which question deserves to travel?', instruction: 'Simple instruction', instructionPlaceholder: 'Example: Ask which educational project sparks the most curiosity: Horizonte, QV, Chemical or Einstein Physics.', transform: 'Turn into a poll', review: 'review the details', question: 'Question', questionPlaceholder: 'What do you want to discover?', options: 'Options', addOption: '+ Add option', caption: 'Caption', captionPlaceholder: 'A short invitation to participate', duration: 'Duration', oneDay: '1 day', threeDays: '3 days', sevenDays: '7 days', fourteenDays: '14 days', hashtags: 'Hashtags', networks: 'Networks', save: 'Save draft', prepare: 'Prepare publication', preview: 'Preview by network', previewTitle: 'Check everything before publishing.', emptyPreview: 'Select networks and prepare the publication.', assisted: 'assisted publishing', copyPaste: 'copy and paste', officialApi: 'official API', writeQuestion: 'Write the question.', twoOptions: 'Include at least two options.', selectNetwork: 'Select at least one network.', copy: 'Copy content', open: 'Open', ready: 'Publications prepared. Check each preview before opening the networks.', copied: 'Content for {network} copied.', saved: 'Draft saved in this browser.', instructionFirst: 'Write an instruction first.', draftCreated: 'First draft created. Now refine your question.', optionLabel: 'Poll option', removeOption: 'Remove option'
  }
};

const t = key => messages[language][key] || messages['pt-BR'][key] || key;

function applyLanguage(nextLanguage) {
  language = messages[nextLanguage] ? nextLanguage : 'pt-BR';
  document.documentElement.lang = language;
  document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(node => { node.placeholder = t(node.dataset.i18nPlaceholder); });
  $('#language').value = language;
  renderNetworks();
}

function addOption(value = '') {
  const row = optionTemplate.content.firstElementChild.cloneNode(true);
  const input = row.querySelector('input');
  const remove = row.querySelector('.remove');
  input.value = value;
  input.setAttribute('aria-label', t('optionLabel'));
  remove.setAttribute('aria-label', t('removeOption'));
  remove.addEventListener('click', () => {
    if (document.querySelectorAll('.option-row').length > 2) row.remove();
  });
  $('#options').append(row);
}

function selectedNetworks() {
  return [...document.querySelectorAll('#networks input:checked')].map(input => input.value);
}

function renderNetworks() {
  const selected = new Set(selectedNetworks());
  if (!selected.size) ['linkedin', 'substack'].forEach(id => selected.add(id));
  $('#networks').innerHTML = Object.entries(NETWORKS).map(([id, network]) => `<label class="network-choice"><input type="checkbox" value="${id}" ${selected.has(id) ? 'checked' : ''}><span>${network.label}<small>${modeLabel(network.mode)}</small></span></label>`).join('');
}

function modeLabel(mode) {
  return ({ assisted: t('assisted'), 'copy-paste': t('copyPaste'), 'official-api': t('officialApi') })[mode] || mode;
}

function readPoll() {
  return {
    question: $('#question').value.trim(),
    options: [...document.querySelectorAll('.option-input')].map(input => input.value.trim()).filter(Boolean),
    caption: $('#caption').value.trim(),
    hashtags: $('#hashtags').value.trim().split(/[\s,]+/).filter(Boolean),
    duration: Number($('#duration').value)
  };
}

function writePoll(poll) {
  $('#question').value = poll.question || '';
  $('#caption').value = poll.caption || '';
  $('#duration').value = String(poll.duration || 7);
  $('#hashtags').value = (poll.hashtags || []).join(' ');
  $('#options').innerHTML = '';
  const options = poll.options?.length ? poll.options : ['', ''];
  options.forEach(addOption);
  updateCount();
}

function validate(poll) {
  if (!poll.question) return t('writeQuestion');
  if (poll.options.length < 2) return t('twoOptions');
  if (!selectedNetworks().length) return t('selectNetwork');
  return '';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function prepare() {
  const poll = readPoll();
  const error = validate(poll);
  if (error) return setStatus(error, true);
  $('#previews').innerHTML = selectedNetworks().map(id => {
    const adapted = adaptPoll(poll, id);
    const network = adapted.capability;
    return `<article class="card"><div class="card-head"><strong>${network.label}</strong><span class="badge">${modeLabel(network.mode)}</span></div><p>${escapeHtml(adapted.caption)}</p><b>${escapeHtml(adapted.question)}</b>${adapted.options.map(option => `<div class="poll-option">${escapeHtml(option)}</div>`).join('')}<div class="card-actions"><button class="copy secondary" data-network="${id}">${t('copy')}</button><a href="${network.url}" target="_blank" rel="noreferrer">${t('open')} ${network.label}</a></div></article>`;
  }).join('');
  document.querySelectorAll('.copy').forEach(button => button.addEventListener('click', () => copyFor(button.dataset.network)));
  setStatus(t('ready'));
}

async function copyFor(id) {
  const text = adaptPoll(readPoll(), id).shareText;
  await navigator.clipboard.writeText(text);
  setStatus(t('copied').replace('{network}', NETWORKS[id].label));
}

function setStatus(message, isError = false) {
  $('#status').textContent = message;
  $('#status').style.color = isError ? 'var(--danger)' : 'var(--green)';
}

function updateCount() {
  $('#questionCount').textContent = `${$('#question').value.length}/300`;
}

async function save() {
  const poll = readPoll();
  await chrome.storage.local.set({ draft: poll, language });
  setStatus(t('saved'));
}

async function load() {
  const stored = await chrome.storage.local.get(['draft', 'language']);
  applyLanguage(stored.language || navigator.language);
  writePoll(stored.draft || { question: '', options: ['', ''], caption: '', hashtags: [], duration: 7 });
}

$('#interpret').addEventListener('click', () => {
  if (!$('#instruction').value.trim()) return setStatus(t('instructionFirst'), true);
  writePoll(inferPoll($('#instruction').value, language));
  setStatus(t('draftCreated'));
});
$('#addOption').addEventListener('click', () => addOption());
$('#prepare').addEventListener('click', prepare);
$('#save').addEventListener('click', save);
$('#question').addEventListener('input', updateCount);
$('#newPoll').addEventListener('click', () => writePoll({ question: '', options: ['', ''], caption: '', hashtags: [], duration: 7 }));
$('#language').addEventListener('change', async event => {
  applyLanguage(event.target.value);
  await chrome.storage.local.set({ language });
});

renderNetworks();
load();
