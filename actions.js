const { getDirectories, SetLastAction, checkPlayerInGroup, checkPlayer, numberToEmoji, EmojiToNumber, UpdatePlayerAttribute } = require('./functions.js')

const fs = require('fs-extra')


let Actions = [
    {
        id: "!info",
        name: "Pour en savoir plus sur moi",
        description: "",
        setLastAction: (playerId, action) => { SetLastAction(playerId, action) },
        condition: (player) => true,
        action: async (msg) => {

            await msg.reply({
                text: "Salut Jeune padawan🧘‍♂️!\n\n" +
                    "Je m'appelle *Jcx Unitorium Negatron Iodine Omnitron Révogore*, mais tu peux m'appeler *J.U.N.I.O.R.*.\n\n" +
                    "Voici une liste des commandes que tu peux m'envoyer et je verais comment les executer\n\n" +
                    Actions.filter(_action => _action.id.startsWith('!')).map(_action => "- *" + _action.id + "* -- " + _action.name + "\n").join('') +
                    "\nC'est tout 😊"
            })
            return

        }
    },
    {
        id: "!jouer",
        name: "Pour jouer à une partie de SIMS Yaoundé",
        condition: (player) => true,
        setLastAction: (playerId, action) => { SetLastAction(playerId, action) },
        description: "",
        action: async (msg) => {
            let path = getDirectories('./Games');
            if (path.length == 0) {
                await msg.reply({ text: "Aucune partie est en cours\nSi tu veux jouer à Sims Yaoundé, crée un  groupe et ajoute moi 😉" })
                return
            }

            let groupInfos = null;
            path.forEach(groupId => {
                if (checkPlayerInGroup(msg.fromId, groupId).isPlayer)
                    groupInfos = checkPlayerInGroup(msg.fromId, groupId).groupInfos
            })

            // IF HE IS NOT A MEMBER OF A GROUP, ASK HIM TO JOIN
            if (!groupInfos) {
                let a = Actions.find(action => action.id == 'joinGroup')
                await msg.reply({ text: "*" + a.name + "*\n" + a.description })
                SetLastAction(msg.fromId, 'action-joinGroup')
                return
            }

            // IF HE IS MEMBER OF A GROUP... THEN START HIS PARTY
            console.log('ini Player')
            /**
            * START ¨PLAYER GAME
            */
            let a = Actions.find(_action => _action.id.startsWith('iniPlayer'))
            await msg.sock.sendMessage(msg.player.id, { text: a.name })
            await a.description(msg);
            SetLastAction(msg.player.id, 'action-' + a.id)

        }
    },
    {
        id: "joinGroup",
        name: "Vous n'êtes pas encore membre d'un group. Choisissez un group pour y jouer:\n",
        description: () => getDirectories('./Games').map((groupId, index) => numberToEmoji(index + 1) + " " + fs.readJSONSync('./Games/' + groupId + '/gameInfos.json').name + "\n"),
        setLastAction: (playerId, action) => { SetLastAction(playerId, action) },
        conditionsToPerformAction: [],
        condition: (player) => true,
        action: async (msg) => {
            let choiceNumber = EmojiToNumber(msg.text);
            if (!getDirectories('./Games')[parseInt(choiceNumber) - 1]) {
                await msg.reply({ text: "Le choix n'est pas disponible, veillez faire un nouveau choix!" })
                return;
            }
            const code = await msg.sock.groupInviteCode(getDirectories('./Games')[parseInt(choiceNumber) - 1])
            console.log("group code: " + code)
            await msg.reply({ text: "rejoignez ce group avec ce code\n" + code })
        }
    },
    {
        id: "iniPlayer",
        name: "*Commençons par créer votre personnage SIMS Yaoundé*\n\nSIMS Yaoundé est un jeu de société qui encourage les rencontres et la collaboration.\nPour jouer à SIMS Yaoundé, vous devez envoyer une photo de vous et en légende de la photo, écrivez *[Nom],[sex]* (les 2 séparé par une virgule)\n\nVoici 2 examples:",
        description: async (msg) => {
            await msg.sock.sendMessage(msg.fromId, { image: { url: './images/iniPlayer.jpg' }, caption: "Voici 2 examples\nN'envoyez pas 2 fois pardon, c'est just l'example" })
        },
        setLastAction: (playerId, action) => { SetLastAction(playerId, action) },
        conditionsToPerformAction: [],
        condition: (player) => player.isDead,
        action: async (msg) => {
            let media = await msg.downloadImage('Players/' + msg.player.id + '/', 'profil.jpg')
            let name = media.caption.split(',')[0];
            let sex = media.caption.split(',')[1];
            UpdatePlayerAttribute(msg.player.id, "name", name)
            UpdatePlayerAttribute(msg.player.id, "sex", sex.startsWith('f') ? 'F' : 'M')
            UpdatePlayerAttribute(msg.player.id, "isDead", false)
            /**
             * 
             * 
             */
            let player =  SetLastAction(msg.player.id, 'action')

            await msg.reply({ text: 'Félicitation!\nVous Jouez maintenant à SIMS Yaoundé sous le pseudonyme *' + name + '*\n' })
            await msg.reply({
                text: "Voici les trucs que tu peux faire, envoie just le chiffre de l'action que tu veux accomplir\n\n" +
                    Actions.filter(_action => !_action.id.startsWith('!') && parseInt(_action.id) > 0 && _action.condition(player)).map(_action => "- *" + numberToEmoji(_action.id) + "* " + _action.name + "\n").join('')
            })
            if (parseInt(Math.random() * 100) < 6)
                await msg.reply({ text: "Oublie pas que je peux faire plein de truc, pour savoir quoi, envoie *!info*" })
        }
    },
    {
        id: "1",
        name: "Faire L'école",
        description: "Dans quel domaine souhaitez vous obtenir un diplome?",
        conditionsToPerformAction: [],
        condition: (player) => true,
        action: async (msg) => {
            let choiceNumber = EmojiToNumber(msg.text);
        },
        "subActions": [
            {
                "id": "1",
                "name": "École de médécine",
                "skill": ["Docteur"],
                "Occupation": ["étudiant"],
                "prix": 2000,
                "dailyActionPoints": 3,
                "daysToPerfom": 100,
                condition: (player) => true,
                "action": (msg) => {
                    if (msg.subAction.prix && msg.subAction.prix >= msg.player.money) {
                        msg.reply({ text: "😂 T'es fauché! t'as pas assez d'argent pour ça!\n\nChoisi une autre école ou envoie *!annuler* pour annuler l'action" })
                        return
                    }
                    let actionPointsLeft = 5;
                    for (const _occup in msg.player.occupations) {
                        actionPointsLeft -= _occup.points;
                    }
                    if (msg.subAction.dailyActionPoints && msg.subAction.dailyActionPoints > actionPointsLeft) {
                        msg.reply({ text: "Tu peux pas prendre cette action car elle sera de trop sur ton planning déjà chargé\nTu as *" + actionPointsLeft + " temps libres restant* mais cette action demande d'en avoir *" + msg.subAction.dailyActionPoints + "*\n\nChoisi une autre école ou envoie *!annuler* pour annuler l'action" })
                        return
                    }
                    msg.reply({ text: "Félicitaion!🥳\nTu as rejoins l'université!\nTu recevra ton diplome dans *" + msg.subAction.daysToPerfom + "* Jours si tout ce passe bien\n¯\_( ͡° ͜ʖ ͡°)_/¯\n\nForce à toi" })

                    /** save future actions
                     * 
                     * 
                     * 
                     * 
                     * 
                     */
                    SetLastAction(msg.fromId, 'idle')
                }
            },
            {
                "id": "2",
                "name": "École d'ingénierie",
                "skill": ["Ingénieur"],
                "Occupation": ["étudiant"],
                "prix": 1500,
                "dailyActionPoints": 2,
                "daysToPerfom": 70,
                condition: (player) => true,
                "action": (msg) => {
                    SetLastAction(msg.fromId, 'idle')
                }
            },
            {
                "id": "3",
                "name": "École de Commerce",
                "skill": ["Manager"],
                "Occupation": ["étudiant"],
                "prix": 1500,
                "dailyActionPoints": 2,
                "daysToPerfom": 70,
                condition: (player) => true,
                "action": (msg) => {
                    SetLastAction(msg.fromId, 'idle')
                }
            },
            {
                "id": "4",
                "name": "École d'informatique",
                "skill": ["Développeur"],
                "Occupation": ["étudiant"],
                "prix": 2000,
                "dailyActionPoints": 2,
                "daysToPerfome": 80,
                condition: (player) => true,
                "action": (msg) => {
                    SetLastAction(msg.fromId, 'idle')
                }
            },
            {
                "id": "5",
                "name": "École des beaux-arts",
                "skill": ["Artiste"],
                "Occupation": ["étudiant"],
                "prix": 1100,
                "dailyActionPoints": 1,
                "daysToPerfome": 50,
                condition: (player) => true,
                "action": (msg) => {
                    SetLastAction(msg.fromId, 'idle')
                }
            },
            {
                "id": "6",
                "name": "École des media et de la communication",
                "skill": ["journaliste"],
                "Occupation": ["étudiant"],
                "prix": 1600,
                "dailyActionPoints": 2,
                "daysToPerfome": 50,
                condition: (player) => true,
                "action": (msg) => {
                    SetLastAction(msg.fromId, 'idle')
                }
            }
        ]
    }]



