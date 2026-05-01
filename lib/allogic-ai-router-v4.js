const baseAI = require('./allogic-ai');
const securityGuard = require('./allogic-security-guard');
const webSearchAI = require('./allogic-web-search');
const { buildAllogicSystemPrompt } = require('./allogic-system-prompt-v5');
const memoryAI = require('./allogic-memory');
const historyAI = require('./allogic-chat-history');
const fetchFn = global.fetch || require('node-fetch');

function env(k, d = '') {
  const v = process.env[k];
  return v === undefined || v === null || String(v).trim() === ''
    ? d
    : String(v).trim();
}

function good(v = '') {
  v = String(v || '').trim();
  if (!v) return false;
  if (/^(YOUR_|ISI_|PASTE_|xxx|xxxx|kosong|null|undefined)/i.test(v)) return false;
  if (/x{4,}/i.test(v)) return false;
  return true;
}

function list(v = '', fb = []) {
  const a = String(v || '')
    .split(',')
    .map(x => x.trim())
    .filter(good);

  return a.length ? a : fb.filter(good);
}

function normProvider(p = '') {
  p = String(p || '').toLowerCase().trim();

  if (p === 'google' || p === 'gemini') return 'google';
  if (p === 'groq' || p === 'grok') return 'groq';
  if (p === 'openrouter' || p === 'router') return 'openrouter';
  if (p === 'nvidia' || p === 'nim' || p === 'nvidia-nim') return 'nvidia';

  return 'auto';
}

function isHeavy(msg = '', opt = {}) {
  if (opt.forceHeavy || opt.heavy) return true;
  if (opt.forceLight || opt.light) return false;

  const t = String(msg || '').toLowerCase();
  const min = Number(env('AI_HEAVY_MIN_CHARS', '700'));

  if (Number.isFinite(min) && t.length >= min) return true;

  const words = [
    'step by step',
    'langkah demi langkah',
    'matematika',
    'persamaan',
    'debug',
    'error',
    'bug',
    'syntaxerror',
    'typeerror',
    'referenceerror',
    'analisis',
    'arsitektur',
    'database',
    'secara detail',
    'mendalam'
  ];

  if (words.some(w => t.includes(w))) return true;

  return /buatkan?.*(kode|script|program|website|aplikasi|game)/i.test(t);
}

function providerOrder(provider = 'auto', heavy = false) {
  const p = normProvider(provider);
  if (p !== 'auto') return [p];

  const fb = heavy
    ? ['google', 'groq', 'openrouter', 'nvidia']
    : ['groq', 'openrouter', 'nvidia', 'google'];

  const key = heavy ? 'AI_HEAVY_PROVIDER_ORDER' : 'AI_LIGHT_PROVIDER_ORDER';

  return list(env(key, fb.join(',')), fb)
    .map(normProvider)
    .filter(x => x && x !== 'auto');
}

function modelsFor(provider, heavy = false, opt = {}) {
  if (opt.model) return [opt.model];

  if (provider === 'google') {
    const b = env('GOOGLE_MODEL', env('GEMINI_MODEL', ''));
    const k = heavy ? 'GOOGLE_MODELS_HEAVY' : 'GOOGLE_MODELS_LIGHT';
    return list(env(k, b), b ? [b] : []);
  }

  if (provider === 'groq') {
    const b = env('GROQ_MODEL', '');
    const k = heavy ? 'GROQ_MODELS_HEAVY' : 'GROQ_MODELS_LIGHT';
    return list(env(k, b), b ? [b] : []);
  }

  if (provider === 'openrouter') {
    const b = env('OPENROUTER_MODEL', '');
    const k = heavy ? 'OPENROUTER_MODELS_HEAVY' : 'OPENROUTER_MODELS_LIGHT';
    return list(env(k, b), b ? [b] : []);
  }

  if (provider === 'nvidia') {
    const b = env('NVIDIA_MODEL', '');
    const k = heavy ? 'NVIDIA_MODELS_HEAVY' : 'NVIDIA_MODELS_LIGHT';
    return list(env(k, b), b ? [b] : []);
  }

  return [];
}

function retryable(e) {
  const msg = String((e && e.message) || e || '').toLowerCase();
  const st = Number((e && e.status) || 0);

  if ([400, 404, 408, 409, 410, 429, 500, 502, 503, 504].includes(st)) {
    return true;
  }

  return /rate|limit|quota|token|context|overload|busy|timeout|capacity|unavailable|exceeded|too many|model|not found|unsupported/i.test(msg);
}

