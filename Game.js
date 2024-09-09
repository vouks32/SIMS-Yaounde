const fs = require('fs-extra')
const path = require('path');
const { Actions, groupActions } = require('./actions.js')
const { getDirectories, SetLastAction, checkPlayerInGroup, checkPlayer, numberToEmoji, EmojiToNumber, UpdatePlayerAttribute } = require('./functions.js')



const processMessage = async (message) => {

    console.log('MESSAGE:', message)


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
                let subAction = a;
                let childActionWasFound = false;
                if (actionHierarchyArray.length > 1)
                    for (let i = 1; i < actionHierarchyArray.length; i++) {// i starts at 1 because i=0 is the parent action a, but we looking for children
                        const index = actionHierarchyArray[i];
                        if (a.subActions && a.subActions.find(_subAction => _subAction.id == index)) {
                            console.log("subAction was found With index,", index)

                            subAction = a.subActions.find(_subAction => _subAction.id == index)
                            if (i == actionHierarchyArray.length - 1)
                                childActionWasFound = true;

                            continue;
                        }
                        break;
                    }

                if (subAction.condition(message)) {
                    message.subAction = subAction;
                    await subAction.action(message)
                    console.log(actionHierarchyArray)

                    if (subAction.subActions) {
                        await message.reply({
                            text:
                                "*" + subAction.name + "*\n" + subAction.description + "\n\n" +
                                "" + subAction.subActions.map(_subAction =>
                                    numberToEmoji(_subAction.id) + " *" + _subAction.name + "*\n" +
                                    (_subAction.prix ? "- Prix: *" + _subAction.prix + "Frs*\n" : "") +
                                    (_subAction.dailyActionPoints ? "- Points d'action: *" + _subAction.dailyActionPoints + " Points*\n" : "") +
                                    (_subAction.daysToPerfom ? "- Complète dans: *" + _subAction.daysToPerfom + " Jours*\n" : "")
                                ).join('')
                        })
                        SetLastAction(player.id, 'action-' + (childActionWasFound ? actionHierarchyArray.join('-') : actionHierarchyArray.slice(0, actionHierarchyArray.length - 1).join('')))
                    }else{
                        SetLastAction(player.id, 'idle')

                    }
                }
            }
        }
    }
}
module.exports = {
    processMessage
}