let groupActions = [
    {
        id: "!info",
        name: "Pour en savoir plus sur moi",
        description: "",
        setLastAction: (playerId, action) => { },
        condition: (player) => true,
        action: async (msg) => {

            await msg.reply({
                text: "Salut Jeune padawan🧘‍♂️!\n\n" +
                    "Je m'appelle *Jcx Unitorium Negatron Iodine Omnitron Révogore*, mais tu peux m'appeler *J.U.N.I.O.R.*.\n\n" +
                    "Voici une liste des commandes que tu peux m'envoyer et je verais comment les executer\n\n" +
                    groupActions.filter(_action => _action.id.startsWith('!')).map(_action => "- *" + _action.id + "* -- " + _action.name + "\n").join('') +
                    "\nC'est tout 😊"
            })
            return

        }
    },
    {
        id: "!lancer",
        name: "Pour Lancer une partie dans ce group",
        description: "",
        setLastAction: (playerId, action) => { },
        condition: (player) => true,
        action: async (msg) => {
            if (!fs.existsSync('./Games/' + msg.groupId + '/gameInfos.json')) {
                console.log("paartie doesn't exist in this group, creating one!")
                let defaultGroupInfos = fs.readJSONSync('./Games/games_default.json')
                defaultGroupInfos.dateCreated = Date.now();
                defaultGroupInfos.gameDateInfo = {
                    actualTime: Date.now(),
                    daysPassed: 0
                };
                defaultGroupInfos.id = msg.groupId;
                const group = await msg.sock.groupMetadata(msg.groupId)
                defaultGroupInfos.name = group.subject;

                //msg.reply({text: ""})
                fs.mkdirSync('./Games/' + msg.groupId + '/')
                fs.writeJSONSync('./Games/' + msg.groupId + '/gameInfos.json', defaultGroupInfos)
                console.log("group info gotten:", defaultGroupInfos)

                for (let index = 0; index < group.participants.length; index++) {
                    let _participant = group.participants[index];
                    if (_participant.id == "237650687834@s.whatsapp.net") continue;
                    console.log("Player with ID:", _participant.id, "is being initialised")

                    defaultGroupInfos.players.push({ id: _participant.id, isDead: false })
                    let player = SetLastAction(_participant.id, 'idle')
                    msg.player = player;
                    /**
                     * START ¨PLAYER GAME
                     */
                    let a = Actions.find(_action => _action.id.startsWith('iniPlayer'))
                    await msg.sock.sendMessage(msg.player.id, { text: a.name })
                    await a.description(msg);
                    SetLastAction(msg.player.id, 'action-' + a.id)
                }

                console.log("All player initialised, group is Saved")
                msg.reply({ text: "*Lets Gooooooooo!*\nUne partie de SIMS Yaoundé a été lancé dans ce group🪄✨\nJ'ai envoyé un message en privé à chacun d'entre vous!" })
                fs.writeJSONSync('./Games/' + msg.groupId + '/gameInfos.json', defaultGroupInfos)
                return defaultGroupInfos;
            } else {
                console.log("paartie already exist in this group!")
                msg.reply({ text: "Une partie est déjà en cours wesh !" })
                return
            }
            return
        }
    },
]
module.exports = { Actions, groupActions }