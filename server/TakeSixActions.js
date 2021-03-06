const {TakeSix} = require('./../utils/TakeSix.js');


class TakeSixActions {

    constructor(ts) {
        this.bt = "";
        this.bt2 = "";
        this.mes = "";
        this.packet = null;
        this.takeSix = ts;

    }

    take6Cmd( msg) {



        let user = this.takeSix.getUser(msg.name);
        let takeSix =this.takeSix ;
        let lst = takeSix.getUserList();
        let packet = null;
        let pkt = null;
        let ulst;
        let str;
        let rows;

        switch (msg.action) {

            case "startingGame":
                rows = takeSix.getCardRows();
                takeSix.setState(msg.name, 2);
                ulst = takeSix.getByNotState(2);
                str = "";
                if (ulst.length == 0) {
                    takeSix.setTakeSixStarted(true) ;
                    str = "Let the games begin! Select your first Card";
                    takeSix.setAllState(3);

                } else {
                    str = "Waiting for "
                    let cnt = 1;
                    let names = [];
                    for (let item in ulst) {
                        names.push(ulst[item].id);
                    }
                    str += takeSix.formatNameList(names) + " to click Start";

                }
                packet = this.prepareTakeSixPacket("message", str);
                takeSix.broadCastAll(packet);
                break;



                case "placeCard":
                    if (takeSix.getState(msg.name) != 5) {
                    return;
                }
                takeSix.setState(msg.name, 6);
                takeSix.stopPlaying(msg.name);
                str = msg.name + " placed their card for this round. ";
                rows = takeSix.getCardRows();
                let moo = false;
                let score = 0;
                let msgType = "message"

                if (rows[msg.row - 1][rows[msg.row - 1].length - 1].rank < takeSix.getCurrentCard(msg.name).rank &&
                    rows[msg.row - 1].length < TakeSix.NUMBER_TAKE) {
                    rows[msg.row - 1].push(takeSix.getCurrentCard(msg.name));
                } else {
                    score = takeSix.score(msg.name, rows[msg.row - 1]);
                    str += msg.name + " added " + score + " bulls to their score. ";
                    let newRow = [];
                    if (rows[msg.row - 1].length == TakeSix.NUMBER_TAKE)
                        msgType = "mooSound";
                    newRow.push(takeSix.getCurrentCard(msg.name));
                    takeSix.setOneRow(msg.row, newRow);
                }

                ulst = takeSix.getByNotState(6);
                if (ulst.length == 0) {
                    takeSix.setAllState(3);
                    if (takeSix.users[0].cards.length != 0) {
                        str += " Start round " + (11 - takeSix.users[0].cards.length) + ".";
                        packet = this.prepareTakeSixPacket(msgType, str);
                        takeSix.broadCastAll(packet);
                    } else {
                        let tally = takeSix.findMinMax();
                        let min = tally[0];
                        let minNames = tally[1];
                        let max = tally[2];
                        let maxNames = tally[3];
                        let wstatus = minNames.length > 1 ? " are the WINNERS!!" : " is the WINNER!!";
                        let lstatus = minNames.length > 1 ? " are the LOOSERS!!" : " is the LOOSER!!";
                        let astatus = minNames.length > 1 ? " are the leaders." : " is the leader.";
                        let rstatus = minNames.length > 1 ? " are bringing up the rear." : " is bringing up the rear.";
                        if (max >= TakeSix.NUMBER_GOAL) {
                            str += "With a score of " + min + " " +
                                takeSix.formatNameList(minNames) + wstatus;
                            str += " With a score of " + max + " " +
                                takeSix.formatNameList(maxNames) + lstatus;
                            takeSix.setTakeSixStarted(false) ;
                            packet = this.prepareTakeSixPacket(msgType, str);
                            packet.buttonText = "Again?";
                            takeSix.broadCastAll(packet);
                            takeSix.removeAllConnections();
                        } else {
                            takeSix.reshuffle();
                            str += "With a score of " + min + " " +
                                takeSix.formatNameList(minNames) + astatus;
                            str += " With a score of " + max + " " +
                                takeSix.formatNameList(maxNames) + rstatus;
                            str += " The deck will be reshuffle and play will continue."
                            packet = this.prepareTakeSixPacket(msgType, str);
                            packet.reanimate = true;
                            takeSix.broadCastAll(packet);
                        }


                    }


                } else {
                    packet = this.prepareTakeSixPacket(msgType, "");
                    pkt = this.prepareTakeSixPacket(msgType, str + ulst[0].id);

                    takeSix.fillinPacket(ulst[0].id, pkt);
                    pkt = this.prepareForPlacement(pkt, ulst[0].currentCard.rank)
                    packet.message = pkt.message;
                    takeSix.broadCastMessage(ulst[0].id, packet);

                    takeSix.sendCustomPacket(ulst[0].id, pkt);

                }


                break;
            case "selectCard":
                takeSix.setState(msg.name, 4);
                takeSix.removeCard(msg.name, msg.card.rank);
                ulst = takeSix.getByNotState(4);
                if (ulst.length == 0) {
                    takeSix.sortUsersByCardRank();
                    str = msg.name + " selected a card for this round. All cards have now been Selected. " +
                        takeSix.getUserList()[0].name;
                    takeSix.setAllState(5);

                    packet = this.prepareTakeSixPacket("message", str);
                    pkt = this.prepareTakeSixPacket("message", str);

                    takeSix.fillinPacket(takeSix.getUserList()[0].name, pkt);
                    pkt = this.prepareForPlacement(pkt, takeSix.users[0].currentCard.rank)
                    packet.message = pkt.message;
                    takeSix.broadCastMessage(takeSix.getUserList()[0].name, packet);

                    takeSix.sendCustomPacket(takeSix.getUserList()[0].name, pkt);
                } else {
                    packet = this.prepareTakeSixPacket("message", msg.name + " selected  a card for this round.");
                    takeSix.broadCastAll(packet);
                }
                break;

        }
    }

    compare(a, b) {
        if (a.rank < b.rank) {
            return -1;
        }
        if (a.rank > b.rank) {
            return 1;
        }
        // a must be equal to b
        return 0;
    }


     prepareTakeSixPacket(type, message) {
        return {
            messageType: type,
            cards: {},
            row1: null,
            row2: null,
            row3: null,
            row4: null,
            message: message,
            state: 0,
            buttonText: "Start",
            reanimate: false,
            users: []
        }
    }



    prepareForPlacement(packet, rank) {

        // console.log("prepareForPlacement rank =" + rank);
        let pkt = JSON.parse(JSON.stringify(packet));  //deepCopy
        let rows = [pkt.row1, pkt.row2, pkt.row3, pkt.row4];
        let min = 200;
        let rmin = -1;
        let idx = 0;
        for (let item in rows) {
            if (rank > rows[item][rows[item].length - 1].rank) {
                if (min > rank - rows[item][rows[item].length - 1].rank &&
                    (rank - rows[item][rows[item].length - 1].rank) > 0) {
                    min = rank - rows[item][rows[item].length - 1].rank;
                    rmin = idx;
                    //  console.log("prepareForPlacement row=" + idx + " card=" + rows[item][rows[item].length - 1].rank
                    //    + " min=" + min);
                }
            }
            idx++;
        }
        if (rmin >= 0) {
            rows[rmin][rows[rmin].length - 1].state = 1;
            pkt.message = packet.message + " should place their card, In row " + (rmin + 1);
        } else {
            pkt.message = packet.message + " can replace any row "
            for (let item in rows) {
                rows[item][0].state = 1;

            }

        }
        return pkt;
    }


}
module.exports = {TakeSixActions};