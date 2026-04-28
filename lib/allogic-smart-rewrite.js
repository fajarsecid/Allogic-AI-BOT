const fs = require('fs');
const path = require('path');

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

function pickCommand(...names) {
    for (const name of names) {
        if (commandExists(name)) return name;
    }
    return names[0];
}

function make(cmd, arg = '') {
    return `.${cmd}${arg ? ' ' + String(arg).trim() : ''}`.trim();
}

function has(t, patterns) {
    return patterns.some(p => p.test(t));
}

function strip(text, patterns) {
    let out = String(text || '').trim();
    for (const p of patterns) out = out.replace(p, ' ');
    return out.replace(/\s+/g, ' ').replace(/^(jadi|menjadi|ke|to|:|-)\s*/i, '').trim();
}

function wantsOff(t) {
    return has(t, [/matikan/, /mati/, /\boff\b/, /nonaktif/, /disable/, /stop/, /turn off/]);
}

function wantsOn(t) {
    return has(t, [/hidupkan/, /aktifkan/, /nyalakan/, /\bon\b/, /enable/, /start/, /turn on/]);
}

function toggle(cmd, t) {
    if (wantsOff(t)) return make(pickCommand(cmd), 'off');
    if (wantsOn(t)) return make(pickCommand(cmd), 'on');
    return '';
}

