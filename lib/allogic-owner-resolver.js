const fs = require('fs');
const path = require('path');

function onlyNum(x = '') {
  return String(x || '').split('@')[0].split(':')[0].replace(/\D/g, '');
}

function readEnvOwners() {
  const nums = new Set();

  try {
    const envPath = path.join(process.cwd(), '.env');
    const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    for (const key of ['OWNER_NUMBER', 'OWNER_NUMBERS', 'OWNER', 'OWNERS', 'SUDO', 'SUDO_USERS']) {
      const m = env.match(new RegExp('^' + key + '\\s*=\\s*(.+)$', 'm'));
      if (!m) continue;

      String(m[1]).split(/[,;\s]+/).forEach(v => {
        const n = onlyNum(v);
        if (n) nums.add(n);
      });
    }
  } catch {}

  [
    global.owner,
    global.owners,
    global.ownerNumber,
    global.ownernumber,
    global.owner_number,
    global.sudo,
    global.sudoUsers
  ].forEach(v => {
    if (Array.isArray(v)) {
      v.forEach(x => {
        const n = onlyNum(x);
        if (n) nums.add(n);
      });
    } else {
      String(v || '').split(/[,;\s]+/).forEach(x => {
        const n = onlyNum(x);
        if (n) nums.add(n);
      });
    }
  });

  return [...nums];
}

async function learnOwnerLid() {
  return false;
}

function isOwnerByNumberOrCachedLid(sender) {
  const n = onlyNum(sender);
  return readEnvOwners().includes(n);
}

module.exports = {
  onlyNum,
  readEnvOwners,
  learnOwnerLid,
  isOwnerByNumberOrCachedLid
};
