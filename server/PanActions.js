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

    static get PICKUP_OR_PASS() {
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

  // 7 IS DEFUNCT

    static get FORFEIT() {
        return 8
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
        if (cmd.action == PanActions.PanActions_PLAY_TILE &&
            this.players[this.currentPlayer].state != PanActions.PanActions_PLAY_TILE){
            console.log("try sneak in a tile " + cmd.name);
            return;
        }
        this.lastCmd = JSON.stringify(cmd)
        console.log("processCmd2 " + this.lastCmd);
        this.getPlayer(cmd.name).state = 6;

        switch (cmd.action) {
            case PanActions.PanActions_START:
                this.lostPlayers = [];
                return this.startPlayer(cmd);
            case PanActions.PanActions_PLAY_TILE:
                return this.playTile(cmd);
            case PanActions.PanActions_BUY_HOTEL:
                return this.buyStockAction(cmd);
            case PanActions.PanActions_START_HOTEL:
                return this.startHotel(cmd);
            case PanActions.PanActions_NEXT_TRANSACTION:
                let str = this.trade(cmd);
                return this.nextTrans(str);
            case PanActions.PanActions_MERGE_HOTEL:
                let s = "";
                let o = [];
                for (let i = 0; i < cmd.args.order.length; i++) {
                    let h = Hotel.HOTELS.indexOf(cmd.args.order[i]);
                    o.push(h);
                }
                return this.setMerge(cmd.args.cnt, o, s);
            case PanActions.PanActions_END_GAME:
                return this.chooseWinner(cmd);
        }
        return null;
    }


    setPlay(id) {
        let lst = this.players.filter((player) => player.name === id);
        let p = lst[0];
        let t = p.startingTile;
        this.tile[t.row][t.column].state = 9;
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
            let packet = this.pan.setPanPacket("playerStart", str, "Pick a tile from the rack or click on an eligible tile on the board");
            this.currentPlayer = num;
            players[num].state = PanActions.PanActions_PLAY_TILE;
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