function history(h = []) {
  if (!Array.isArray(h)) return [];

  const max = Number(env('AI_MAX_HISTORY', '6'));
  const limit = Number.isFinite(max) ? max : 6;

  return h
    .slice(-limit)
    .map(x => ({
      role: x && x.role === 'assistant' ? 'assistant' : 'user',
      content: String((x && x.content) || '').slice(0, 2500)
    }))
    .filter(x => x.content.trim());
}

function buildMessages(msg, opt = {}) {
  const memoryContext = allogicCombinedContext(opt);
  const systemText = buildAllogicSystemPrompt(memoryContext);

  return [
    {
      role: 'system',
      content: systemText
    },
    ...history(opt.history),
    {
      role: 'user',
      content: String(msg || '')
    }
  ];
}


async function openaiCompat(provider, msg, opt = {}) {
  let key = '';
  let base = '';
  let model = opt.model;

  if (provider === 'openrouter') {
    key = env('OPENROUTER_API_KEY');
    base = env('OPENROUTER_API_BASE', 'https://openrouter.ai/api/v1');
    model = model || env('OPENROUTER_MODEL');
  }

  if (provider === 'nvidia') {
    key = env('NVIDIA_API_KEY');
    base = env('NVIDIA_API_BASE', 'https://integrate.api.nvidia.com/v1');
    model = model || env('NVIDIA_MODEL');
  }

  if (!good(key)) {
    const e = new Error(provider + ' API key belum diisi');
    e.status = 401;
    throw e;
  }

  if (!good(model)) {
    const e = new Error(provider + ' model belum diisi');
    e.status = 400;
    throw e;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + key
  };

  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = env(
      'OPENROUTER_SITE_URL',
      'https://github.com/fajarsecid/Allogic-AI-BOT'
    );
    headers['X-Title'] = env('OPENROUTER_APP_NAME', 'Allogic AI BOT');
  }

  const res = await fetchFn(base.replace(/\/$/, '') + '/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: buildMessages(msg, opt),
      temperature: Number(env('AI_TEMPERATURE', '0.22')),
      top_p: 0.86,
      max_tokens: Number(env('AI_MAX_OUTPUT_TOKENS', '1200'))
    })
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const e = new Error(
      data && data.error && data.error.message
        ? data.error.message
        : provider + ' API error ' + res.status
    );
    e.status = res.status;
    throw e;
  }

  const text =
    data &&
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content
      ? data.choices[0].message.content.trim()
      : '';

  if (!text) {
    const e = new Error(provider + ' tidak mengembalikan teks');
    e.status = 502;
    throw e;
  }

  if (typeof baseAI.trimForWhatsApp === 'function') {
    return baseAI.trimForWhatsApp(text, msg, opt.maxLength || 3900);
  }

  return text.slice(0, opt.maxLength || 3900);
}


function withMemoryContext(msg, opt = {}) {
  const memoryContext = allogicCombinedContext(opt);
  if (!memoryContext) return msg;

  return [
    'KONTEKS MEMORY KHUSUS USER INI:',
    memoryContext,
    '',
    'Gunakan memory di atas untuk menjawab pertanyaan user ini.',
    'Jangan bilang kamu tidak punya memory kalau memory tersedia.',
    '',
    'PERTANYAAN USER:',
    String(msg || '')
  ].join('\n');
}






function allogicCombinedContext(opt = {}) {
  const memoryContext = typeof memoryAI !== 'undefined'
    ? memoryAI.getMemoryContext(opt.memoryScope || {})
    : '';

  const webContext = opt.webContext || '';

  return [
    memoryContext || '',
    webContext || ''
  ].filter(Boolean).join('\n\n');
}



function allogicRouterInstruction(msg, opt = {}) {
  const context = allogicCombinedContext(opt);
  const systemText = buildAllogicSystemPrompt(context);

  const localFacts = [];

  const lower = String(msg || '').toLowerCase();

  if (lower.includes('claude')) {
    localFacts.push(
      'FAKTA WAJIB: Claude AI dikembangkan oleh Anthropic, bukan Google. Jika user meminta berita terbaru dan web search tidak memberi hasil kuat, jangan mengarang berita terbaru.'
    );
  }

  if (/\brag\b/i.test(String(msg || ''))) {
    localFacts.push(
      'FAKTA WAJIB: Dalam konteks AI/bot/memory/knowledge base, RAG berarti Retrieval-Augmented Generation.'
    );
  }

  return [
    systemText,
    localFacts.length ? localFacts.join('\n') : '',
    '',
    'PERTANYAAN USER:',
    String(msg || '')
  ].filter(Boolean).join('\n\n');
}