function detectAdminOwnerIntent(original, t) {
    // =========================
    // TOGGLE ADMIN / OWNER
    // =========================

    if (has(t, [/anti\s*link/, /antilink/, /blokir link/, /larang link/, /no link/, /link tidak boleh/])) {
        if (wantsOff(t)) return make(pickCommand('antilink'), 'off');
        return make(pickCommand('antilink'), 'on');
    }

    if (has(t, [/anti\s*tag/, /antitag/, /larang tag/, /blokir tag/])) {
        return toggle('antitag', t) || make(pickCommand('antitag'), 'on');
    }

    if (has(t, [/anti\s*bad\s*word/, /antibadword/, /anti badword/, /anti toxic/, /anti kata kasar/, /filter kata kasar/, /blokir kata kasar/])) {
        return toggle('antibadword', t) || make(pickCommand('antibadword'), 'on');
    }

    if (has(t, [/chatbot/, /bot chat/, /ai grup/, /ai group/, /bot balas otomatis/, /auto reply grup/, /auto reply group/])) {
        return toggle('chatbot', t) || make(pickCommand('chatbot'), 'on');
    }

    if (has(t, [/welcome/, /selamat datang/, /pesan masuk/, /sambutan member baru/, /ucapan masuk/])) {
        return toggle('welcome', t) || make(pickCommand('welcome'), 'on');
    }

    if (has(t, [/goodbye/, /pesan keluar/, /ucapan keluar/, /left message/, /member keluar/])) {
        return toggle('goodbye', t) || make(pickCommand('goodbye'), 'on');
    }

    if (has(t, [/autoread/, /auto read/, /baca otomatis/, /auto seen/])) {
        return toggle('autoread', t) || make(pickCommand('autoread'), 'on');
    }

    if (has(t, [/autotyping/, /auto typing/, /mengetik otomatis/, /show typing/])) {
        return toggle('autotyping', t) || make(pickCommand('autotyping'), 'on');
    }

    if (has(t, [/autostatus/, /auto status/, /lihat status otomatis/, /auto view status/])) {
        return toggle('autostatus', t) || make(pickCommand('autostatus'), 'on');
    }

    if (has(t, [/autoreact/, /auto react/, /auto reaction/, /areact/])) {
        return toggle('autoreact', t) || make(pickCommand('autoreact'), 'on');
    }

    if (has(t, [/anticall/, /anti call/, /tolak panggilan/, /blokir panggilan/])) {
        return toggle('anticall', t) || make(pickCommand('anticall'), 'on');
    }

    if (has(t, [/antidelete/, /anti delete/, /lihat pesan dihapus/, /show deleted message/])) {
        return toggle('antidelete', t) || make(pickCommand('antidelete'), 'on');
    }

    if (has(t, [/pmblocker/, /pm blocker/, /blokir pc/, /blokir private chat/, /block private chat/])) {
        return toggle('pmblocker', t) || make(pickCommand('pmblocker'), 'on');
    }

    if (has(t, [/mention on/, /mention off/, /fitur mention/, /auto mention/])) {
        return toggle('mention', t) || make(pickCommand('mention'), 'on');
    }

    // =========================
    // ADMIN GROUP ACTION
    // =========================

    // STAFF_WARNINGS_PRIORITY
    // Harus sebelum promote/warn.
    // "lihat admin grup" => .staff
    // "lihat warning" => .warnings
    if (has(t, [
        /lihat admin/,
        /list admin/,
        /daftar admin/,
        /admin grup/,
        /admin group/,
        /siapa admin/,
        /staff/,
        /admins/
    ])) {
        return make(pickCommand('staff', 'admins'));
    }

    if (has(t, [
        /lihat warning/,
        /jumlah warning/,
        /cek warning/,
        /check warning/,
        /warnings/
    ])) {
        return make(pickCommand('warnings'));
    }
    // END_STAFF_WARNINGS_PRIORITY

    if (has(t, [
        /jadikan .+ admin/,
        /jadiin .+ admin/,
        /buat .+ jadi admin/,
        /angkat .+ admin/,
        /admin(?:kan)? .+/,
        /kasih admin/,
        /beri admin/,
        /promote/
    ])) {
        return make(pickCommand('promote'));
    }

    if (has(t, [
        /turunkan .+ jadi member/,
        /turunkan .+ admin/,
        /cabut .+ admin/,
        /hapus admin/,
        /jadikan .+ member/,
        /jadiin .+ member/,
        /buat .+ jadi member/,
        /buat .+ member/,
        /demote/
    ])) {
        return make(pickCommand('demote'));
    }

    if (has(t, [/kick/, /tendang/, /keluarkan/, /keluarin/, /usir/, /remove member/, /hapus .+ dari grup/, /hapus .+ dari group/])) {
        return make(pickCommand('kick'));
    }

    if (has(t, [/mute grup/, /mute group/, /tutup grup/, /tutup group/, /hanya admin/, /cuma admin yang bisa chat/, /only admin/, /member jangan bisa chat/])) {
        return make(pickCommand('mute'));
    }

    if (has(t, [/unmute grup/, /unmute group/, /buka grup/, /buka group/, /semua bisa chat/, /member bisa chat/, /everyone can chat/])) {
        return make(pickCommand('unmute'));
    }

    if (has(t, [/tag semua/, /tagall/, /mention semua/, /panggil semua/, /tag everyone/, /mention all/])) {
        return make(pickCommand('tagall'));
    }

    if (has(t, [/tagnotadmin/, /tag non admin/, /tag yang bukan admin/, /mention non admin/])) {
        return make(pickCommand('tagnotadmin'));
    }

    if (has(t, [/hidetag/, /hidden tag/, /tag diam/, /mention diam/, /silent tag/])) {
        const arg = strip(original, [/hidetag/ig, /hidden tag/ig, /tag diam/ig, /mention diam/ig, /silent tag/ig]);
        return make(pickCommand('hidetag'), arg);
    }

    if (has(t, [
        /ganti pp grup/,
        /ganti pp group/,
        /ubah pp grup/,
        /ubah pp group/,
        /setgpp/,
        /set group pp/,
        /set grup pp/,
        /sett group pp/,
        /foto profil grup/,
        /foto profil group/,
        /jadikan ini pp grup/,
        /jadikan ini pp group/,
        /logo grup/,
        /logo group/,
        /icon grup/,
        /icon group/,
        /ikon grup/,
        /ikon group/
    ])) {
        return make(pickCommand('setgpp'));
    }

    if (has(t, [/ganti nama grup/, /ganti nama group/, /ubah nama grup/, /ubah nama group/, /rename grup/, /rename group/, /setgname/, /set group name/])) {
        const arg = strip(original, [/ganti nama grup/ig, /ganti nama group/ig, /ubah nama grup/ig, /ubah nama group/ig, /rename grup/ig, /rename group/ig, /setgname/ig, /set group name/ig]);
        return make(pickCommand('setgname'), arg);
    }

    if (has(t, [/ganti deskripsi grup/, /ganti deskripsi group/, /ubah deskripsi grup/, /ubah deskripsi group/, /deskripsi grup/, /deskripsi group/, /setgdesc/, /set group desc/])) {
        const arg = strip(original, [/ganti deskripsi grup/ig, /ganti deskripsi group/ig, /ubah deskripsi grup/ig, /ubah deskripsi group/ig, /deskripsi grup/ig, /deskripsi group/ig, /setgdesc/ig, /set group desc/ig]);
        return make(pickCommand('setgdesc'), arg);
    }

    if (has(t, [/resetlink/, /reset link/, /reset tautan/, /link grup baru/, /link group baru/, /buat link baru/])) {
        return make(pickCommand('resetlink'));
    }

    if (has(t, [/groupinfo/, /info grup/, /info group/, /informasi grup/, /informasi group/, /grup info/, /group info/])) {
        return make(pickCommand('groupinfo'));
    }

    if (has(t, [/groupmanage/, /kelola grup/, /kelola group/, /atur grup/, /atur group/, /manage group/])) {
        return make(pickCommand('groupmanage'));
    }

    if (has(t, [/staff/, /admins/, /list admin/, /daftar admin/, /lihat admin/, /admin grup/, /admin group/, /siapa admin/])) {
        return make(pickCommand('staff', 'admins'));
    }

    if (has(t, [/hapus pesan/, /delete pesan/, /delete message/, /del pesan/])) {
        return make(pickCommand('delete', 'del'));
    }

    if (has(t, [/warn/, /peringatkan/, /kasih warning/, /teguran/, /give warning/])) {
        return make(pickCommand('warn'));
    }

    if (has(t, [/warnings/, /lihat warning/, /jumlah warning/, /cek warning/, /check warnings/])) {
        return make(pickCommand('warnings'));
    }

    if (has(t, [/unban/, /hapus ban/, /buka ban/, /lepas ban/])) {
        return make(pickCommand('unban'));
    }

    if (has(t, [/ban user/, /ban dia/, /blokir user/, /banned user/])) {
        return make(pickCommand('ban'));
    }

    if (has(t, [/clear chat/, /bersihkan chat/, /hapus chat/])) {
        return make(pickCommand('clear'));
    }

    if (has(t, [/topmembers/, /top member/, /member aktif/, /ranking member/])) {
        return make(pickCommand('topmembers'));
    }

    // =========================
    // OWNER ACTION
    // =========================

    if (has(t, [/clearsession/, /clear session/, /hapus session/, /reset session/])) {
        return make(pickCommand('clearsession'));
    }

    if (has(t, [/cleartmp/, /clear tmp/, /hapus tmp/, /hapus cache/, /clear cache/])) {
        return make(pickCommand('cleartmp'));
    }

    if (has(t, [/update bot/, /update script/, /perbarui bot/])) {
        return make(pickCommand('update'));
    }

    if (has(t, [/settings/, /setting bot/, /pengaturan bot/])) {
        return make(pickCommand('settings'));
    }

    if (has(t, [/setpp/, /set pp bot/, /ganti pp bot/, /foto profil bot/])) {
        return make(pickCommand('setpp'));
    }

    if (has(t, [/sudo/, /tambah sudo/, /hapus sudo/, /add sudo/, /remove sudo/])) {
        const arg = strip(original, [/sudo/ig, /tambah sudo/ig, /hapus sudo/ig, /add sudo/ig, /remove sudo/ig]);
        return make(pickCommand('sudo'), arg);
    }

    if (has(t, [/pair/, /pairing/, /kode pairing/, /pairing code/, /login bot/])) {
        return make(pickCommand('pair'));
    }

    if (has(t, [/owner/, /pemilik bot/, /dev bot/, /developer bot/])) {
        return make(pickCommand('owner'));
    }

    return '';
}

