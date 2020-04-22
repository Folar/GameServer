const {PanPlayer} = require('./objects/PanPlayer.js');
const {PanCard} = require('./objects/PanCard.js');


class PanActions {


    constructor(pan) {
        this.pan= pan;
        this.deck = [];
        this.deckIndex = 0;
        this.players = [];
        this.current = 0;
        this.playerNum = 0;
        this.gameState = PanActions.OTHER;

        this.currentPlayer = 0;

        this.playing = false;
        this.gameStarted = false;

        this.gameInfo = "";
        this.panStarted = false;


        this.lostPlayers = [];
        this.stopProcessing = false;
        this.lastCmd = "";
        this.initDeck();
        pan.setPanActions(this);
    }

    static get OTHER() {
        return 0
    };
    static get FIRST_PLAYER_DRAW() {
        return 1
    };

    static get DRAW() {
        return 2
    };

    static get PICKUP() {
        return 3
    };


    static get PLAY_AND_MUCK() {
        return 4
    };

    static get PICKUP_OR_DRAW() {
        return 5
    };

    static get FIRST_PLAYER_PICKUP_OR_DRAW() {
        return 6
    };

    static get PASS() {
        return 7
    };

    static get FORFEIT() {
        return 8
    };

    static get WAITING() {
        return 10
    };

    static get MOVE() {
        return 11
    };

    static get START() {
        return 100;
    }

    static get ANTE() {
        return 101;
    }
    static get GAMEOVER() {
        return 110;
    }


    getGameState() {
        return this.gameState;
    }

    setGameState(s) {
        this.gameState = s;
    }



    lostConnection(players) {
        this.lostPlayers = players;
        let str = "Everyone is reconnected, "+this.players[this.currentPlayer].name +" may resume play"
        if (this.lostPlayers.length != 0) {
            let p = this.pan.formatNameList(players);
            this.stopProcessing = true;
            str = p + " has lost their connections please wait";
        } else {
            this.stopProcessing = false;
        }
        let packet = this.pan.setPanPacket("playerStart", str, "");
        this.pan.broadCastAll(packet);

    }



    initDeck() {
        this.deck = [];
        this.deckIndex =0;
        for (let i = 0; i < 40; i++) {
            let k = [];
            for (let j = 0; j < 8; j++) {
                this.deck.push(new PanCard(i))
            }
        }

        this.shuffle();

    }

    shuffle() {
        // for 1000 turns
        // switch the values of two random cards
        for (let i = 0; i < 5000; i++) {
            let location1 = Math.floor((Math.random() * this.deck.length));
            let location2 = Math.floor((Math.random() * this.deck.length));
            let tmp = this.deck[location1];
            this.deck[location1] = this.deck[location2];
            this.deck[location2] = tmp;
        }
    }




    getPlayer(id) {
        return this.players.filter((player) => player.name === id)[0];
    }

    processMsg(cmd) {

        if (this.stopProcessing)
            return;
        if (this.lastCmd == JSON.stringify(cmd)){
            console.log("dup command " + cmd.name);
            return;
        }
        this.lastCmd = JSON.stringify(cmd)
        console.log("processCmd2 " + this.lastCmd);


        switch (cmd.action) {
            case PanActions.START:
                this.lostPlayers = [];
                return this.startPlayer(cmd);

            case PanActions.DRAW:
                return this.draw(cmd);

            case PanActions.PICKUP:
                return this.pickup(cmd);

            case PanActions.PASS:
                return this.pass(cmd);

            case PanActions.PLAY_AND_MUCK:
                return this.muck(cmd);

            case PanActions.MOVE:
                return this.move(cmd)
        }
        return null;
    }
    transfer(target, source) {
        target.suit = source.suit;
        target.rank = source.rank;
        target.ordinal = source.ordinal;
        target.rankOrdinal = source.rankOrdinal
    }

