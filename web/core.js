export const DESTINATIONS = {
  mastodon: { label: 'Mastodon', kind: 'api', maxOptions: 4, maxLength: 50 },
  surveymonkey: { label: 'SurveyMonkey', kind: 'api', maxOptions: 100, maxLength: 200 },
  facebook: { label: 'Facebook', kind: 'assisted', url: 'https://www.facebook.com/' },
  linkedin: { label: 'LinkedIn', kind: 'assisted', url: 'https://www.linkedin.com/feed/' },
  instagram: { label: 'Instagram', kind: 'assisted', url: 'https://www.instagram.com/' },
  x: { label: 'X', kind: 'assisted', url: 'https://x.com/compose/post' },
  reddit: { label: 'Reddit', kind: 'assisted', url: 'https://www.reddit.com/submit' },
  telegram: { label: 'Telegram', kind: 'assisted', url: 'https://web.telegram.org/' }
};
export function validatePoll(input) {
  if (!input || typeof input !== 'object') throw new Error('Enquete inválida');
  const question = String(input.question ?? '').trim();
  const options = Array.isArray(input.options) ? input.options.map(v => String(v).trim()) : [];
  if (!question || question.length > 200) throw new Error('A pergunta precisa ter até 200 caracteres.');
  if (options.length < 2 || options.length > 4 || options.some(v => !v || v.length > 50)) throw new Error('Use de 2 a 4 opções com até 50 caracteres.');
  if (new Set(options.map(v => v.toLocaleLowerCase())).size !== options.length) throw new Error('As opções precisam ser diferentes.');
  const days = Number(input.days ?? 7);
  if (!Number.isInteger(days) || days < 1 || days > 7) throw new Error('Duração permitida: de 1 a 7 dias.');
  return { question, options, days };
}
export function shareText(poll) { return `${poll.question}\n\n${poll.options.map((x,i) => `${i+1}. ${x}`).join('\n')}`; }