async function tryProvider(provider, msg, opt = {}, heavy = false) {
  const modelList = typeof modelsFor === 'function'
    ? modelsFor(provider, heavy, opt)
    : (typeof models === 'function' ? models(provider, heavy, opt) : []);

  const errors = [];

  if (!modelList.length) {
    throw new Error(provider + ': tidak ada model dikonfigurasi');
  }

  for (const model of modelList) {
    try {
      console.log('🤖 Allogic Model Try: provider=' + provider + ' model=' + model);

      const next = Object.assign({}, opt, {
        model,
        noLocal: true
      });

      const promptMsg = typeof allogicRouterInstruction === 'function'
        ? allogicRouterInstruction(msg, next)
        : msg;

      if (provider === 'google') {
        if (!baseAI.askGoogle) throw new Error('askGoogle tidak tersedia');
        return await baseAI.askGoogle(promptMsg, next);
      }

      if (provider === 'groq') {
        if (!baseAI.askGroq) throw new Error('askGroq tidak tersedia');
        return await baseAI.askGroq(promptMsg, next);
      }

      if (provider === 'openrouter') {
        if (typeof openaiCompat === 'function') {
          return await openaiCompat('openrouter', msg, next);
        }
        if (typeof askOpenAICompatible === 'function') {
          return await askOpenAICompatible('openrouter', msg, next);
        }
        throw new Error('openrouter handler tidak tersedia');
      }

      if (provider === 'nvidia') {
        if (typeof openaiCompat === 'function') {
          return await openaiCompat('nvidia', msg, next);
        }
        if (typeof askOpenAICompatible === 'function') {
          return await askOpenAICompatible('nvidia', msg, next);
        }
        throw new Error('nvidia handler tidak tersedia');
      }

      throw new Error('Provider tidak dikenal: ' + provider);
    } catch (e) {
      const detail = provider + '/' + model + ': ' + e.message;
      errors.push(detail);
      console.log('⚠️ Allogic Model Failed: ' + detail);

      if (typeof retryable === 'function') {
        if (!retryable(e)) break;
      }
    }
  }

  throw new Error(errors.join(' | '));
}



function normalizeAmbiguousTerms(msg = '', opt = {}) {
  let text = String(msg || '');
  const lower = text.toLowerCase();

  const hist = Array.isArray(opt.history)
    ? opt.history.map(x => String(x.content || '')).join('\n').toLowerCase()
    : '';

  const combined = lower + '\n' + hist;

  const aiContext =
    combined.includes('ai') ||
    combined.includes('bot') ||
    combined.includes('memory') ||
    combined.includes('memori') ||
    combined.includes('knowledge') ||
    combined.includes('database') ||
    combined.includes('retrieval') ||
    combined.includes('embedding') ||
    combined.includes('vector') ||
    combined.includes('dokumen') ||
    combined.includes('flow teknis');

  const marketingContext =
    combined.includes('iklan') ||
    combined.includes('ads') ||
    combined.includes('marketing') ||
    combined.includes('campaign') ||
    combined.includes('roas') ||
    combined.includes('biaya iklan') ||
    combined.includes('laba iklan');

  if (/\bRAG\b/i.test(text) && aiContext && !marketingContext) {
    text += '\\n\\nCatatan konteks wajib: Dalam konteks percakapan ini, RAG berarti Retrieval-Augmented Generation untuk AI/bot/knowledge base. Jangan jawab RAG sebagai Return on Ad Spend atau Relevance Accuracy Generality.';
  }

  return text;
}



function allogicHardLocalReply(msg = '') {
  const text = String(msg || '').toLowerCase();

  if (!text.includes('claude')) return null;

  const asksNews =
    text.includes('berita') ||
    text.includes('terbaru') ||
    text.includes('update') ||
    text.includes('cari') ||
    text.includes('internet') ||
    text.includes('web');

  const asksBasic =
    text.includes('apa itu') ||
    text.includes('siapa') ||
    text.includes('dibuat') ||
    text.includes('dikembangkan') ||
    text.includes('pembuat') ||
    text.includes('buatan');

  if (asksNews) {
    return [
      'Claude AI dikembangkan oleh Anthropic, bukan Google.',
      '',
      'Untuk berita terbaru tentang Claude AI, web search ringan bisa saja tidak menemukan hasil yang cukup. Jadi saya tidak akan mengarang berita terbaru.',
      '',
      'Info umum yang aman: Claude adalah asisten AI / keluarga model AI dari Anthropic yang bisa dipakai untuk chat, coding, analisis, penulisan, ringkasan, dan problem solving.'
    ].join('\n');
  }

  if (asksBasic) {
    return 'Claude AI adalah asisten AI / keluarga model AI yang dikembangkan oleh Anthropic, bukan Google. Claude dapat membantu chat, menulis, coding, analisis, ringkasan, dan problem solving.';
  }

  return null;
}



