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
  const options = poll.options.slice(0, cap.maxOptions).map(value => value.slice(0, cap.optionLimit));
  const tags = poll.hashtags.filter(Boolean).map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
  return { ...poll, options, network, capability: cap, shareText: [poll.caption, poll.question, options.map((v,i)=>`${i+1}. ${v}`).join('\n'), tags].filter(Boolean).join('\n\n') };
}

export function inferPoll(instruction) {
  const clean = instruction.trim();
  const afterColon = clean.includes(':') ? clean.split(':').slice(1).join(':') : '';
  const candidates = afterColon.split(/,|\bou\b/i).map(v => v.trim().replace(/[.!?]+$/,'')).filter(Boolean).slice(0,10);
  return {
    question: clean.split(':')[0].replace(/^(pergunte|crie uma enquete sobre)\s*/i,'').trim() || clean,
    options: candidates.length >= 2 ? candidates : ['', ''],
    caption: 'Sua opinião pode abrir novos caminhos. Participe da enquete.',
    hashtags: [], duration: 7
  };
}
