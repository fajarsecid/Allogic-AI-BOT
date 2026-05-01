const fs = require('fs');
const path = require('path');

const BASE = path.join(process.cwd(), 'data', 'memory');

function mkdir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function cleanId(v) {
  v = String(v || '').split('@')[0];
  let out = '';

  for (const ch of v) {
    if (
      (ch >= 'a' && ch <= 'z') ||
      (ch >= 'A' && ch <= 'Z') ||
      (ch >= '0' && ch <= '9') ||
      ch === '_' ||
      ch === '-'
    ) {
      out += ch;
    } else {
      out += '_';
    }
  }

  return out.slice(0, 80);
}

function stripAi(text) {
  text = String(text || '').trim();

  const prefixes = ['.ai', '.ask', '.gpt', '.gemini', '.groq', '.allogic'];

  for (const p of prefixes) {
    if (text.toLowerCase().startsWith(p + ' ')) {
      return text.slice(p.length).trim();
    }

    if (text.toLowerCase() === p) {
      return '';
    }
  }

  return text;
}

function fileFor(scope = {}) {
  const user = cleanId(scope.userId || scope.sender || scope.senderNum || '');
  const chat = cleanId(scope.chatId || scope.groupId || '');

  if (!user) return null;

  if (scope.ownerOnly) {
    return path.join(BASE, 'owner', 'owner.json');
  }

  if (scope.isGroup && chat) {
    return path.join(BASE, 'groups', chat + '__' + user + '.json');
  }

  return path.join(BASE, 'users', user + '.json');
}

function emptyData() {
  return {
    memories: [],
    rules: [],
    corrections: []
  };
}

function loadMemory(scope = {}) {
  const file = fileFor(scope);
  if (!file) return null;

  try {
    mkdir(path.dirname(file));

    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(emptyData(), null, 2));
    }

    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    return {
      memories: Array.isArray(data.memories) ? data.memories : [],
      rules: Array.isArray(data.rules) ? data.rules : [],
      corrections: Array.isArray(data.corrections) ? data.corrections : []
    };
  } catch {
    return emptyData();
  }
}

function saveMemory(scope = {}, data = emptyData()) {
  const file = fileFor(scope);
  if (!file) return false;

  mkdir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return true;
}

function addItem(scope = {}, type = 'memories', text = '') {
  const data = loadMemory(scope);
  if (!data) return false;

  text = String(text || '').trim();
  if (!text) return false;

  if (!Array.isArray(data[type])) data[type] = [];

  const exists = data[type].some(x => {
    return String(x.text || '').toLowerCase() === text.toLowerCase();
  });

  if (!exists) {
    data[type].push({
      text,
      createdAt: new Date().toISOString()
    });
  }

  return saveMemory(scope, data);
}

function forgetItem(scope = {}, keyword = '') {
  const data = loadMemory(scope);
  if (!data) return 0;

  keyword = String(keyword || '').toLowerCase().trim();
  if (!keyword) return 0;

  let removed = 0;

  for (const type of ['memories', 'rules', 'corrections']) {
    const before = data[type].length;

    data[type] = data[type].filter(x => {
      return !String(x.text || '').toLowerCase().includes(keyword);
    });

    removed += before - data[type].length;
  }

  saveMemory(scope, data);
  return removed;
}

function listMemory(scope = {}) {
  const data = loadMemory(scope);

  if (!data) {
    return '⚠️ Memory belum aktif untuk user ini.';
  }

  const memories = data.memories || [];
  const rules = data.rules || [];
  const corrections = data.corrections || [];

  if (!memories.length && !rules.length && !corrections.length) {
    return 'Saya belum menyimpan memory apa pun untuk kamu.';
  }

  let out = '🧠 Memory kamu:\n\n';

  if (memories.length) {
    out += '📌 Hal yang diingat:\n';
    memories.slice(-15).forEach((m, i) => {
      out += `${i + 1}. ${m.text}\n`;
    });
    out += '\n';
  }

  if (rules.length) {
    out += '📏 Rule khusus:\n';
    rules.slice(-15).forEach((r, i) => {
      out += `${i + 1}. ${r.text}\n`;
    });
    out += '\n';
  }

  if (corrections.length) {
    out += '✅ Koreksi:\n';
    corrections.slice(-15).forEach((c, i) => {
      out += `${i + 1}. ${c.text}\n`;
    });
  }

  return out.trim();
}

function afterColonOrPhrase(text, phrase) {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(phrase.toLowerCase());

  if (idx < 0) return '';

  let rest = text.slice(idx + phrase.length).trim();

  if (rest.startsWith(':')) rest = rest.slice(1).trim();

  return rest;
}

function noScope() {
  return '⚠️ Memory belum aktif karena sender/userId belum dikirim ke memory system.';
}

