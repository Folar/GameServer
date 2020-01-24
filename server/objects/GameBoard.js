const {Tile} = require('./Tile.js');

class GameBoard {
    constructor() {
        this.tile = [];
        this.tileBag = [];
        this.hot = [];
        this.cSafe = 0;
        this.availTiles = 108;
        this.cExamine = 0;
        this.tilesExamine = [new Tile(), new Tile(), new Tile(), new Tile()];
        this.tilesSafe = [new Tile(), new Tile(), new Tile(), new Tile()];
        this.tradeCnt = 0;
        this.tradeIndex = 0;
        this.current = 0;
        this.playerNum = 0;
        this.gameState=GameBoard.OTHER;
        this.stockTrade = [];
        this.m_row = -1;
        this.m_column = -1;
        this.sharesBrought = 0;
        this.hits = false;
        this.currentPlayer = 0;
        this.okToBuy= true;
        this.playing = false;
        this.gameStarted = false;
        this.bonusWinners=[];
        this.dummyTile = Tile.dummy;
        this.winner = 0;
        this.starterTile = []
        this.startTile = null
        this.startPlayer = 0;
        this.startNum = 0;
        this.gameInfo="";
        this.tileStr = [];
        for (let i = 0; i < 9; i++) {
            let k = []
            for (let j = 0; j < 12; j++) {
                k.push(new Tile(i, j));
                this.tileBag.push(new Tile(i, j))
            }
            this.tile.push(k)
        }
        ;
    }

    static get PLACETILE() {
        return 0
    };

    static get STARTCHAIN() {
        return 1
    };

    static get MERGE() {
        return 2
    };

    static get BUYSTOCK() {
        return 3
    };

    static get GAMEOVER() {
        return 4
    };

    static get NEWGAME() {
        return 5
    };

    static get OTHER() {
        return 6
    };

    static get SERVER() {
        return 7
    };

    static get SWAP() {
        return 8
    };

    static get CHOOSE_ORDER() {
        return9
    };

}

module.exports = {GameBoard}