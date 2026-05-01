const fs = require('fs');
const os = require('os');
const { requireOwnerOrGroupAdmin } = require('../lib/allogic-owner-admin-access');

function formatBytes(bytes = 0) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = Number(bytes) || 0;
    let index = 0;

    while (value >= 1024 && index < units.length - 1) {
        value /= 1024;
        index += 1;
    }

    return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function formatUptime(seconds = 0) {
    let rest = Math.floor(Number(seconds) || 0);
    const days = Math.floor(rest / 86400);
    rest %= 86400;
    const hours = Math.floor(rest / 3600);
    rest %= 3600;
    const minutes = Math.floor(rest / 60);
    const secs = rest % 60;

    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (secs || parts.length === 0) parts.push(`${secs}s`);
    return parts.join(' ');
}

function getDiskInfo() {
    if (typeof fs.statfsSync !== 'function') return null;

    try {
        const stat = fs.statfsSync(process.cwd());
        const total = Number(stat.blocks) * Number(stat.bsize);
        const free = Number(stat.bavail) * Number(stat.bsize);
        const used = Math.max(total - free, 0);
        const percent = total > 0 ? (used / total) * 100 : 0;

        return { total, used, free, percent };
    } catch (error) {
        console.error('Error reading disk info:', error?.message || error);
        return null;
    }
}

function formatLoadAverage(values = []) {
    return values.map(value => Number(value || 0).toFixed(2)).join(' / ');
}

async function serverInfoCommand(sock, chatId, message) {
    if (!await requireOwnerOrGroupAdmin(sock, chatId, message)) return;

    try {
        const cpus = os.cpus() || [];
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = Math.max(totalMem - freeMem, 0);
        const memPercent = totalMem > 0 ? (usedMem / totalMem) * 100 : 0;
        const procMem = process.memoryUsage();
        const disk = getDiskInfo();

        const lines = [
            '*Info Server*',
            '',
            `OS: ${os.type()} ${os.release()}`,
            `Platform: ${os.platform()} ${os.arch()}`,
            `CPU: ${cpus[0]?.model || 'Unknown'}`,
            `CPU Core: ${cpus.length || 0}`,
            `Load Avg: ${formatLoadAverage(os.loadavg())}`,
            `RAM: ${formatBytes(usedMem)} / ${formatBytes(totalMem)} (${memPercent.toFixed(1)}%)`,
            `Process RAM: RSS ${formatBytes(procMem.rss)} | Heap ${formatBytes(procMem.heapUsed)}`,
            `Node.js: ${process.version}`,
            `Bot Uptime: ${formatUptime(process.uptime())}`,
            `Server Uptime: ${formatUptime(os.uptime())}`
        ];

        if (disk) {
            lines.splice(9, 0, `Disk: ${formatBytes(disk.used)} / ${formatBytes(disk.total)} (${disk.percent.toFixed(1)}%)`);
        }

        await sock.sendMessage(chatId, { text: lines.join('\n') }, { quoted: message });
    } catch (error) {
        console.error('Error in serverinfo command:', error);
        await sock.sendMessage(chatId, {
            text: 'Gagal mengambil info server.'
        }, { quoted: message });
    }
}

module.exports = serverInfoCommand;