function handleMemoryCommand(message = '', scope = {}) {
  const text = stripAi(message);
  const lower = text.toLowerCase();

  if (!fileFor(scope)) {
    if (
      lower.startsWith('ingat ') ||
      lower.startsWith('simpan memory') ||
      lower.startsWith('simpan rule') ||
      lower.startsWith('koreksi') ||
      lower.startsWith('lupakan') ||
      lower.includes('memory')
    ) {
      return noScope();
    }

    return null;
  }

  if (lower.startsWith('ingat bahwa ')) {
    const val = text.slice('ingat bahwa '.length).trim();
    return addItem(scope, 'memories', val)
      ? `✅ Saya ingat: ${val}`
      : '❌ Memory kosong, tidak ada yang disimpan.';
  }

  if (lower.startsWith('ingatkan bahwa ')) {
    const val = text.slice('ingatkan bahwa '.length).trim();
    return addItem(scope, 'memories', val)
      ? `✅ Saya ingat: ${val}`
      : '❌ Memory kosong, tidak ada yang disimpan.';
  }

  if (lower.startsWith('simpan memory')) {
    const val = afterColonOrPhrase(text, 'simpan memory');
    return addItem(scope, 'memories', val)
      ? `✅ Memory disimpan: ${val}`
      : '❌ Memory kosong, tidak ada yang disimpan.';
  }

  if (lower.startsWith('simpan rule')) {
    const val = afterColonOrPhrase(text, 'simpan rule');
    return addItem(scope, 'rules', val)
      ? `✅ Rule disimpan: ${val}`
      : '❌ Rule kosong, tidak ada yang disimpan.';
  }

  if (lower.startsWith('koreksi jawaban kamu')) {
    const val = afterColonOrPhrase(text, 'koreksi jawaban kamu');
    return addItem(scope, 'corrections', val)
      ? `✅ Koreksi disimpan: ${val}`
      : '❌ Koreksi kosong, tidak ada yang disimpan.';
  }

  if (lower.startsWith('koreksi')) {
    const val = afterColonOrPhrase(text, 'koreksi');
    return addItem(scope, 'corrections', val)
      ? `✅ Koreksi disimpan: ${val}`
      : '❌ Koreksi kosong, tidak ada yang disimpan.';
  }

  if (lower.startsWith('lupakan ')) {
    const val = text.slice('lupakan '.length).trim();
    const removed = forgetItem(scope, val);

    return removed > 0
      ? `✅ Saya sudah melupakan ${removed} memory/rule/koreksi yang cocok dengan: ${val}`
      : `⚠️ Tidak ada memory yang cocok dengan: ${val}`;
  }

  if (
    lower.startsWith('apa yang kamu ingat') ||
    lower.startsWith('memory kamu') ||
    lower.startsWith('lihat memory') ||
    lower.startsWith('daftar memory')
  ) {
    return listMemory(scope);
  }

  return null;
}

function getMemoryContext(scope = {}) {
  const data = loadMemory(scope);
  if (!data) return '';

  const memories = data.memories.slice(-10);
  const rules = data.rules.slice(-10);
  const corrections = data.corrections.slice(-10);

  if (!memories.length && !rules.length && !corrections.length) {
    return '';
  }

  let ctx = 'MEMORY KHUSUS USER INI:\n';

  if (memories.length) {
    ctx += '\nHal yang diingat:\n';
    memories.forEach(x => {
      ctx += '- ' + x.text + '\n';
    });
  }

  if (rules.length) {
    ctx += '\nRule khusus:\n';
    rules.forEach(x => {
      ctx += '- ' + x.text + '\n';
    });
  }

  if (corrections.length) {
    ctx += '\nKoreksi yang harus dipatuhi:\n';
    corrections.forEach(x => {
      ctx += '- ' + x.text + '\n';
    });
  }

  ctx += '\nGunakan memory ini hanya untuk user ini. Jangan bocorkan ke user lain.';

  return ctx;
}

module.exports = {
  handleMemoryCommand,
  getMemoryContext,
  loadMemory,
  saveMemory,
  listMemory,
  forgetItem
};

// ALLOGIC_MEMORY_NAME_PATCH
const __oldHandleMemoryCommand = module.exports.handleMemoryCommand;

module.exports.handleMemoryCommand = function(message = '', scope = {}) {
  const text = stripAi(message);
  const lower = text.toLowerCase();

  if (!fileFor(scope)) {
    return __oldHandleMemoryCommand(message, scope);
  }

  if (lower.startsWith('ingat nama saya ')) {
    const name = text.slice('ingat nama saya '.length).trim();
    return addItem(scope, 'memories', 'Nama user adalah ' + name)
      ? '✅ Saya ingat, nama kamu: ' + name
      : '❌ Nama kosong, tidak ada yang disimpan.';
  }

  if (lower.startsWith('nama saya ')) {
    const name = text.slice('nama saya '.length).trim();
    return addItem(scope, 'memories', 'Nama user adalah ' + name)
      ? '✅ Saya ingat, nama kamu: ' + name
      : '❌ Nama kosong, tidak ada yang disimpan.';
  }

  if (
    lower.includes('siapa nama saya') ||
    lower.includes('ingat nama saya') ||
    lower.includes('kamu ingat siapa nama saya')
  ) {
    const data = loadMemory(scope);
    const memories = data && Array.isArray(data.memories) ? data.memories : [];

    const found = memories
      .map(x => String(x.text || ''))
      .find(x => x.toLowerCase().startsWith('nama user adalah '));

    if (found) {
      const name = found.replace(/^Nama user adalah\s+/i, '').trim();
      return 'Nama kamu adalah ' + name + '.';
    }
  }

  return __oldHandleMemoryCommand(message, scope);
};