function directAdminOwnerCommand(original = '') {
    const allowed = new Set([
        'antibadword', 'antilink', 'antitag',
        'ban', 'unban', 'chatbot', 'clear', 'delete', 'del',
        'demote', 'goodbye', 'groupinfo', 'groupmanage',
        'hidetag', 'kick', 'mention', 'mute', 'unmute',
        'promote', 'resetlink', 'setgpp', 'setgname', 'setgdesc',
        'staff', 'admins', 'tagall', 'tagnotadmin', 'topmembers',
        'warn', 'warnings', 'welcome',
        'anticall', 'antidelete', 'autoread', 'autostatus',
        'autotyping', 'autoreact', 'clearsession', 'cleartmp',
        'owner', 'pair', 'pmblocker', 'setpp', 'settings', 'sudo', 'update'
    ]);

    const q = String(original || '').trim();
    const m = q.match(/^\.?([a-z0-9_-]+)(?:\s+([\s\S]*))?$/i);
    if (!m) return '';

    const cmd = m[1].toLowerCase();
    const arg = (m[2] || '').trim();

    if (!allowed.has(cmd)) return '';
    if (!commandExists(cmd) && !['admins', 'del'].includes(cmd)) return '';

    if (cmd === 'admins') return make(pickCommand('staff', 'admins'), arg);
    if (cmd === 'del') return make(pickCommand('delete', 'del'), arg);

    return make(cmd, arg);
}


