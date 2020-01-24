const {Tile} = require('./Tile.js');
const {AboutNeighbors} = require('./AboutNeighbors.js');

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
        this.gameState = GameBoard.OTHER;
        this.stockTrade = [];
        this.this.row = -1;
        this.this.column = -1;
        this.sharesBrought = 0;
        this.hits = false;
        this.currentPlayer = 0;
        this.okToBuy = true;
        this.playing = false;
        this.gameStarted = false;
        this.bonusWinners = [];
        this.dummyTile = Tile.dummy;
        this.winner = 0;
        this.starterTile = [];
        this.startTile = null;
        this.startPlayer = 0;
        this.startNum = 0;
        this.gameInfo = "";
        this.tileStr = [];
        this.playingTile = false;
        this.initTiles();
        this.initHotels();
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
        return 9
    };

    setTileState(row, col, state) {
        this.row = row;
        this.column = col;
        this.tile[row][col].setState(state);
        this.availTiles = 108;
        this.tileCnt = 0;
    }

    initHotels() {
        this.hot = [];
        this.hot.push(new Hotel(Hotel.LUXOR, "Luxor", this));
        this.hot.push(new Hotel(Hotel.TOWER, "Tower", this));
        this.hot.push(Hotel(Hotel.AMERICAN, "American", this));
        this.hot.push(Hotel(Hotel.FESTIVAL, "Festival", this));
        this.hot.push(Hotel(Hotel.WORLDWIDE, "WorldWide", this));
        this.hot.push(Hotel(Hotel.CONTINENTAL, "Continental", this));
        this.hot.push(Hotel(Hotel.IMPERIAL, "Imperial", this));

    }

    initTiles() {
        for (let i = 0; i < 9; i++) {
            let k = [];
            for (let j = 0; j < 12; j++) {
                k.push(new Tile(i, j));
                this.tileBag.push(new Tile(i, j))
            }
            this.tile.push(k)
        }
    }

    playTile(msg) {
        let col;
        let row;
        let x;
        let t = msg.getTile();
        row = t.getRow();
        col = t.getColumn();
        this.placeTile(row, col, msg);


        for (let i = 0; i < 6; i++) {
            if (this.players[this.currentPlayer].getTiles()[i].getRow() == row &&
                this.players[this.currentPlayer].getTiles()[i].getColumn() == col) {
                this.players[this.currentPlayer].getTiles()[i] = dummyTile;
                break;
            }
        }


        this.playingTile = false;
        let msgs = {msg};
        return msgs;
    }

    isDead(row, col) {
        if (this.tile[row][col].getState() != Tile.EMPTY) return false;
        this.cSafe = 0;
        let dup = [0, 0, 0, 0];
        let dupCnt = 0;
        let j;
        if (row != 0) {
            if (this.tile[row - 1][col].getState() != Tile.EMPTY &&
                this.tile[row - 1][col].getState() != Tile.ONBOARD) {
                dup[dupCnt++] = this.tile[row - 1][col].getState();
                this.tilesSafe[this.cSafe++] = this.tile[row - 1][col];
            }
        }
        if (row != 8) {
            if (this.tile[row + 1][col].getState() != Tile.EMPTY &&
                this.tile[row + 1][col].getState() != Tile.ONBOARD) {
                for (j = 0; j < dupCnt; j++) {
                    if (this.tile[row + 1][col].getState() == dup[j]) break;
                }
                if (j == dupCnt) {
                    dup[dupCnt++] = this.tile[row + 1][col].getState();
                    this.tilesSafe[this.cSafe++] = this.tile[row + 1][col];
                }
            }
        }
        if (col != 0) {
            if (this.tile[row][col - 1].getState() != Tile.EMPTY &&
                this.tile[row][col - 1].getState() != Tile.ONBOARD) {
                for (j = 0; j < dupCnt; j++) {
                    if (this.tile[row][col - 1].getState() == dup[j]) break;
                }
                if (j == dupCnt) {
                    dup[dupCnt++] = this.tile[row][col - 1].getState();
                    this.tilesSafe[this.cSafe++] = this.tile[row][col - 1];
                }
            }
        }
        if (col != 11) {
            if (this.tile[row][col + 1].getState() != Tile.EMPTY &&
                this.tile[row][col + 1].getState() != Tile.ONBOARD) {
                for (j = 0; j < dupCnt; j++) {
                    if (this.tile[row][col + 1].getState() == dup[j]) break;
                }
                if (j == dupCnt) {
                    this.tilesSafe[this.cSafe++] = this.tile[row][col + 1];
                }
            }
        }
        if (this.cSafe == 0 || this.cSafe == 1) {
            return false;
        }
        let cnt = 0;
        for (let i = 0; i < this.cSafe; i++) {
            if (this.hot[this.tilesSafe[i].getState()].isSafe()) {
                cnt++;
            }
        }
        if (cnt > 1) return true;
        return false;
    }


    canStartChain(state) {
        if (this.hot[state].price() != 0) return false;
        return true;
    }

    isOneHotelLeft() {
        let j = 0;
        let h = -1;
        for (let i = 0; i < 7; i++) {
            if (canStartChain(i)) {
                j++;
                h = i;
            }
        }
        if (j > 1) {
            h = -1;
        }
        return h;
    }

    startChain(state, cur) {

        if (this.hot[state].price() != 0) return false;

        this.tile[this.row][this.column].setState(state);
        for (let i = 0; i < this.cExamine; i++) {
            this.walkChain(this.tilesExamine[i], state);
        }
        this.cExamine = 0;
        this.players[cur].bonusShare(this.hot[state]);
        if (this.getGameState() == GameBoard.STARTCHAIN) {

            setGameState(GameBoard.BUYSTOCK);
        }
        this.players[this.currentPlayer].setState(GameBoard.BUYSTOCK);


        return true;
    }

    walkChain(t, state) {
        let row = t.getRow();
        let col = t.getColumn();
        if (this.tile[row][col].getState() == Tile.ONBOARD) {
            t.setState(state);
        }
        if (row != 0) {
            if (this.tile[row - 1][col].getState() == Tile.ONBOARD) {
                walkChain(this.tile[row - 1][col], state);
            }
        }
        if (row != 8) {
            if (this.tile[row + 1][col].getState() == Tile.ONBOARD) {
                walkChain(this.tile[row + 1][col], state);
            }
        }
        if (col != 0) {
            if (this.tile[row][col - 1].getState() == Tile.ONBOARD) {
                this.walkChain(this.tile[row][col - 1], state);
            }
        }
        if (col != 11) {
            if (this.tile[row][col + 1].getState() == Tile.ONBOARD) {
                this.walkChain(this.tile[row][col + 1], state);
            }
        }
    }

    canBuyStock(i) {
        if (this.hot[i].price() == 0) return false;
        if (this.players[this.currentPlayer].getMoney() < this.hot[i].price())
            return false;
        let av = this.hot[i].getAvailShares();
        if (av == 0) return false;
        return true;
    }


    buyStock(bh) {
        let b = false;
        for (let i = 0; i < bh.getCount(); i++) {
            for (let j = 0; j < bh.getAmount(i); j++) {
                b = true;
                this.players[bh.getCurrentPlayerID()].purchaseStock(this.hot[bh.getHotel(i)]);
            }

        }
        return b;
    }

    isAllSafe() {
        let b = false;
        for (let i = 0; i < 7; i++) {
            if (this.hot[i].count() == 0)
                continue;
            if (this.hot[i].count() < 11)
                return false;
            b = true;
        }
        return b;
    }

    checkForEnd() {
        if (this.over40() || thiis.isAllSafe())
            return true;
        else
            return false;
    }

    over40() {
        let i;
        for (i = 0; i < 7; i++) {
            if (this.hot[i].count() > 40)
                break;
        }
        if (i == 7) return false;
        return true;
    }

    isTile() {
        if (this.availTiles > 0) return true;
        return false;
    }

    chooseWinner(bh) {
        buyStock(bh);
        let m = [];
        for (let i = 0; i < 7; i++) {
            if (this.hot[i].count() != 0) {
                this.hot[i].calcBonus();
                bonusPayout(i, -1, bh);
            }
        }
        let amt = 0;
        let winner = 0;
        for (let i = 0; i < this.playerNum; i++) {
            let w = this.players[i].worth();
            this.players[i].setMoney(w);
            if (amt < w) {
                amt = w;
                winner = i;
            }


        }

        for (let i = 0; i < this.playerNum; i++) {
            this.players[i].setState(GAMEOVER);

        }
        let res = [];

        res[0] = bh;


        let str = this.players[bh.getCurrentPlayerID()].getName() + " ends the Game.\n>> " +
            this.players[winner].getName() + " is the WINNER!!.";
        bh.appendMessage(str);


        setGameState(GameBoard.GAMEOVER);

        return res;
    }

    surroundingTiles(ti) {
        let x;
        let row = ti.getRow();
        let col = ti.getColumn();
        if (ti.getState() != Tile.EMPTY) {
            return null;
        }
        let an = new AboutNeighbors();
        if (isNonPlayable(row, col)) {
            an.setType(Tile.NONPLAYBLE);
            return an;
        }
        an.setType(Tile.ONBOARD);
        this.cSafe = 0;
        let dup = [0, 0, 0, 0];
        let dupCnt = 0;
        let j;
        if (row != 0) {
            if (this.tile[row - 1][col].getState() != Tile.EMPTY &&
                this.tile[row - 1][col].getState() != Tile.ONBOARD) {
                dup[dupCnt++] = this.tile[row - 1][col].getState();
                this.tilesSafe[this.cSafe++] = this.tile[row - 1][col];

                //north
                an.getNeighors()[0] = this.tile[row - 1][col].getState();
                an.getHotels()[this.tile[row - 1][col].getState()] =
                    this.hot[this.tile[row - 1][col].getState()].count();
            } else {
                an.getNeighors()[0] = this.tile[row - 1][col].getState();
                if (an.getNeighors()[0] == Tile.ONBOARD) {
                    an.setType(Tile.START);
                }
            }
        } else {
            an.getNeighors()[0] = Tile.OUTOFBOUNDRY;
        }

        if (row != 8) {
            if (this.tile[row + 1][col].getState() != Tile.EMPTY &&
                this.tile[row + 1][col].getState() != Tile.ONBOARD) {

                // south Tile
                an.getNeighors()[2] = this.tile[row + 1][col].getState();
                an.getHotels()[this.tile[row + 1][col].getState()] =
                    this.hot[this.tile[row + 1][col].getState()].count();
                for (j = 0; j < dupCnt; j++) {
                    if (this.tile[row + 1][col].getState() == dup[j]) break;
                }
                if (j == dupCnt) {
                    dup[dupCnt++] = this.tile[row + 1][col].getState();
                    this.tilesSafe[this.cSafe++] = this.tile[row + 1][col];

                }
            } else {
                an.getNeighors()[2] = this.tile[row + 1][col].getState();
                if (an.getNeighors()[2] == Tile.ONBOARD) {
                    an.setType(Tile.START);
                }
            }
        } else {
            an.getNeighors()[2] = Tile.OUTOFBOUNDRY;
        }
        if (col != 0) {
            if (this.tile[row][col - 1].getState() != Tile.EMPTY &&
                this.tile[row][col - 1].getState() != Tile.ONBOARD) {

                // west Tile
                an.getNeighors()[3] = this.tile[row][col - 1].getState();
                an.getHotels()[this.tile[row][col - 1].getState()] =
                    this.hot[this.tile[row][col - 1].getState()].count();
                for (j = 0; j < dupCnt; j++) {
                    if (this.tile[row][col - 1].getState() == dup[j]) break;
                }
                if (j == dupCnt) {
                    dup[dupCnt++] = this.tile[row][col - 1].getState();
                    this.tilesSafe[this.cSafe++] = this.tile[row][col - 1];
                }
            } else {
                an.getNeighors()[3] = this.tile[row][col - 1].getState();
                if (an.getNeighors()[3] == Tile.ONBOARD) {
                    an.setType(Tile.START);
                }
            }

        } else {
            an.getNeighors()[3] = Tile.OUTOFBOUNDRY;
        }
        if (col != 11) {
            if (this.tile[row][col + 1].getState() != Tile.EMPTY &&
                this.tile[row][col + 1].getState() != Tile.ONBOARD) {

                //east
                an.getNeighors()[1] = this.tile[row][col + 1].getState();
                an.getHotels()[this.tile[row][col + 1].getState()] =
                    this.hot[this.tile[row][col + 1].getState()].count();
                for (j = 0; j < dupCnt; j++) {
                    if (this.tile[row][col + 1].getState() == dup[j]) break;
                }
                if (j == dupCnt) {
                    this.tilesSafe[this.cSafe++] = this.tile[row][col + 1];
                }
            } else {
                an.getNeighors()[1] = this.tile[row][col + 1].getState();
                if (an.getNeighors()[1] == Tile.ONBOARD) {
                    an.setType(Tile.START);
                }
            }

        } else {
            an.getNeighors()[1] = Tile.OUTOFBOUNDRY;
        }
        if (this.cSafe == 1) {
            an.setType(Tile.GROW);
            an.setGrower(this.tilesSafe[0].getState());
            return an;
        }
        let cnt = 0;
        for (let i = 0; i < this.cSafe; i++) {
            if (this.hot[this.tilesSafe[i].getState()].isSafe()) {
                cnt++;
            }
        }
        if (cnt > 1) {
            an.setType(Tile.DEAD);
            return an;
        }
        if (this.cSafe > 1) {
            an.setType(Tile.MERGE);
            return an;
        }
        return an;
    }


}

module.exports = {GameBoard};