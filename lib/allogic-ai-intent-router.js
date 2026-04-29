function stripAiPrefix(text = '') {
    return String(text || '')
        .replace(/^\s*(\.ai|\.ask|\.gpt|\.gemini|\.groq|\.allogic)\s*/i, '')
        .trim();
}

function isAiPrefix(text = '') {
    return /^\s*(\.ai|\.ask|\.gpt|\.gemini|\.groq|\.allogic)(\s|$)/i.test(String(text || ''));
}

function getGermanTranslationTerm(text = '') {
    const q = stripAiPrefix(text)
        .replace(/[?!。!?.]+$/g, '')
        .trim();

    if (!q) return null;

    const patterns = [
        /^apa\s+bahasa\s+jerman(?:nya)?\s+(?:dari\s+|untuk\s+)?(.+)$/i,
        /^bahasa\s+jerman(?:nya)?\s+(.+)$/i,
        /^jerman(?:nya)?\s+(.+)$/i,
        /^(?:terjemahkan|translate)\s+(.+?)\s+(?:ke|to)\s+(?:bahasa\s+)?(?:jerman|german)$/i,
        /^(.+?)\s+(?:ke|dalam|to)\s+(?:bahasa\s+)?(?:jerman|german)$/i
    ];

    for (const re of patterns) {
        const m = q.match(re);
        if (!m) continue;

        let term = String(m[1] || '')
            .replace(/^kata\s+/i, '')
            .replace(/^kalimat\s+/i, '')
            .replace(/^dari\s+/i, '')
            .replace(/^untuk\s+/i, '')
            .trim();

        if (!term) return null;
        if (term.length > 180) return null;

        return term;
    }

    return null;
}

function isQuestionLike(text = '') {
    const q = stripAiPrefix(text).toLowerCase().trim();

    return /^(apa|apakah|siapa|kapan|dimana|di mana|kenapa|mengapa|bagaimana|gimana|berapa|jelaskan|terangkan|artinya|arti|maksud|bahasa|translate|terjemahkan|jerman|german)\b/i.test(q);
}

function isLikelyBotAction(text = '') {
    const q = stripAiPrefix(text).toLowerCase().trim();

    return /\b(jadikan|buat|ubah|ganti|set|aktifkan|hidupkan|nyalakan|matikan|nonaktifkan|copot|turunkan|promote|demote|admin|member|kick|tendang|ban|unban|mute|unmute|tutup grup|buka grup|tagall|tag semua|warning|warn|hapus|delete|sticker|download|ytmp3|ytmp4|video|musik|lagu|mode publik|mode private|public|private)\b/i.test(q);
}

function shouldSkipCommandPlanner(text = '') {
    if (!isAiPrefix(text)) return false;

    if (getGermanTranslationTerm(text)) return true;

    if (isQuestionLike(text) && !isLikelyBotAction(text)) {
        return true;
    }

    return false;
}

function buildGermanTranslationPrompt(term = '') {
    return `
Kamu adalah penerjemah Bahasa Indonesia-Inggris-Jerman yang akurat.

User bertanya terjemahan ke Bahasa Jerman.

Kata/frasa yang harus diterjemahkan:
"${term}"

Tugas:
- Terjemahkan kata/frasa itu ke Bahasa Jerman.
- Jangan menjawab dalam Bahasa Inggris.
- Jangan ubah menjadi possessive seperti "tripod's".
- Jika kata benda, wajib sertakan artikel der/die/das.
- Jika kata kerja, berikan bentuk infinitiv.
- Jika ada beberapa pilihan, berikan yang paling umum dulu.
- Jawab singkat, jelas, dan cocok untuk WhatsApp.

Format wajib:

🇩🇪 Bahasa Jerman:
<jawaban utama>

Arti:
<arti dalam Bahasa Indonesia>

Jenis kata:
<Nomina/Verb/Adjektiv/dll>

Catatan:
<catatan singkat penggunaan>

Contoh:
<kalimat Jerman>

Artinya:
<arti contoh dalam Bahasa Indonesia>
`.trim();
}

function prepareAiQuery(query = '', options = {}) {
    const germanTerm = getGermanTranslationTerm(query);

    if (germanTerm) {
        return {
            query: buildGermanTranslationPrompt(germanTerm),
            options: {
                ...options,
                provider: options.provider === 'auto' || !options.provider ? 'google' : options.provider,
                noLocal: true,
                forceAnswer: true
            },
            reason: 'german_translation'
        };
    }

    return {
        query,
        options,
        reason: 'normal'
    };
}

module.exports = {
    stripAiPrefix,
    isAiPrefix,
    getGermanTranslationTerm,
    isQuestionLike,
    isLikelyBotAction,
    shouldSkipCommandPlanner,
    buildGermanTranslationPrompt,
    prepareAiQuery
};
