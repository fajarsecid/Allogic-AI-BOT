let downloadMediaMessage;
try {
    ({ downloadMediaMessage } = require('@whiskeysockets/baileys'));
} catch {
    ({ downloadMediaMessage } = require('@adiwajshing/baileys'));
}

const isOwnerOrSudo = require('./isOwner');
const groupLib = require('./index');
const { detectSmartCommand } = require('./allogic-command-intents');

function cleanJid(jid = '') {
    return String(jid).split(':')[0].split('@')[0];
}

function isGroup(chatId) {
    return String(chatId || '').endsWith('@g.us');
}

function getSenderId(message, chatId) {
    return message?.key?.participant ||
        message?.participant ||
        message?.key?.remoteJid ||
        chatId ||
        '';
}

async function getGroupRoles(sock, chatId, message) {
    const senderId = getSenderId(message, chatId);
    const fromMe = Boolean(message?.key?.fromMe);

    let owner = false;
    try {
        owner = fromMe || await isOwnerOrSudo(senderId, sock, chatId);
    } catch {
        owner = fromMe;
    }

    let groupAdmin = false;
    let botAdmin = false;

    if (!isGroup(chatId)) {
        return { owner, groupAdmin, botAdmin, senderId };
    }

    try {
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants || [];

        const senderClean = cleanJid(senderId);
        const sender = participants.find(p =>
            [p.id, p.lid].filter(Boolean).some(id => cleanJid(id) === senderClean)
        );

        groupAdmin = Boolean(sender && (sender.admin === 'admin' || sender.admin === 'superadmin'));

        const botIds = [sock.user?.id, sock.user?.lid].filter(Boolean).map(cleanJid);
        const bot = participants.find(p =>
            [p.id, p.lid].filter(Boolean).some(id => botIds.includes(cleanJid(id)))
        );

        botAdmin = Boolean(bot && (bot.admin === 'admin' || bot.admin === 'superadmin'));
    } catch (e) {
        console.error('Role check error:', e.message);
    }

    return { owner, groupAdmin, botAdmin, senderId };
}

function detectAction(text) {
    const t = String(text || '').toLowerCase();

    if (/(matikan|nonaktifkan|off|disable|stop)/i.test(t)) return 'off';
    if (/(hidupkan|aktifkan|nyalakan|on|enable|turn on)/i.test(t)) return 'on';

    return null;
}

function detectAntilinkAction(text) {
    const t = String(text || '').toLowerCase();

    if (/(kick|tendang|keluarin|remove)/i.test(t)) return 'kick';
    if (/(warn|peringatan|teguran)/i.test(t)) return 'warn';
    return 'delete';
}

// NATURAL_ADMIN_PATTERNS:
 // Tujuan: AI paham kalimat natural seperti:
 // "jadikan @user sebagai admin"
 // "angkat @user jadi admin"
 // "turunkan @user dari admin"
 // "keluarkan @user dari grup"
 // bukan hanya command literal seperti .promote / .demote / .kick
function isAdminIntent(text) {
    const smart = detectSmartCommand(text);
    return Boolean(smart && smart.type === 'admin');
}

function isOwnerIntent(text) {
    const smart = detectSmartCommand(text);
    return Boolean(smart && smart.type === 'owner');
}

function getMentionedOrQuotedUsers(message) {
    const ctx = message?.message?.extendedTextMessage?.contextInfo || {};
    const mentioned = ctx.mentionedJid || [];
    const quotedParticipant = ctx.participant;

    const users = [...mentioned];
    if (quotedParticipant) users.push(quotedParticipant);

    return [...new Set(users)].filter(Boolean);
}

async function requireGroupAndBotAdmin(sock, chatId, message, roles) {
    if (!isGroup(chatId)) {
        await sock.sendMessage(chatId, {
            text: '❌ Perintah admin grup harus dijalankan di dalam grup.'
        }, { quoted: message });
        return false;
    }

    if (!roles.botAdmin) {
        await sock.sendMessage(chatId, {
            text: '❌ Bot harus jadi admin grup dulu untuk menjalankan perintah ini.'
        }, { quoted: message });
        return false;
    }

    return true;
}

