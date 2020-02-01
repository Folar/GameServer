const {GameBoard} = require('./GameBoard.js');
const {Hotel} = require('./Hotel.js');
const {AboutNeighbors} = require('./AboutNeighbors.js');
const {Tile} = require('./Tile.js');
class Player {

    constructor(name = null, gb = null, money = 6000) {
        this.hotels = [0, 0, 0, 0, 0, 0, 0];
        this.money = money;
        this.tileCount = 6;
        this.name = name;
        this.tileStr = "";
        this.gameBoard = gb;
        this.state = gb.OTHER;
        this.tiles = [0, 0, 0,0,0,0];
        this.mergeNum = 0;
        this.startingTile = null;
        this.mergeList = [];
        this.playing = false;
    }

    setState(s) {
        this.state = s;
    }

    getState() {
        return this.state;
    }

    getMergeList() {
        return this.mergeList;
    }

    setMergeList(x) {
        this.mergeList = x;
    }

    getMergeNum() {
        return this.mergeNum;
    }

    setMerge(x, y) {
        this.mergeNum = x;
        this.mergeList = y;
    }

    getName() {
        return this.name;
    }


    pickFirstTiles() {
        for (let i = 0; i < 6; i++) {
            this.tiles[i] = this.gameBoard.pickATile();
        }
        this.startingTile = this.gameBoard.pickATile();
    }


    worth() {
        let amt = 0;
        for (let i = 0; i < 7; i++) {
            if (this.hotels[i] != 0) {
                amt = this.hotels[i] * this.gameBoard.getHotels()[i].price();
                this.money += amt;
            }
        }
        return m_money;
    }

    bonusShare(h) {
        let av = h.getAvailShares();
        if (av == 0) return false;
        h.setAvailShares(av - 1);
        m_hotels[h.m_hotel]++;
        return true;
    }

    swapStock(h, d, swap, sell) {
        let av = h.getAvailShares();
        h.setAvailShares(av - swap / 2);
        this.hotels[h.hotel] += swap / 2;

        av = d.getAvailShares();
        d.setAvailShares(av + swap);
        this.hotels[d.hotel] -= swap;

        av = d.getAvailShares();
        d.setAvailShares(av + sell);
        m_hotels[d.hotel] -= sell;
        //this.money += sell * d.firstBonus()/10; todo
    }

    purchaseStock(h) {
        let av = h.getAvailShares();
        if (av == 0) return false;
        h.setAvailShares(av - 1);
        this.money = this.money - h.price();
        hotels[h.hotel]++;
        return true;
    }
    getTileColor(c)
    {
        switch(c)
        {
            case 'R':
                return "lightgray";
            case 'w':
                return "white";
            case 's':
                return "green";
            case 'd':
                return "black";
            case 'n':
                return "darkgray";
            case 'm':
                return "orange";
        }
        return Hotel.HOTEL_COLORS[c];
    }
    colorTiles() {
        let c =['R','R','R','R','R','R'];
        let str = "";
        let j = 0;
        for (let i = 0; i < 6; i++) {
            if (this.tiles[i].row == -1) {
                continue;
            }

            let an = this.gameBoard.surroundingTiles(this.tiles[i]);
            switch (an.getType()) {
                case Tile.GROW:
                    c[i]= an.getGrower();
                    break;
                case Tile.START:
                    c[j]='s';
                    break;
                case Tile.DEAD:
                    c[j]='d';
                    break;
                case Tile.NONPLAYBLE:
                    c[j]='n';
                    break;
                case Tile.MERGE:
                    c[j]='m';
                    break;

            }
            j++;
        }
        for (let i = 0; i < j - 1; i++) {
            if (c[i] != 'R') {
                continue;
            }
            for (let k = i + 1; k < j; k++) {
                if (c[k]!= 'R') {
                    continue;
                }
                if (this.formChain(i, k)) {
                    c[i]='w';
                    c[k]='w';
                }
            }
        }
        return c;
    }

     formChain(i, j) {
        let t1 = this.tiles[i];
        let t2 = this.tiles[j];
        if (t1.getRow() == t2.getRow()) {
            if (t1.getColumn() == (t2.getColumn() + 1) ||
                t1.getColumn() == (t2.getColumn() - 1)) {
                return true;

            }
            return false;
        }
        if (t1.getColumn() == t2.getColumn()) {
            if (t1.getRow() == (t2.getRow() + 1) ||
                t1.getRow() == (t2.getRow() - 1)) {
                return true;

            }
            return false;
        }
        return false;
    }
    getRack()
    {
        let result =[];
        let str=this.colorTiles();
        for (let i = 0; i<6; i++) {
            if(this.tiles[i].row != -1){
                result.push({label:this.tiles[i].getLabel(),ordinal:this.tiles[i].ordinal, bg:this.getTileColor(str[i]),fg: str[i] !='R'?"black":"white" });;
            }

        }
        return result;

    }

}

module.exports = {Player};
