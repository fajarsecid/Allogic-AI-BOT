const fs = require('fs');
const path = require('path');

function loadEnvFile() {
    try {
        const envPath = path.join(process.cwd(), '.env');
        if (!fs.existsSync(envPath)) return;

        const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

        for (const line of lines) {
            const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
            if (!m) continue;

            const key = m[1];
            let value = m[2].trim();

            value = value.replace(/^['"]|['"]$/g, '');

            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
    } catch (err) {
        console.log('[ENV LOAD ERROR]', err?.message || err);
    }
}

loadEnvFile();



const ADMIN_COMMANDS = new Set([
    'antilink',
    'antitag',
    'antibadword',
    'chatbot',
    'welcome',
    'goodbye',
    'promote',
    'demote',
    'kick',
    'mute',
    'unmute',
    'tagall',
    'hidetag',
    'tagnotadmin',
    'setgpp',
    'setgname',
    'setgdesc',
    'resetlink',
    'groupinfo',
    'groupmanage',
    'staff',
    'delete',
    'warn',
    'warnings',
    'ban',
    'unban',
    'clear',
    'topmembers'
]);

const OWNER_COMMANDS = new Set([
    'autoread',
    'autotyping',
    'autostatus',
    'autoreact',
    'anticall',
    'antidelete',
    'pmblocker',
    'clearsession',
    'cleartmp',
    'update',
    'settings',
    'setpp',
    'sudo',
    'pair',
    'owner',
    'mode'
]);

const NEEDS_BOT_ADMIN = new Set([
    'promote',
    'demote',
    'kick',
    'mute',
    'unmute',
    'setgpp',
    'setgname',
    'setgdesc',
    'resetlink',
    'delete'
]);

function norm(s = '') {
    return String(s)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}@:+./\s_-]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function removeAiPrefix(text = '') {
    return String(text || '')
        .replace(/^(\.ai|\.ask|\.gpt|\.gemini|\.groq|\.allogic)\s*/i, '')
        .trim();
}

function commandExists(cmd) {
    return fs.existsSync(path.join(process.cwd(), 'commands', `${cmd}.js`));
}

function make(cmd, args = '') {
    return `.${cmd}${args ? ' ' + String(args).trim() : ''}`.trim();
}

function readDotEnv() {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return {};

    const out = {};
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

    for (const line of lines) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/i);
        if (!m) continue;

        const key = m[1];
        let value = m[2];

        value = value.replace(/^['"]|['"]$/g, '');
        out[key] = value;
    }

    return out;
}

function getGroqApiKey() {
    const envFile = readDotEnv();

    return (
        process.env.GROQ_API_KEY ||
        process.env.GROQ_APIKEY ||
        process.env.GROQ_KEY ||
        envFile.GROQ_API_KEY ||
        envFile.GROQ_APIKEY ||
        envFile.GROQ_KEY ||
        global.groq_api_key ||
        global.groqApiKey ||
        ''
    );
}

function getPlannerModel() {
    const envFile = readDotEnv();

    return (
        process.env.ALLOGIC_PLANNER_MODEL ||
        envFile.ALLOGIC_PLANNER_MODEL ||
        'llama-3.3-70b-versatile'
    );
}

function jidToNumber(jid = '') {
    return String(jid)
        .split('@')[0]
        .split(':')[0]
        .replace(/\D/g, '');
}

function collectNumbers(value) {
    const text = Array.isArray(value) ? value.join(',') : String(value || '');
    const nums = text.match(/\d{8,16}/g);
    return nums ? nums.map(x => x.replace(/\D/g, '')) : [];
}


function isMessageFromMeOwner(message = {}) {
    return Boolean(message?.key?.fromMe);
}

function getOwnerNumbers() {
    const nums = new Set();

    function loadModule(name) {
        try {
            return require(path.join(process.cwd(), name));
        } catch {
            return {};
        }
    }

    const settings = loadModule('settings.js');
    const config = loadModule('config.js');

    [
        global.owner,
        global.owners,
        global.ownerNumber,
        global.ownernumber,
        global.owner_number,

        settings.owner,
        settings.owners,
        settings.ownerNumber,
        settings.ownernumber,
        settings.owner_number,
        settings.OWNER,
        settings.OWNER_NUMBER,

        config.owner,
        config.owners,
        config.ownerNumber,
        config.ownernumber,
        config.owner_number,
        config.OWNER,
        config.OWNER_NUMBER,

        process.env.OWNER,
        process.env.OWNERS,
        process.env.OWNER_NUMBER,
        process.env.OWNER_NUMBERS
    ].forEach(v => {
        for (const n of collectNumbers(v)) nums.add(n);
    });

    return [...nums];
}

function getSenderJid(message = {}, chatId = '') {
    return (
        message?.key?.participant ||
        message?.participant ||
        message?.key?.remoteJid ||
        chatId ||
        ''
    );
}

async function getRole(sock, chatId, message) {
    const senderJid = getSenderJid(message, chatId);
    const senderNum = jidToNumber(senderJid);
    const ownerNums = getOwnerNumbers();

    const isOwner = isMessageFromMeOwner(message) || (ownerNums.includes(senderNum));
    const isGroup = String(chatId || '').endsWith('@g.us');

    let isAdmin = false;
    let isBotAdmin = false;

    if (isGroup && sock?.groupMetadata) {
        try {
            const meta = await sock.groupMetadata(chatId);
            const participants = meta?.participants || [];

            const senderParticipant = participants.find(p => jidToNumber(p.id || p.jid) === senderNum);
            isAdmin = Boolean(senderParticipant?.admin || senderParticipant?.isAdmin || senderParticipant?.isSuperAdmin);

            const botNum = jidToNumber(sock?.user?.id || sock?.user?.jid || '');
            const botParticipant = participants.find(p => jidToNumber(p.id || p.jid) === botNum);
            isBotAdmin = Boolean(botParticipant?.admin || botParticipant?.isAdmin || botParticipant?.isSuperAdmin);
        } catch (err) {
            console.log('[Planner Role Check Error]', err?.message || err);
        }
    }

    // DEBUG_OWNER_CHECK
    console.log('[OWNER CHECK]', {
        senderJid,
        senderNum,
        ownerNums,
        isOwner,
        isAdmin,
        isBotAdmin
    });

    return {
        senderJid,
        senderNum,
        isOwner,
        isGroup,
        isAdmin,
        isBotAdmin
    };
}

function looksLikeAdminOwnerRequest(t = '') {
    const cues = [
        'admin',
        'member',
        'anggota',
        'grup',
        'group',
        'gc',
        'antilink',
        'anti link',
        'antitag',
        'anti tag',
        'badword',
        'kata kasar',
        'chatbot',
        'welcome',
        'goodbye',
        'kick',
        'tendang',
        'keluarin',
        'mute',
        'unmute',
        'tag semua',
        'hidetag',
        'pp grup',
        'pp group',
        'foto profil grup',
        'foto profil group',
        'reset link',
        'link grup',
        'warning',
        'warn',
        'ban',
        'unban',
        'clear session',
        'clear tmp',
        'update bot',
        'settings',
        'autoread',
        'autotyping',
        'autostatus',
        'autoreact',
        'anticall',
        'antidelete',
        'pmblocker',
        'sudo',
        'pair',
        'owner'
    ];

    return cues.some(cue => t.includes(cue));
}

function extractJson(text = '') {
    let out = String(text || '').trim();

    out = out.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();

    const start = out.indexOf('{');
    const end = out.lastIndexOf('}');

    if (start >= 0 && end > start) {
        out = out.slice(start, end + 1);
    }

    return JSON.parse(out);
}

async function callGroqPlanner(userText, role) {
    const apiKey = getGroqApiKey();
    if (!apiKey) return null;

    const model = getPlannerModel();

    const systemPrompt = `
Kamu adalah command planner untuk bot WhatsApp bernama Allogic AI.

Tugasmu HANYA menerjemahkan permintaan user menjadi command bot yang tersedia.
Jangan menjawab user.
Jangan menolak dengan alasan keamanan.
Balas hanya JSON valid tanpa markdown.

Command admin:
antilink, antitag, antibadword, chatbot, welcome, goodbye, promote, demote, kick, mute, unmute, tagall, hidetag, tagnotadmin, setgpp, setgname, setgdesc, resetlink, groupinfo, groupmanage, staff, delete, warn, warnings, ban, unban, clear, topmembers

Command owner:
autoread, autotyping, autostatus, autoreact, anticall, antidelete, pmblocker, clearsession, cleartmp, update, settings, setpp, sudo, pair, owner

Makna penting:
- menaikkan seseorang jadi admin, jadikan admin, adminin, kasih admin => promote
- mencabut admin, copot admin, jadikan member, jadikan anggota biasa, turunkan admin => demote
- tendang, keluarkan, usir dari grup => kick
- tutup grup, hanya admin yang bisa chat => mute
- buka grup, semua member bisa chat => unmute
- tag semua, panggil semua, mention all => tagall
- lihat admin, daftar admin, siapa admin => staff
- ganti PP/foto/logo/icon grup => setgpp
- ganti nama grup => setgname
- ganti deskripsi grup => setgdesc
- reset link grup => resetlink
- lihat warning, cek warning, jumlah warning => warnings
- kasih warning, beri peringatan => warn
- bersihkan chat => clear
- bersihkan session => clearsession
- bersihkan tmp/cache/sampah bot => cleartmp
- update/perbarui bot => update
- ganti PP/foto profil bot => setpp
- mode publik, mode public, aktifkan mode publik, ubah dari private ke public => mode public
- mode private, mode privat, ubah dari public ke private, bot khusus owner => mode private

Untuk on/off:
- hidupkan, aktifkan, nyalakan, enable, on => args "on"
- matikan, nonaktifkan, disable, off, stop => args "off"

Aturan:
- Kalau bukan command admin/owner, should_execute false.
- Jangan pilih promote kalau maksud user adalah copot/cabut/turunkan admin.
- Jangan pilih warn kalau maksud user hanya melihat warning.
- Ambil mention/nomor sebagai args jika ada.
- Kalau tidak yakin, should_execute false.

Format JSON:
{
  "should_execute": true,
  "command": "nama_command",
  "args": "argumen jika ada",
  "menu": "admin/owner/none",
  "confidence": 0.0
}
`.trim();

    const payload = {
        model,
        temperature: 0,
        max_tokens: 180,
        messages: [
            { role: 'system', content: systemPrompt },
            {
                role: 'user',
                content: JSON.stringify({
                    text: userText,
                    role
                })
            }
        ]
    };

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.log('[Planner API Error]', res.status, errText.slice(0, 300));
        return null;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || '';

    return extractJson(content);
}

function normalizePlan(plan) {
    if (!plan || typeof plan !== 'object') return null;

    const command = String(plan.command || '').toLowerCase().replace(/^\./, '').trim();
    const args = String(plan.args || '').trim();
    const confidence = Number(plan.confidence || 0);

    if (!plan.should_execute) return null;
    if (!command) return null;
    if (confidence < 0.65) return null;

    let menu = 'none';

    if (ADMIN_COMMANDS.has(command)) menu = 'admin';
    if (OWNER_COMMANDS.has(command)) menu = 'owner';

    if (menu === 'none') return null;

    return { command, args, confidence, menu };
}

function validatePermission(plan, role) {
    if (!plan) return { ok: false };

    if (plan.menu === 'owner' && !role.isOwner) {
        return {
            ok: false,
            blocked: true,
            message: '❌ Command ini khusus owner.'
        };
    }

    if (plan.menu === 'admin') {
        if (!role.isGroup) {
            return {
                ok: false,
                blocked: true,
                message: '❌ Command admin hanya bisa dipakai di grup.'
            };
        }

        if (!role.isOwner && !role.isAdmin) {
            return {
                ok: false,
                blocked: true,
                message: '❌ Command ini khusus admin grup atau owner.'
            };
        }

        if (NEEDS_BOT_ADMIN.has(plan.command) && !role.isBotAdmin) {
            return {
                ok: false,
                blocked: true,
                message: '❌ Bot harus jadi admin grup dulu untuk menjalankan command ini.'
            };
        }
    }

    return { ok: true };
}

async function planAdminOwnerCommand({ sock, chatId, message, userText }) {
    try {
        const raw = String(userText || '').trim();

        if (!/^(\.ai|\.ask|\.gpt|\.gemini|\.groq|\.allogic)(\s|$)/i.test(raw)) {
            return null;
        }

        const original = removeAiPrefix(raw);
        const t = norm(original);

        if (!t) return null;
        if (!looksLikeAdminOwnerRequest(t)) return null;

        const role = await getRole(sock, chatId, message);
        const rawPlan = await callGroqPlanner(original, role);

        const plan = normalizePlan(rawPlan);
        if (!plan) return null;

        if (!commandExists(plan.command)) {
            return null;
        }

        const permission = validatePermission(plan, role);

        if (!permission.ok) {
            if (permission.blocked) {
                return {
                    execute: false,
                    blocked: true,
                    message: permission.message
                };
            }

            return null;
        }

        return {
            execute: true,
            command: plan.command,
            args: plan.args,
            commandText: make(plan.command, plan.args),
            plan
        };
    } catch (err) {
        console.log('[Allogic Command Planner Error]', err?.message || err);
        return null;
    }
}

module.exports = {
    planAdminOwnerCommand,
    ADMIN_COMMANDS,
    OWNER_COMMANDS
};
