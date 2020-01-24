const {Hotel} = require('./Hotel.js');
class StockTransaction {

    constructor(player=0,survivor=0,defunct=0,bonusStr) {
        this.index = 0;
        this.player = "";
        this.survivor = 0;
        this.defunct = defunct;
        this.bonusStr = "";
        this.title =Hotel.HOTELS[survivor] + " takes over "+ Hotel.HOTELS[defunct]  ;
    }


}
module.exports = {StockTransaction};
