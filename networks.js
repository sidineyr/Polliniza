export const NETWORKS = {
  linkedin: { label: 'LinkedIn', mode: 'assisted', poll: true, maxOptions: 4, optionLimit: 30, url: 'https://www.linkedin.com/feed/' },
  x: { label: 'X', mode: 'assisted', poll: true, maxOptions: 4, optionLimit: 25, url: 'https://x.com/compose/post' },
  facebook: { label: 'Facebook', mode: 'copy-paste', poll: 'varies', maxOptions: 10, optionLimit: 80, url: 'https://www.facebook.com/' },
  instagram: { label: 'Instagram', mode: 'copy-paste', poll: 'stories', maxOptions: 4, optionLimit: 80, url: 'https://www.instagram.com/' },
  threads: { label: 'Threads', mode: 'copy-paste', poll: false, maxOptions: 4, optionLimit: 80, url: 'https://www.threads.net/' },
  bluesky: { label: 'Bluesky', mode: 'copy-paste', poll: false, maxOptions: 4, optionLimit: 80, url: 'https://bsky.app/' },
  mastodon: { label: 'Mastodon', mode: 'copy-paste', poll: true, maxOptions: 4, optionLimit: 80, url: 'https://joinmastodon.org/servers' },
  reddit: { label: 'Reddit', mode: 'assisted', poll: true, maxOptions: 6, optionLimit: 120, url: 'https://www.reddit.com/submit' },
  substack: { label: 'Substack', mode: 'assisted', poll: true, maxOptions: 10, optionLimit: 80, url: 'https://substack.com/home' },
  telegram: { label: 'Telegram', mode: 'copy-paste', poll: true, maxOptions: 10, optionLimit: 100, url: 'https://web.telegram.org/' }
};

export function adaptPoll(poll, network) {
  const cap = NETWORKS[network];
  if (!cap) throw new Error('Rede desconhecida');
  const options = (poll.options || []).slice(0, cap.maxOptions).map(value => String(value).slice(0, cap.optionLimit));
  const tags = [...new Set((poll.hashtags || []).filter(Boolean).map(tag => tag.startsWith('#') ? tag : `#${tag}`))].join(' ');
  const question = String(poll.question || '').slice(0, 300);
  const caption = String(poll.caption || '').slice(0, 1000);
  return { ...poll, question, caption, options, network, capability: cap, shareText: [caption, question, options.map((value,index)=>`${index+1}. ${value}`).join('\n'), tags].filter(Boolean).join('\n\n') };
}

export function inferPoll(instruction, language = 'pt-BR') {
  const clean = instruction.trim();
  const afterColon = clean.includes(':') ? clean.split(':').slice(1).join(':') : '';
  const candidates = afterColon.split(/,|\bou\b|\bor\b/i).map(v => v.trim().replace(/[.!?]+$/,'')).filter(Boolean).slice(0,10);
  const english = language === 'en';
  return {
    question: clean.split(':')[0].replace(/^(pergunte|crie uma enquete sobre|ask|create a poll about)\s*/i,'').trim() || clean,
    options: candidates.length >= 2 ? candidates : ['', ''],
    caption: english ? 'Your opinion can open new paths. Take part in the poll.' : 'Sua opinião pode abrir novos caminhos. Participe da enquete.',
    hashtags: [], duration: 7
  };
}
