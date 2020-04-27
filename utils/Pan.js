const {PanPlayer} = require('../server/objects/PanPlayer.js');
const {PanActions} = require('../server/PanActions.js');
class Pan {


    constructor() {
        this.users = [];
        this.watchers = [];
        this.panData = this.preparePanPacket();
        this.panStarted = false;
        this.panActions = null;


    }

    static get NUMBER_PLAYERS() {
        return 7;
    }

    setPanStarted(f) {
        this.panStarted=f ;
    }

    hasPanStarted() {
        return this.panStarted;
    }

    setPanActions(pan) {
        this.panActions = pan;
    }

    formatNameList(ulst) {
        let cnt = 1;
        let str = "";
        for (let item in ulst) {
            str = str + ulst[item]
            if (cnt != ulst.length) {
                str = str + ", ";
            } else {
                str = str;
            }
            cnt++;

        }
        return str;
    }

    removeAllConnections() {
        let lst = this.users;
        this.closeSockets(lst);
        lst = this.watchers;
        this.closeSockets(lst);
        this.watchers = [];
        this.users = [];
        this.panActions.players = [];
        this.panActions.stopProcessing = false;
        this.panActions.playerNum = 0;
        this.panActions.lostPlayers =[];
        this.panActions.lastCmd = "";
        this.hand=[];
        this.setPanStarted(false);
        this.panData = this.preparePanPacket();

    }


    formatNameList(ulst) {
        let cnt = 1;
        let str = "";
        for (let item in ulst) {
            str = str + ulst[item]
            if (cnt != ulst.length) {
                str = str + ", ";
            } else {
                str = str;
            }
            cnt++;

        }
        return str;
    }



    chkForReconnect(n) {
        let ulst = this.users;
        for (let item in ulst) {
            if (ulst[item].name == n) {
                for (let name in this.panActions.lostPlayers){
                    if (n == this.panActions.lostPlayers[name] ){
                        return item;
                    }
                }
            }
        }
        return -1;
    }
    reconnectUser(connection,name){
        this.panActions.lostPlayers = [];
        let ulst = this.users;
        for (let item in ulst) {
            if (ulst[item].name == name) {
                ulst[item].connection = connection;
                this.lookForDropConnection(true);
                return true;
            }
        }
    }
    chkForDuplicateName(n) {
        let ulst = this.users;
        for (let item in ulst) {
            if (ulst[item].name == n) {
                return true;
            }
        }
        return false;
    }

    findMinMax() {
        let min = 1000000;
        let max = -1;
        let minNames = [];
        let maxNames = [];
        let ulst = this.users;
        for (let item in ulst) {
            if (ulst[item].player.money < min) {
                min = ulst[item].player.money;
                minNames = [];
                minNames.push(ulst[item].player.name);
            } else if (ulst[item].player.money == min) {
                minNames.push(ulst[item].player.name)
            }
            if (ulst[item].player.money > max) {
                max = ulst[item].player.money;
                maxNames = [];
                maxNames.push(ulst[item].player.name);
            } else if (ulst[item].player.money == max) {
                maxNames.push(ulst[item].player.name)
            }
        }
        return [min, minNames, max, maxNames];
    }




    getCurrentPacket() {
        return this.panData;
    }

    setPanPacket(type, message, instructions, buttonText) {

        this.panData.messageTypeype = type;
        this.panData.journal = message;
        this.panData.instructions = instructions;
        this.panData.state = 100;
        this.panData.buttonText = buttonText;
        return this.panData;
    }



    preparePanPacket() {

        return {
            type:0,
            playerId:0,
            currentPlayer:10,
            winner:0,
            dealer:0,
            state:100,
            otherState:5,
            kitty:0,
            oldInstructions:"",
            instructions:"Press the start button after all then pan players have joined. ",
            instructionColor:"black",
            journal:"Welcome to Panguingue",
            currentCard: {
                group:-1,
                suit:'',
                rank:"card_back",
                ordinal:0,
                rankOrdinal:0
            },
            passCard:  {   group:-1,
                suit:'',
                rank:"card_back",
                ordinal:0,
                rankOrdinal:0
            },
            discardCard:  {
                group:-1,
                suit:'',
                rank:"card_back",
                ordinal:0,
                rankOrdinal:0
            },
            hand:[],
            players:[]
        }
    }

