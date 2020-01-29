const {Tile} = require('./Tile.js');
const {Hotel} = require('./Hotel.js');
const {Player} = require('./Player.js');

class GameBoard {


    constructor(acquire) {
        this.acquire = acquire;
        this.tile = [];
        this.tileBag = [];
        this.tileIndex = 0;
        this.hot = [];
        this.players= [];
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
        this.row = -1;
        this.column = -1;
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
       
        this.stockTransaction;
        this.initTiles();
        this.initHotels();
        acquire.setGameBoard(this);
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

    static get GAMEBOARD_START(){
        return 100;
    }
    static get GAMEBOARD_PLAY_TILE(){
        return 101;
    }
    static get GAMEBOARD_BUY_HOTEL(){
        return 102;
    }
    static get GAMEBOARD_START_HOTEL(){
        return 103;
    }
    static get GAMEBOARD_NEXT_TRANSACTION(){
        return 104;
    }
    static get GAMEBOARD_MERGE_HOTEL(){
        return 105;
    }
    static get GAMEBOARD_SWAP_HOTELS(){
        return 106;
    }
    static get GAMEBOARD_SWAP_STOCK(){
        return 107;
    }
    static get GAMEBOARD_END_GAME(){
        return 108;
    }
    getGameState() {
        return this.gameState;
    }

    setGameState(s) {
        this.gameState = s;
    }
    getStockTrade() {
        return this.stockTrade;
    }

    setStockTrade(value) {
        this.stockTrade = value;
    }
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
        this.hot.push(new Hotel(Hotel.AMERICAN, "American", this));
        this.hot.push(new Hotel(Hotel.FESTIVAL, "Festival", this));
        this.hot.push(new Hotel(Hotel.WORLDWIDE, "WorldWide", this));
        this.hot.push(new Hotel(Hotel.CONTINENTAL, "Continental", this));
        this.hot.push(new Hotel(Hotel.IMPERIAL, "Imperial", this));

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
    processMsg( cmd )
    {

        switch(cmd.getCode()){
            case GameBoard.GAMEBOARD_START:
                return this.startPlayer(cmd);
            case GameBoard.GAMEBOARD_PLAY_TILE:
                return this.playTile(cmd);
            case GameBoard.GAMEBOARD_BUY_HOTEL:
                return this.nextPlayer(cmd);
            case GameBoard.GAMEBOARD_START_HOTEL:
                return this.startHotel(cmd);

            case GameBoard.GAMEBOARD_NEXT_TRANSACTION:
                return this.nextTrans();
            case GameBoard.GAMEBOARD_MERGE_HOTEL:
                return this.mergeHotels(cmd);
            case GameBoard.GAMEBOARD_SWAP_HOTELS:
                return this.swapHotels(cmd);

            case GameBoard.GAMEBOARD_SWAP_STOCK:
                return this.trade(cmd);
            case GameBoard.GAMEBOARD_END_GAME:
                return this.chooseWinner(cmd);
        }
    return null;
    }
    pickATile(){
        if (this.tileIndex == 107) return null;
        return this.tileBag[this.tileIndex++]
    }

    swapHotels( trade)
    {
    }
    getSwap() {
        return this.stockTransaction;
    }

    setSwap(st) {
        this.stockTransaction = st;
    }

    placeTile(row, col, msg) {


        if (this.tile[row][col].getState() != Tile.EMPTY) {

            return false;
        }

        this.row = row;
        this.column = col;


        this.cExamine = 0;
        if (row != 0) {
            if (this.tile[row - 1][col].getState() != Tile.EMPTY) {
                this.tilesExamine[this.cExamine++] = this.tile[row - 1][col];
            }
        }


        if (row != 8) {
            if (this.tile[row + 1][col].getState() != Tile.EMPTY) {
                this.tilesExamine[this.cExamine++] = this.tile[row + 1][col];
            }
        }

        ;

        if (col != 0) {
            if (this.tile[row][col - 1].getState() != Tile.EMPTY) {
                this.tilesExamine[this.cExamine++] = this.tile[row][col - 1];
            }
        }

        ;

        if (col != 11) {
            if (this.tile[row][col + 1].getState() != Tile.EMPTY) {
                this.tilesExamine[this.cExamine++] = this.tile[row][col + 1];
            }
        }


        if (this.cExamine == 0) {
            this.players[this.currentPlayer].setState(GameBoard.BUYSTOCK);
            if (this.getGameState() == GameBoard.PLACETILE) {

                this.setGameState(GameBoard.BUYSTOCK);
            }
            this.tile[row][col].setState(Tile.ONBOARD);

            return true;
        }


        let chain = Tile.EMPTY;

        for (let i = 0; i < this.cExamine; i++) {
            if (this.tilesExamine[i].getState() != Tile.ONBOARD) {
                if (chain != Tile.EMPTY) {
                    if (chain != this.tilesExamine[i].getState()) {
                        this.tile[row][col].setState(Tile.ONBOARD);
                        this.players[this.currentPlayer].setState(GameBoard.MERGE);

                        if (this.getGameState() == GameBoard.PLACETILE) {
                            if (this.getGameState() == GameBoard.PLACETILE) {
                                this.setGameState(GameBoard.MERGE);
                            }
                            return this.mergeChain();
                        }
                        return true;
                    }
                } else {
                    chain = this.tilesExamine[i].getState();
                }
            }
        }

        isHotelsToBuy()
        {
            let i;
            for (i = 0; i < 7; i++) {
                if (this.hot[i].count() == 0)
                    break;
            }
            if (i != 7) return true;
            return false;

        }
        takeOver(survivor, defunct)
        {
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 12; j++) {
                    if (this.tile[i][j].getState() == defunct) {
                        this.tile[i][j].setState(survivor);
                    }
                }
            }
        }

