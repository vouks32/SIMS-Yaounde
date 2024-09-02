const fs = require('fs-extra')
const path = require('path');
const { Actions, groupActions } = require('./actions.js')
const processMessage = async (message) => {




    if (message.isFromGroup) {
        if (message.text.startsWith('!')) {
            let a = groupActions.find(_action => _action.id.startsWith(message.text.split(' ')[0]))
            if (!a) {
                await message.reply({ text: "Je sais pas ce que tu viens d'envoyer...\nMais c'est pas une commande que je connais" })
                await groupActions.find(_action => _action.id.startsWith("!info")).action(message)
                return;
            }
            await a.action(message)
            return
        }
    } else {
        let player;
        // SAVE THIS PLAYER INFO IF FIRST TIME
        if (!checkPlayer(message.fromId).isPlayer) {
            player = SetLastAction(message.fromId, 'idle')
        } else {
            player = checkPlayer(message.fromId).playerInfos
        }
        player.msg = message;
        message.player = player;


        // IF !, then send execute action
        if (message.text.startsWith('!')) {
            let a = Actions.find(_action => _action.id.startsWith(message.text.split(' ')[0]))
            if (!a) {
                await message.reply({ text: "Je sais pas ce que tu viens d'envoyer...\nMais c'est pas une commande que je connais" })
                await Actions.find(_action => _action.id.startsWith("!info")).action(message)
                SetLastAction(player.id, 'idle')
                return;
            }
            await a.action(message)
            return
        }

        // IF NO !, THEN SEND OPTIONS
        if (player.lastAction == "idle") {
            if (player.isDead) {
                await message.reply({ text: "*QUOIIII!?*\nTu ne joue pas encore à SIMS Yaoundé??😑\n\nBref, envoie *!jouer* et commence à jouer!\n\nOu envoie *!info* pour en savoir plus sur moi😊" })
            } else {
                await message.reply({
                    text: "Voici les trucs que tu peux faire, envoie just le chiffre de l'action que tu veux accomplir\n\n" +
                        Actions.filter(_action => !_action.id.startsWith('!') && parseInt(_action.id) > 0 && _action.condition(player)).map(_action => "- *" + numberToEmoji(_action.id) + "* " + _action.name + "\n")
                })
                if (parseInt(Math.random() * 100) < 6)
                    await message.reply({ text: "Oublie pas que je peux faire plein de truc, pour savoir quoi, envoie *!info*" })
                SetLastAction(player.id, 'action')
            }
        } else if (player.lastAction.startsWith("action")) {

            let parentActionIndex = player.lastAction.split('-')[1] || message.text;

            let a = Actions.find(action => action.id == parentActionIndex && action.condition(player))
            if (!a) {
                await message.reply({ text: "Je sais pas ce que tu viens d'envoyer...\nMais c'est pas une des options que je t'ai montré" })
                await message.reply({
                    text: "Voici les trucs que tu peux faire, envoie just le chiffre de l'action que tu veux accomplir\n\n" +
                        Actions.filter(_action => !_action.id.startsWith('!') && parseInt(_action.id) > 0 && _action.condition(player)).map(_action => "- *" + numberToEmoji(_action.id) + "* " + _action.name + "\n")
                })
                SetLastAction(player.id, 'action')
                return;
            } else {

                let actionHierarchyArray = player.lastAction.split('-').slice(1, player.lastAction.split('-').length)
                let subAction = a;
                actionHierarchyArray.forEach(index => {
                    subAction = a.subActions.find(_subAction => _subAction.id == index)
                })

                if (subAction.condition(player)) {
                    message.subAction = subAction;
                    await subAction.action(message)
                    if (subAction.subActions) {
                        await message.reply({
                            text:
                                "*" + subAction.name + "*\n" + subAction.description + "\n" +
                                "" + subAction.subActions.map(_subAction => numberToEmoji(_subAction.id) + " " + _subAction.name)
                        })
                        SetLastAction(player.id, 'action-' + actionHierarchyArray.join('-') + message.text)
                    }
                }
            }
        }
    }
}






const checkPlayerInGroup = (playerId, groupId) => {
    let groupInfos = fs.readJSONSync('./Games/' + groupId + '/gameInfos.json')
    let isPlayer = false
    groupInfos.players.forEach(_player => {
        if (_player.id == playerId) {
            isPlayer = true
        }
    });
    return { isPlayer: isPlayer, groupInfos: groupInfos }
}