function parseAfterKeyword(text, keywords) {
    let out = String(text || '').trim();

    for (const kw of keywords) {
        out = out.replace(new RegExp(kw, 'i'), '').trim();
    }

    out = out.replace(/^(jadi|menjadi|ke|to|:|-)/i, '').trim();
    return out;
}

async function getImageBufferFromMessage(sock, chatId, message) {
    const msg = message?.message || {};
    const ctx = msg?.extendedTextMessage?.contextInfo || {};
    const quoted = ctx.quotedMessage;

    if (quoted?.imageMessage) {
        const quotedMsg = {
            key: {
                remoteJid: chatId,
                id: ctx.stanzaId,
                participant: ctx.participant
            },
            message: quoted
        };

        return await downloadMediaMessage(
            quotedMsg,
            'buffer',
            {},
            {
                logger: console,
                reuploadRequest: sock.updateMediaMessage
            }
        );
    }

    if (msg?.imageMessage) {
        return await downloadMediaMessage(
            message,
            'buffer',
            {},
            {
                logger: console,
                reuploadRequest: sock.updateMediaMessage
            }
        );
    }

    return null;
}

async function runAdminIntent(sock, chatId, message, query, roles) {
    const text = String(query || '').trim();
    const t = text.toLowerCase();
    const smartCommand = detectSmartCommand(text);

    if (!isAdminIntent(text)) return false;

    const allowed = roles.owner || roles.groupAdmin;

    if (!allowed) {
        await sock.sendMessage(chatId, {
            text: '❌ Perintah admin hanya bisa dijalankan oleh owner bot atau admin grup.'
        }, { quoted: message });
        return true;
    }

    const ok = await requireGroupAndBotAdmin(sock, chatId, message, roles);
    if (!ok) return true;

    const action = detectAction(text);

    try {
        if (smartCommand?.command === 'setgpp') {
            const buffer = await getImageBufferFromMessage(sock, chatId, message);

            if (!buffer) {
                await sock.sendMessage(chatId, {
                    text: 'Reply gambar dengan perintah:\n.ai set group pp'
                }, { quoted: message });
                return true;
            }

            await sock.updateProfilePicture(chatId, buffer);
            await sock.sendMessage(chatId, {
                text: '✅ Foto profil grup berhasil diganti.'
            }, { quoted: message });
            return true;
        }

        if (/\b(setgname|set group name|ganti nama grup|ubah nama grup)\b/i.test(t)) {
            const name = parseAfterKeyword(text, [
                'setgname',
                'set group name',
                'ganti nama grup',
                'ubah nama grup'
            ]);

            if (!name) {
                await sock.sendMessage(chatId, {
                    text: 'Nama grupnya apa?\nContoh: .ai ganti nama grup jadi Allogic Community'
                }, { quoted: message });
                return true;
            }

            await sock.groupUpdateSubject(chatId, name);
            await sock.sendMessage(chatId, {
                text: `✅ Nama grup berhasil diganti menjadi:\n${name}`
            }, { quoted: message });
            return true;
        }

        if (/\b(setgdesc|set group desc|ganti deskripsi grup|ubah deskripsi grup|deskripsi grup)\b/i.test(t)) {
            const desc = parseAfterKeyword(text, [
                'setgdesc',
                'set group desc',
                'ganti deskripsi grup',
                'ubah deskripsi grup',
                'deskripsi grup'
            ]);

            if (!desc) {
                await sock.sendMessage(chatId, {
                    text: 'Deskripsi grupnya apa?\nContoh: .ai ubah deskripsi grup jadi Grup belajar dan diskusi.'
                }, { quoted: message });
                return true;
            }

            await sock.groupUpdateDescription(chatId, desc);
            await sock.sendMessage(chatId, {
                text: '✅ Deskripsi grup berhasil diganti.'
            }, { quoted: message });
            return true;
        }

        if (/\b(resetlink|reset link|reset tautan|link grup baru)\b/i.test(t)) {
            await sock.groupRevokeInvite(chatId);
            const code = await sock.groupInviteCode(chatId);

            await sock.sendMessage(chatId, {
                text: `✅ Link grup berhasil direset.\nhttps://chat.whatsapp.com/${code}`
            }, { quoted: message });
            return true;
        }

        if (/(anti\s*link|antilink)/i.test(t)) {
            if (!action) {
                await sock.sendMessage(chatId, {
                    text: 'Mau hidupkan atau matikan antilink?\nContoh: .ai hidupkan anti link'
                }, { quoted: message });
                return true;
            }

            if (action === 'on') {
                const antiAction = detectAntilinkAction(text);
                await groupLib.setAntilink(chatId, 'on', antiAction);
                await sock.sendMessage(chatId, {
                    text: `✅ Antilink berhasil diaktifkan.\nAksi: ${antiAction}`
                }, { quoted: message });
                return true;
            }

            await groupLib.removeAntilink(chatId, 'on');
            await sock.sendMessage(chatId, {
                text: '✅ Antilink berhasil dimatikan.'
            }, { quoted: message });
            return true;
        }

        if (/(anti\s*badword|antibadword|anti\s*kata\s*kasar|anti\s*toxic)/i.test(t)) {
            if (!action) {
                await sock.sendMessage(chatId, {
                    text: 'Mau hidupkan atau matikan antibadword?\nContoh: .ai hidupkan anti badword'
                }, { quoted: message });
                return true;
            }

            if (action === 'on') {
                await groupLib.setAntiBadword(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, {
                    text: '✅ Antibadword berhasil diaktifkan.\nAksi: delete'
                }, { quoted: message });
                return true;
            }

            await groupLib.removeAntiBadword(chatId, 'on');
            await sock.sendMessage(chatId, {
                text: '✅ Antibadword berhasil dimatikan.'
            }, { quoted: message });
            return true;
        }

        if (/(anti\s*tag|antitag)/i.test(t)) {
            if (!action) {
                await sock.sendMessage(chatId, {
                    text: 'Mau hidupkan atau matikan antitag?\nContoh: .ai hidupkan antitag'
                }, { quoted: message });
                return true;
            }

            if (action === 'on') {
                await groupLib.setAntitag(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, {
                    text: '✅ Antitag berhasil diaktifkan.'
                }, { quoted: message });
                return true;
            }

            await groupLib.removeAntitag(chatId, 'on');
            await sock.sendMessage(chatId, {
                text: '✅ Antitag berhasil dimatikan.'
            }, { quoted: message });
            return true;
        }

        if (/\b(chatbot|bot\s*chat)\b/i.test(t)) {
            if (!action) {
                await sock.sendMessage(chatId, {
                    text: 'Mau hidupkan atau matikan chatbot grup?\nContoh: .ai hidupkan chatbot'
                }, { quoted: message });
                return true;
            }

            if (action === 'on') {
                await groupLib.setChatbot(chatId, true);
                await sock.sendMessage(chatId, {
                    text: '✅ Chatbot grup berhasil diaktifkan.'
                }, { quoted: message });
                return true;
            }

            await groupLib.removeChatbot(chatId);
            await sock.sendMessage(chatId, {
                text: '✅ Chatbot grup berhasil dimatikan.'
            }, { quoted: message });
            return true;
        }

        if (/\b(welcome|selamat\s*datang)\b/i.test(t)) {
            if (action === 'on') {
                if (typeof groupLib.addWelcome === 'function') {
                    await groupLib.addWelcome(chatId, true, 'Selamat datang @user di grup @group!');
                }
                await sock.sendMessage(chatId, { text: '✅ Welcome berhasil diaktifkan.' }, { quoted: message });
                return true;
            }

            if (action === 'off') {
                if (typeof groupLib.delWelcome === 'function') await groupLib.delWelcome(chatId);
                await sock.sendMessage(chatId, { text: '✅ Welcome berhasil dimatikan.' }, { quoted: message });
                return true;
            }
        }

        if (/\b(goodbye|left|keluar\s*grup)\b/i.test(t)) {
            if (action === 'on') {
                if (typeof groupLib.addGoodbye === 'function') {
                    await groupLib.addGoodbye(chatId, true, 'Selamat tinggal @user.');
                }
                await sock.sendMessage(chatId, { text: '✅ Goodbye berhasil diaktifkan.' }, { quoted: message });
                return true;
            }

            if (action === 'off') {
                if (typeof groupLib.delGoodBye === 'function') await groupLib.delGoodBye(chatId);
                await sock.sendMessage(chatId, { text: '✅ Goodbye berhasil dimatikan.' }, { quoted: message });
                return true;
            }
        }

        if (smartCommand?.command === 'kick') {
            const users = getMentionedOrQuotedUsers(message);
            if (!users.length) {
                await sock.sendMessage(chatId, {
                    text: 'Reply atau mention user yang mau dikeluarkan.'
                }, { quoted: message });
                return true;
            }

            await sock.groupParticipantsUpdate(chatId, users, 'remove');
            await sock.sendMessage(chatId, {
                text: `✅ ${users.length} user berhasil dikeluarkan.`
            }, { quoted: message });
            return true;
        }

        if (smartCommand?.command === 'promote') {
            const users = getMentionedOrQuotedUsers(message);
            if (!users.length) {
                await sock.sendMessage(chatId, {
                    text: 'Reply atau mention user yang mau dijadikan admin.'
                }, { quoted: message });
                return true;
            }

            await sock.groupParticipantsUpdate(chatId, users, 'promote');
            await sock.sendMessage(chatId, {
                text: `✅ ${users.length} user berhasil dijadikan admin.`
            }, { quoted: message });
            return true;
        }

        if (smartCommand?.command === 'demote') {
            const users = getMentionedOrQuotedUsers(message);
            if (!users.length) {
                await sock.sendMessage(chatId, {
                    text: 'Reply atau mention admin yang mau diturunkan.'
                }, { quoted: message });
                return true;
            }

            await sock.groupParticipantsUpdate(chatId, users, 'demote');
            await sock.sendMessage(chatId, {
                text: `✅ ${users.length} admin berhasil diturunkan.`
            }, { quoted: message });
            return true;
        }

        if (/\b(mute|tutup grup|hanya admin)\b/i.test(t)) {
            await sock.groupSettingUpdate(chatId, 'announcement');
            await sock.sendMessage(chatId, {
                text: '✅ Grup berhasil dimute. Hanya admin yang bisa kirim pesan.'
            }, { quoted: message });
            return true;
        }

        if (/\b(unmute|buka grup|semua bisa chat)\b/i.test(t)) {
            await sock.groupSettingUpdate(chatId, 'not_announcement');
            await sock.sendMessage(chatId, {
                text: '✅ Grup berhasil dibuka. Semua member bisa kirim pesan.'
            }, { quoted: message });
            return true;
        }

        if (/\b(tagall|tag semua)\b/i.test(t) || /\b(hidetag|hidden tag)\b/i.test(t)) {
            const metadata = await sock.groupMetadata(chatId);
            const participants = metadata.participants || [];
            const mentions = participants.map(p => p.id).filter(Boolean);

            const msg = text
                .replace(/tagall|tag semua|hidetag|hidden tag/gi, '')
                .trim() || 'Pesan dari admin grup.';

            await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: message });
            return true;
        }

        return false;
    } catch (err) {
        console.error('Admin intent error:', err);
        await sock.sendMessage(chatId, {
            text: '❌ Gagal menjalankan perintah admin. Cek log server.'
        }, { quoted: message });
        return true;
    }
}

async function runOwnerIntent(sock, chatId, message, query, roles) {
    const text = String(query || '').trim();

    if (!isOwnerIntent(text)) return false;

    if (!roles.owner) {
        await sock.sendMessage(chatId, {
            text: '❌ Perintah owner hanya bisa dijalankan oleh owner bot.'
        }, { quoted: message });
        return true;
    }

    await sock.sendMessage(chatId, {
        text: `✅ Kamu terdeteksi sebagai owner.\nUntuk command owner sensitif ini, pakai command langsung agar aman:\n.${text.replace(/^\./, '')}`
    }, { quoted: message });

    return true;
}

async function runOwnerAdminIntent(sock, chatId, message, query) {
    const text = String(query || '').trim();
    if (!text) return false;

    const admin = isAdminIntent(text);
    const owner = isOwnerIntent(text);

    if (!admin && !owner) return false;

    const roles = await getGroupRoles(sock, chatId, message);

    if (admin) return await runAdminIntent(sock, chatId, message, text, roles);
    if (owner) return await runOwnerIntent(sock, chatId, message, text, roles);

    return false;
}

module.exports = {
    runOwnerAdminIntent,
    getGroupRoles
};
