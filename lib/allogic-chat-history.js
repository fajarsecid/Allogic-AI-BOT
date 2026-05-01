const fs = require('fs');
const path = require('path');

const BASE = path.join(process.cwd(), 'data', 'memory', 'history');

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

function fileFor(scope = {}) {
  const user = cleanId(scope.userId || scope.sender || scope.senderNum || '');
  const chat = cleanId(scope.chatId || scope.groupId || '');

  if (!user) return null;

  if (scope.isGroup && chat) {
    return path.join(BASE, 'groups', chat + '__' + user + '.json');
  }

  return path.join(BASE, 'users', user + '.json');
}

function load(scope = {}) {
  const file = fileFor(scope);
  if (!file) return [];

  try {
    mkdir(path.dirname(file));

    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify([], null, 2));
    }

    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    if (!Array.isArray(data)) return [];

    const now = Date.now();
    const ttlMs = 1000 * 60 * 60 * 12;

    return data.filter(x => {
      const t = new Date(x.createdAt || 0).getTime();
      return Number.isFinite(t) && now - t < ttlMs;
    });
  } catch {
    return [];
  }
}

function save(scope = {}, history = []) {
  const file = fileFor(scope);
  if (!file) return false;

  mkdir(path.dirname(file));

  const max = Number(process.env.AI_SHORT_HISTORY_TURNS || 10);
  const limit = Number.isFinite(max) ? max : 10;

  const clean = history
    .slice(-limit)
    .map(x => ({
      role: x.role === 'assistant' ? 'assistant' : 'user',
      content: String(x.content || '').slice(0, 1800),
      createdAt: x.createdAt || new Date().toISOString()
    }))
    .filter(x => x.content.trim());

  fs.writeFileSync(file, JSON.stringify(clean, null, 2));
  return true;
}

function getHistory(scope = {}) {
  return load(scope).map(x => ({
    role: x.role === 'assistant' ? 'assistant' : 'user',
    content: String(x.content || '').slice(0, 1800)
  }));
}

function saveTurn(scope = {}, userText = '', assistantText = '') {
  const file = fileFor(scope);
  if (!file) return false;

  const hist = load(scope);

  if (String(userText || '').trim()) {
    hist.push({
      role: 'user',
      content: String(userText || '').slice(0, 1800),
      createdAt: new Date().toISOString()
    });
  }

  if (String(assistantText || '').trim()) {
    hist.push({
      role: 'assistant',
      content: String(assistantText || '').slice(0, 1800),
      createdAt: new Date().toISOString()
    });
  }

  return save(scope, hist);
}

function clearHistory(scope = {}) {
  const file = fileFor(scope);
  if (!file) return false;

  mkdir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify([], null, 2));
  return true;
}

module.exports = {
  getHistory,
  saveTurn,
  clearHistory
};