const checkPlayer = (playerId) => {
    let isPlayer = false;
    let playerInfos = null;
    if (fs.existsSync('./Players/' + playerId + '/playerInfos.json')) {
        isPlayer = true
        playerInfos = fs.readJSONSync('./Players/' + playerId + '/playerInfos.json')
    }
    return { isPlayer: isPlayer, playerInfos: playerInfos }
}

const numberToEmoji = (number) => {
    if (parseInt(number) == NaN) return number;
    let n = number.toString();
    let emojiNumber = '';
    n.split('').forEach(letter => {
        if (letter == '1')
            emojiNumber += '1️⃣'
        else if (letter == '2')
            emojiNumber += '2️⃣'
        else if (letter == '3')
            emojiNumber += '3️⃣'
        else if (letter == '4')
            emojiNumber += '4️⃣'
        else if (letter == '5')
            emojiNumber += '5️⃣'
        else if (letter == '6')
            emojiNumber += '6️⃣'
        else if (letter == '7')
            emojiNumber += '7️⃣'
        else if (letter == '8')
            emojiNumber += '8️⃣'
        else if (letter == '9')
            emojiNumber += '9️⃣'
        else if (letter == '0')
            emojiNumber += '0️⃣'
        else
            emojiNumber += letter
    })

    return emojiNumber
}

const EmojiToNumber = (emoji) => {
    let n = emoji;
    let number = '';
    n.split('').forEach(letter => {
        if (parseInt(letter) > 0 && parseInt(letter) < 10)
            number += letter;
    })

    return number
}

const SetLastAction = (playerId, action) => {

    if (!fs.existsSync('./Players/' + playerId + '/playerInfos.json')) {
        let defaultPlayerInfos = fs.readJSONSync('./Players/default_player.json')
        defaultPlayerInfos.isDead = true;
        defaultPlayerInfos.id = playerId;
        defaultPlayerInfos.lastAction = action;
        fs.mkdirSync('./Players/' + playerId + '/')
        fs.writeJSONSync('./Players/' + playerId + '/playerInfos.json', defaultPlayerInfos)
        return defaultPlayerInfos;
    }
    let playerInfos = fs.readJSONSync('./Players/' + playerId + '/playerInfos.json')
    playerInfos.lastAction = action;
    fs.writeJSONSync('./Players/' + playerId + '/playerInfos.json', playerInfos)
    return playerInfos
}


const UpdatePlayerAttribute = (playerId, attribute, value) => {
    if (!fs.existsSync('./Players/' + playerId + '/playerInfos.json')) {
        return false;
    }
    let playerInfos = fs.readJSONSync('./Players/' + playerId + '/playerInfos.json')
    playerInfos[attribute] = value;
    fs.writeJSONSync('./Players/' + playerId + '/playerInfos.json', playerInfos)
    return playerInfos
}


const StartGameInGroup = async (groupId, msg) => {

    if (!fs.existsSync('./Games/' + groupId + '/gameInfos.json')) {
        let defaultGroupInfos = fs.readJSONSync('./Games/games_default.json')
        defaultGroupInfos.dateCreated = Date.now();
        defaultGroupInfos.gameDateInfo = {
            actualTime: Date.now(),
            daysPassed: 0
        };
        defaultGroupInfos.id = groupId;
        const group = await msg.sock.groupMetadata(groupId)
        defaultGroupInfos.name = group.subject;
        group.participants.forEach(_participant => {
            if (_participant.id == "237650687834@s.whatsapp.net") return;
            defaultGroupInfos.players.push({ id: _participant.id, isDead: false })
            let player = SetLastAction(_participant.id, 'idle')
            msg.player = player;
            /**
             * 
             * 
             * 
             */
            StartPlayerGame(msg)
        })
        fs.mkdirSync('./Games/' + groupId + '/')
        fs.writeJSONSync('./Games/' + groupId + '/gameInfos.json', defaultGroupInfos)
        return defaultGroupInfos;
    } else {
        msg.reply({ text: "Une partie est déjà en cours wesh !" })
        return
    }
}

const StartPlayerGame = async (msg) => {
    let a = Actions.find(_action => _action.id.startsWith('iniPlayer'))
    await msg.sock.sendMessage(msg.player.id, { text: a.name })
    await a.description(msg);
    SetLastAction(msg.player.id, 'action-' + a.id)
}


module.exports = {
    processMessage: processMessage,
    numberToEmoji: numberToEmoji,
    EmojiToNumber: EmojiToNumber,
    SetLastAction: SetLastAction,
    UpdatePlayerAttribute: UpdatePlayerAttribute,
    StartGameInGroup: StartGameInGroup,
    StartPlayerGame : StartPlayerGame,
    checkPlayerInGroup : checkPlayerInGroup
}