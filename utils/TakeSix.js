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
        this.row2 = row2,
            this.row3 = row3;
        this.row4 = row4;
    }

    addUser(connection, id, cards) {
        var user = {connection: connection, id: id, cards: cards, score: 0, currentCard: {}, playing: false};
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

    broadCastAll(id, packet) {
        let lst = this.users;
        lst.map((u) => {
            packet.cards = u.cards.sort(this.compare);
            u.connection.send(JSON.stringify(packet));
        });
    }

    send(id, packet) {
        let lst = this.users.filter((user) => user.id === id);
        lst.map((u) => {
            packet.cards = u.cards.sort(this.compare);
            u.connection.send(JSON.stringify(packet));
        });
    }

    broadCastMessage(id, packet) {
        let lst = this.users.filter((user) => user.id !== id);
        lst.map((u) => {
            packet.cards = u.cards.sort(this.compare);
            u.connection.send(JSON.stringify(packet));
        });
    }

    getUser(id) {
        return this.users.filter((user) => user.id === id)[0]
    }

    getUserList() {
        var namesArray = this.users.map((user) => {
            return {name: user.id, score: user.score, card: user.currentCard, playing: user.playing};
        });

        return namesArray;
    }
}

module.exports = {TakeSix};

