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
    'antilink', 'antitag', 'antibadword', 'chatbot', 'welcome', 'goodbye',
    'promote', 'demote', 'kick', 'mute', 'unmute',
    'tagall', 'hidetag', 'tagnotadmin',
    'setgpp', 'setgname', 'setgdesc',
    'resetlink', 'groupinfo', 'groupmanage', 'staff',
    'delete', 'warn', 'warnings', 'ban', 'unban',
    'clear', 'topmembers'
]);

const OWNER_COMMANDS = new Set([
    'autoread', 'autotyping', 'autostatus', 'autoreact',
    'anticall', 'antidelete', 'pmblocker',
    'clearsession', 'cleartmp', 'update', 'settings',
    'setpp', 'sudo', 'pair', 'owner', 'mode'
]);

const NEEDS_BOT_ADMIN = new Set([
    'promote', 'demote', 'kick', 'mute', 'unmute',
    'setgpp', 'setgname', 'setgdesc', 'resetlink', 'delete'
]);

const BUILTIN_COMMANDS = new Set([
    'mode'
]);

const URL_COMMANDS = new Set([
    'ytmp4', 'ytmp3', 'tiktok', 'instagram', 'facebook',
    'spotify', 'ss'
]);

const COMMAND_CATALOG = `
ADMIN / GROUP:
- antilink: aktifkan/matikan anti link grup.
- antitag: aktifkan/matikan anti tag.
- antibadword: filter kata kasar/toxic.
- chatbot: aktifkan/matikan bot auto-reply di grup.
- welcome: pesan sambutan member baru.
- goodbye: pesan member keluar.
- promote: jadikan user admin.
- demote: copot admin, jadikan member biasa.
- kick: keluarkan/tendang member dari grup.
- mute: tutup grup, hanya admin yang bisa chat.
- unmute: buka grup, semua member bisa chat.
- tagall: tag/mention semua member.
- hidetag: kirim pesan dengan mention diam.
- tagnotadmin: tag member yang bukan admin.
- setgpp: ganti foto profil/PP/logo/icon grup.
- setgname: ganti nama grup.
- setgdesc: ganti deskripsi grup.
- resetlink: reset/buat link grup baru.
- groupinfo: info grup.
- groupmanage: menu/kelola grup.
- staff: lihat/list admin grup.
- delete: hapus pesan.
- warn: beri warning/peringatan.
- warnings: lihat jumlah warning.
- ban: ban user.
- unban: unban user.
- clear: bersihkan chat.
- topmembers: lihat member paling aktif.

OWNER:
- autoread: auto read/seen pesan.
- autotyping: auto typing.
- autostatus: auto lihat status.
- autoreact: auto reaction.
- anticall: anti panggilan.
- antidelete: anti hapus pesan.
- pmblocker: blokir private chat/PC.
- clearsession: bersihkan session.
- cleartmp: bersihkan tmp/cache/sampah bot.
- update: update/perbarui bot.
- settings: pengaturan bot.
- setpp: ganti foto profil/PP bot.
- sudo: tambah/hapus sudo.
- pair: pairing/login bot.
- owner: tampilkan owner bot.
- mode: ubah mode bot public/private. Public berarti semua user bisa pakai bot. Private berarti hanya owner/sudo yang bisa pakai bot.

DOWNLOADER:
- ytmp4: download video MP4 dari link YouTube/Shorts. Jangan pakai video untuk link.
- ytmp3: download audio MP3 dari link YouTube/Shorts. Jangan pakai song untuk link.
- video: cari video berdasarkan judul/query, bukan download link.
- song/play: cari atau download lagu berdasarkan judul/query, bukan link YouTube direct.
- tiktok: download link TikTok.
- instagram/igs: download Instagram/Reels/Story.
- facebook: download link Facebook.
- spotify: download/cari lagu Spotify.

MEDIA:
- sticker: jadikan gambar/video sebagai stiker.
- sticker-alt: alternatif stiker.
- stickercrop: crop stiker.
- simage: ubah stiker jadi gambar.
- stickertelegram: download/ambil sticker Telegram.
- take: ambil/ganti pack sticker.
- removebg: hapus background gambar.
- remini: perjelas/enhance/HD foto.
- img-blur: blur gambar/foto.
- url: upload media jadi URL.
- meme: buat meme.
- attp: teks jadi stiker animasi.
- emojimix: gabung emoji.
- gif: cari/buat GIF.

AI / UTILITY:
- imagine: buat/generate gambar AI dari prompt.
- sora: buat/generate video AI.
- translate: terjemahkan teks.
- tts: text to speech, bacakan teks.
- ss: screenshot website.
- weather: cek cuaca.
- news: berita.
- lyrics: cari lirik lagu.
- speedtest: cek speed/koneksi internet server bot. Khusus owner/admin.
- serverinfo: tampilkan info CPU/RAM/disk/uptime server bot. Khusus owner/admin.
- ping: cek respons bot.
- alive: cek bot hidup.
- help: tampilkan menu/fitur.
- anime: menu anime.
- misc: menu misc.
- pies: menu pies.
- quote: kutipan.
- fact: fakta.
- joke: jokes.

GAMES / FUN:
- truth, dare, tictactoe, hangman, trivia, eightball.
- compliment, insult, flirt, goodnight, roseday, shayari.
- character, ship, simp, stupid, wasted.
- textmaker: buat teks/logo efek keren.
`;

