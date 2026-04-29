const { askAllogicAI } = require('../lib/allogic-ai-router-v4');
const { prepareAiQuery } = require('../lib/allogic-ai-intent-router');
const { runToolIntent } = require('../lib/allogic-tools');
const { runOwnerAdminIntent } = require('../lib/allogic-admin-tools');

// ALLOGIC_DIRECT_GERMAN_TRANSLATION_FIX
function allogicGermanTermFromQuery(text = '') {
    text = String(text || '')
        .replace(/^\s*(\.ai|\.ask|\.gpt|\.gemini|\.groq|\.allogic)\s*/i, '')
        .replace(/[?!。!?.]+$/g, '')
        .trim();

    const patterns = [
        /^apa\s+bahasa\s+jerman(?:nya)?\s+(?:dari\s+|untuk\s+)?(.+)$/i,
        /^bahasa\s+jerman(?:nya)?\s+(.+)$/i,
        /^jerman(?:nya)?\s+(.+)$/i,
        /^(?:terjemahkan|translate)\s+(.+?)\s+(?:ke|to)\s+(?:bahasa\s+)?(?:jerman|german)$/i,
        /^(.+?)\s+(?:ke|dalam|to)\s+(?:bahasa\s+)?(?:jerman|german)$/i
    ];

    for (const re of patterns) {
        const m = text.match(re);
        if (!m) continue;

        let term = String(m[1] || '')
            .replace(/^kata\s+/i, '')
            .replace(/^kalimat\s+/i, '')
            .replace(/^dari\s+/i, '')
            .replace(/^untuk\s+/i, '')
            .trim();

        if (!term || term.length > 120) return null;
        return term;
    }

    return null;
}

const ALLOGIC_GERMAN_DIRECT_DICT = {
    tripod: {
        de: 'das Stativ',
        id: 'tripod / penyangga kamera berkaki tiga',
        type: 'Nomina',
        note: 'Paling umum untuk kamera, fotografi, atau alat berkaki tiga.',
        ex: 'Ich brauche ein Stativ für die Kamera.',
        exid: 'Saya membutuhkan tripod untuk kamera.'
    },
    makan: {
        de: 'essen',
        id: 'makan',
        type: 'Verb',
        note: 'Bentuk dasar atau infinitiv.',
        ex: 'Ich esse Reis.',
        exid: 'Saya makan nasi.'
    },
    minum: {
        de: 'trinken',
        id: 'minum',
        type: 'Verb',
        note: 'Bentuk dasar atau infinitiv.',
        ex: 'Ich trinke Wasser.',
        exid: 'Saya minum air.'
    },
    tidur: {
        de: 'schlafen',
        id: 'tidur',
        type: 'Verb',
        note: 'Bentuk dasar atau infinitiv.',
        ex: 'Ich schlafe früh.',
        exid: 'Saya tidur lebih awal.'
    },
    belajar: {
        de: 'lernen',
        id: 'belajar',
        type: 'Verb',
        note: 'Dipakai untuk belajar pelajaran, bahasa, atau skill.',
        ex: 'Ich lerne Deutsch.',
        exid: 'Saya belajar bahasa Jerman.'
    },
    rumah: {
        de: 'das Haus',
        id: 'rumah',
        type: 'Nomina',
        note: 'Artikel: das. Plural: die Häuser.',
        ex: 'Das Haus ist groß.',
        exid: 'Rumah itu besar.'
    },
    buku: {
        de: 'das Buch',
        id: 'buku',
        type: 'Nomina',
        note: 'Artikel: das. Plural: die Bücher.',
        ex: 'Ich lese ein Buch.',
        exid: 'Saya membaca sebuah buku.'
    }
};

function allogicGermanDirectReply(term = '') {
    const key = String(term || '').trim().toLowerCase();
    const d = ALLOGIC_GERMAN_DIRECT_DICT[key];

    if (!d) return null;

    return `🇩🇪 Bahasa Jerman:
${d.de}

Arti:
${d.id}

Jenis kata:
${d.type}

Catatan:
${d.note}

Contoh:
${d.ex}

Artinya:
${d.exid}`;
}

function allogicGermanPrompt(term = '') {
    return `Terjemahkan kata/frasa berikut ke Bahasa Jerman: "${term}"

Aturan:
- Jawab dalam Bahasa Indonesia.
- Jangan jawab dalam Bahasa Inggris.
- Jangan ubah menjadi possessive seperti "tripod's".
- Jika kata benda, sertakan artikel der/die/das.
- Jika kata kerja, berikan bentuk infinitiv.
- Jawab dengan format:

🇩🇪 Bahasa Jerman:
<jawaban>

Arti:
<arti Indonesia>

Jenis kata:
<jenis kata>

Catatan:
<catatan singkat>

Contoh:
<kalimat Jerman>

Artinya:
<arti contoh>`;
}


function extractText(message) {
    return message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        message.message?.imageMessage?.caption ||
        message.message?.videoMessage?.caption ||
        '';
}

function getCommandAndQuery(text) {
    const parts = String(text || '').trim().split(/\s+/);
    const command = (parts.shift() || '').toLowerCase();
    return { command, query: parts.join(' ').trim() };
}

async function aiCommand(sock, chatId, message) {
    try {
        const text = extractText(message);
        const { command, query } = getCommandAndQuery(text);

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: `🤖 *Allogic AI*

Kirim pertanyaan setelah command.

Contoh:
.ai siapa kamu?
.ai apa kelebihan kamu?
.ai tools apa aja?
.ai download mp3 https://youtu.be/xxxxx
.ai download mp4 https://youtu.be/xxxxx`
            }, { quoted: message });
        }

        const adminExecuted = await runOwnerAdminIntent(sock, chatId, message, query);
        if (adminExecuted) return;

        const toolExecuted = await runToolIntent(sock, chatId, message, query);
        if (toolExecuted) return;

        await sock.sendMessage(chatId, { react: { text: '🤖', key: message.key } }).catch(() => {});
        await sock.presenceSubscribe(chatId).catch(() => {});
        await sock.sendPresenceUpdate('composing', chatId).catch(() => {});

        const provider =
            command === '.gemini' ? 'google' :
            command === '.groq' ? 'groq' :
            undefined;

        // Jangan tempel daftar tools ke semua prompt.
        // Tools sudah ditangani oleh local reply / runToolIntent.
        let finalQuery = query;
        let finalOptions = { provider };

        const germanTerm = allogicGermanTermFromQuery(query);
        const germanLocal = germanTerm ? allogicGermanDirectReply(germanTerm) : null;

        const preparedAi = prepareAiQuery(query, { provider });
        console.log(`[AI INTENT ROUTER] reason=${preparedAi.reason} provider=${preparedAi.options.provider || provider || 'auto'}`);
        const answer = await askAllogicAI(preparedAi.query, preparedAi.options);

        await sock.sendMessage(chatId, { text: answer }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } }).catch(() => {});
    } catch (error) {
        console.error('Allogic AI Command Error:', error.message);
        await sock.sendMessage(chatId, {
            text: `❌ Allogic AI sedang tidak bisa menjawab. Coba lagi nanti atau cek API key di .env.`
        }, { quoted: message });
    }
}

module.exports = aiCommand;