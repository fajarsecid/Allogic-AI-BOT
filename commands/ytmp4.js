const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

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
    let text = '';

    if (typeof params[1] === 'string') {
        chatId = params[1];
        message = params[2];
        text = Array.isArray(params[3]) ? params[3].join(' ') : String(params[3] || '');
    } else {
        message = params[1];
        chatId = message?.key?.remoteJid || '';
        text = Array.isArray(params[2]) ? params[2].join(' ') : String(params[2] || '');
    }

    if (!text) text = getTextFromMessage(message);

    return { sock, chatId, message, text };
}

async function sendText(sock, chatId, message, text) {
    return sock.sendMessage(chatId, { text }, { quoted: message });
}

async function ytmp4Command(...params) {
    const { sock, chatId, message, text } = resolveContext(params);

    try {
        let url = extractUrl(text);

        if (!url) {
            return await sendText(
                sock,
                chatId,
                message,
                '❌ Kirim link YouTube.\nContoh: .ytmp4 https://youtube.com/shorts/xxxx'
            );
        }

        url = normalizeYoutubeUrl(url);

        if (!/(youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)/i.test(url)) {
            return await sendText(sock, chatId, message, '❌ Link harus dari YouTube.');
        }

        await sendText(sock, chatId, message, '⏳ Downloading YouTube MP4...');

        const base = path.join(os.tmpdir(), `allogic-ytmp4-${Date.now()}`);
        const outputTemplate = `${base}.%(ext)s`;

        await execFileAsync('yt-dlp', [
            '--no-playlist',
            '--no-warnings',
            '--merge-output-format', 'mp4',
            '-f', 'bv*[height<=720]+ba/b[height<=720]/best[height<=720]/best',
            '-o', outputTemplate,
            url
        ], {
            timeout: 180000,
            maxBuffer: 1024 * 1024 * 20
        });

        const files = fs.readdirSync(os.tmpdir())
            .filter(f => f.startsWith(path.basename(base)))
            .map(f => path.join(os.tmpdir(), f));

        const mp4 = files.find(f => f.endsWith('.mp4')) || files[0];

        if (!mp4 || !fs.existsSync(mp4)) {
            return await sendText(sock, chatId, message, '❌ Gagal download video dari link itu.');
        }

        await sock.sendMessage(chatId, {
            video: { url: mp4 },
            mimetype: 'video/mp4',
            caption: '✅ Downloaded by Allogic AI'
        }, { quoted: message });

        for (const f of files) {
            try { fs.unlinkSync(f); } catch {}
        }

    } catch (err) {
        console.error('YTMP4 exact URL error:', err);
        await sendText(sock, chatId, message, '❌ Gagal download MP4. Link mungkin dibatasi, private, atau downloader YouTube sedang error.');
    }
}

module.exports = ytmp4Command;
