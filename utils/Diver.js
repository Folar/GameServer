class Diver {

    constructor() {
        this.users = [];
        this.watchers = [];
        this.diverData = this.prepareDiverPacket();
        this.newDeal();
        this.diverStarted = false;


    }
    setDiverStarted (f){
        this.diverStarted = f;
    }
    hasDiverStarted (){
        return this.diverStarted;
    }
    removeAllConnections() {
        let lst = this.users;
        this.closeSockets(lst);
        lst = this.watchers;
        this.closeSockets(lst);
        this.watchers = [];
        this.users = [];
        this.diverData = this.prepareDiverPacket();
        this.newDeal();


    }

    static get NUMBER_ROUNDS() {
        return 3;
    }

    static get NUMBER_DICE() {
        return 8;
    }


    static get NUMBER_PLAYERS() {
        return 6;
    }

    static get DIVER_DELAY() {
        return 2000;
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

    sumCash(fldCash) {
        let s = 0
        for (let i in fldCash)
            s += fldCash[i].value;
        return s;
    }

    distributeCash() {
        for (let i = 0; i < 6; i++) {
            while (this.sumCash(this.cash[i]) < 50) {
                this.cash[i].push(this.getOneCard())
            }
            this.cash[i].sort(this.cmp)
        }
    }

    cmp(a, b) {
        return (a.value - b.value) * -1;
    }

    nextRound() {
        this.distributeCash();
        this.diverData.money = this.cash
        this.diverData.ofieldPlayers = [[], [], [], [], [], []];
        this.diverData.fieldPlayers = [[], [], [], [], [], []];
        this.setMoneyTotalDiceLeft();
        this.diverData.diceNum = BocaDice.NUMBER_DICE;
    }

    newDeal() {
        this.subDeal(0, 0);
        this.subDeal(4, 8);
        this.subDeal(8, 16);
        this.subDeal(12, 24);
    }

    subDeal(scoreBase, chipBase) {
        this.deck = this.getDeck(scoreBase);
        for (let i = 0; i < 8; i++) {
            let idx = i + chipBase;
            this.diverData.chips[idx].value = this.deck[i]
        }


    }


    calcValue(i) {
        if (i < 2)
            return 0;
        if (i < 4)
            return 1;
        if (i < 6)
            return 2;
        return 3;
    }


    getDeck(base) {
        var deck = new Array();

        for (var i = 0; i < 8; i++) {
            var val = this.calcValue(i) + base;
            deck.push(val);
        }
        this.shuffle(deck)

        return deck;
    }

    shuffle(deck) {
        // for 1000 turns
        // switch the values of two random cards
        for (let i = 0; i < 1000; i++) {
            let location1 = Math.floor((Math.random() * 8));
            let location2 = Math.floor((Math.random() * 8));
            let tmp = deck[location1];

            deck[location1] = deck[location2];
            deck[location2] = tmp;
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
        return this.diverData;
    }

    setDiverPacket(type, message, buttonText = "", buttonText2 = "") {

        this.diverData.type = type;
        this.diverData.message = message;
        this.diverData.state = 0;
        this.diverData.players = this.getUserList();
        this.diverData.buttonText = buttonText;
        this.diverData.buttonText2 = buttonText2;
        return this.diverData;
    }

    prepareDiverPacket() {
        return {

            round: 1,
            currentIndex: -1,
            startIndex: 0,
            buttonText: "Start",
            buttonText2: "",
            oxygen: 25,
            message: "the start msg",
            di1:0,
            di2:0,
            players: [],
            chips: [
                {
                    name: "",
                    type: 'C',
                    color: "#2dcded",
                    textColor:"red",
                    value: 3,
                    size: .5
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#2dcded",
                    value: 3,
                    size: .5
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#2dcded",
                    value: 3,
                    size: .5
                },
                {
                    name: "",
                    type: 'C',
                    color: "#2dcded",
                    textColor:"red",
                    value: 3,
                    size: .5
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#2dcded",
                    value: 3,
                    size: .5
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#2dcded",
                    value: 3,
                    size: .5
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#2dcded",
                    value: 3,
                    size: .5
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#2dcded",
                    value: 3,
                    size: .5
                },

                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#40aed6",
                    value: 3,
                    size: .6
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#40aed6",
                    value: 3,
                    size: .6
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#40a3d6",
                    value: 3,
                    size: .6
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#40aed6",
                    value: 3,
                    size: .6
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#40aed6",
                    value: 3,
                    size: .6
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#40aed6",
                    value: 3,
                    size: .6
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#40aed6",
                    value: 3,
                    size: .6
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#40aed6",
                    value: 3,
                    size: .6
                },

                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#3c7da3",
                    value: 3,
                    size: .7
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#3c7da3",
                    value: 3,
                    size: .7
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#3c7da3",
                    value: 3,
                    size: .7
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#3c7da3",
                    value: 3,
                    size: .7
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#3c7da3",
                    value: 3,
                    size: .7
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#3c7da3",
                    value: 3,
                    size: .7
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#3c7da3",
                    value: 3,
                    size: .7
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#3c7da3",
                    value: 3,
                    size: .7
                },

                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#406280",
                    value: 3,
                    size: .8
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#406280",
                    value: 3,
                    size: .8
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#406280",
                    value: 3,
                    size: .8
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#406280",
                    value: 3,
                    size: .8
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#406280",
                    value: 3,
                    size: .8
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#406280",
                    value: 3,
                    size: .8
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#406280",
                    value: 3,
                    size: .8
                },
                {
                    name: "",
                    type: 'C',
                    textColor:"red",
                    color: "#406280",
                    value: 3,
                    size: .8
                }
            ]

        }
    }

    isUnique(playerIndex, fld) {
        for (let i in fld) {
            if (i == playerIndex)
                continue;
            if (fld[i].value == fld[playerIndex].value)
                return false;
        }
        return true;
    }

    getUniquePlayer(playerIndex, fld) {
        if (playerIndex == fld.length) {
            return -1;
        }
        while (!this.isUnique(playerIndex, fld)) {
            playerIndex++;
            if (playerIndex == fld.length) {
                return -1;
            }
        }
        return playerIndex;
    }

    distributeFieldCash(ind) {
        let playerIndex = 0;
        let fld = this.diverData.fieldPlayers[ind]
        let money = this.diverData.money[ind];
        while (money.length > 0) {
            playerIndex = this.getUniquePlayer(playerIndex, fld);
            if (playerIndex == -1)
                return;
            this.getUser(fld[playerIndex].name).money += money[0].value;
            this.getUser(fld[playerIndex].name).totalMoney += money[0].value;
            money.splice(0, 1);
            playerIndex++;

        }

    }

    distributePlayerCash() {
        this.setMoneyZero();
        for (let i = 0; i < 6; i++) {
            if (this.diverData.fieldPlayers[i].length > 0)
                this.distributeFieldCash(i);

        }

    }

    addUser(connection, name) {
        var user = {
            connection: connection,
            name: name,
            position:-1,
            score: 0,
            treasure: [],
            direction: "Down",
            playing: false
        };
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

    score(id, row) {
        let s = 0;

        for (let item in row) {
            s += row[item].value;
        }
        this.users.filter((user) => user.name === id)[0].score += s;
        return s;

    }

    getCurrentCard(id) {
        return this.users.filter((user) => user.name === id)[0].currentCard;

    }

    setAllState(state) {
        let lst = this.users;
        lst.map((u) => {
            u.state = state;
            u.cards.map((y) => {
                y.state = state;
            });
        });
    }


    closeSockets(lst) {
        lst.map((u) => {
            u.connection.close();
        });
    }

    sendPacket(lst, packet) {
        lst.map((u) => {
            packet.state = u.state;
            packet.users = this.getUserList();
            u.connection.send(JSON.stringify(packet));
        });
    }

    fillinPacket(id, packet) {
        let u = this.users.filter((user) => user.name === id)[0];
        packet.state = u.state;
        packet.cards = u.cards.sort(this.compare);
        packet.row1 = this.row1;
        packet.row2 = this.row2;
        packet.row3 = this.row3;
        packet.row4 = this.row4;
        packet.users = this.getUserList();

    }


    broadCastAll(packet) {
        let lst = this.users;
        this.sendPacket(lst, packet);
        lst = this.watchers;
        this.sendPacket(lst, packet);
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

    send(id, packet) {
        let lst = this.users.filter((user) => user.name === id);
        this.sendPacket(lst, packet);
    }

    sendWatcher(id, packet) {
        let lst = this.watchers.filter((user) => user.name === id);
        this.sendPacket(lst, packet);
    }
    sendToAll(id, packet){
        this.send(id, packet);
        packet.buttonText = "";
        packet.buttonText2 = "";
        this.broadCastMessage(id, packet);
    }
    broadCastMessage(id, packet) {
        let lst = this.users.filter((user) => user.name !== id);
        this.sendPacket(lst, packet);
        lst = this.watchers;
        this.sendPacket(lst, packet);
    }

    setScoreZero() {
        for (let i in this.users)
            this.users[i].score = 0;
    }

    getUser(id) {
        return this.users.filter((user) => user.name === id)[0]
    }

    getUserList() {
        var namesArray = this.users.map((user) => {
            return {
                name: user.name,
                position:user.position,
                score: user.score,
                treasure: user.treasure,
                direction: user.direction,
                playing: user.playing
            };
        });

        return namesArray;
    }

}

module.exports = {Diver};

