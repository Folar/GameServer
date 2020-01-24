class Hotel {

    constructor(h=null,name=null,gb=nulll) {
        this.hotel = h;
        this.first = "";
        this.second = "";
        this.name = name;
        this.availShares = 25;
        this.gameBoard = gb;
    }

    static get HOTELS(){
        return ["Luxor","Tower","American","Worldwide","Festival","Continental","Imperial"];
    }
    static get HOTEL_COLORS(){
        return ["red","yellow","#8787ff","#c3af91","green","cyan","pink"];
    }
    static get LUXOR() {
        return 0;
    }
    static get TOWER() {
        return 1;
    }
    static get AMERICAN() {
        return 2;
    }
    static get WORLDWIDE() {
        return 3;
    }
    static get FESTIVAL() {
        return 4;
    }
    static get CONTINENTAL() {
        return 5;
    }
    static get IMPERIAL() {
        return 6;
    }

    static get LUXOR_COLOR() {
        return "red";
    }
    static get TOWER_COLOR() {
        return "yellow";
    }
    static get AMERICAN_COLOR() {
        return "#8787ff";
    }
    static get WORLDWIDE_COLOR() {
        return "#c3af91";
    }
    static get FESTIVAL_COLOR() {
        return "green";
    }
    static get CONTINENTAL_COLOR() {
        return "cyan";
    }
    static get IMPERIAL_COLOR() {
        return "pink";
    }

    count() {
        let cnt = 0;
        for (let i = 0; i < 9; i++)
            for (let j = 0; j < 12; j++)
                if (this.gameBoard.getTile()[i][j].m_state == this.hotel) cnt++;
        return cnt;
    }

    calcBonus()
    {
        this.first = this.price() * 10;
        this.second = this.price() * 5;
    }
    secondBonus()
    {
        return this.m_second ;
    }
    firstBonus ()
    {
        return this.first;
    }

    isSafe()
    {
        if (this.count() > 10) return true;
        return false;
    }

    price ()
    {
        let cnt = this.count();
        if(cnt == 0) return 0;
        let base = 200;
        let price;
        switch (hotel) {
            case Hotel.LUXOR:
            case Hotel.TOWER:
                base = 200;
                break;
            case Hotel.FESTIVAL:
            case Hotel.WORLDWIDE:
            case Hotel.AMERICAN:
                base = 300;
                break;
            case Hotel.IMPERIAL:
            case Hotel.CONTINENTAL:
                base = 400;
                break;
        }
        if (cnt < 6) {
            price = base + 100 * (cnt -2);
        } else if ( cnt < 11) {
            price = base + 400 ;
        } else if ( cnt < 21) {
            price = base + 500;
        } else if ( cnt < 31) {
            price = base + 600 ;
        } else if ( cnt < 41) {
            price = base + 700 ;
        } else {
            price =base + 800;
        }

        return price;
    }

    getAvailShares(){
        this.availShares;
    }

}
module.exports = {Hotel};
