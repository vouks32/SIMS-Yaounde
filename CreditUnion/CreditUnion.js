const { text } = require('express');
const fs = require('fs-extra')
const path = require('path');

const processCreditUnionMessage = (msg) => {
    if (!msg.text.toLowerCase().startsWith('!')) return;
    let player = GetPlayer(msg.fromId);
    msg.player = player
    let _action = Actions.find(_action => msg.text.toLowerCase().startsWith(_action.name))
    if (_action)
        _action.action(msg)
}

const Actions = [
    {
        name: "!info",
        condition: (msg) => true,
        action: (msg) => {
            let player = msg.player;
            msg.replyTo({
                text: "*Vos Informations*\n" +
                    "- *Solde:* " + player.bank.solde + "\n" +
                    "- *Tontine(cette semaine):* " + player.bank.tontine + "\n\n" +
                    "*5 Dernières transactions:*\n " + player.bank.transactions.map(_trans => {
                        return "- " + _trans.amount + "(" + FormatDate(_trans.date) + ")"
                    }).join('\n')
            })
        }
    }
]


const GetPlayer = (memberId) => {

    if (!fs.existsSync('./Members/' + memberId + '/memberInfos.json')) {
        let defaultMemberInfos = fs.readJSONSync('./Members/default_members.json')
        defaultMemberInfos.id = memberId;
        fs.mkdirSync('./Members/' + memberId + '/')
        fs.writeJSONSync('./Members/' + memberId + '/memberInfos.json', defaultMemberInfos)
        return defaultMemberInfos;
    }
    let memberInfos = fs.readJSONSync('./Members/' + memberId + '/memberInfos.json')
    return memberInfos
}


const FormatDate = (timeStamp) => {
    var options = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
    var today = new Date(timeStamp);
    return today.toLocaleDateString("fr-FR", options);
}


module.exports = { processCreditUnionMessage }