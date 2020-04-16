class PanCard{
    constructor(r) {
        let s = 's';
        switch (r % 4) {
            case 1:
                s = 'h';
                break;
            case 2:
                s = 'd';
                break;
            case 3:
                s = 'c';
        }

        this.ordinal = r;
        this.suit = s;
        r = Math.floor(r / 4);
        r++;
        this.group =0;
        this.suit = s ;
        this.rankOrdinal = r;
        this.rank = r > 7 ? r + 3 : r;

    }


}
module.exports = {PanCard};