    getCardString(c){
        let suit ="";
        let rank = "";

        switch (c.suit) {
            case 's':
                suit = "Spades";
                break;
            case 'h':
                suit = "Hearts";
                break;
            case 'd':
                suit = "Diamonds";
                break;
            case 'c':
                suit = "Clubs";
                break;
        }
        rank = c.rank;
        switch (c.rank) {
            case 1:
                rank = "Ace";
                break;
            case 11:
                rank = "Jack";
                break;
            case 12:
                rank = "Queen";
                break;
            case 13:
                rank = "King";
                break;
        }
        return rank + " of " + suit;
    }
    draw(msg){
        let c = this.pickACard();
        let packet = this.pan.setPanPacket("draw", msg.name +" draws the " + this.getCardString(c), "");
        let lst = this.players.filter((player) => player.name === msg.name);
        let p = lst[0];
        p.state = msg.args.newState;
        p.hand = msg.args.hand;
        p.cards = msg.args.cards;
        packet.currentCard = c;
        this.pan.broadCastAll(packet);
    }
    pickup(msg){
        let  c = this.pan.getCurrentPacket().currentCard;
        let packet = this.pan.setPanPacket("pickup", msg.name +" picks up the " + this.getCardString(c), "");
        let lst = this.players.filter((player) => player.name === msg.name);
        let p = lst[0];
        p.state = msg.args.newState;
        p.hand = msg.args.hand;
        p.cards = msg.args.cards;
        packet.currentCard.rank = 'card_back';
        packet.currentCard.suit = '';
        this.pan.broadCastAll(packet);
    }
    pass(msg) {
        let packet = this.pan.getCurrentPacket();

        this.transfer(packet.passCard, packet.currentCard);
        packet.currentCard.rank = 'card_back';
        packet.currentCard.suit = '';

        let lst = this.players.filter((player) => player.name === msg.name);
        let p = lst[0];
        p.hand = msg.args.hand;
        p.cards = msg.args.cards;
        p.state = 0;
        packet.currentPlayer++
        if (packet.currentPlayer == packet.players.length)
            packet.currentPlayer = 0;
        this.players[packet.currentPlayer].state = 5;
        let cards = this.players[packet.currentPlayer].cards;

        this.currentPlayer =  packet.currentPlayer;
        packet.journal =  this.players[packet.currentPlayer].name + " can pickup the " + this.getCardString(packet.passCard) + " or draw a card from the deck" ;
        this.createDropSpot(cards);
        this.pan.broadCastAll(packet);
    }

    move(msg) {
        let packet = this.pan.getCurrentPacket();

        let lst = this.players.filter((player) => player.name === msg.name);
        let p = lst[0];
        p.hand = msg.args.hand;
        p.cards = msg.args.cards;
        this.pan.broadCastAll(packet);
    }

    muck(msg) {
        let packet = this.pan.getCurrentPacket();

        packet.currentCard.rank = 'card_back';
        packet.currentCard.suit = '';

        let lst = this.players.filter((player) => player.name === msg.name);
        let p = lst[0];
        p.hand = msg.args.hand;
        p.cards = msg.args.cards;
        p.state = 0;
        packet.currentPlayer++
        if (packet.currentPlayer == packet.players.length)
            packet.currentPlayer = 0;
        this.players[packet.currentPlayer].state = 2;
        let cards = this.players[packet.currentPlayer].cards;

        this.currentPlayer =  packet.currentPlayer;
        packet.journal = msg.name +" has "+ msg.args.txt ;

        this.pan.broadCastAll(packet);
    }

    createDropSpot(cards) {

        if (cards.length > 0 && cards[cards.length - 1].money == -1)
            return;
        cards.push({
            str:"",
            group: cards.length,
            sels: [false, false, false, false, false, false, false, false, false, false],
            money: -1,
            cards: [
                {
                    rank: "empty"
                }
            ]

        });
    }
    setPlay(id) {
        let lst = this.players.filter((player) => player.name === id);
        let p = lst[0];
        p.state = PanActions.WAITING;
        p.playing = true;
    }

    getNonPlaying() {
        return this.players.filter((player) => player.playing !== true);
    }

    getPlaying() {
        return this.players.filter((player) => player.playing === true);
    }

    startPlayer(msg) {
        this.setPlay(msg.name);
        let ulst = this.getNonPlaying();

        let str = "";
        if (ulst.length == 0) {
            this.pan.setPanStarted(true);
            let players = this.getPlaying();
            let num = Math.floor(Math.random() * players.length);
            str = "Let the games begin! " +
                players[num].name + " was randomly chosen to roll first";
            let packet = this.pan.setPanPacket("playerStart", str, "");
            this.currentPlayer = num;
            for(let i = 0;i<players.length;i++)
                players[i].state = 0;
            players[num].state = PanActions.FIRST_PLAYER_DRAW;
            this.pan.broadCastAll(packet);

        } else {
            str = "Waiting for "
            let cnt = 1;
            let names = [];
            for (let item in ulst) {
                names.push(ulst[item].name);
            }
            str += this.pan.formatNameList(names) + " to click Start";
            let packet = this.pan.setPanPacket("playerStart", str, "");
            this.pan.broadCastAll(packet);
        }
    }

    pickACard() {
        if (this.deckIndex == 280){
            this.shuffle();
            this.deckIndex =0;
        };
        return this.deck[this.deckIndex++]
    }



    nextPlayer(arg, str) {


        return;
    }







}

module.exports = {PanActions};