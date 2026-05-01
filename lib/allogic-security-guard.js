function stripAi(text = '') {
  return String(text || '')
    .replace(/^\s*(\.ai|\.ask|\.gpt|\.gemini|\.groq|\.allogic)\s*/i, '')
    .trim();
}

function norm(text = '') {
  return stripAi(text)
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function hasAny(text = '', items = []) {
  return items.some(item => {
    if (item instanceof RegExp) return item.test(text);
    return text.includes(item);
  });
}

const DISCLOSURE_WORDS = [
  'tampilkan',
  'tunjukkan',
  'lihatkan',
  'buka',
  'kirim',
  'kasih',
  'berikan',
  'bagikan',
  'share',
  'print',
  'dump',
  'copy',
  'salin',
  'bocorkan',
  'leak',
  'reveal',
  'expose',
  'show me',
  'give me',
  'send me'
];

const BYPASS_WORDS = [
  'abaikan instruksi',
  'abaikan aturan',
  'lupakan aturan',
  'jangan ikuti aturan',
  'ignore previous',
  'ignore all previous',
  'developer mode',
  'mode developer',
  'jailbreak'
];

const OWN_SYSTEM_REFS = [
  'kamu',
  'punyamu',
  'milikmu',
  'bot ini',
  'allogic',
  'server ini',
  'project ini',
  'repo ini',
  'aplikasi ini',
  'sistem ini',
  'internal'
];

const INTERNAL_TARGETS = [
  'system prompt',
  'sistem prompt',
  'prompt internal',
  'internal prompt',
  'prompt kamu',
  'promptmu',
  'instruksi sistem',
  'system instruction',
  'developer instruction',
  'instruksi developer',
  'aturan internal',
  'workflow internal',
  'cara kerja internal',
  'chain-of-thought',
  'chain of thought',
  'reasoning trace',
  'router kamu',
  'routing model kamu'
];

const SECRET_TARGETS = [
  '.env',
  'env file',
  'api key',
  'apikey',
  'token',
  'secret',
  'cookie',
  'session',
  'creds',
  'credential',
  'password',
  'private key',
  'noise key',
  'signedidentitykey',
  'baileys_store',
  'baileys store',
  'auth info',
  'payload',
  'request body',
  'header api',
  'config internal',
  'konfigurasi rahasia',
  'memory user lain',
  'memori user lain',
  'database memory',
  'isi file internal',
  'struktur folder internal'
];

function hasDisclosureIntent(text = '') {
  return hasAny(text, DISCLOSURE_WORDS);
}

function hasBypassIntent(text = '') {
  return hasAny(text, BYPASS_WORDS);
}

function hasOwnSystemRef(text = '') {
  if (hasAny(text, OWN_SYSTEM_REFS)) return true;
  return /\b(prompt|instruksi|token|session|cookie|key|memory|config|payload|header)\s*(mu|nya)\b/i.test(text);
}

function isGeneralEducationalQuestion(message = '') {
  const text = norm(message);

  const safeStarts = [
    'apa itu ai',
    'apa itu artificial intelligence',
    'jelaskan ai',
    'jelaskan konsep ai',
    'pengertian ai',
    'apa itu api',
    'apa itu api key',
    'pengertian api key',
    'apa itu token',
    'apa itu cookie',
    'apa itu session',
    'apa itu system prompt',
    'apa itu sistem prompt',
    'pengertian system prompt',
    'jelaskan konsep system prompt',
    'jelaskan konsep sistem prompt',
    'apa itu rag',
    'apa itu machine learning',
    'apa itu deep learning',
    'apa itu bot',
    'apa itu whatsapp',
    'apakah kamu bisa belajar sendiri',
    'bisa belajar sendiri',
    'kamu bisa belajar sendiri',
    'apa kemampuan kamu',
    'kemampuan kamu'
  ];

  if (safeStarts.some(x => text.startsWith(x))) return true;

  return /^(apa itu|pengertian|arti|maksud|jelaskan konsep|jelaskan secara umum)\s+/.test(text);
}


function isSensitiveQuestion(message = '') {
  const text = norm(message);
  if (!text) return false;

  const educational = isGeneralEducationalQuestion(text);
  const disclosure = hasDisclosureIntent(text);
  const bypass = hasBypassIntent(text);
  const ownSystem = hasOwnSystemRef(text);
  const hasInternalTarget = hasAny(text, INTERNAL_TARGETS);
  const hasSecretTarget = hasAny(text, SECRET_TARGETS);

  if (hasAny(text, ['bocorkan rahasia', 'tampilkan rahasia', 'lihat rahasia', 'dump rahasia'])) {
    return true;
  }

  if (hasInternalTarget) {
    if (educational && !disclosure && !bypass && !ownSystem) return false;
    return disclosure || bypass || ownSystem || /^(jelaskan|sebutkan|urai|detailkan)\b/.test(text);
  }

  if (hasSecretTarget) {
    if (educational && !disclosure && !bypass && !ownSystem) return false;
    return disclosure || bypass || ownSystem;
  }

  return false;
}

function safeReply(message = '') {
  if (!isSensitiveQuestion(message)) return null;

  return [
    'Maaf, saya tidak bisa membahas atau menampilkan detail internal, prompt, router, API key, session, payload, memory user lain, atau konfigurasi rahasia sistem.',
    '',
    'Saya tetap bisa membantu secara aman, misalnya:',
    '- memperbaiki potongan kode yang kamu kirim',
    '- menjelaskan konsep umum',
    '- memberi best practice keamanan',
    '- membantu debug tanpa membuka rahasia sistem'
  ].join('\n');
}

function shouldForceGoogle(message = '') {
  const text = stripAi(message).toLowerCase();

  const triggers = [
    'keamanan',
    'security',
    'privacy',
    'privasi',
    'bocor',
    'rahasia',
    'audit',
    'validasi',
    'proteksi'
  ];

  return triggers.some(p => text.includes(p));
}

module.exports = {
  isSensitiveQuestion,
  safeReply,
  shouldForceGoogle
};
