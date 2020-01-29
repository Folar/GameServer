class Tile{
    constructor(row=-1,col=-1,name = null) {
        this.state = Tile.EMPTY;
        this.row = row;
        this.column = col;
        this.dirty = false;
        this.inRack= false;
        this.dirty = false;
        this.mergeTile = false;
        if(name !=null){
            let arr =  name.split("-");
            this.row = arr[0]
            this.column = ["A","B","C","D","E","F","G","H","I"].indexOf(arr[1]);
        }

    }

    static get dummy() { return new Tile();}

    static get EMPTY() {
        return 8;
    }

    static get ONBOARD() {
        return 9;
    }

    static get OUTOFBOUNDRY() {
        return 10;
    }

    static get START() {
        return 11;
    }
    static get GROW() {
        return 12;
    }
    static get MERGE() {
        return 13;
    }
    static get NONPLAYBLE() {
        return 14;
    }
    static get DEAD() {
        return 15;
    }
    getRow(){
        return this.row;
    }
    getColumn(){
        return this.column;
    }
    getState(){
        return this.state;
    }
    setState(s){
         this.state = s;
         this.dirty = true;
    }
    setTile(r,c){
        this.row = r;
        this.dirty = c;
    }
    getLabel() {
        return this.row +"-"+["A","B","C","D","E","F","G","H","I"][this.column]
    }

    isEmpty (){
        return this.row == -1;
    }
    isDirty(){
        return this.dirty;
    }
    setDirty(d){
        this.dirty = d;
    }
    isInRack(){
        return this.inRack;
    }
    setInRack(inrack) {
        if (inrack) {
            if (!this.inRack){
                this.dirty = true;
            }
        } else if (this.inRack){
            this.dirty = true;
        }
        this.inRack = inrack;
    }
    compare (t){
        if (t.getColumn() < this.getColumn()) {
            return 1;

        } else if (t.getColumn() == this.getColumn()) {
            if (t.getRow() < this.getRow()) {
                return 1;
            }
        }
        return -1;

    }
}
module.exports = {Tile};