const fs = require('fs-extra')

function getDirectories(source) {
    return (fs.readdirSync(source, { withFileTypes: true })).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name)
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



module.exports = {
    numberToEmoji,
    EmojiToNumber,
    SetLastAction,
    UpdatePlayerAttribute,
    checkPlayerInGroup,
    getDirectories
}