function extractTargetArg(original = '') {
    const text = String(original || '');

    const mentions = text.match(/@[^\s]+/g);
    if (mentions && mentions.length) return mentions.join(' ');

    const nums = text.match(/\b(?:\+?62|0)\d{8,16}\b/g);
    if (nums && nums.length) return nums.join(' ');

    return '';
}

function makeWithTarget(cmd, original = '') {
    const arg = extractTargetArg(original);
    return make(pickCommand(cmd), arg);
}

function hardAdminOwnerIntent(original, t) {
    // =========================
    // 1. TOGGLE ADMIN/OWNER
    // =========================
    const toggleItems = [
        { cmd: 'antilink', keys: ['antilink', 'anti link'] },
        { cmd: 'antitag', keys: ['antitag', 'anti tag'] },
        { cmd: 'antibadword', keys: ['antibadword', 'anti badword', 'anti bad word', 'anti toxic', 'anti kata kasar', 'filter kata kasar'] },
        { cmd: 'chatbot', keys: ['chatbot', 'bot chat', 'ai grup', 'ai group', 'auto reply grup', 'auto reply group'] },
        { cmd: 'welcome', keys: ['welcome', 'selamat datang'] },
        { cmd: 'goodbye', keys: ['goodbye', 'pesan keluar', 'member keluar'] },

        { cmd: 'autoread', keys: ['autoread', 'auto read', 'baca otomatis'] },
        { cmd: 'autotyping', keys: ['autotyping', 'auto typing', 'mengetik otomatis'] },
        { cmd: 'autostatus', keys: ['autostatus', 'auto status'] },
        { cmd: 'autoreact', keys: ['autoreact', 'auto react', 'auto reaction', 'areact'] },
        { cmd: 'anticall', keys: ['anticall', 'anti call'] },
        { cmd: 'antidelete', keys: ['antidelete', 'anti delete'] },
        { cmd: 'pmblocker', keys: ['pmblocker', 'pm blocker', 'blokir pc', 'blokir private chat'] }
    ];

    for (const item of toggleItems) {
        const matched = item.keys.some(k => t.includes(k));
        if (!matched) continue;

        if (wantsOff(t)) return make(pickCommand(item.cmd), 'off');
        if (wantsOn(t)) return make(pickCommand(item.cmd), 'on');
    }

    // =========================
    // 2. CEK/LIST HARUS DI ATAS PROMOTE/WARN
    // =========================
    if (has(t, [
        /lihat admin/,
        /list admin/,
        /daftar admin/,
        /cek admin/,
        /siapa admin/,
        /admin grup/,
        /admin group/,
        /staff/,
        /admins/
    ])) {
        return make(pickCommand('staff', 'admins'));
    }

    if (has(t, [
        /lihat warning/,
        /cek warning/,
        /jumlah warning/,
        /list warning/,
        /warnings/
    ])) {
        return make(pickCommand('warnings'));
    }

    // =========================
    // 3. DEMOTE HARUS DI ATAS PROMOTE
    // =========================
    if (has(t, [
        /demote/,
        /copot.{0,40}admin/,
        /cabut.{0,40}admin/,
        /hapus.{0,40}admin/,
        /remove.{0,40}admin/,
        /turunkan.{0,40}admin/,
        /turunkan.{0,40}member/,
        /jadikan.{0,40}member/,
        /jadiin.{0,40}member/,
        /buat.{0,40}member/,
        /make.{0,40}member/,
        /memberkan/
    ])) {
        return makeWithTarget('demote', original);
    }

    if (has(t, [
        /promote/,
        /jadikan.{0,40}admin/,
        /jadiin.{0,40}admin/,
        /buat.{0,40}admin/,
        /angkat.{0,40}admin/,
        /naikkan.{0,40}admin/,
        /kasih.{0,40}admin/,
        /beri.{0,40}admin/,
        /make.{0,40}admin/,
        /admin(?:kan)/
    ])) {
        return makeWithTarget('promote', original);
    }

    // =========================
    // 4. ADMIN ACTION
    // =========================
    if (has(t, [/kick/, /tendang/, /keluarkan/, /keluarin/, /usir/, /remove member/, /hapus.{0,40}dari grup/, /hapus.{0,40}dari group/])) {
        return makeWithTarget('kick', original);
    }

    if (has(t, [/tutup grup/, /tutup group/, /mute grup/, /mute group/, /hanya admin/, /cuma admin/, /only admin/])) {
        return make(pickCommand('mute'));
    }

    if (has(t, [/buka grup/, /buka group/, /unmute grup/, /unmute group/, /semua bisa chat/, /member bisa chat/, /everyone can chat/])) {
        return make(pickCommand('unmute'));
    }

    if (has(t, [/tag semua/, /tagall/, /mention semua/, /panggil semua/, /tag everyone/, /mention all/])) {
        return make(pickCommand('tagall'));
    }

    if (has(t, [/tagnotadmin/, /tag non admin/, /tag yang bukan admin/])) {
        return make(pickCommand('tagnotadmin'));
    }

    if (has(t, [/hidetag/, /hidden tag/, /tag diam/, /mention diam/, /silent tag/])) {
        const arg = strip(original, [/hidetag/ig, /hidden tag/ig, /tag diam/ig, /mention diam/ig, /silent tag/ig]);
        return make(pickCommand('hidetag'), arg);
    }

    if (has(t, [
        /ganti pp grup/,
        /ganti pp group/,
        /ubah pp grup/,
        /ubah pp group/,
        /setgpp/,
        /set group pp/,
        /set grup pp/,
        /foto profil grup/,
        /foto profil group/,
        /jadikan ini pp grup/,
        /jadikan ini pp group/,
        /pasang foto.{0,30}pp grup/,
        /pasang foto.{0,30}pp group/,
        /logo grup/,
        /logo group/,
        /icon grup/,
        /icon group/,
        /ikon grup/,
        /ikon group/
    ])) {
        return make(pickCommand('setgpp'));
    }

    if (has(t, [/ganti nama grup/, /ganti nama group/, /ubah nama grup/, /ubah nama group/, /rename grup/, /rename group/, /setgname/, /set group name/])) {
        const arg = strip(original, [/ganti nama grup/ig, /ganti nama group/ig, /ubah nama grup/ig, /ubah nama group/ig, /rename grup/ig, /rename group/ig, /setgname/ig, /set group name/ig]);
        return make(pickCommand('setgname'), arg);
    }

    if (has(t, [/ganti deskripsi grup/, /ganti deskripsi group/, /ubah deskripsi grup/, /ubah deskripsi group/, /deskripsi grup/, /deskripsi group/, /setgdesc/, /set group desc/])) {
        const arg = strip(original, [/ganti deskripsi grup/ig, /ganti deskripsi group/ig, /ubah deskripsi grup/ig, /ubah deskripsi group/ig, /deskripsi grup/ig, /deskripsi group/ig, /setgdesc/ig, /set group desc/ig]);
        return make(pickCommand('setgdesc'), arg);
    }

    if (has(t, [/reset link/, /reset tautan/, /link grup baru/, /link group baru/, /resetlink/])) {
        return make(pickCommand('resetlink'));
    }

    if (has(t, [/info grup/, /info group/, /groupinfo/, /grup info/, /group info/])) {
        return make(pickCommand('groupinfo'));
    }

    if (has(t, [/groupmanage/, /kelola grup/, /kelola group/, /atur grup/, /atur group/, /manage group/])) {
        return make(pickCommand('groupmanage'));
    }

    if (has(t, [/hapus pesan/, /delete pesan/, /delete message/, /del pesan/])) {
        return make(pickCommand('delete', 'del'));
    }

    if (has(t, [/kasih warning/, /beri warning/, /warn user/, /peringatkan/, /teguran/, /warn/])) {
        return makeWithTarget('warn', original);
    }

    if (has(t, [/unban/, /hapus ban/, /buka ban/, /lepas ban/])) {
        return makeWithTarget('unban', original);
    }

    if (has(t, [/ban user/, /ban dia/, /blokir user/, /banned user/])) {
        return makeWithTarget('ban', original);
    }

    if (has(t, [/clear chat/, /bersihkan chat/, /hapus chat/])) {
        return make(pickCommand('clear'));
    }

    if (has(t, [/topmembers/, /top member/, /member aktif/, /ranking member/])) {
        return make(pickCommand('topmembers'));
    }

    // =========================
    // 5. OWNER ACTION
    // =========================
    if (has(t, [/clear session/, /clearsession/, /hapus session/, /reset session/])) {
        return make(pickCommand('clearsession'));
    }

    if (has(t, [/clear tmp/, /cleartmp/, /hapus tmp/, /hapus cache/, /clear cache/])) {
        return make(pickCommand('cleartmp'));
    }

    if (has(t, [/update bot/, /update script/, /perbarui bot/])) {
        return make(pickCommand('update'));
    }

    if (has(t, [/settings/, /setting bot/, /pengaturan bot/])) {
        return make(pickCommand('settings'));
    }

    if (has(t, [/setpp/, /set pp bot/, /ganti pp bot/, /foto profil bot/])) {
        return make(pickCommand('setpp'));
    }

    if (has(t, [/sudo/, /tambah sudo/, /hapus sudo/, /add sudo/, /remove sudo/])) {
        const arg = strip(original, [/sudo/ig, /tambah sudo/ig, /hapus sudo/ig, /add sudo/ig, /remove sudo/ig]);
        return make(pickCommand('sudo'), arg);
    }

    if (has(t, [/pair/, /pairing/, /kode pairing/, /pairing code/, /login bot/])) {
        return make(pickCommand('pair'));
    }

    if (has(t, [/owner/, /pemilik bot/, /dev bot/, /developer bot/])) {
        return make(pickCommand('owner'));
    }

    return '';
}

