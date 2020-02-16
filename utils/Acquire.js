const {Hotel} = require('../server/objects/Hotel');
const {GameBoard} = require('../server/objects/GameBoard.js');
class Acquire {


    constructor() {
        this.users = [];
        this.watchers = [];
        this.acquireData = this.prepareAcquirePacket();
        this.acquireStarted = false;
        this.gameBoard = null;


    }

    static get NUMBER_PLAYERS() {
        return 6;
    }

    setAcquireStarted(f) {
        this.acquireStarted=f ;
    }

    hasAcquireStarted() {
        return this.acquireStarted;
    }

    setGameBoard(gb) {
        this.gameBoard = gb;
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
        this.gameBoard.players = [];
        this.gameBoard.stopProcessing = false;
        this.gameBoard.playerNum = 0;
        this.gameBoard.lostPlayers =[];
        this.gameBoard.lastCmd = "";
        this.gameBoard.initTiles();
        this.gameBoard.initHotels();
        this.setAcquireStarted(false);
        this.acquireData = this.prepareAcquirePacket();

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

    getDeck() {
        var deck = new Array();

        for (var i = 0; i < 54; i++) {
            var card = {value: this.calcValue(i), color: "black"};
            deck.push(card);
        }

        return deck;
    }

    shuffle() {
        // for 1000 turns
        // switch the values of two random cards
        for (let i = 0; i < 1000; i++) {
            let location1 = Math.floor((Math.random() * this.deck.length));
            let location2 = Math.floor((Math.random() * this.deck.length));
            let tmp = this.deck[location1];

            this.deck[location1] = this.deck[location2];
            this.deck[location2] = tmp;
        }
    }

    getOneCard() {
        // remove top card from deck
        let card = this.deck[this.deck.length - 1];
        this.deck.splice(this.deck.length - 1, 1);
        return card;
    }

    chkForReconnect(n) {
        let ulst = this.users;
        for (let item in ulst) {
            if (ulst[item].name == n) {
                for (let name in this.gameBoard.lostPlayers){
                    if (n == this.gameBoard.lostPlayers[name] ){
                        return item;
                    }
                }
            }
        }
        return -1;
    }
    reconnectUser(connection,name){
        this.gameBoard.lostPlayers = [];
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


    reshuffle() {
        this.newDeal();
        let lst = this.users;
        lst.map((u) => {
            u.cards = this.getUserCards();

        });
    }

    getCurrentPacket() {
        return this.acquireData;
    }

    setAcquirePacket(type, message, instructions, buttonText) {

        this.acquireData.messageTypeype = type;
        this.acquireData.message = message;
        this.acquireData.instructions = instructions;
        this.acquireData.state = 0;
        this.acquireData.buttonText = buttonText;
        return this.acquireData;
    }

    pxrepareAcquirePacket() {

        return;
    }

    prepareAcquirePacket() {

        return {
            gameState: 6,
            currentPlayer: 0,
            currentSwapPlayer: 0,
            tiles:[],
            message: "",
            messageType: "",
            buttonText: "Start",
            instructions: "",
            dlgType: 0,
            rack: [{label: "1-A", ordinal: 0, fg: "black", bg: "black"},
                {label: "1-A", ordinal: 0, fg: "black", bg: "black"},
                {label: "1-A", ordinal: 0, fg: "black", bg: "black"},
                {label: "1-A", ordinal: 0, fg: "black", bg: "black"},
                {label: "1-A", ordinal: 0, fg: "black", bg: "black"},
                {label: "1-A", ordinal: 0, fg: "black", bg: "black"}
            ],

            hotels: [
                {
                    name: "Luxor",
                    color: "red",
                    available: 25,
                    size: 0,
                    price: 0
                },
                {
                    name: "Tower",
                    color: "yellow",
                    available: 25,
                    size: 0,
                    price: 0
                },
                {
                    name: "American",
                    color: "#8787ff",
                    available: 25,
                    size: 0,
                    price: 0
                },
                {
                    name: "Worldwide",
                    color: "#c3af91",
                    available: 25,
                    size: 0,
                    price: 0
                },
                {
                    name: "Festival",
                    color: "green",
                    available: 25,
                    size: 0,
                    price: 0
                },
                {
                    name: "Continental",
                    color: "cyan",
                    available: 25,
                    size: 0,
                    price: 0
                },
                {
                    name: "Imperial",
                    color: "pink",
                    available: 25,
                    size: 0,
                    price: 0
                }
            ],
            players: [],
            canEnd:false,
            over:false,
            stk: {
                title: "",
                survivor: "",
                defunct: "",
                keep: 0,
                swap: 0,
                sell: 0,
                total: 0,
                player:-1,
                survivorColor: "",
                defunctColor: "",
                defunctPrice: 0,
                playerMoneyBase: 0,
                playerSurvivorBase: 0,
                playerDefunctBase: 0,
                hotelAvailDefunctBase: 0,
                hotelAvailSurvivorBase: 0,
                info: ""
            },
            merger: {

                title: "Choose the order of the merger",
                clickCount: 0,
                sourceIndex: 0,
                tempColor: "",
                info: "Choose the hotel that you want to switch",
                //info:"Select either hotel to switch the order",
                oneTouch:true,
                hotels: [],
                hotelSizes: [],
                hotelColors: []
            },
            buy: {
                hotels: [],
                amt: [0, 0, 0, 0, 0, 0, 0],
                title: "Buy up to three stocks",
                hotelColors: [],
                playerBaseMoney: 0,
                total: 0,
                error:"",
                info: "Cost $0"
            }
        };
    }

    fillInPacket(packet) {
        packet.tiles=this.gameBoard.tile;
        packet.canEnd = false;
        packet.dlgType = 0;
        this.acquireData.players = new Array();
        for (let i in this.gameBoard.players) {
            let p = this.gameBoard.players[i];
            this.acquireData.players.push({name: p.name, hotels: p.hotels, money: p.money, playing: p.playing,state:p.state});
        }
        for (let i in this.gameBoard.hot) {
            let h = this.gameBoard.hot[i];
            this.acquireData.hotels[i].available = h.availShares;
            this.acquireData.hotels[i].price = h.price();
            this.acquireData.hotels[i].size = h.count();
        }
        this.acquireData.currentPlayer = this.gameBoard.currentPlayer;
        this.acquireData.currentSwapPlayer = this.gameBoard.currentSwapPlayer;

    }

    addUser(connection, name) {
        var user = {
            connection: connection,
            name: name,
            player: this.gameBoard.addPlayer(name)
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
            if (u.player.state != GameBoard.GAMEOVER) {

                   let state = u.connection.state;
                   if(state == "closed"){
                       players.push(u.player.name);
                   }
            }

        });
        if (players.length!=0 || force){
            this.gameBoard.lostConnection(players);
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
                        if (this.gameBoard.checkForEnd())
                            pkt.canEnd = true;
                    } else if (u.player.state == 106) {
                        pkt.dlgType = 1;
                        let st = this.gameBoard.stockTransaction;
                        let p = this.gameBoard.players[st.player];
                        pkt.stk.keep = p.hotels[st.defunct];
                        pkt.stk.player = st.player;
                        pkt.stk.title = st.title;
                        pkt.stk.survivor = Hotel.HOTELS[st.survivor];
                        pkt.stk.defunct = Hotel.HOTELS[st.defunct];
                        pkt.stk.survivorColor = Hotel.HOTEL_COLORS[st.survivor];
                        pkt.stk.defunctColor = Hotel.HOTEL_COLORS[st.defunct];
                        pkt.stk.defunctPrice = this.gameBoard.hot[st.defunct].first / 10;
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
                        for (let i = 0; i < this.gameBoard.split.length; i++) {
                            let grp = this.gameBoard.split[i];
                            for (let j = 0; j < grp.length; j++) {

                                hotels.push(Hotel.HOTELS[grp[j]]);
                                colors.push(Hotel.HOTEL_COLORS[grp[j]]);
                                sizes.push(this.acquireData.hotels[grp[j]].size);
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

                            if (this.gameBoard.canBuyStock(i)) {
                                hotels.push(Hotel.HOTELS[i]);
                                colors.push(Hotel.HOTEL_COLORS[i]);
                            }
                        }
                        if (this.gameBoard.checkForEnd())
                            pkt.canEnd = true;
                        pkt.buy.error = "";
                        pkt.buy.hotelColors = colors;
                        pkt.buy.hotels = hotels;
                        pkt.buy.playerBaseMoney = u.player.money;
                        pkt.buy.amt = [0, 0, 0, 0, 0, 0, 0];
                        pkt.buy.total = 0;
                    } else if (u.player.state == GameBoard.GAMEOVER) {
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

module.exports = {Acquire};

