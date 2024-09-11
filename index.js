const makeWASocket = require('@whiskeysockets/baileys').default;
const fs = require('fs-extra')
const path = require('path')
const { DisconnectReason, useMultiFileAuthState, downloadMediaMessage } = require('@whiskeysockets/baileys');
const { processMessage, Routine } = require('./Game');
const { processCreditUnionMessage } = require('./CreditUnion/CreditUnion');

let sock

async function connectionLogic() {

    const { state, saveCreds } = await useMultiFileAuthState(path.join(process.cwd(), 'auth_info_baileys'))
    sock = makeWASocket({
        // can provide additional config here
        auth: state,
        printQRInTerminal: true
    })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('messages.upsert', async (msgData) => {
        console.log("  ==================================================================== ")
        console.log('messages.upsert', JSON.stringify(msgData))
        if (msgData.messages[0].key?.remoteJid?.split('@')[1] == "broadcast") {
            //Handle BROADCASTS AND STATUSES
            return;
        }
        if (msgData.messages[0].key?.fromMe) {
            return;
        }

        let hasImage = false
        const m = msgData.messages[0]
        const messageType = Object.keys(m.message)[0]// get what type of message it is -- text, image, video
        // if the message is an image
        if (messageType === 'imageMessage') {
            hasImage = true;
        }

        let chatId = msgData.messages[0]?.key?.remoteJid;
        let msg = {
            fromId: msgData.messages[0]?.key?.participant ? msgData.messages[0]?.key?.participant : msgData.messages[0]?.key?.remoteJid,
            isFromGroup: msgData.messages[0]?.key?.participant ? true : false,
            groupId: msgData.messages[0]?.key?.participant ? msgData.messages[0]?.key?.remoteJid : null,
            text: msgData.messages[0]?.message?.conversation || msgData.messages[0]?.message?.extendedTextMessage?.text || "",
            mentions: msgData.messages[0]?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [],
            hasImage: hasImage,
            reply: async (_message) => {
                const sentMsg = await sock.sendMessage(chatId, { text: _message.text + "\n\n✩𝑽𝒐𝒖𝒌𝒔 𝒃𝒐𝒕✩", mentions: _message.mentions || [] })
            },
            replyTo: async (_message) => {
                const sentMsg = await sock.sendMessage(chatId, { text: _message.text + "\n\n✩𝑽𝒐𝒖𝒌𝒔 𝒃𝒐𝒕✩", mentions: _message.mentions || [] }, { quoted: msgData.messages[0] })
            },
            downloadImage: async (path, fileName) => {
                const m = msgData.messages[0]

                if (!m.message) return // if there is no text or media message
                const messageType = Object.keys(m.message)[0]// get what type of message it is -- text, image, video
                // if the message is an image
                if (messageType === 'imageMessage') {
                    // download the message
                    const buffer = await downloadMediaMessage(
                        m,
                        'buffer',
                        {}/*,
                        {
                            logger,
                            // pass this so that baileys can request a reupload of media
                            // that has been deleted
                            reuploadRequest: sock.updateMediaMessage
                        }*/
                    )
                    // save to file
                    if (!fs.existsSync(path))
                        fs.mkdirSync(path)
                    await fs.writeFile(path + fileName, buffer)
                    return { filePath: path + fileName, caption: m.message.imageMessage.caption }
                } else {
                    return false
                }
            },
            sock: null
        }

        console.log('MESSAGE: ', msg)

        msg.sock = sock;

        let group;
        if (msg.isFromGroup) {
            group = await msg.sock.groupMetadata(msg.groupId);
        }

        if (group && group.subject.toLowerCase().startsWith('credit')) {
            try {
                processCreditUnionMessage(msg)
            } catch (error) {
                console.log(error.toString())
                await sock.sendMessage("237676073559@s.whatsapp.net", {
                    text: "*ERROR:*\n" + error.toString() + "\n\n*Info:*\n" +
                        "*From:* " + msg.fromId +
                        "\n*Group?:* " + msg.isFromGroup +
                        (msg.isFromGroup ? "*\nGroup?:* " + msg.groupId : "") +
                        "\n*text:* " + msg.text
                })
            }
        } else {
            try {
                processMessage(msg)
            } catch (error) {
                console.log(error.toString())
                await sock.sendMessage("237676073559@s.whatsapp.net", {
                    text: "*ERROR:*\n" + error.toString() + "\n\n*Info:*\n" +
                        "*From:* " + msg.fromId +
                        "\n*Group?:* " + msg.isFromGroup +
                        (msg.isFromGroup ? "*\nGroup?:* " + msg.groupId : "") +
                        "\n*text:* " + msg.text
                })
            }
        }

        //console.log( "GROUP INFOS : ",JSON.stringify(msgData.messages[0]?.key?.remoteJid))

        //const metadata = await sock.groupMetadata(msgData.messages[0]?.key?.remoteJid)
        //console.log( "GROUP INFOS : ",JSON.stringify(metadata))
    })
    sock.ev.on('groups.upsert', (msgData) => {
        console.log("  ==================================================================== ")
        console.log("groups.upsert", JSON.stringify(msgData))

    })
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            //console.log(qr)
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            if (shouldReconnect) {
                connectionLogic();
            }
        }
    })
}

const thisMin = new Date().getMinutes();
const now = new Date();
let millisecsToAdd = 10 //(60 - thisMin) * 60 * 1000;
setTimeout(async () => {
    try {
        Routine()
    } catch (error) {
        console.log(error.toString())
        await sock.sendMessage("237676073559@s.whatsapp.net", {
            text: "*ERROR:*\n" + error.toString() + "\n\n*Info:*\n" +
                "*From: Routine in setTimeout* "
        })
    }
    setInterval(async () => {
        try {
            Routine()
        } catch (error) {
            console.log(error.toString())
            await sock.sendMessage("237676073559@s.whatsapp.net", {
                text: "*ERROR:*\n" + error.toString() + "\n\n*Info:*\n" +
                    "*From: Routine in SetInterval* "
            })
        }
        if (new Date().getMinutes() > 58 || new Date().getMinutes() < 2) {

        }
    }, 1000 /*10 * 60 * 1000*/)
}, millisecsToAdd)

const CreditUnionRoutine = () => {

}

connectionLogic()


const sendMessage = async (playerId, _message)=>{
    const sentMsg = await sock.sendMessage(playerId, { text: _message.text + "\n\n✩𝑽𝒐𝒖𝒌𝒔 𝒃𝒐𝒕✩", mentions: _message.mentions || [] })
    return sentMsg
}

module.exports = { 
    sendMessage
}