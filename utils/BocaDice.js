class BocaDice {


    constructor() {
        this.users = [];
        this.watchers = [];
        this.newDeal();
        this.bocaData = this.prepareBocaDicePacket();


    }
    removeAllConnections(){
        let lst = this.users;
        this.closeSockets(lst);
        lst = this.watchers;
        this.closeSockets(lst);
        this.watchers = [];
        this.users = [];
        this.newDeal();
        this.bocaData = this.prepareBocaDicePacket();

    }
    static get NUMBER_ROUNDS() {
        return 4;
    }

    static get NUMBER_DICE() {
        return 8;
    }


    static get NUMBER_PLAYERS() {
        return  5;
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
    sumCash(fldCash){
        let s = 0
        for (let i in fldCash)
            s += fldCash[i].value;
        return s;
    }
    distributeCash(){
        for (let i = 0;i <6;i++){
            while(this.sumCash(this.cash[i])<50){
                this.cash[i].push(this.getOneCard())
            }
            this.cash[i].sort(this.cmp)
        }    
    }
    cmp(a, b) {
        return (a.value - b.value) * -1;
    }
    newDeal() {
        this.deck = this.getDeck();
        this.shuffle();
        this.cash = [[],[],[],[],[],[]];
        this.distributeCash();
    
    }


    calcValue(i) {
        if (i <6)
            return 10;
        if (i<14)
            return 20;
        if (i<22)
            return 30;
        if (i<28)
            return 40;
        if (i<34)
            return 50;
        if (i<39)
            return 60;
        if (i<44)
            return 70;
        if (i<49)
            return 80;
        return 90
    }

    getDeck() {
        var deck = new Array();

        for (var i = 0; i < 54; i++) {
            var card = {value: this.calcValue(i), color: "black" };
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
            if (ulst[item].id === n) {
                return true;
            }
        }
        return false;
    }

    findMinMax() {
        let min = 200;
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

    getCurrentPacket(){
        return this.bocaData;
    }
    setBocaDicePacket(type, message,buttonText) {

        this.bocaData.type = type;
        this.bocaData.message = message;
        this.bocaData.state = 0;
        this.bocaData.players = this.getUserList();
        this.bocaData.buttonText= buttonText;
        return  this.bocaData;
    }

    prepareBocaDicePacket() {
        return {
            messageType: 0,
            message: "",
            state: 0,
            players: this.getUserList(),
            money:this.cash,
            ofieldColors: ["yellow", "cyan", "pink", "green", "orange", "#b19cd9"],
            ofieldPlayers:[[],[],[],[],[],[]],
            fieldColors: ["yellow", "cyan", "pink", "green", "orange", "#b19cd9"],
            fieldPlayers:[[],[],[],[],[],[]],
            currentPlayer:"x@xas",
            currentIndex:0,
            startIndex:0,
            round:1,
            buttonText:"Start",
            buttonShow:true,
            dice:[0,0,0,0,0,0,0,0],
            totalDice:0,
            selectedDice :0,
            diceNum:BocaDice.NUMBER_DICE
        }
    }
    isUnique(playerIndex,fld){
         for(let i in fld){
             if (i == playerIndex)
                 continue;
             if(fld[i].value == fld[playerIndex].value)
                 return false;
         }
         return true;
    }
    getUniquePlayer(playerIndex,fld){
        if(playerIndex == fld.length){
            return -1;
        }
        while(!this.isUnique(playerIndex,fld)){
            playerIndex++;
            if(playerIndex == fld.length){
                return -1;
            }
        }
        return playerIndex;
    }
    distributeFieldCash(ind){
        let playerIndex = 0;
        let fld = this.bocaData.fieldPlayers[ind]
        let money = this.bocaData.money[ind];
        while(money.length>0){
            playerIndex = this.getUniquePlayer(playerIndex,fld);
            if(playerIndex == -1)
                return;
            this.getUser(fld[playerIndex].name).money += money[0].value;
            this.getUser(fld[playerIndex].name).totalMoney += money[0].value;
            money.splice(0,1);
            playerIndex++;

        }

    }

    distributePlayerCash(){
        for (let i=0;i<6;i++){
            if(this.bocaData.fieldPlayers[i].length>0)
                this.distributeFieldCash(i);

        }

    }

    addUser(connection, name) {
        var user = {
            connection: connection,
            name: name,
            money:0,
            totalMoney:0,
            diceLeft: BocaDice.NUMBER_DICE,
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

    compare(a, b) {
        if (a.rank < b.rank) {
            return -1;
        }
        if (a.rank > b.rank) {
            return 1;
        }
        // a must be equal to b
        return 0;
    }

    compareUsers(a, b) {
        if (a.currentCard.rank < b.currentCard.rank) {
            return -1;
        }
        if (a.currentCard.rank > b.currentCard.rank) {
            return 1;
        }
        // a must be equal to b
        return 0;
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
    getPlaying(){
        return this.users.filter((user) => user.playing == true);
    }
    getNonPlaying(){
        return this.users.filter((user) => user.playing !== true);
    }
    setPlay(id){
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
                diceLeft:user.diceLeft,
                playing: user.playing
            };
        });

        return namesArray;
    }

}

module.exports = {BocaDice};

