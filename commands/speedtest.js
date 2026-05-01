const fetch = require('node-fetch');
const { requireOwnerOrGroupAdmin } = require('../lib/allogic-owner-admin-access');

const SPEED_BASE = 'https://speed.cloudflare.com';
const DOWNLOAD_BYTES = 5 * 1024 * 1024;
const UPLOAD_BYTES = 1024 * 1024;

function formatBytes(bytes = 0) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = Number(bytes) || 0;
    let index = 0;

    while (value >= 1024 && index < units.length - 1) {
        value /= 1024;
        index += 1;
    }

    return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function formatMbps(value) {
    if (!Number.isFinite(value)) return '-';
    return `${value.toFixed(value >= 100 ? 1 : 2)} Mbps`;
}

function formatSeconds(value) {
    if (!Number.isFinite(value)) return '-';
    return `${value.toFixed(2)}s`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

    try {
        return await fetch(url, {
            ...options,
            signal: controller ? controller.signal : undefined
        });
    } finally {
        if (timer) clearTimeout(timer);
    }
}

function elapsedSeconds(start) {
    return Number(process.hrtime.bigint() - start) / 1e9;
}

async function measureLatency() {
    const samples = [];

    for (let i = 0; i < 3; i += 1) {
        const start = process.hrtime.bigint();
        const res = await fetchWithTimeout(`${SPEED_BASE}/cdn-cgi/trace?ts=${Date.now()}-${i}`, {
            headers: { 'Cache-Control': 'no-cache' }
        }, 8000);

        await res.text().catch(() => '');
        if (!res.ok) throw new Error(`Latency test failed (${res.status})`);
        samples.push(elapsedSeconds(start) * 1000);
    }

    return samples.reduce((sum, item) => sum + item, 0) / samples.length;
}

async function measureDownload() {
    const start = process.hrtime.bigint();
    const res = await fetchWithTimeout(`${SPEED_BASE}/__down?bytes=${DOWNLOAD_BYTES}&ts=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' }
    }, 25000);

    if (!res.ok) throw new Error(`Download test failed (${res.status})`);

    const body = await res.buffer();
    const seconds = Math.max(elapsedSeconds(start), 0.001);
    const mbps = (body.length * 8) / seconds / 1000000;

    return { bytes: body.length, seconds, mbps };
}

async function measureUpload() {
    const payload = Buffer.alloc(UPLOAD_BYTES, '0');
    const start = process.hrtime.bigint();
    const res = await fetchWithTimeout(`${SPEED_BASE}/__up?ts=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: payload
    }, 25000);

    await res.text().catch(() => '');
    if (!res.ok) throw new Error(`Upload test failed (${res.status})`);

    const seconds = Math.max(elapsedSeconds(start), 0.001);
    const mbps = (payload.length * 8) / seconds / 1000000;

    return { bytes: payload.length, seconds, mbps };
}

async function speedtestCommand(sock, chatId, message) {
    if (!await requireOwnerOrGroupAdmin(sock, chatId, message)) return;

    await sock.sendMessage(chatId, {
        text: 'Menjalankan speedtest server, tunggu sebentar...'
    }, { quoted: message });

    try {
        const latency = await measureLatency();
        const download = await measureDownload();

        let upload = null;
        let uploadError = '';

        try {
            upload = await measureUpload();
        } catch (error) {
            uploadError = error?.message || 'gagal dites';
        }

        const uploadText = upload
            ? `${formatMbps(upload.mbps)} (${formatBytes(upload.bytes)} / ${formatSeconds(upload.seconds)})`
            : `Gagal dites (${uploadError})`;

        const text = [
            '*Speedtest Server*',
            '',
            `Ping: ${latency.toFixed(0)} ms`,
            `Download: ${formatMbps(download.mbps)} (${formatBytes(download.bytes)} / ${formatSeconds(download.seconds)})`,
            `Upload: ${uploadText}`,
            'Provider: Cloudflare'
        ].join('\n');

        await sock.sendMessage(chatId, { text }, { quoted: message });
    } catch (error) {
        console.error('Error in speedtest command:', error);
        await sock.sendMessage(chatId, {
            text: `Gagal menjalankan speedtest: ${error?.message || 'unknown error'}`
        }, { quoted: message });
    }
}

module.exports = speedtestCommand;
