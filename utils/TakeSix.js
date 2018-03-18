

class TakeSix {



    constructor() {
        this.users = [];

        this.newDeal();
    }
    static get NUMBER_DEALT() {
        return 5;
    }

    static get NUMBER_TAKE() {
        return 2;
    }

    newDeal() {
        this.deck = this.getDeck();
        this.shuffle();
        this.row1 = [this.getOneCard()];
        this.row2 = [this.getOneCard()];
        this.row3 = [this.getOneCard()];
        this.row4 = [this.getOneCard()];
    }


    calcValue(i) {
        if (i % 10 == 0)
            return 3;
        if (i % 11 == 0) {
            if (i == 55)
                return 7;
            return 5;
        }
        if (i % 5 == 0)
            return 2;
        return 1;
    }

    getDeck() {
        var deck = new Array();

        for (var i = 0; i < 104; i++) {
            var card = {value: this.calcValue(i + 1), rank: i + 1, state: 0};
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

    setOneRow(idx, row) {
        switch (idx) {
            case 1:
                this.row1 = row;
                break;
            case 2:
                this.row2 = row;
                break;
            case 3:
                this.row3 = row;
                break;
            case 4:
                this.row4 = row;
                break;
        }

    }

    setCardRows(row1, row2, row3, row4) {
        this.row1 = row1;
        this.row2 = row2;
        this.row3 = row3;
        this.row4 = row4;
    }

    getCardRows() {
        return [this.row1, this.row2, this.row3, this.row4];
    }

    getUserCards() {
        let userCards = [];
        for (let i = 0; i < TakeSix.NUMBER_DEALT; i++) { // NUMBER
            userCards.push(this.getOneCard());
        }
        return userCards;
    }

    reshuffle() {
        this.newDeal();
        let lst = this.users;
        lst.map((u) => {
            u.cards = this.getUserCards();

        });
    }

    addUser(connection, id) {
        var user = {
            connection: connection,
            id: id,
            cards: this.getUserCards(),
            score: 0,
            currentCard: {value: 0, rank: 0, state: 0},
            state: 1,
            playing: false
        };
        this.users.push(user);
        return user;
    }

    removeUser(id) {
        var user = this.getUser(id);

        if (user) {
            this.users = this.users.filter((user) => user.id !== id);

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
        let u = this.users.filter((user) => user.id === id)[0];
        u.state = state;
    }

    removeCard(id, rank) {
        let u = this.users.filter((user) => user.id === id)[0];
        let idx = 0;
        for (let item in u.cards) {
            if (u.cards[item].rank == rank) {
                u.currentCard = u.cards[item];
                break;
            }
            idx++;
        }
        u.cards.splice(idx, 1);
        u.playing = true;
    }

    stopPlaying(id) {
        this.users.filter((user) => user.id === id)[0].playing = false;

    }

    score(id, row) {
        let s = 0;

        for (let item in row) {
            s += row[item].value;
        }
        this.users.filter((user) => user.id === id)[0].score += s;


    }

    getCurrentCard(id) {
        return this.users.filter((user) => user.id === id)[0].currentCard;

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

    sortUsersByCardRank() {
        this.users = this.users.sort(this.compareUsers);
    }

    sendPacket(lst, packet) {
        lst.map((u) => {
            packet.state = u.state;
            packet.cards = u.cards.sort(this.compare);
            packet.row1 = this.row1;
            packet.row2 = this.row2;
            packet.row3 = this.row3;
            packet.row4 = this.row4;
            packet.users = this.getUserList();
            u.connection.send(JSON.stringify(packet));
        });
    }

    fillinPacket(id, packet) {
        let u = this.users.filter((user) => user.id === id)[0];
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
    }

    sendCustomPacket(id, packet) {
        let u = this.users.filter((user) => user.id === id)[0];
        u.connection.send(JSON.stringify(packet));
    }

    send(id, packet) {
        let lst = this.users.filter((user) => user.id === id);
        this.sendPacket(lst, packet);
    }

    broadCastMessage(id, packet) {
        let lst = this.users.filter((user) => user.id !== id);
        this.sendPacket(lst, packet);
    }

    getUser(id) {
        return this.users.filter((user) => user.id === id)[0]
    }

    getUserList() {
        var namesArray = this.users.map((user) => {
            return {
                name: user.id,
                score: user.score,
                card: user.state == 5 ? user.currentCard : {value: 0, rank: "", state: 0},
                playing: user.playing
            };
        });

        return namesArray;
    }
}

module.exports = {TakeSix};

