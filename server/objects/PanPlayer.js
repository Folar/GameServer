const {PanActions} = require('./../PanActions.js');
const {PanCard} = require('./PanCard.js');
class PanPlayer {

    constructor(name = null, pa = null, id=-1, total = 100) {
        this.total = total;
        this.current = 0;
        this.name = name;
        this.panActions = pa;
        this.state = 100;
        this.sitOut = false;
        this.forfeit = false;
        this.winner = false;
        this.atTable = false;
        this.playing = false;
        this.hand = [];
        this.pickHand();
        this.playerId = pa.playerNum;
        this.cards = [];
    }

    setState(s) {
        this.state = s;
    }

    getState() {
        return this.state;
    }


    getName() {
        return this.name;
    }

    resetPlayer(){
        this.forfeit = false;
        this.sitOut = false;
        this.state = 0;
        this.pickHand();
        this.cards = [];
        this.current = 0;
        this.winner = false;
    }
    pickHand() {
        this.hand = [];
        for (let i = 0; i < 10; i++) {
            this.hand.push(this.panActions.pickACard()) ;
        }
        this.hand.sort(this.compare);

    }
    compare(a, b) {
        return (a.ordinal - b.ordinal);
    }


}

module.exports = {PanPlayer};