function rewriteAiToBotCommand(rawText, message = {}) {
    const raw = String(rawText || '').trim();

    if (!/^(\.ai|\.ask|\.gpt|\.gemini|\.groq|\.allogic)(\s|$)/i.test(raw)) {
        return '';
    }

    const original = removeAiPrefix(raw);
    const t = norm(original);

    if (!t) return '';

    // SETGPP_SUPER_OVERRIDE
    // Pahami semua variasi perintah ganti foto/PP/logo/icon grup.
    // Harus sebelum AI biasa dan sebelum direct command.
    {
        const isGroupPpRequest =
            /\b(set|sett|ganti|ubah|jadikan|jadiin|pasang|pakai|gunakan|buat)\b/i.test(t) &&
            /\b(pp|foto|poto|photo|gambar|profil|profile|pfp|avatar|logo|icon|ikon)\b/i.test(t) &&
            /\b(grup|group|gc)\b/i.test(t);

        const explicitSetGpp =
            /\bsetgpp\b/i.test(t) ||
            /\bset\s*gpp\b/i.test(t) ||
            /\bset\s+pp\s+(grup|group|gc)\b/i.test(t) ||
            /\bset\s+(grup|group|gc)\s+pp\b/i.test(t) ||
            /\bganti\s+pp\s+(grup|group|gc)\b/i.test(t) ||
            /\bganti\s+(foto|poto|photo|gambar)\s+(grup|group|gc)\b/i.test(t) ||
            /\bfoto\s+profil\s+(grup|group|gc)\b/i.test(t) ||
            /\b(group|grup)\s+(profile\s+picture|photo|icon|logo)\b/i.test(t);

        const makeThisGroupPhoto =
            /\b(jadikan|jadiin|pasang|pakai|gunakan)\b/i.test(t) &&
            /\b(ini|gambar ini|foto ini|photo ini|media ini)\b/i.test(t) &&
            /\b(foto|photo|pp|profil|profile|logo|icon|ikon)\b/i.test(t) &&
            /\b(grup|group|gc)\b/i.test(t);

        if (isGroupPpRequest || explicitSetGpp || makeThisGroupPhoto) {
            return make(pickCommand('setgpp'));
        }
    }
    // END_SETGPP_SUPER_OVERRIDE

    const hardIntent = hardAdminOwnerIntent(original, t);
    if (hardIntent) return hardIntent;

    // ADMIN_PERMISSION_NATURAL_OVERRIDE
    // Kalau user menyuruh aksi admin grup, jangan masuk AI biasa.
    // Langsung arahkan ke command bot.
    if (has(t, [
        /jadikan .+ admin/,
        /jadiin .+ admin/,
        /angkat .+ admin/,
        /buat .+ jadi admin/,
        /kasih .+ admin/,
        /beri .+ admin/,
        /promote/,
        /naikkan .+ admin/
    ])) {
        return make(pickCommand('promote'));
    }

    if (has(t, [
        /turunkan .+ admin/,
        /turunkan .+ jadi member/,
        /jadikan .+ member/,
        /jadiin .+ member/,
        /buat .+ jadi member/,
        /cabut .+ admin/,
        /copot .+ admin/,
        /hapus admin/,
        /remove admin/,
        /demote/
    ])) {
        return make(pickCommand('demote'));
    }

    if (has(t, [
        /kick/,
        /tendang/,
        /keluarkan/,
        /keluarin/,
        /usir/,
        /remove member/,
        /hapus .+ dari grup/,
        /hapus .+ dari group/
    ])) {
        return make(pickCommand('kick'));
    }

    if (has(t, [
        /tutup grup/,
        /tutup group/,
        /mute grup/,
        /mute group/,
        /hanya admin yang bisa chat/,
        /cuma admin yang bisa chat/
    ])) {
        return make(pickCommand('mute'));
    }

    if (has(t, [
        /buka grup/,
        /buka group/,
        /unmute grup/,
        /unmute group/,
        /semua bisa chat/,
        /member bisa chat/
    ])) {
        return make(pickCommand('unmute'));
    }

    // END_ADMIN_PERMISSION_NATURAL_OVERRIDE

    // SETGPP_HARD_OVERRIDE
    // Pahami semua variasi perintah ganti PP grup.
    // Contoh:
    // .ai ganti pp grup
    // .ai ganti foto profil group
    // .ai jadikan ini pp gc
    // .ai pasang foto ini jadi pp grup
    {
        const isGroupChat = String(message?.key?.remoteJid || '').endsWith('@g.us');

        const hasGroupWord =
            /\\b(grup|group|gc)\\b/i.test(t);

        const hasPpWord =
            /\\b(pp|poto|foto|photo|profil|profile|pfp|avatar|icon|ikon|logo)\\b/i.test(t);

        const hasSetWord =
            /\\b(ganti|ubah|set|sett|jadikan|jadiin|pasang|pakai|gunakan|buat)\\b/i.test(t);

        const isBotPp =
            /\\b(bot|owner)\\b/i.test(t);

        const explicitSetGpp =
            /set\\s*gpp|setgpp|set\\s+(group|grup)\\s+pp|group\\s+profile\\s+picture|group\\s+photo|group\\s+icon|group\\s+logo/i.test(t);

        if (
            explicitSetGpp ||
            (hasSetWord && hasPpWord && hasGroupWord) ||
            (isGroupChat && hasSetWord && hasPpWord && !isBotPp)
        ) {
            return make(pickCommand('setgpp'));
        }
    }
    // END_SETGPP_HARD_OVERRIDE

    // 1. Pahami maksud kalimat admin/owner dulu.
    const intent = detectAdminOwnerIntent(original, t);
    if (intent) return intent;

    // 2. Baru direct command admin/owner.
    const direct = directAdminOwnerCommand(original);
    if (direct) return direct;

    // 3. Selain admin/owner, jangan rewrite. Biarkan AI biasa.
    return '';
}

module.exports = {
    rewriteAiToBotCommand
};
