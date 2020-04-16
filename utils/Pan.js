const {PanCard} = require('../server/objects/PanCard');
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
        return 6;
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
        this.panActions.initTiles();
        this.panActions.initHotels();
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
        this.panData.message = message;
        this.panData.instructions = instructions;
        this.panData.state = 0;
        this.panData.buttonText = buttonText;
        return this.panData;
    }



    preparePanPacket() {

        return {
            type:0,
            playerId:0,
            currentPlayer:0,
            state:1,
            otherState:5,
            kitty:0,
            oldInstructions:"",
            instructions:"You can now draw a card. ",
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
        packet.tiles=this.panActions.tile;
        packet.canEnd = false;
        packet.dlgType = 0;
        this.panData.players = new Array();
        for (let i in this.panActions.players) {
            let p = this.panActions.players[i];
            this.panData.players.push({name: p.name, hotels: p.hotels, money: p.money, playing: p.playing,state:p.state});
        }
        for (let i in this.panActions.hot) {
            let h = this.panActions.hot[i];
            this.panData.hotels[i].available = h.availShares;
            this.panData.hotels[i].price = h.price();
            this.panData.hotels[i].size = h.count();
        }
        this.panData.currentPlayer = this.panActions.currentPlayer;
        this.panData.currentSwapPlayer = this.panActions.currentSwapPlayer;

    }

    addUser(connection, name) {
        var user = {
            connection: connection,
            name: name,
            player: this.panActions.addPlayer(name)
        }
        this.users.push(user);
        return user;
    }

    addWatchers(connection, name) {
        var user = {
            connection: connection,
            name: name,
            playing: false
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
            if (u.player.state != PanActions.GAMEOVER) {

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
            packet.state = 6;
            packet.users = this.getUserList();
            u.connection.send(JSON.stringify(packet));
        });
    }

    sendPacket(lst, packet, loadTiles = false) {
        let pkt = packet;
        lst.map((u) => {
            if(u.connection.state == "open") {
                if (loadTiles && u.player.playing) {
                    pkt = JSON.parse(JSON.stringify(packet));
                    let r = u.player.getRack(pkt);
                    pkt.rack = r;
                    pkt.gameState = u.player.state;
                    if (u.player.state == 6)
                        pkt.instructions = "";
                    else if (u.player.state == 101) {
                        if (this.panActions.checkForEnd())
                            pkt.canEnd = true;
                    } else if (u.player.state == 106) {
                        pkt.dlgType = 1;
                        let st = this.panActions.stockTransaction;
                        let p = this.panActions.players[st.player];
                        pkt.stk.keep = p.hotels[st.defunct];
                        pkt.stk.player = st.player;
                        pkt.stk.title = st.title;
                        pkt.stk.survivor = Hotel.HOTELS[st.survivor];
                        pkt.stk.defunct = Hotel.HOTELS[st.defunct];
                        pkt.stk.survivorColor = Hotel.HOTEL_COLORS[st.survivor];
                        pkt.stk.defunctColor = Hotel.HOTEL_COLORS[st.defunct];
                        pkt.stk.defunctPrice = this.panActions.hot[st.defunct].first / 10;
                        pkt.stk.playerMoneyBase = p.money;
                        pkt.stk.total = p.hotels[st.defunct];
                        pkt.stk.playerSurvivorBase = p.hotels[st.survivor];
                        pkt.stk.playerDefunctBase = p.hotels[st.defunct];
                        pkt.stk.hotelAvailDefunctBase = pkt.hotels[st.defunct].available;
                        pkt.stk.hotelAvailSurvivorBase = pkt.hotels[st.survivor].available;
                        let str = "\nA share of " + pkt.stk.survivor + " is now worth " + pkt.hotels[st.survivor].price +
                            ". There are " + pkt.stk.hotelAvailSurvivorBase + " available.\n";
                        str += "A share of " + pkt.stk.defunct + " was worth " + pkt.stk.defunctPrice +
                            ". You have " + p.hotels[st.defunct] + " shares."
                        pkt.stk.info = st.bonusStr + str;

                    } else if (u.player.state == 109) {
                        pkt.dlgType = 2;
                        let oneTouch = true;
                        pkt.merger.info = "Select one of the hotels to switch the order"
                        let hotels = [];
                        let sizes = [];
                        let colors = [];
                        for (let i = 0; i < this.panActions.split.length; i++) {
                            let grp = this.panActions.split[i];
                            for (let j = 0; j < grp.length; j++) {

                                hotels.push(Hotel.HOTELS[grp[j]]);
                                colors.push(Hotel.HOTEL_COLORS[grp[j]]);
                                sizes.push(this.panData.hotels[grp[j]].size);
                            }
                            if (grp.length > 2) {
                                oneTouch = false;
                                pkt.merger.info = "Choose the hotel that you want to switch";
                                //info:"Select either hotel to switch the order
                            }

                        }
                        pkt.merger.oneTouch = oneTouch;
                        pkt.merger.hotelColors = colors;
                        pkt.merger.hotels = hotels;
                        pkt.merger.hotelSizes = sizes;
                    } else if (u.player.state == 102) {
                        pkt.dlgType = 3;
                        let hotels = [];
                        let colors = [];
                        for (let i = 0; i < 7; i++) {

                            if (this.panActions.canBuyStock(i)) {
                                hotels.push(Hotel.HOTELS[i]);
                                colors.push(Hotel.HOTEL_COLORS[i]);
                            }
                        }
                        if (this.panActions.checkForEnd())
                            pkt.canEnd = true;
                        pkt.buy.error = "";
                        pkt.buy.hotelColors = colors;
                        pkt.buy.hotels = hotels;
                        pkt.buy.playerBaseMoney = u.player.money;
                        pkt.buy.amt = [0, 0, 0, 0, 0, 0, 0];
                        pkt.buy.total = 0;
                    } else if (u.player.state == PanActions.GAMEOVER) {
                        pkt.over = true;
                        pkt.dlgType = 0;
                    }
                }
                u.connection.send(JSON.stringify(pkt));
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

    send(id, packet, loadTiles = false) {
        this.fillInPacket(packet);
        let lst = this.users.filter((user) => user.name === id);
        this.sendPacket(lst, packet, false);
    }

    sendWatcher(id, packet) {
        this.fillInPacket(packet)
        let lst = this.watchers.filter((user) => user.name === id);
        this.sendPacket(lst, packet);
    }

    broadCastMessage(id, packet) {
        let lst = this.users.filter((user) => user.name !== id);
        this.sendPacket(lst, packet);
        lst = this.watchers;
        this.sendPacket(lst, packet);
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

