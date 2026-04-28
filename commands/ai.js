const { askAllogicAI } = require('../lib/allogic-ai');
const { runToolIntent } = require('../lib/allogic-tools');
const { runOwnerAdminIntent } = require('../lib/allogic-admin-tools');

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
        const answer = await askAllogicAI(query, { provider });

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
