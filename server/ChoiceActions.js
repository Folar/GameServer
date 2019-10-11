const {Choice} = require('./../utils/Choice.js');


class ChoiceActions {

    constructor(choice) {
        this.bt = "";
        this.bt2 = "";
        this.mes = "";
        this.packet = null;
        this.choice = choice;
        this.lastCmd = "";
        this.lastName = "";

    }




    choiceCmd(msg) {
        let user = this.choice.getUser(msg.name);
        let choice = this.choice;
        if (this.lastCmd == msg.action && this.lastName == msg.name) {
            return;
        }
        this.lastCmd = msg.action;
        this.lastName = msg.name;
        switch (msg.action) {
            case "startChoice":
                this.choice.setPlay(msg.name);
                let ulst = this.choice.getNonPlaying();

                let str = "";
                if (ulst.length == 0) {
                    this.choice.setChoiceStarted(true);
                    let players = choice.getPlaying();
                    let num = Math.floor(Math.random() * players.length);
                    str = "Let the games begin! " +
                        players[num].name + " was randomly chosen to roll first";
                    let packet = choice.setChoicePacket("playerStart", str, "Roll!!!");
                    packet.startIndex = packet.currentIndex = num;
                    packet.currentPlayer = players[packet.currentIndex].name;
                    choice.sendToAll(players[num].name, packet);

                } else {
                    str = "Waiting for "
                    let cnt = 1;
                    let names = [];
                    for (let item in ulst) {
                        names.push(ulst[item].name);
                    }
                    str += choice.formatNameList(names) + " to click Start";
                    let packet = choice.setChoicePacket("playerStart", str, "Start");
                    choice.sendPacket(ulst, packet);
                    ulst = choice.getPlaying();
                    packet.buttonText = "";
                    choice.sendPacket(ulst, packet);
                }
                break;
            case "roll":
                let dice = {
                    die1: Math.floor(Math.random() * 6) + 1,
                    die2: Math.floor(Math.random() * 6) + 1,
                    die3: Math.floor(Math.random() * 6) + 1,
                    die4: Math.floor(Math.random() * 6) + 1,
                    die5: Math.floor(Math.random() * 6) + 1
                };
                let pkt = choice.setChoicePacket("Roll", user.name + " rolled the dice you can now make your selections", "");
                pkt.dice = dice;
                let ndlst = choice.getNotDone();
                choice.sendPacket(ndlst, pkt);
                break;


            case "confirm":
                user.confirm = true;
                user.done = msg.done;
                user.score = msg.score;
                let nclst = choice.getNotConfirmed();
                if (nclst.length == 0) {
                    let ndlst = choice.getNotDone();
                    if (ndlst.length == 0) {
                        this.lastCmd = "";
                        this.lastName = "";
                        let res = this.choice.findMinMax();
                        msg = this.choice.formatNameList(res[3]) + " won the game with the score of " + res[2];
                        let packet = this.choice.setChoicePacket("Restart", msg, "Restart");
                        this.choice.broadCastAll(packet);
                        this.choice.setChoiceStarted(false);
                        this.choice.removeAllConnections();
                    } else {
                        let packet = this.choice.choiceData;
                        let players = this.choice.getPlaying();

                        while (true) {
                            packet.startIndex++;
                            if (packet.startIndex == packet.players.length)
                                packet.startIndex = 0;
                            if (players[packet.startIndex].done)
                                continue;
                            packet.currentIndex = packet.startIndex;
                            packet.currentPlayer = players[packet.startIndex].name;
                            break;
                        }
                        for(let i in players){
                            if(players[i].done == false)
                                players[i].confirm = false;
                        }
                        if(players.length >1) {
                            let pkt = choice.setChoicePacket("newRoller", "Everybody has hit confirmed, "
                                + packet.currentPlayer + " rolls next", "");
                            let ndlst = choice.getNotDone();
                            choice.sendPacket(ndlst, packet);
                            setTimeout(this.continueToRoll.bind(this), Choice.CHOICE_DELAY);
                        }else
                            this.continueToRoll();
                    }

                } else {
                    let str = "Waiting for "
                    let cnt = 1;
                    let clst = choice.getConfirmedNotDone()
                    let names = [];
                    for (let item in nclst) {
                        names.push(nclst[item].name);
                    }
                    str += choice.formatNameList(names) + " to click Confirm";
                    let packet = choice.setChoicePacket("playerConfirmed", str, "");
                    choice.sendPacket(clst, packet);
                }

                break;


        }
    }


    continueToRoll() {
        let bt = "Roll!!!";
        let bt2 = "";
        let players1 = this.choice.getPlaying();
        let mes = players1[this.choice.choiceData.currentIndex].name + " you can roll now. ";
        let packet = this.choice.setChoicePacket("notifyRoll", mes, bt);
        this.choice.sendToAll(players1[packet.currentIndex].name, packet);

    }
}

module.exports = {ChoiceActions};