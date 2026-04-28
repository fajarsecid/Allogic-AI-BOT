const songCommand = require('../commands/song');
const videoCommand = require('../commands/video');

const TOOL_CATALOG = `
Tools Allogic AI yang tersedia di bot WhatsApp:

Downloader:
- YouTube MP3/audio: .song, .play, .mp3, .ytmp3
- YouTube MP4/video: .video, .ytmp4
- TikTok downloader: .tiktok, .tt
- Instagram downloader: .instagram, .insta, .ig
- Facebook downloader: .facebook, .fb
- Spotify: .spotify

AI:
- .ai <pertanyaan>
- .ask <pertanyaan>
- .gpt <pertanyaan>
- .gemini <pertanyaan>
- .groq <pertanyaan>

Media/tools:
- Sticker: .sticker
- Text to speech: .tts
- Translate: .translate / .trt
- Screenshot website: .ss / .ssweb / .screenshot
- Remove background: .removebg
- Remini/enhance: .remini
- Image generation: .imagine

Info:
- Weather: .weather
- News: .news
- GitHub: .github
- Lyrics: .lyrics

Group tools:
- Tagall, hidetag, promote, demote, kick, mute, welcome, goodbye, antilink, antibadword, dll.
Catatan: tools admin grup tidak boleh dijalankan otomatis dari AI demi keamanan.
`.trim();

function toolsSummary() {
    return `🤖 *Tools Allogic AI*

*Downloader*
• YouTube MP3/audio: *.song / .play / .mp3 / .ytmp3*
• YouTube MP4/video: *.video / .ytmp4*
• TikTok: *.tiktok / .tt*
• Instagram: *.instagram / .insta / .ig*
• Facebook: *.facebook / .fb*
• Spotify: *.spotify*

*AI*
• *.ai* / *.ask* / *.gpt* / *.gemini* / *.groq*

*Media*
• *.sticker*, *.tts*, *.translate*, *.ss*, *.removebg*, *.remini*, *.imagine*

Kalau mau download YouTube lewat AI, bisa tulis:
*.ai download mp3 https://youtu.be/...*
atau
*.ai download mp4 https://youtu.be/...*`;
}

function isToolListQuestion(text) {
    const t = String(text || '').toLowerCase();
    return /(tools apa|tool apa|fitur apa|bisa apa aja|command apa|perintah apa|daftar tools|daftar fitur)/i.test(t);
}

function extractYoutubeUrl(text) {
    const match = String(text || '').match(/https?:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\/[^\s]+/i);
    return match ? match[0] : '';
}

function cleanDownloadQuery(text) {
    return String(text || '')
        .replace(/^download\s*/i, '')
        .replace(/youtube/ig, '')
        .replace(/\bmp3\b/ig, '')
        .replace(/\bmp4\b/ig, '')
        .replace(/\baudio\b/ig, '')
        .replace(/\bvideo\b/ig, '')
        .replace(/\blagu\b/ig, '')
        .replace(/\byt\b/ig, '')
        .trim();
}

function detectToolIntent(text) {
    const raw = String(text || '').trim();
    const t = raw.toLowerCase();

    const wantsDownload = /(download|unduh|ambil|save|simpan|dl)/i.test(t);
    const mentionsYoutube = /(youtube|youtu\.be|ytmp3|ytmp4|\bmp3\b|\bmp4\b|lagu|audio|video)/i.test(t);

    if (!wantsDownload || !mentionsYoutube) return null;

    const url = extractYoutubeUrl(raw);
    const target = url || cleanDownloadQuery(raw);

    const wantsAudio = /(\bmp3\b|audio|lagu|musik|song|ytmp3)/i.test(t);
    const wantsVideo = /(\bmp4\b|video|ytmp4)/i.test(t);

    if (wantsAudio && target) {
        return { type: 'youtube_audio', command: '.song', target };
    }

    if (wantsVideo && target) {
        return { type: 'youtube_video', command: '.video', target };
    }

    if (target) {
        return { type: 'youtube_video', command: '.video', target };
    }

    return { type: 'youtube_unknown', command: null, target: '' };
}

function cloneMessageWithText(message, text) {
    const cloned = JSON.parse(JSON.stringify(message || {}));
    cloned.message = { conversation: text };
    return cloned;
}

async function runToolIntent(sock, chatId, message, query) {
    const intent = detectToolIntent(query);
    if (!intent) return false;

    if (!intent.target) {
        await sock.sendMessage(chatId, {
            text: `Bisa. Kirim link atau judul YouTube-nya ya.\n\nContoh:\n.ai download mp3 https://youtu.be/xxxxx\n.ai download mp4 https://youtu.be/xxxxx`
        }, { quoted: message });
        return true;
    }

    if (intent.type === 'youtube_audio') {
        await sock.sendMessage(chatId, {
            text: `🎵 Siap, aku coba download audionya...\n\n${intent.target}`
        }, { quoted: message });

        const toolMessage = cloneMessageWithText(message, `.song ${intent.target}`);
        await songCommand(sock, chatId, toolMessage);
        return true;
    }

    if (intent.type === 'youtube_video') {
        await sock.sendMessage(chatId, {
            text: `🎬 Siap, aku coba download videonya...\n\n${intent.target}`
        }, { quoted: message });

        const toolMessage = cloneMessageWithText(message, `.video ${intent.target}`);
        await videoCommand(sock, chatId, toolMessage);
        return true;
    }

    return false;
}

module.exports = {
    TOOL_CATALOG,
    toolsSummary,
    isToolListQuestion,
    detectToolIntent,
    runToolIntent
};