        if (chain == Tile.EMPTY) {
            if (this.isHotelsToBuy() == false) return false;
            this.tile[row][col].setState(Tile.ONBOARD);
            let h = this.isOneHotelLeft();
            if (h != -1) {
                this.startChain(h, msg.getCurrentPlayerID());
                msg.appendMessage(this.players[this.currentPlayer].getName() +
                    " starts " + this.hot[h].getName());
            }
            if (this.getGameState() == GameBoard.PLACETILE) {
                if (h == -1) {
                    this.setGameState(GameBoard.STARTCHAIN);
                } else {
                    setGameState(GameBoard.BUYSTOCK);
                }
            }
            if (h == -1) {
                this.players[this.currentPlayer].setState(GameBoard.STARTCHAIN);
            } else {
                this.players[this.currentPlayer].setState(GameBoard.BUYSTOCK);
            }

        } else {

            this.growChain(chain, msg);
            this.players[this.currentPlayer].setState(GameBoard.BUYSTOCK);
            if (getGameState() == GameBoard.PLACETILE) {
                setGameState(GameBoard.BUYSTOCK);
            }
        }

        return true;
    }

    mergeChain() {

        let mergeNum = 0;
        let j;
        let i;
        let order = [0, 0, 0, 0];
        for (i = 0; i < this.cExamine; i++) {
            if (this.tilesExamine[i].getState() != Tile.ONBOARD) {
                if (mergeNum == 0) {
                    order[0] = this.tilesExamine[i];
                    mergeNum++;
                } else {
                    for (j = 0; j < mergeNum; j++) {
                        if (order[j].getState() == this.tilesExamine[i].getState()) {
                            break;
                        }
                    }
                    if (mergeNum == j) {
                        order[mergeNum++] = this.tilesExamine[i];
                    }
                }
            }
        }


        let x;
        let y;
        let temp;
        for (i = 0; i < mergeNum - 1; i++) {
            for (j = i + 1; j < mergeNum; j++) {
                if (this.hot[order[i].getState()].count() <
                    this.hot[order[j].getState()].count()) {
                    temp = order[i];
                    order[i] = order[j];
                    order[j] = temp;
                    // during sort
                }
            }
        }

        let nParts = 0;
        let part = [0, 0, 0, 0];
        let cnt = this.hot[order[0].getState()].count();
        let mergeList = [0, 0, 0, 0];
        for (i = 0; i < mergeNum; i++) {
            mergeList[i] = order[i].getState();
            if (this.hot[order[i].getState()].count() == cnt) {
                part[nParts]++;
            } else {
                cnt = this.hot[order[i].getState()].count();
                nParts++;
                part[nParts]++;
            }
        }
        nParts++;
        if (nParts < mergeNum) {
            let split = [];
            let pos = 0;
            for (i = 0; i < nParts; i++) {
                split.push([]);
                for (j = 0; j < part[i]; j++) {
                    split[i].push(order[j + pos].getState());
                    /// xxx = split[i][j];
                }
                pos += part[i];
            }

            // DHTMLMergeList = split;
            //DHTMLMergeNum = mergeNum;
            this.players[this.currentPlayer].setState(GameBoard.CHOOSE_ORDER);

        } else {
            if (this.players[this.currentPlayer].isDHTMLClient()) {
                this.players[this.currentPlayer].setMerge(mergeNum, mergeList);
            } else {
                this.setMerge(mergeNum, mergeList);
            }
        }
        return true;
    }

    round(x) {
        if ((x % 100) == 0) {
            return x;
        }
        let q = x / 100;
        x = q * 100 + 100;
        return x;
    }

    bonusPayout(defunct, mergeIndex, aqc) {
        let cnt = 0;
        let bonusAmt;
        let bonusWinners;
        let partners = [];
        let i;
        // figure partners
        for (i = 0; i < this.playerNum; i++) {
            if (this.players[i].this.hotels[defunct] != 0) {
                partners.push(this.players[i]);
                cnt++;
            }
        }

        if (cnt == 1) {
            // only one owner
            let amt = partners[0].getMoney();
            bonusAmt = this.hot[defunct].firstBonus() +
                this.hot[defunct].secondBonus();
            amt = amt + this.hot[defunct].firstBonus() +
                this.hot[defunct].secondBonus();
            partners[0].setMoney(amt);


            if (mergeIndex != -1) {
                //setAllMoney(partners[0],amt);
            }
            bonusWinners = partners[0].getName() +
                " Wins both first and second bonus for " + bonusAmt;


        } else {
            // more then one owner
            let temp;

            //sort
            let j;
            for (i = 0; i < cnt - 1; i++) {
                for (j = i + 1; j < cnt; j++) {
                    if (partners[i].this.hotels[defunct] <
                        partners[j].this.hotels[defunct]) {
                        temp = partners[i];
                        partners[i] = partners[j];
                        partners[j] = temp;
                    }
                }
            }

            // partition
            let nParts = 0;
            let part = [0, 0, 0, 0, 0, 0];
            let shareCnt = partners[0].this.hotels[defunct];
            for (i = 0; i < cnt; i++) {
                if (partners[i].this.hotels[defunct] == shareCnt) {
                    part[nParts]++;
                } else {
                    shareCnt = partners[i].this.hotels[defunct];
                    nParts++;
                    part[nParts]++;
                }
            }
            if (part[0] == 1) {
                bonusAmt = this.hot[defunct].firstBonus();
                bonusWinners = partners[0].getName() +
                    " Wins first bonus for " + bonusAmt;

                let amt = partners[0].getMoney();
                amt = amt + this.hot[defunct].firstBonus();
                partners[0].setMoney(amt);
                if (mergeIndex != -1) {
                    // setAllMoney(partners[0],amt);
                }
                if (part[1] == 1) {

                    bonusAmt = this.hot[defunct].secondBonus();
                    bonusWinners = bonusWinners + ". " +
                        partners[1].getName() +
                        " Wins second bonus for " + bonusAmt;

                    amt = partners[1].getMoney();
                    amt = amt + this.hot[defunct].secondBonus();
                    partners[1].setMoney(amt);
                    if (mergeIndex != -1) {
                        //setAllMoney(partners[1],amt);
                    }
                } else {
                    bonusAmt = this.hot[defunct].secondBonus();
                    bonusWinners = bonusWinners + ". ";

                    let evenShare = this.hot[defunct].secondBonus();
                    evenShare /= part[1];
                    evenShare = thiis.round(evenShare);
                    for (j = 0; j < part[1]; j++) {
                        bonusWinners = bonusWinners +
                            partners[j + 1].getName() + " ";

                        amt = partners[j + 1].getMoney() + evenShare;
                        partners[j + 1].setMoney(amt);
                        if (mergeIndex != -1) {
                            //setAllMoney(partners[j+1],amt);
                        }
                        if (j + 1 < part[1]) {
                            bonusWinners = bonusWinners + "and ";
                        }
                    }
                    bonusWinners = bonusWinners +
                        " split second bonus of " + bonusAmt;


                }
            } else {
                let evenShare = this.hot[defunct].firstBonus() +
                    this.hot[defunct].secondBonus();

                bonusAmt = evenShare;

                evenShare /= part[0];
                evenShare = round(evenShare);
                bonusWinners = "";
                for (j = 0; j < part[0]; j++) {
                    bonusWinners = bonusWinners +
                        partners[j].getName() + " ";
                    if (j + 1 < part[0]) {
                        bonusWinners = bonusWinners + "& ";
                    }
                    let amt = partners[j].getMoney() + evenShare;
                    partners[j].setMoney(amt);

                }
                bonusWinners = bonusWinners +
                    " split first and second bonus of " + bonusAmt;

            }

        }
        //aqc.appendMessage("For " + this.hot[defunct].this.name+  ", "+ bonusWinners);

        if (mergeIndex != -1)
            this.bonusWinners[mergeIndex - 1] = bonusWinners;

    }

    mergeHotels(arg) {

        let mergeNum = arg.getHotelCount();
        let mergeList = arg.getMergeList();
        this.tile[this.row][this.column].mergeTile = true;
        this.tile[this.row][this.column].setState(this.hot[mergeList[0]].getHotel());
        let p = this.hot[mergeList[1]].count();
        for (let i = 0; i < this.cExamine; i++) {
            walkChain(this.tilesExamine[i], this.hot[mergeList[0]].getHotel());
        }

        let dstr = this.hot[mergeList[1]].getName();
        for (let i = 2; i < mergeNum; i++) {
            dstr = dstr + " and " + this.hot[mergeList[i]].getName();
        }

        arg.setMessage(this.players[this.currentPlayer].getName() + " merges " + dstr +
            " into " + this.hot[mergeList[0]].getName() + ".");

        for (let i = 1; i < mergeNum; i++) {
            this.hot[mergeList[i]].calcBonus();
            this.takeOver(this.hot[mergeList[0]].getHotel(),
                this.hot[mergeList[i]].getHotel());
        }

        this.cExamine = 0;

        for (let i = 1; i < mergeNum; i++) {
            this.bonusPayout(this.hot[mergeList[i]].getHotel(), i, arg);
        }

        msgs[0] = arg;
        this.tradeIndex = 0;
        this.tradeCnt = 0;

        for (let i = 1; i < mergeNum; i++) {
            this.setSwapQueue(mergeList[0], this.mergeList[i], i);
        }
        msgs[1] = ths.firstSwap();
        return msgs;
    }

    firstSwap() {
        this.players[this.currentPlayer].setState(GameBoard.OTHER);
        this.players[this.stockTrade[0].getPlayer()].setState(GameBoard.SWAP);
        let sst = swapStockTransaction(this.stockTrade[0]);
        sst.setMessage(this.players[this.stockTrade[0].getPlayer()].getName() +
            " is deciding what to do with his/her shares of " +
            this.hot[this.stockTrade[0].getDefunct()].getName() + ".");
        this.setSwap(sst.getStockTransaction());
        return sst;
    }

    trade(ass) {

        let str =
            this.players[ass.getCurrentPlayerID()].getName() + " swaps " + ass.getSwap() + " shares of "
            + this.hot[ass.getDefunct()].getName() + " for " +
            this.hot[ass.getSurvivor()].getName() + ".\n" +
            this.players[ass.getCurrentPlayerID()].getName() + " sells " + ass.getSell() + " shares of "
            + this.hot[ass.getDefunct()].getName() + ".";
        ass.setMessage(str);


        this.players[ass.getCurrentPlayerID()].setState(GameBoard.OTHER);

        this.players[ass.getCurrentPlayerID()].swapStock(
            this.hot[ass.getSurvivor()],
            this.hot[ass.getDefunct()],
            ass.getSwap(),
            ass.getSell());


        let msg = [ass];
        return msg;
    }
    addPlayer( name){
        let p = new Player(name,this);
        this.players.push(p);
        this.playerNum++;
        p.pickFirstTiles();
    }

    nextTrans() {
        this.tradeIndex++;
        //AQC msg[]= new AQC[1];
        if (this.tradeIndex < this.tradeCnt) {
            let sst = swapStockTransaction(this.stockTrade[this.tradeIndex]);//todo
             sst.setMessage(this.players[this.stockTrade[this.tradeIndex].getPlayer()].getName() +
                " is deciding what to do with his/her shares of " +
                this.hot[this.stockTrade[this.tradeIndex].getDefunct()].getName() + ".");
            this.players[this.stockTrade[this.tradeIndex].getPlayer()].setState(GameBoard.SWAP);
            this.setSwap(sst.getStockTransaction());
            msg[0] = sst;
        } else {
            this.players[this.currentPlayer].setState(GameBoard.BUYSTOCK);
            msg[0] = new AQCBuyState(this.currentPlayer, this.players[this.currentPlayer].getName());
            msg[0].setMessage(this.players[this.currentPlayer].getName() + " you can buy stock now.");
            // msg[0].setTurnMergeTileOff(true);
        }
        return msg;
    }

    setSwapQueue(survivor, defunct, mergeIndex) {
        let playIndex = this.currentPlayer;
        let str = this.hot[survivor].getName() + " takeover of " +
            this.hot[defunct].getName();
        for (let i = 0; i < this.playerNum; i++) {

            if (this.players[playIndex].this.hotels[defunct] != 0) {
                this.stockTrade[this.tradeCnt].setIndex(this.tradeCnt);
                this.stockTrade[this.tradeCnt].setPlayer(playIndex);
                this.stockTrade[this.tradeCnt].setSurvivor(survivor);
                this.stockTrade[this.tradeCnt].setDefunct(defunct);
                this.stockTrade[this.tradeCnt].setTitle(str);
                this.stockTrade[this.tradeCnt++].setBonusStr(this.bonusWinners[mergeIndex - 1]);
            }
            if (playIndex == (this.playerNum - 1)) {
                playIndex = 0;
            } else {
                playIndex++;
            }
        }
    }

    growChain(state, msg) {
        this.tile[this.row][this.column].setState(state);
        for (let i = 0; i < this.cExamine; i++) {
            walkChain(this.tilesExamine[i], state);
        }
        this.cExamine = 0;

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
            if (this.canStartChain(i)) {
                j++;
                h = i;
            }
        }
        if (j > 1) {
            h = -1;
        }
        return h;
    }

    nextPlayer(arg) {
        let b = buyStock(arg);

        let replace = 0;
        let rt = [0, 0, 0, 0, 0, 0];
        for (let t = 0; t < 6; t++) {
            if (this.players[this.currentPlayer].getTiles()[t] == this.dummyTile) {
                while (this.isTile() == true) {
                    let ti = this.pickATile();
                    if (this.isDead(ti.getRow(), ti.getColumn()) == false) {
                        rt[replace++] = ti;
                        this.players[this.currentPlayer].getTiles()[t] = ti;
                        break;
                    }
                }
            } else if (this.isDead(this.players[this.currentPlayer].getTiles()[t].getRow(),
                this.players[this.currentPlayer].getTiles()[t].getColumn()) == true) {
                while (this.isTile() == true) {
                    let ti = this.pickATile();
                    if (this.isDead(ti.getRow(), ti.getColumn()) == false) {
                        rt[replace++] = ti;
                        this.players[this.currentPlayer].getTiles()[t] = ti;
                        break;
                    }
                }
            }
        }

        this.players[this.currentPlayer].setState(GameBoard.OTHER);
        if (this.currentPlayer == this.playerNum - 1)
            this.currentPlayer = 0;
        else
            this.currentPlayer++;
        //System.out.println("this.currentPlayer =zzz " +  this.players[this.currentPlayer].getName());
        this.players[this.currentPlayer].setState(GameBoard.PLACETILE);
        //gameInfo(this.gameObject);
        /*if(this.autoSave) {
            saveGame();
        }*/

        if (this.allNonPlayable(this.players[this.currentPlayer].getTiles())) {
            this.players[this.currentPlayer].setState(GameBoard.BUYSTOCK);
            msgs[msgs.length - 1] = new AQCBuyState(this.currentPlayer, this.players[this.currentPlayer].getName());
        } else {
            msgs[msgs.length - 1] = new AQCPlaceState(this.currentPlayer, this.players[this.currentPlayer].getName());
        }
        return msgs;
    }


    startChain(state, cur) {

        if (this.hot[state].price() != 0) return false;

        this.tile[this.row][this.column].setState(state);
        for (let i = 0; i < this.cExamine; i++) {
            this.walkChain(this.tilesExamine[i], state);
        }
        this.cExamine = 0;
        this.players[this.currentPlayer].bonusShare(this.hot[state]);
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
        if (this.tileIndex < 107) return true;
        return false;
    }

    chooseWinner(bh) {
        this.buyStock(bh);
        let m = [];
        for (let i = 0; i < 7; i++) {
            if (this.hot[i].count() != 0) {
                this.hot[i].calcBonus();
                this.bonusPayout(i, -1, bh);
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