    fillInPacket(packet) {

        this.panData.players = new Array();
        for (let i in this.panActions.players) {
            let p = this.panActions.players[i];
            this.panData.players.push({name: p.name, current: p.current, total: p.total, playing:p.playing,atTable:true,winner:p.winner,
                round:p.round, state:p.state,forfeit:p.forfeit,sitOut:p.sitOut,playerId: p.playerId,cards:p.cards, hand:[]});
            this.users[i].player= {name: p.name, current: p.current, total: p.total, playing:p.playing,atTable:true,winner:p.winner,
                round:p.round,state:p.state,forfeit:p.forfeit,sitOut:p.sitOut,playerId: p.playerId,cards:p.cards, hand:p.playing? p.hand :[]};
        }

        this.panData.currentPlayer = this.panActions.currentPlayer;

    }
    addPlayer(name) {
        let p = new PanPlayer(name,  this.panActions);
        this.panActions.playerNum++;
        this.panActions.players.push(p);
        return p;
    }

    addUser(connection, name) {
        var user = {
            connection: connection,
            name: name,
            player: this.addPlayer(name)
        }
        this.users.push(user);
        return user;
    }

    addWatchers(connection, name) {
        var user = {
            connection: connection,
            name: name,
            playing: false,
            player:{atTable:false}
        };
        this.watchers.push(user);
        return user;
    }

    removeUser(id) {
        var user = this.getUser(id);

        if (user) {
            this.users = this.users.filter((user) => user.name !== id);

        }

        return user;
    }


    getByNotState(state) {
        return this.users.filter((user) => user.state !== state);
    }

    getByState(state) {
        return this.users.filter((user) => user.state === state);
    }

    setState(id, state) {
        let u = this.users.filter((user) => user.name === id)[0];
        u.state = state;
    }

    getState(id) {
        let u = this.users.filter((user) => user.name === id)[0];
        return u.state;
    }


    stopPlaying(id) {
        this.users.filter((user) => user.name === id)[0].playing = false;

    }
    lookForDropConnection(force = false) {
        let lst = this.users;
        let players = [];
        lst.map((u) => {
            if (true) {

                   let state = u.connection.state;
                   if(state == "closed"){
                       players.push(u.player.name);
                   }
            }

        });
        if (players.length!=0 || force){
            this.panActions.lostConnection(players);
        }
    }

    closeSockets(lst) {
        lst.map((u) => {
            u.connection.close();
        });
    }

    sendWatcherPacket(lst, packet) {
        lst.map((u) => {
            packet.state = 0;
            packet.playerId = 10;
            //packet.users = this.getUserList();
            u.connection.send(JSON.stringify(packet));
        });
    }

    sendPacket(lst, packet, loadCards = false) {
        let pkt = packet;
        lst.map((u) => {
            if(u.connection.state == "open") {
                if ( u.player.atTable) {


                    packet.hand = [];

                    for(let i=0;i<u.player.hand.length;i++)
                        packet.hand.push(u.player.hand[i]);
                    packet.state = u.player.state;
                    packet.playerId = u.player.playerId;
                    pkt = JSON.parse(JSON.stringify(packet));
                }
                u.connection.send(JSON.stringify(pkt));
                packet.hand = [];
                packet.state = 0;
                pkt = packet;
            }
        });

    }


    broadCastAll(packet) {
        this.fillInPacket(packet);
        let lst = this.users;
        this.sendPacket(lst, packet, true);
        lst = this.watchers;
        this.sendWatcherPacket(lst, packet);
    }

    sendCustomPacket(id, packet) {
        let u = this.users.filter((user) => user.name === id)[0];
        u.connection.send(JSON.stringify(packet));
    }

    getPlaying() {
        return this.users.filter((user) => user.playing == true);
    }

    getNonPlaying() {
        return this.users.filter((user) => user.playing !== true);
    }

    setPlay(id) {
        let lst = this.users.filter((user) => user.name === id);
        lst[0].playing = true;
    }

    send(id, packet, loadCards = false) {
        this.fillInPacket(packet);
        let lst = this.users.filter((user) => user.name === id);
        this.sendPacket(lst, packet, loadCards);
    }

    sendWatcher(id, packet) {
        this.fillInPacket(packet)
        let lst = this.watchers.filter((user) => user.name === id);
        this.sendWatcherPacket(lst, packet);
    }

    broadCastMessage(id, packet) {
        let lst = this.users.filter((user) => user.name !== id);
        this.sendPacket(lst, packet);
        lst = this.watchers;
        this.sendWatcherPacket( lst,packet);
    }

    getUser(id) {
        return this.users.filter((user) => user.name === id)[0]
    }

    getUserList() {
        var namesArray = this.users.map((user) => {
            return {
                name: user.name,
                money: user.money,
                diceLeft: user.diceLeft,
                diceXLeft: user.diceXLeft,
                playing: user.playing
            };
        });

        return namesArray;
    }

}

module.exports = {Pan};

