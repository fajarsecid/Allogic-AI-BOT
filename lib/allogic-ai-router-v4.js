const baseAI = require('./allogic-ai');
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

  if ([400, 404, 408, 409, 429, 500, 502, 503, 504].includes(st)) {
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
  return [
    {
      role: 'system',
      content: 'Kamu adalah Allogic AI BOT. Jawab dalam bahasa user. Jawab jelas, rapi, dan cocok untuk WhatsApp.'
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

async function tryProvider(provider, msg, opt = {}, heavy = false) {
  const ms = modelsFor(provider, heavy, opt);
  const errors = [];

  if (!ms.length) {
    throw new Error(provider + ': tidak ada model dikonfigurasi');
  }

  for (const model of ms) {
    try {
      console.log('🤖 Allogic Model Try: provider=' + provider + ' model=' + model);

      const next = Object.assign({}, opt, {
        model,
        noLocal: true
      });

      if (provider === 'google') {
        return await baseAI.askGoogle(msg, next);
      }

      if (provider === 'groq') {
        return await baseAI.askGroq(msg, next);
      }

      if (provider === 'openrouter') {
        return await openaiCompat('openrouter', msg, next);
      }

      if (provider === 'nvidia') {
        return await openaiCompat('nvidia', msg, next);
      }

      throw new Error('Provider tidak dikenal: ' + provider);
    } catch (e) {
      const detail = provider + '/' + model + ': ' + e.message;
      errors.push(detail);
      console.log('⚠️ Allogic Model Failed: ' + detail);

      if (!retryable(e)) break;
    }
  }

  throw new Error(errors.join(' | '));
}

async function askAllogicAI(msg, opt = {}) {
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
      return await tryProvider(p, msg, opt, heavy);
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
