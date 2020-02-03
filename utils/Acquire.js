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
        this.acquireStarted = f;
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
        let min = 20000;
        let max = -1;
        let minNames = [];
        let maxNames = [];
        let ulst = this.users;
        for (let item in ulst) {
            if (ulst[item].money < min) {
                min = ulst[item].money;
                minNames = [];
                minNames.push(ulst[item].name);
            } else if (ulst[item].money == min) {
                minNames.push(ulst[item].name)
            }
            if (ulst[item].money > max) {
                max = ulst[item].money;
                maxNames = [];
                maxNames.push(ulst[item].name);
            } else if (ulst[item].money == max) {
                maxNames.push(ulst[item].name)
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
            stk: {
                title: "",
                survivor: "",
                defunct: "",
                keep: 0,
                swap: 0,
                sell: 0,
                total: 0,
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

                title: "",
                clickCount: 0,
                sourceIndex: 0,
                tempColor: "",
                info: "Choose the hotel that you want to switch",
                //info:"Select either hotel to switch the order",
                //hotels:["Festival","Continental"],
                //hotelColors:["green","cyan"],
                hotels: [],
                hotelColors: []
            },
            buy: {
                hotels: [],
                amt: [0, 0, 0, 0, 0, 0, 0],
                title: "Buy up to three stocks",
                hotelColors: [],
                playerBaseMoney: 0,
                total: 0,
                info: "Cost $0"
            }
        }
    }

    fillInPacket(packet) {
        packet.tiles=this.gameBoard.tile;
        this.acquireData.players = new Array();
        for (let i in this.gameBoard.players) {
            let p = this.gameBoard.players[i];
            this.acquireData.players.push({name: p.name, hotels: p.hotels, money: p.money, playing: p.playing,state:p.state});
        }
        for (let i in this.gameBoard.hotels) {
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


    closeSockets(lst) {
        lst.map((u) => {
            u.connection.close();
        });
    }

    sendWatcherPacket(lst, packet) {
        lst.map((u) => {
            packet.state = u.state;
            packet.users = this.getUserList();
            u.connection.send(JSON.stringify(packet));
        });
    }

    sendPacket(lst, packet, loadTiles = false) {
        let pkt = packet;
        lst.map((u) => {
            if(loadTiles && u.player.playing){
                pkt = JSON.parse(JSON.stringify(packet));
                let r = u.player.getRack(pkt);
                pkt.rack = r;
                pkt.gameState = u.player.state;
                if (u.player.state == 6)
                    pkt.instructions = "";
            }
            u.connection.send(JSON.stringify(pkt));
            pkt = packet;
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

