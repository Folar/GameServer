const {TakeSix} = require('./../utils/TakeSix.js');


class TakeSixActions {

    constructor(ts) {
        this.bt = "";
        this.bt2 = "";
        this.mes = "";
        this.packet = null;
        this.takeSix = boca;

    }

    bocaCmd( msg) {
        let user = this.takeSix.getUser(msg.name);
        let ts =this.takeSix ;
        switch (msg.action) {
            case "startDiver":

                break;
            case "roll":


        }
    }

}
module.exports = {TakeSixActions};