const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

function extractUrl(text = '') {
    const match = String(text).match(/https?:\/\/[^\s]+/i);
    return match ? match[0].trim() : '';
}

function normalizeYoutubeUrl(url = '') {
    const u = String(url).trim();

    const shorts = u.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/i);
    if (shorts) return `https://www.youtube.com/watch?v=${shorts[1]}`;

    const youtu = u.match(/youtu\.be\/([a-zA-Z0-9_-]+)/i);
    if (youtu) return `https://www.youtube.com/watch?v=${youtu[1]}`;

    return u;
}

function getTextFromMessage(message = {}) {
    const msg = message.message || {};
    return (
        msg.conversation ||
        msg.extendedTextMessage?.text ||
        msg.imageMessage?.caption ||
        msg.videoMessage?.caption ||
        ''
    );
}

function resolveContext(params) {
    const sock = params[0];

    let chatId = '';
    let message = null;
    let args = [];

    if (typeof params[1] === 'string') {
        chatId = params[1];
        message = params[2];
        args = Array.isArray(params[3]) ? params[3] : [];
    } else {
        message = params[1];
        chatId = message?.key?.remoteJid || '';
        args = Array.isArray(params[2]) ? params[2] : [];
    }

    // Penting: ambil dari message asli juga, biar ID YouTube tidak rusak lowercase.
    const argText = args.join(' ').trim();
    const originalText = getTextFromMessage(message);
    const text = argText || originalText;

    return { sock, chatId, message, text };
}

function runYtDlp(url, outputTemplate) {
    return new Promise((resolve, reject) => {
        execFile('yt-dlp', [
            '--no-playlist',
            '--no-warnings',
            '-x',
            '--audio-format', 'mp3',
            '--audio-quality', '192K',
            '-o', outputTemplate,
            url
        ], {
            timeout: 180000,
            maxBuffer: 1024 * 1024 * 30
        }, (err, stdout, stderr) => {
            if (err) {
                err.stderr = stderr;
                return reject(err);
            }
            resolve({ stdout, stderr });
        });
    });
}

async function sendText(sock, chatId, message, text) {
    return sock.sendMessage(chatId, { text }, { quoted: message });
}

async function ytmp3Command(...params) {
    const { sock, chatId, message, text } = resolveContext(params);

    try {
        let url = extractUrl(text);

        if (!url) {
            return await sendText(
                sock,
                chatId,
                message,
                '❌ Kirim link YouTube.\nContoh: .ytmp3 https://youtube.com/shorts/xxxx'
            );
        }

        url = normalizeYoutubeUrl(url);

        if (!/(youtube\.com\/watch\?v=|youtu\.be\/)/i.test(url)) {
            return await sendText(sock, chatId, message, '❌ Link harus dari YouTube.');
        }

        console.log('✅ MASUK KE COMMAND YTMP3 ASLI:', url);

        await sendText(sock, chatId, message, '⏳ Downloading MP3...');

        const baseName = `allogic-ytmp3-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
        const outputTemplate = path.join(os.tmpdir(), `${baseName}.%(ext)s`);

        await runYtDlp(url, outputTemplate);

        const files = fs.readdirSync(os.tmpdir())
            .filter(f => f.startsWith(baseName))
            .map(f => path.join(os.tmpdir(), f));

        const mp3 = files.find(f => f.endsWith('.mp3')) || files[0];

        if (!mp3 || !fs.existsSync(mp3)) {
            return await sendText(sock, chatId, message, '❌ File MP3 tidak ditemukan setelah download.');
        }

        const size = fs.statSync(mp3).size;

        if (size < 20 * 1024) {
            for (const f of files) {
                try { fs.unlinkSync(f); } catch {}
            }
            return await sendText(sock, chatId, message, '❌ Hasil download terlalu kecil. Kemungkinan link dibatasi atau gagal diproses.');
        }

        const buffer = fs.readFileSync(mp3);

        await sock.sendMessage(chatId, {
            audio: buffer,
            mimetype: 'audio/mpeg',
            fileName: 'Allogic-AI.mp3'
        }, { quoted: message });

        for (const f of files) {
            try { fs.unlinkSync(f); } catch {}
        }

    } catch (err) {
        console.error('[YTMP3 ERROR]', err?.stderr || err);
        await sendText(sock, chatId, message, '❌ Gagal download MP3. Coba link lain atau update yt-dlp.');
    }
}

module.exports = ytmp3Command;
