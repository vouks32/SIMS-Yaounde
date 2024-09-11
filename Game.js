const fs = require('fs-extra')
const path = require('path');
const { Actions, groupActions } = require('./actions.js')
const { getDirectories, SetLastAction, checkPlayerInGroup, checkPlayer, numberToEmoji, EmojiToNumber, UpdatePlayerAttribute } = require('./functions.js')
const Game = require('./functions.js')
const {sendMessage} = require('./index.js')



const processMessage = async (message) => {

    if (message.isFromGroup) {
        if (message.text.startsWith('!')) {
            let a = groupActions.find(_action => _action.id.startsWith(message.text.split(' ')[0]))
            if (!a) {
                await message.reply({ text: "Je sais pas ce que tu viens d'envoyer...\nMais c'est pas une commande que je connais" })
                await groupActions.find(_action => _action.id.startsWith("!info")).action(message)
                return;
            }
            console.log("action trouvé")
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
                        Actions.filter(_action => !_action.id.startsWith('!') && parseInt(_action.id) > 0 && _action.condition(message)).map(_action => "- *" + numberToEmoji(_action.id) + "* " + _action.name + "\n")
                })
                if (parseInt(Math.random() * 100) < 6)
                    await message.reply({ text: "Oublie pas que je peux faire plein de truc, pour savoir quoi, envoie *!info*" })
                SetLastAction(player.id, 'action')
            }
        } else if (player.lastAction.startsWith("action")) {

            let parentActionIndex = player.lastAction.split('-')[1] || message.text;

            let a = Actions.find(action => action.id == parentActionIndex && action.condition(message))
            if (!a) {
                await message.reply({ text: "Je sais pas ce que tu viens d'envoyer...\nMais c'est pas une des options que je t'ai montré" })
                await message.reply({
                    text: "Voici les trucs que tu peux faire, envoie just le chiffre de l'action que tu veux accomplir\n\n" +
                        Actions.filter(_action => !_action.id.startsWith('!') && parseInt(_action.id) > 0 && _action.condition(message)).map(_action => "*" + numberToEmoji(_action.id) + " " + _action.name + "*\n")
                })
                SetLastAction(player.id, 'action')
                return;
            } else {

                let actionHierarchyArray = [];
                actionHierarchyArray = actionHierarchyArray.concat(player.lastAction.split('-').slice(1, player.lastAction.split('-').length))
                actionHierarchyArray.push(message.text)
                message.subAction = a;
                let childActionWasFound = false;
                if (actionHierarchyArray.length > 1)
                    for (let i = 1; i < actionHierarchyArray.length; i++) {// i starts at 1 because i=0 is the parent action a, but we looking for children
                        const index = actionHierarchyArray[i];
                        if (a.subActions && a.subActions.find(_subAction => _subAction.id == index)) {
                            console.log("subAction was found With index,", index)

                            message.subAction = a.subActions.find(_subAction => _subAction.id == index)
                            if (i == actionHierarchyArray.length - 1)
                                childActionWasFound = true;

                            continue;
                        }
                        break;
                    }

                if (await message.subAction.condition(message)) {
                    await message.subAction.action(message)
                    console.log(actionHierarchyArray)

                    if (message.subAction.subActions) {
                        await message.reply({
                            text:
                                "*" + message.subAction.name + "*\n" + message.subAction.description + "\n\n" +
                                "" + message.subAction.subActions.map(_subAction =>
                                    numberToEmoji(_subAction.id) + " *" + _subAction.name + "*\n" +
                                    (_subAction.prix ? "- Prix: *" + _subAction.prix + "Frs*\n" : "") +
                                    (_subAction.dailyActionPoints ? "- Points d'action: *" + _subAction.dailyActionPoints + " Points*\n" : "") +
                                    (_subAction.daysToPerfom ? "- Complète dans: *" + _subAction.daysToPerfom + " Jours*\n" : "")
                                ).join('')
                        })
                        SetLastAction(player.id, 'action-' + (childActionWasFound ? actionHierarchyArray.join('-') : actionHierarchyArray.slice(0, actionHierarchyArray.length - 1).join('')))
                    } else {
                        SetLastAction(player.id, 'idle')

                    }
                }
            }
        }
    }
}

const Routine = async () => {
    const games = getDirectories('./Games')
    for (let gameIndex = 0; gameIndex < games.length; gameIndex++) {
        const groupId = games[gameIndex];

        let groupInfos = fs.readJSONSync('./Games/' + groupId + '/gameInfos.json')
        if (groupInfos.gameDateInfo.period == "day") {
            // SET TO NIGHT AND PERFORM NIGHTLY ACTIONS
            groupInfos.gameDateInfo = setGameDate(groupInfos.gameDateInfo, 0)

            let ActionsToPerform = [];
            let upComingActions = [...groupInfos.upComingActions]

            groupInfos.upComingActions.forEach((_upComingActionString, upComingActionIndex) => {
                let _upComingAction = parseStringAction(_upComingActionString);
                if (_upComingAction.dateToBePerform >= groupInfos.gameDateInfo.daysPassed) {
                    _upComingAction.id = upComingActionIndex;
                    upComingActions = upComingActions.filter(_u => _u != _upComingActionString)
                    ActionsToPerform.push(_upComingAction)
                }
            })
            groupInfos.upComingActions = upComingActions;

            for (let iAction = 0; iAction < ActionsToPerform.length; iAction++) {
                const _action = ActionsToPerform[iAction];
                Game.sendMessage = sendMessage;
                await _action.action(Game, _action)
            }
        } else {
            // SET TO NEXT DAY AND PERFORM DAILY ACTIONS
            groupInfos.gameDateInfo = setGameDate(groupInfos.gameDateInfo, 1)
            console.log('Day ' + groupInfos.gameDateInfo.daysPassed + " has passed!")
        }

        fs.writeJSONSync('./Games/' + groupInfos.id + '/gameInfos.json', groupInfos)
    }
}




const parseStringAction = (stringAction) => {
    return JSON.parse(stringAction, function (key, value) {
        if (typeof value === "string" &&
            value.startsWith("/Function(") &&
            value.endsWith(")/")) {
            value = value.substring(10, value.length - 2);
            return (0, eval)("(" + value + ")");
        }
        return value;
    });
}


const setGameDate = (date, daysToAdd) => {
    let daysName = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
    let monthsName = ["Jan", "Feb", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"]

    date.actualTime = Date.now();
    date.period = daysToAdd == 0 ? "night" : "day";
    date.daysPassed = date.daysPassed + daysToAdd;
    date.day += daysToAdd;

    while (date.day > 28) {
        date.month += 1;
        date.day -= 28;
    }
    while (date.day < 1) {
        date.month -= 1;
        date.day += 28;
    }

    while (date.month > 12) {
        date.year += 1;
        date.month -= 12;
    }
    while (date.month < 1) {
        date.year -= 1;
        date.month += 12;
    }

    let _dayName = daysName[((date.day - 1) % 7)]
    let _monthName = monthsName[(date.month - 1)]

    date.actualTime = Date.now();
    date.strindDate = _dayName + ". " + date.day + " " + _monthName + " " + date.year
    return date
}
module.exports = {
    processMessage,
    Routine
}

