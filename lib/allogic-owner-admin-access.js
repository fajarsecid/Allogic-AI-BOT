const isAdmin = require('./isAdmin');
const isOwnerOrSudo = require('./isOwner');

async function checkOwnerOrGroupAdmin(sock, chatId, message) {
    const senderId = message?.key?.participant || message?.key?.remoteJid || '';
    const isGroup = String(chatId || '').endsWith('@g.us');

    if (message?.key?.fromMe) {
        return { allowed: true, role: 'owner', isGroup, senderId };
    }

    try {
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        if (isOwner) {
            return { allowed: true, role: 'owner', isGroup, senderId };
        }
    } catch (error) {
        console.error('[Owner/Admin Access] Owner check failed:', error?.message || error);
    }

    if (isGroup) {
        try {
            const adminStatus = await isAdmin(sock, chatId, senderId);
            if (adminStatus.isSenderAdmin) {
                return { allowed: true, role: 'admin', isGroup, senderId };
            }
        } catch (error) {
            console.error('[Owner/Admin Access] Admin check failed:', error?.message || error);
        }
    }

    return { allowed: false, role: 'none', isGroup, senderId };
}

async function requireOwnerOrGroupAdmin(sock, chatId, message) {
    const access = await checkOwnerOrGroupAdmin(sock, chatId, message);

    if (access.allowed) return true;

    const text = access.isGroup
        ? 'Command ini khusus owner/sudo atau admin grup.'
        : 'Command ini khusus owner/sudo di private chat.';

    await sock.sendMessage(chatId, { text }, { quoted: message });
    return false;
}

module.exports = {
    checkOwnerOrGroupAdmin,
    requireOwnerOrGroupAdmin
};
