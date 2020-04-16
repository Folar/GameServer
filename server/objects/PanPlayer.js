const {PanActions} = require('../../utils/PanActions.js');
const {PanCard} = require('./PanCard.js');
class PanPlayer {

    constructor(name = null, pa = null, total = 100) {
        this.total = total;
        this.current = 0;
        this.name = name;
        this.panActions = pa;
        this.state = 100;
        this.sitOut = false;
        this.forfeit = false;
        this.playing = false;
        this.hand = this.pickHand();
        this.playerId = -1;
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

    pickHand() {

        for (let i = 0; i < 10; i++) {
            this.hand.push(pa.pickACard()) ;
        }

    }



}

module.exports = {PanPlayer};