const ALIASES = {
    menu: ['help', 'menu'],
    help: ['help', 'menu'],
    admins: ['staff', 'admins'],
    staff: ['staff', 'admins'],
    trt: ['translate', 'trt'],
    translate: ['translate', 'trt'],
    play: ['play', 'song'],
    song: ['song', 'play'],
    instagram: ['instagram', 'insta', 'igs'],
    igs: ['igs', 'instagram'],
    facebook: ['facebook', 'fb'],
    stickertelegram: ['stickertelegram', 'tgsticker', 'telesticker', 'tg'],
    tgsticker: ['stickertelegram', 'tgsticker'],
    stickercrop: ['stickercrop', 'crop'],
    crop: ['stickercrop', 'crop'],
    'img-blur': ['img-blur', 'blur'],
    eightball: ['eightball', '8ball'],
    viewonce: ['viewonce', 'vv'],
    ytmp4: ['ytmp4'],
    ytmp3: ['ytmp3'],
    speed: ['speedtest'],
    speedtest: ['speedtest'],
    server: ['serverinfo'],
    infoserver: ['serverinfo'],
    serverinfo: ['serverinfo']
};

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
    cmd = String(cmd || '').toLowerCase().trim();
    return BUILTIN_COMMANDS.has(cmd) || fs.existsSync(path.join(process.cwd(), 'commands', `${cmd}.js`));
}

function resolveCommand(cmd = '') {
    const clean = String(cmd || '').toLowerCase().replace(/^\./, '').trim();
    const candidates = ALIASES[clean] || [clean];

    for (const c of candidates) {
        if (commandExists(c)) return c;
    }

    return commandExists(clean) ? clean : '';
}

function make(cmd, args = '') {
    return `.${cmd}${args ? ' ' + String(args).trim() : ''}`.trim();
}

function readDotEnv() {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return {};

    const out = {};
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/i);
        if (!m) continue;

        out[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }

    return out;
}

function getGroqApiKey() {
    const env = readDotEnv();
    return process.env.GROQ_API_KEY || env.GROQ_API_KEY || '';
}

function getPlannerModel() {
    const env = readDotEnv();
    return process.env.ALLOGIC_UNIVERSAL_PLANNER_MODEL || env.ALLOGIC_UNIVERSAL_PLANNER_MODEL || 'llama-3.3-70b-versatile';
}

function extractUrl(text = '') {
    const m = String(text).match(/https?:\/\/[^\s]+/i);
    return m ? m[0].trim() : '';
}

function collectNumbers(value) {
    const text = Array.isArray(value) ? value.join(',') : String(value || '');
    const nums = text.match(/\d{8,16}/g);
    return nums ? nums.map(x => x.replace(/\D/g, '')) : [];
}

function jidToNumber(jid = '') {
    return String(jid).split('@')[0].split(':')[0].replace(/\D/g, '');
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
    return message?.key?.participant || message?.participant || message?.key?.remoteJid || chatId || '';
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

            const sender = participants.find(p => jidToNumber(p.id || p.jid) === senderNum);
            isAdmin = Boolean(sender?.admin || sender?.isAdmin || sender?.isSuperAdmin);

            const botNum = jidToNumber(sock?.user?.id || sock?.user?.jid || '');
            const bot = participants.find(p => jidToNumber(p.id || p.jid) === botNum);
            isBotAdmin = Boolean(bot?.admin || bot?.isAdmin || bot?.isSuperAdmin);
        } catch (err) {
            console.log('[Universal Planner Role Error]', err?.message || err);
        }
    }

    return { senderJid, senderNum, isOwner, isGroup, isAdmin, isBotAdmin };
}