function allogicMetaLocalReply(msg = '') {
  const text = String(msg || '')
    .replace(/^\s*(\.ai|\.ask|\.gpt|\.gemini|\.groq|\.allogic)\s*/i, '')
    .toLowerCase()
    .trim();

  if (
    text.includes('belajar sendiri') ||
    text.includes('meningkatkan diri sendiri') ||
    text.includes('bisa belajar') ||
    text.includes('kemampuan kamu')
  ) {
    return [
      'Bisa, tapi dalam batas yang realistis.',
      '',
      'Saya tidak benar-benar melatih ulang model AI sendiri seperti manusia. Tapi saya bisa dibuat “terasa belajar” dengan fitur seperti:',
      '',
      '1. Short-term context: mengingat alur chat beberapa pesan terakhir.',
      '2. Memory per user: menyimpan hal penting seperti nama, preferensi, atau target belajar.',
      '3. Feedback learning: menyimpan koreksi dari user/owner.',
      '4. Knowledge base/RAG: membaca data dari dokumen, database, atau web search.',
      '',
      'Jadi saya bisa meningkatkan jawaban dari memory dan knowledge yang tersedia, tapi bukan training ulang model secara permanen.'
    ].join('\n');
  }

  return null;
}


async function askAllogicAI(msg, opt = {}) {
  // ALLOGIC_SECURITY_GUARD_LOCAL
  const securityReply = securityGuard.safeReply(msg);
  if (securityReply) return securityReply;

  // ALLOGIC_META_LOCAL_REPLY
  const metaReply = allogicMetaLocalReply(msg);
  if (metaReply) return metaReply;

  if (securityGuard.shouldForceGoogle(msg) && (!opt.provider || opt.provider === 'auto')) {
    opt = Object.assign({}, opt, { provider: 'google' });
  }

  // ALLOGIC_MEMORY_COMMAND_HANDLER
  const memoryReply = memoryAI.handleMemoryCommand(msg, opt.memoryScope || {});
  if (memoryReply) return memoryReply;

  // ALLOGIC_CLAUDE_LOCAL_FACT_HANDLER
  const hardLocalReply = allogicHardLocalReply(msg);
  if (hardLocalReply) return hardLocalReply;

  // ALLOGIC_SHORT_HISTORY_ATTACH
  const shortHistory = historyAI.getHistory(opt.memoryScope || {});
  opt = Object.assign({}, opt, {
    history: [
      ...shortHistory,
      ...(Array.isArray(opt.history) ? opt.history : [])
    ]
  });

// ALLOGIC_WEB_SEARCH_ATTACH
  if (!opt.webContext && webSearchAI.shouldUseWebSearch(msg)) {
    try {
      const webContext = await webSearchAI.buildWebContext(msg);
      if (webContext) {
        opt = Object.assign({}, opt, { webContext });
        console.log('🌐 Allogic Web Search: attached');
      } else {
        console.log('🌐 Allogic Web Search: no result');
      }
    } catch (e) {
      console.log('⚠️ Allogic Web Search Failed: ' + e.message);
    }
  }

  msg = normalizeAmbiguousTerms(msg, opt);

  const heavy = isHeavy(msg, opt);
  const ord = providerOrder(
    opt.provider || env('ALLOGIC_AI_PROVIDER', 'auto'),
    heavy
  );

  const errors = [];

  console.log(
    '🤖 Allogic AI Router V4: type=' +
      (heavy ? 'heavy' : 'light') +
      ' order=' +
      ord.join('>')
  );

  for (const p of ord) {
    try {
      const answer = await tryProvider(p, msg, opt, heavy);
      historyAI.saveTurn(opt.memoryScope || {}, msg, answer);
      return answer;
    } catch (e) {
      errors.push(p + ': ' + e.message);
      console.log('⚠️ Allogic Provider Failed: ' + p + ': ' + e.message);
    }
  }

  throw new Error(errors.join(' | ') || 'AI provider tidak tersedia');
}

module.exports = {
  askAllogicAI,
  askOpenRouter: (msg, opt = {}) => openaiCompat('openrouter', msg, opt),
  askNvidia: (msg, opt = {}) => openaiCompat('nvidia', msg, opt)
};
