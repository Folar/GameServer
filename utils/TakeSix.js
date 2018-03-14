// addUser(id, name, room)
// removeUser(id)
// getUser(id)
// getUserList(room)

class TakeSix {
    constructor() {
        this.users = [];
        this.row1 = [];
        this.row2 = [];
        this.row3 = [];
        this.row4 = [];
    }

    addCardRows(row1, row2, row3, row4) {
        this.row1 = row1;
        this.row2 = row2;
        this.row3 = row3;
        this.row4 = row4;
    }

    addUser(connection, id, cards) {
        var user = {connection: connection, id: id, cards: cards, score: 0, currentCard:  {value: 0, rank: 0,state:0},
                    state: 1, playing: false};
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

    setAllState(state) {
        let lst = this.users;
        lst.map((u) => {
            u.state = state;
            u.cards.map((y) => {
                y.state = state;
            });
        });
    }
    sortUsersByCardRank(){
        this.users.sort(this.compareUsers);
    }

    sendPacket(lst, packet) {
        lst.map((u) => {
            packet.state = u.state;
            packet.cards = u.cards.sort(this.compare);
            u.connection.send(JSON.stringify(packet));
        });
    }

    fillinPacket(id, packet) {
        let u = this.users.filter((user) => user.id === id)[0];
        packet.state = u.state;
        packet.cards = u.cards.sort(this.compare);

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
            return {name: user.id, score: user.score, card:user.state ==5 ? user.currentCard :{value: 0, rank: "",state:0},
                    playing: user.playing};
        });

        return namesArray;
    }
}

module.exports = {TakeSix};