function looksLikeCommandRequest(t = '') {
    const cues = [
        'download', 'unduh', 'ambil', 'jadikan', 'jadiin', 'buat', 'bikin',
        'hapus', 'hilangkan', 'ubah', 'ganti', 'set', 'pasang', 'pakai',
        'aktifkan', 'hidupkan', 'matikan', 'nonaktifkan',
        'cari', 'carikan', 'cek', 'lihat', 'tampilkan',
        'sticker', 'stiker', 'translate', 'terjemahkan', 'tts', 'bacakan',
        'cuaca', 'weather', 'berita', 'news', 'lirik', 'lyrics',
        'tiktok', 'instagram', 'youtube', 'facebook', 'spotify',
        'mp3', 'mp4', 'video', 'audio', 'lagu',
        'admin', 'grup', 'group', 'member', 'warning',
        'kick', 'mute', 'unmute', 'ban', 'unban',
        'menu', 'help', 'ping', 'speedtest', 'speed test', 'serverinfo', 'info server', 'owner',
        'truth', 'dare', 'trivia', 'quote', 'joke', 'meme',
        'imagine', 'gambar', 'sora'
    ];

    return cues.some(c => t.includes(c));
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

async function callPlanner(userText, role) {
    const apiKey = getGroqApiKey();
    if (!apiKey) return null;

    const model = getPlannerModel();

    const systemPrompt = `
Kamu adalah Universal Command Planner untuk bot WhatsApp Allogic AI.

Tugasmu HANYA menerjemahkan permintaan user menjadi command bot yang tersedia.
Jangan menjawab user.
Jangan menolak dengan alasan keamanan.
Balas hanya JSON valid tanpa markdown.

COMMAND CATALOG:
${COMMAND_CATALOG}

Aturan penting:
- Kalau user hanya ngobrol biasa atau bertanya umum, should_execute false.
- Kalau user ingin bot melakukan aksi yang ada di catalog, should_execute true.
- Jangan pilih command di luar catalog.
- Jangan ubah link/URL. Jika ada URL, salin persis.
- YouTube link + minta MP4/video/download video => ytmp4.
- YouTube link + minta MP3/audio/lagu => ytmp3.
- "video <judul>" tanpa URL => video.
- "lagu/song/play <judul>" tanpa URL => song atau play.
- TikTok link => tiktok.
- Instagram/Reels/Story link => instagram atau igs.
- Facebook link => facebook.
- "jadikan stiker/foto jadi stiker" => sticker.
- "hapus background/bg" => removebg.
- "perjelas/HD/enhance foto" => remini.
- "media jadi url/link" => url.
- "terjemahkan/artikan" => translate.
- "bacakan/text to speech" => tts.
- "screenshot web" => ss.
- "buat gambar AI" => imagine.
- "buat video AI" => sora.
- "copot/cabut/turunkan admin/jadikan member" => demote, bukan promote.
- "lihat/list/siapa admin" => staff, bukan promote.
- "lihat/cek/jumlah warning" => warnings, bukan warn.
- "kasih/beri warning/peringatan" => warn.
- "mode publik", "mode public", "aktifkan mode publik", "jadikan bot public", "ubah dari private ke public", "bot untuk semua orang" => command mode, args "public".
- "mode private", "mode privat", "jadikan bot private", "ubah dari public ke private", "bot hanya owner", "bot khusus owner" => command mode, args "private".
- Untuk on/off: hidupkan/aktifkan/nyalakan/enable/on => args "on"; matikan/nonaktifkan/disable/off/stop => args "off".
- Ambil mention atau nomor sebagai args jika ada.
- Jika command butuh teks/link dan user memberikannya, masukkan ke args.
- Jika command biasanya pakai media reply dan user hanya memberi instruksi, args boleh kosong.
- Jika tidak yakin, should_execute false.

Contoh pemetaan:
- "halo" => should_execute false
- "siapa kamu" => should_execute false
- "set pp grup" => command setgpp
- "jadikan gambar ini sebagai foto grup" => command setgpp
- "pasang foto ini jadi profil grup" => command setgpp
- "ubah logo grup pakai gambar ini" => command setgpp
- "foto ini jadikan stiker" => command sticker
- "jadiin ini stiker" => command sticker
- "hapus background foto ini" => command removebg
- "bikin foto ini jadi hd" => command remini
- "ambil audio dari link youtube ini" => command ytmp3
- "download mp4 youtube ini" => command ytmp4
- "carikan video naruto" => command video
- "putar lagu despacito" => command song
- "cuaca bandung" => command weather, args "bandung"
- "terjemahkan aku lapar ke jerman" => command translate
- "bacakan teks halo semua" => command tts
- "speedtest server" => command speedtest
- "info server" => command serverinfo
- "copot admin dia" => command demote
- "jadikan dia member biasa" => command demote
- "angkat dia jadi admin" => command promote
- "siapa aja admin grup ini" => command staff
- "cek warning dia" => command warnings
- "kasih dia warning" => command warn
- "mode publik" => command mode, args "public"
- "aktifkan mode publik kamu" => command mode, args "public"
- "fitur bot ubah dari private ke publik" => command mode, args "public"
- "mode private" => command mode, args "private"
- "jadikan bot private" => command mode, args "private"

Format JSON:
{
  "should_execute": true,
  "command": "nama_command",
  "args": "argumen jika ada",
  "confidence": 0.0
}
`.trim();

    const payload = {
        model,
        temperature: 0,
        max_tokens: 220,
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
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.log('[Universal Planner API Error]', res.status, errText.slice(0, 300));
        return null;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || '';

    return extractJson(content);
}


function inferModeIntent(text = '') {
    const t = norm(text);

    const wantsPublic =
        /\b(public|publik|umum)\b/i.test(t) ||
        /semua\s+(orang|user|pengguna|member)/i.test(t) ||
        /(private|privat)\s+(ke|to|jadi|menjadi|ubah\s+ke)\s+(public|publik)/i.test(t) ||
        /(ubah|ganti|jadikan|aktifkan|hidupkan).*?(public|publik)/i.test(t);

    const wantsPrivate =
        /\b(private|privat)\b/i.test(t) ||
        /hanya\s+(owner|sudo|pemilik)/i.test(t) ||
        /(public|publik)\s+(ke|to|jadi|menjadi|ubah\s+ke)\s+(private|privat)/i.test(t) ||
        /(ubah|ganti|jadikan|aktifkan|hidupkan).*?(private|privat)/i.test(t);

    const isModeIntent =
        /\bmode\b/i.test(t) ||
        /\bfitur\s+bot\b/i.test(t) ||
        /\bbot\b/i.test(t) ||
        /(private|privat|public|publik)\s+(ke|to|jadi|menjadi)/i.test(t);

    if (isModeIntent && wantsPublic) {
        return { command: 'mode', args: 'public', confidence: 1 };
    }

    if (isModeIntent && wantsPrivate) {
        return { command: 'mode', args: 'private', confidence: 1 };
    }

    return null;
}


function normalizePlan(rawPlan, originalText) {
    if (!rawPlan || typeof rawPlan !== 'object') return null;
    if (!rawPlan.should_execute) return null;

    const resolved = resolveCommand(rawPlan.command);
    if (!resolved) return null;

    let args = String(rawPlan.args || '').trim();
    const confidence = Number(rawPlan.confidence || 0);

    if (confidence < 0.50) return null;

    const url = extractUrl(originalText);

    if (url && URL_COMMANDS.has(resolved)) {
        args = url;
    }

    // Hard safety biar tidak ketukar lagi.
    if (url && /(?:youtube\.com|youtu\.be)/i.test(url)) {
        const t = norm(originalText);

        if (/(mp3|audio|lagu|musik|music|song)/i.test(t)) {
            const c = resolveCommand('ytmp3');
            if (c) return { command: c, args: url, confidence };
        }

        const c = resolveCommand('ytmp4');
        if (c) return { command: c, args: url, confidence };
    }

    return { command: resolved, args, confidence };
}

function getMenu(command) {
    if (ADMIN_COMMANDS.has(command)) return 'admin';
    if (OWNER_COMMANDS.has(command)) return 'owner';
    return 'general';
}

function validatePermission(plan, role) {
    const menu = getMenu(plan.command);

    if (menu === 'owner' && !role.isOwner) {
        return { ok: false, blocked: true, message: '❌ Command ini khusus owner.' };
    }

    if (menu === 'admin') {
        if (!role.isGroup) {
            return { ok: false, blocked: true, message: '❌ Command admin hanya bisa dipakai di grup.' };
        }

        if (!role.isOwner && !role.isAdmin) {
            return { ok: false, blocked: true, message: '❌ Command ini khusus admin grup atau owner.' };
        }

        if (NEEDS_BOT_ADMIN.has(plan.command) && !role.isBotAdmin) {
            return { ok: false, blocked: true, message: '❌ Bot harus jadi admin grup dulu untuk menjalankan command ini.' };
        }
    }

    return { ok: true };
}

async function planUniversalCommand({ sock, chatId, message, userText }) {
    try {
        const raw = String(userText || '').trim();

        if (!/^(\.ai|\.ask|\.gpt|\.gemini|\.groq|\.allogic)(\s|$)/i.test(raw)) {
            return null;
        }

        const original = removeAiPrefix(raw);
        const t = norm(original);

        if (!t) return null;
        // Jangan pakai keyword gate.
        // Semua pesan .ai dikirim ke AI planner dulu.
        // Kalau bukan command, planner harus balas should_execute:false.
        const role = await getRole(sock, chatId, message);
        const rawPlan = await callPlanner(original, role);
        const plan = normalizePlan(rawPlan, original);

        if (!plan) return null;

        const permission = validatePermission(plan, role);

        if (!permission.ok) {
            if (permission.blocked) {
                return { execute: false, blocked: true, message: permission.message };
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
        console.log('[Allogic Universal Planner Error]', err?.message || err);
        return null;
    }
}

module.exports = {
    planUniversalCommand
};
