class AboutNeighbors {

    constructor() {
        this.neighbors = [0, 0, 0, 0];
        this.hotels = [0, 0, 0, 0, 0, 0, 0];
        this.type = 0;
        this.grower = 0;
    }
    getNeighors() {
        return this.neighbors;
    }
    getHotels() {
        return this.hotels;
    }

    getType() {
        return this.type;
    }

    setType(type) {
        this.type = type;
    }

    getGrower() {
        return this.grower;
    }

    setGrower(grower) {
        this.grower = grower;
    }


}

module.exports = {AboutNeighbors};
