function norm(text = '') {
    return String(text)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}@:+./\s-]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function has(t, patterns) {
    return patterns.some(p => p.test(t));
}

function getCommandText(query = '') {
    let t = norm(query);

    // buang prefix command AI
    t = t.replace(/^(\.ai|\.ask|\.gpt|\.gemini|\.groq|\.allogic)\s+/i, '').trim();

    return t;
}

function detectSmartCommand(query) {
    const t = getCommandText(query);

    if (!t) return null;

    // ======================
    // ADMIN GROUP COMMANDS
    // ======================

    // antilink
    if (has(t, [
        /\banti\s*link\b/i,
        /\bantilink\b/i,
        /\bblokir\s+link\b/i,
        /\blarang\s+link\b/i,
        /\bcegah\s+link\b/i,
        /\bhapus\s+link\b/i,
        /\blink\s+tidak\s+boleh\b/i,
        /\bno\s+link\b/i
    ])) {
        if (has(t, [/\bmati\b/i, /\bmatikan\b/i, /\boff\b/i, /\bnonaktif/i, /\bdisable\b/i, /\bstop\b/i])) {
            return { type: 'admin', command: 'antilink_off' };
        }
        return { type: 'admin', command: 'antilink_on' };
    }

    // antibadword
    if (has(t, [
        /\banti\s*bad\s*word\b/i,
        /\banti\s*badword\b/i,
        /\bantibadword\b/i,
        /\banti\s*toxic\b/i,
        /\banti\s*kata\s*kasar\b/i,
        /\bfilter\s+kata\b/i,
        /\bblokir\s+kata\s+kasar\b/i,
        /\btoxic\s+filter\b/i
    ])) {
        if (has(t, [/\bmati\b/i, /\bmatikan\b/i, /\boff\b/i, /\bnonaktif/i, /\bdisable\b/i])) {
            return { type: 'admin', command: 'antibadword_off' };
        }
        return { type: 'admin', command: 'antibadword_on' };
    }

    // antitag
    if (has(t, [
        /\banti\s*tag\b/i,
        /\bantitag\b/i,
        /\blarang\s+tag\b/i,
        /\bblokir\s+tag\b/i
    ])) {
        if (has(t, [/\bmati\b/i, /\bmatikan\b/i, /\boff\b/i, /\bnonaktif/i, /\bdisable\b/i])) {
            return { type: 'admin', command: 'antitag_off' };
        }
        return { type: 'admin', command: 'antitag_on' };
    }

    // chatbot group
    if (has(t, [
        /\bchatbot\b/i,
        /\bbot\s*chat\b/i,
        /\bai\s+grup\b/i,
        /\bai\s+group\b/i,
        /\bbot\s+aktif\s+di\s+grup\b/i,
        /\baktifkan\s+ai\s+di\s+grup\b/i
    ])) {
        if (has(t, [/\bmati\b/i, /\bmatikan\b/i, /\boff\b/i, /\bnonaktif/i, /\bdisable\b/i])) {
            return { type: 'admin', command: 'chatbot_off' };
        }
        return { type: 'admin', command: 'chatbot_on' };
    }

    // welcome
    if (has(t, [
        /\bwelcome\b/i,
        /\bselamat\s+datang\b/i,
        /\bpesan\s+masuk\b/i,
        /\bsambutan\b/i,
        /\bucapan\s+welcome\b/i
    ])) {
        if (has(t, [/\bmati\b/i, /\bmatikan\b/i, /\boff\b/i, /\bnonaktif/i, /\bdisable\b/i])) {
            return { type: 'admin', command: 'welcome_off' };
        }
        return { type: 'admin', command: 'welcome_on' };
    }

    // goodbye
    if (has(t, [
        /\bgoodbye\b/i,
        /\bbye\s+message\b/i,
        /\bleft\s+message\b/i,
        /\bpesan\s+keluar\b/i,
        /\bucapan\s+keluar\b/i
    ])) {
        if (has(t, [/\bmati\b/i, /\bmatikan\b/i, /\boff\b/i, /\bnonaktif/i, /\bdisable\b/i])) {
            return { type: 'admin', command: 'goodbye_off' };
        }
        return { type: 'admin', command: 'goodbye_on' };
    }

    // promote
    if (has(t, [
        /\bpromote\b/i,
        /\bjadikan\s+.+\s+(sebagai\s+)?admin\b/i,
        /\bjadiin\s+.+\s+(sebagai\s+)?admin\b/i,
        /\bbuat\s+.+\s+(jadi\s+|sebagai\s+)?admin\b/i,
        /\bangkat\s+.+\s+(jadi\s+|sebagai\s+)?admin\b/i,
        /\badmin(?:kan)?\s+.+/i,
        /\bkasih\s+admin\s+.+/i,
        /\bberi\s+admin\s+.+/i
    ])) {
        return { type: 'admin', command: 'promote' };
    }

    // demote
    if (has(t, [
        /\bdemote\b/i,
        /\bturunkan\s+.+\s+dari\s+admin\b/i,
        /\bturunkan\s+.+\s+admin\b/i,
        /\bcabut\s+.+\s+dari\s+admin\b/i,
        /\bcabut\s+admin\s+.+/i,
        /\bhapus\s+admin\s+.+/i,
        /\bjadikan\s+.+\s+(sebagai\s+)?member\b/i,
        /\bbuat\s+.+\s+(jadi\s+)?member\b/i
    ])) {
        return { type: 'admin', command: 'demote' };
    }

    // kick
    if (has(t, [
        /\bkick\b/i,
        /\btendang\b/i,
        /\bkeluarkan\b/i,
        /\bkeluarin\b/i,
        /\busir\b/i,
        /\bhapus\s+.+\s+dari\s+(grup|group)\b/i,
        /\bremove\b/i
    ])) {
        return { type: 'admin', command: 'kick' };
    }

    // mute/unmute
    if (has(t, [
        /\bmute\s+(grup|group)\b/i,
        /\btutup\s+(grup|group)\b/i,
        /\bhanya\s+admin\b/i,
        /\bcuma\s+admin\s+yang\s+bisa\s+chat\b/i,
        /\bmember\s+jangan\s+bisa\s+chat\b/i
    ])) {
        return { type: 'admin', command: 'mute' };
    }

    if (has(t, [
        /\bunmute\s+(grup|group)\b/i,
        /\bbuka\s+(grup|group)\b/i,
        /\bsemua\s+bisa\s+chat\b/i,
        /\bmember\s+bisa\s+chat\b/i
    ])) {
        return { type: 'admin', command: 'unmute' };
    }

    // tagall/hidetag
    if (has(t, [
        /\btagall\b/i,
        /\btag\s+semua\b/i,
        /\bmention\s+semua\b/i,
        /\bpanggil\s+semua\b/i
    ])) {
        return { type: 'admin', command: 'tagall' };
    }

    if (has(t, [
        /\bhidetag\b/i,
        /\bhidden\s+tag\b/i,
        /\btag\s+diam\b/i,
        /\bmention\s+diam\b/i
    ])) {
        return { type: 'admin', command: 'hidetag' };
    }

    // group pp / setgpp
    if (has(t, [
        /\bsetgpp\b/i,
        /\bset\s*gpp\b/i,
        /\bset\s+(group|grup)\s+pp\b/i,
        /\bsett\s+(group|grup)\s+pp\b/i,
        /\bganti\s+pp\s+(group|grup)\b/i,
        /\bganti\s+(group|grup)\s+pp\b/i,
        /\bubah\s+pp\s+(group|grup)\b/i,
        /\bubah\s+(group|grup)\s+pp\b/i,
        /\bjadikan\s+(ini\s+)?pp\s+(group|grup)\b/i,
        /\bjadiin\s+(ini\s+)?pp\s+(group|grup)\b/i,
        /\bfoto\s+profil\s+(group|grup)\b/i,
        /\bprofile\s+(picture|photo)\s+(group|grup)\b/i,
        /\bicon\s+(group|grup)\b/i,
        /\bikon\s+(group|grup)\b/i,
        /\blogo\s+(group|grup)\b/i
    ])) {
        return { type: 'admin', command: 'setgpp' };
    }

    // group name
    if (has(t, [
        /\bsetgname\b/i,
        /\bset\s+(group|grup)\s+name\b/i,
        /\bganti\s+nama\s+(group|grup)\b/i,
        /\bubah\s+nama\s+(group|grup)\b/i,
        /\brename\s+(group|grup)\b/i
    ])) {
        return { type: 'admin', command: 'setgname' };
    }

    // group desc
    if (has(t, [
        /\bsetgdesc\b/i,
        /\bset\s+(group|grup)\s+desc\b/i,
        /\bganti\s+deskripsi\s+(group|grup)\b/i,
        /\bubah\s+deskripsi\s+(group|grup)\b/i,
        /\bdeskripsi\s+(group|grup)\b/i,
        /\bdescription\s+(group|grup)\b/i
    ])) {
        return { type: 'admin', command: 'setgdesc' };
    }

    // reset group link
    if (has(t, [
        /\bresetlink\b/i,
        /\breset\s+link\b/i,
        /\breset\s+tautan\b/i,
        /\blink\s+(group|grup)\s+baru\b/i,
        /\bbuat\s+link\s+(group|grup)\s+baru\b/i
    ])) {
        return { type: 'admin', command: 'resetlink' };
    }

    // add member
    if (has(t, [
        /\badd\s+member\b/i,
        /\btambah\s+member\b/i,
        /\btambahkan\s+.+\s+ke\s+(grup|group)\b/i,
        /\bundang\s+.+\s+ke\s+(grup|group)\b/i,
        /\bmasukkan\s+.+\s+ke\s+(grup|group)\b/i,
        /\bmasukin\s+.+\s+ke\s+(grup|group)\b/i
    ])) {
        return { type: 'admin', command: 'add_member' };
    }

    // ======================
    // USER TOOLS
    // ======================

    if (has(t, [
        /\bsticker\b/i,
        /\bstiker\b/i,
        /\bbuat\s+sticker\b/i,
        /\bbuat\s+stiker\b/i,
        /\bjadiin\s+sticker\b/i,
        /\bjadiin\s+stiker\b/i,
        /\bgambar\s+jadi\s+sticker\b/i
    ])) {
        return { type: 'user', command: 'sticker' };
    }

    if (has(t, [
        /\btts\b/i,
        /\btext\s+to\s+speech\b/i,
        /\bteks\s+jadi\s+suara\b/i,
        /\bbacakan\b/i,
        /\bubah\s+teks\s+jadi\s+suara\b/i
    ])) {
        return { type: 'user', command: 'tts' };
    }

    if (has(t, [
        /\btranslate\b/i,
        /\bterjemahkan\b/i,
        /\bartikan\b/i,
        /\bubah\s+ke\s+bahasa\b/i,
        /\btranslate\s+ke\b/i
    ])) {
        return { type: 'user', command: 'translate' };
    }

    if (has(t, [
        /\bscreenshot\s+web\b/i,
        /\bss\s+web\b/i,
        /\bscreenshot\s+website\b/i,
        /\bcapture\s+web\b/i
    ])) {
        return { type: 'user', command: 'screenshot' };
    }

    if (has(t, [
        /\bremovebg\b/i,
        /\bremove\s+background\b/i,
        /\bhapus\s+background\b/i,
        /\bhilangkan\s+background\b/i,
        /\bhapus\s+bg\b/i
    ])) {
        return { type: 'user', command: 'removebg' };
    }

    if (has(t, [
        /\bremini\b/i,
        /\benhance\b/i,
        /\bjernihkan\s+foto\b/i,
        /\bhd\s+in\s+foto\b/i,
        /\bbikin\s+foto\s+hd\b/i,
        /\bperjelas\s+foto\b/i
    ])) {
        return { type: 'user', command: 'remini' };
    }

    if (has(t, [
        /\bimagine\b/i,
        /\bflux\b/i,
        /\bbuat\s+gambar\b/i,
        /\bgenerate\s+gambar\b/i,
        /\bbikin\s+gambar\b/i,
        /\bciptakan\s+gambar\b/i
    ])) {
        return { type: 'user', command: 'imagine' };
    }

    // downloader
    if (has(t, [/youtube/i, /youtu\.be/i, /\byt\b/i]) && has(t, [/mp3/i, /audio/i, /lagu/i, /musik/i])) {
        return { type: 'user', command: 'ytmp3' };
    }

    if (has(t, [/youtube/i, /youtu\.be/i, /\byt\b/i]) && has(t, [/mp4/i, /video/i])) {
        return { type: 'user', command: 'ytmp4' };
    }

    if (has(t, [/tiktok/i, /\btt\b/i])) {
        return { type: 'user', command: 'tiktok' };
    }

    if (has(t, [/instagram/i, /\big\b/i, /reels/i, /\binsta\b/i])) {
        return { type: 'user', command: 'instagram' };
    }

    if (has(t, [/facebook/i, /\bfb\b/i])) {
        return { type: 'user', command: 'facebook' };
    }

    if (has(t, [/spotify/i])) {
        return { type: 'user', command: 'spotify' };
    }

    if (has(t, [/cuaca/i, /weather/i])) {
        return { type: 'user', command: 'weather' };
    }

    if (has(t, [/berita/i, /news/i])) {
        return { type: 'user', command: 'news' };
    }

    if (has(t, [/lirik/i, /lyrics/i])) {
        return { type: 'user', command: 'lyrics' };
    }

    // ======================
    // OWNER COMMANDS
    // ======================

    if (has(t, [/mode public/i, /public mode/i, /jadikan bot public/i])) {
        return { type: 'owner', command: 'mode_public' };
    }

    if (has(t, [/mode private/i, /private mode/i, /jadikan bot private/i])) {
        return { type: 'owner', command: 'mode_private' };
    }

    if (has(t, [/clear session/i, /hapus session/i, /clearsession/i])) {
        return { type: 'owner', command: 'clearsession' };
    }

    if (has(t, [/auto read/i, /autoread/i])) {
        return { type: 'owner', command: has(t, [/mati/i, /off/i, /nonaktif/i]) ? 'autoread_off' : 'autoread_on' };
    }

    if (has(t, [/auto typing/i, /autotyping/i])) {
        return { type: 'owner', command: has(t, [/mati/i, /off/i, /nonaktif/i]) ? 'autotyping_off' : 'autotyping_on' };
    }

    if (has(t, [/auto react/i, /autoreact/i])) {
        return { type: 'owner', command: has(t, [/mati/i, /off/i, /nonaktif/i]) ? 'autoreact_off' : 'autoreact_on' };
    }

    if (has(t, [/anti call/i, /anticall/i])) {
        return { type: 'owner', command: has(t, [/mati/i, /off/i, /nonaktif/i]) ? 'anticall_off' : 'anticall_on' };
    }

    return null;
}

module.exports = {
    detectSmartCommand,
    getCommandText
};
