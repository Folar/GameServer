const {BocaDice} = require('./../utils/BocaDice.js');


class BocaActions {

    constructor(boca) {
        this.bt = "";
        this.bt2 = "";
        this.mes = "";
        this.packet = null;
        this.boca = boca;

    }
    endGame() {
        let bocaDice = this.boca;
        bocaDice.setMoneyTotalDiceLeft();
        let res = bocaDice.findMinMax();
        let packet = this.packet;
        packet = bocaDice.setBocaDicePacket("Restart",
            bocaDice.formatNameList(res[3]) + " won the game with " + res[2] + " grand",
            "Restart");
        bocaDice.diceNum = BocaDice.NUMBER_DICE;
        bocaDice.diceXNum = BocaDice.NUMBER_DICEX;
        bocaDice.setBocaStarted(false);
        packet.money = packet.prevMoney.money;
        bocaDice.broadCastAll(packet);
        bocaDice.removeAllConnections();
    }
    passDice() {
        let bocaDice = this.boca;
        let packet = bocaDice.getCurrentPacket();
        while (true) {
            if (packet.totalDice <= 0) {
                packet.startIndex++;
                if (packet.startIndex == packet.players.length)
                    packet.startIndex = 0;
                packet.currentIndex = packet.startIndex;
                packet.currentPlayer = packet.players[packet.currentIndex].name;
                let prevMoney = JSON.parse(JSON.stringify({money: packet.money}));
                packet.prevMoney = prevMoney;
                bocaDice.distributePlayerCash();
                let afterMoney = JSON.parse(JSON.stringify({money: packet.money}));
                packet.round++;

                let res = bocaDice.findMinMax();
                if (packet.round <= BocaDice.NUMBER_ROUNDS) {
                    packet = bocaDice.setBocaDicePacket("startRound",
                        bocaDice.formatNameList(res[3]) + " won the round with " + res[2] + " grand . " +
                        packet.currentPlayer + " will start round " + packet.round +
                        "\n  *subtotals for round " + (packet.round - 1),
                        "Start Rnd " + packet.round);
                } else {
                    packet = bocaDice.setBocaDicePacket("endGame",
                        bocaDice.formatNameList(res[3]) + " won the round with " + res[2] + " grand . " +
                        "\n  *subtotals for round " + (packet.round - 1),
                        "Finish");
                    setTimeout(this.endGame.bind(this), BocaDice.BOCA_DELAY);
                }
                packet.money = prevMoney.money;
                bocaDice.broadCastAll(packet);
                packet.money = afterMoney.money;

                break;
            }
            packet.currentIndex++;
            if (packet.currentIndex == packet.players.length)
                packet.currentIndex = 0;
            if (packet.players[packet.currentIndex].diceLeft != 0 || packet.players[packet.currentIndex].diceXLeft != 0 ) {
                packet.currentPlayer = packet.players[packet.currentIndex].name;
                packet.diceNum = packet.players[packet.currentIndex].diceLeft;
                packet.diceXNum = packet.players[packet.currentIndex].diceXLeft;
                packet = bocaDice.setBocaDicePacket("passDice",
                    packet.currentPlayer + " is starting her/his turn",
                    "Roll!!");
                bocaDice.broadCastAll(packet);
                break;
            }
        }
    }

    bocaCmd( msg) {
        let user = this.boca.getUser(msg.name);
        let bocaDice =this.boca ;

        let packet = null;
        let pkt = null;
        let ulst;
        let str;
        switch (msg.action) {
            case "nextRoundBocaDice":
                bocaDice.nextRound();
                let players = bocaDice.getPlaying();
                packet = bocaDice.getCurrentPacket();
                packet.totalDice = players.length * (BocaDice.NUMBER_DICE + BocaDice.NUMBER_DICEX) ;
                packet = bocaDice.setBocaDicePacket("passDice",
                    packet.currentPlayer + " is starting her/his turn",
                    "Roll!!");
                bocaDice.broadCastAll(packet)


                break;
            case "passBocaDice":
                packet = bocaDice.getCurrentPacket();
                while (true) {
                    if (packet.totalDice <= 0) {
                        packet.startIndex++;
                        if (packet.startIndex == packet.players.length)
                            packet.startIndex = 0;
                        packet.currentIndex = packet.startIndex;
                        packet.currentPlayer = packet.players[packet.currentIndex].name;
                        let prevMoney = JSON.parse(JSON.stringify({money: packet.money}));
                        packet.prevMoney = prevMoney;
                        bocaDice.distributePlayerCash();
                        let afterMoney = JSON.parse(JSON.stringify({money: packet.money}));
                        packet.round++;

                        let res = bocaDice.findMinMax();
                        if (packet.round <= BocaDice.NUMBER_ROUNDS) {
                            packet = bocaDice.setBocaDicePacket("startRound",
                                bocaDice.formatNameList(res[3]) + " won the round with " + res[2] + " grand . " +
                                packet.currentPlayer + " will start round " + packet.round +
                                "\n  *subtotals for round " + (packet.round - 1),
                                "Start Rnd " + packet.round);
                        } else {
                            packet = bocaDice.setBocaDicePacket("endGame",
                                bocaDice.formatNameList(res[3]) + " won the round with " + res[2] + " grand . " +
                                "\n  *subtotals for round " + (packet.round - 1),
                                "Finish");
                        }
                        packet.money = prevMoney.money;
                        bocaDice.broadCastAll(packet);
                        packet.money = afterMoney.money;

                        break;
                    }
                    packet.currentIndex++;
                    if (packet.currentIndex == packet.players.length)
                        packet.currentIndex = 0;
                    if (packet.players[packet.currentIndex].diceLeft != 0 || packet.players[packet.currentIndex].diceXLeft != 0) {
                        packet.currentPlayer = packet.players[packet.currentIndex].name;
                        packet.diceNum = packet.players[packet.currentIndex].diceLeft;
                        packet.diceXNum = packet.players[packet.currentIndex].diceXLeft;
                        packet = bocaDice.setBocaDicePacket("passDice",
                            packet.currentPlayer + " is starting her/his turn",
                            "Roll!!");
                        bocaDice.broadCastAll(packet);
                        break;
                    }
                }
                break;

            case "endGame":
                bocaDice.setMoneyTotalDiceLeft();
                let res = bocaDice.findMinMax();
                packet = bocaDice.setBocaDicePacket("Restart",
                    bocaDice.formatNameList(res[3]) + " won the game with " + res[2] + " grand",
                    "Restart");
                bocaDice.diceNum = BocaDice.NUMBER_DICE;
                bocaDice.diceXNum = BocaDice.NUMBER_DICEX;
                bocaDice.setBocaStarted (false);
                packet.money = packet.prevMoney;
                bocaDice.broadCastAll(packet);
                bocaDice.removeAllConnections();
                break;

            case "rollBocaDice":


                if (msg.selectedDice != -1 ||msg.selectedDiceX != -1 ) {
                    packet = bocaDice.getCurrentPacket();
                    packet.dice = msg.dice;
                    let idx  = msg.selectedDice != -1 ? msg.dice[msg.selectedDice] - 1:msg.diceX[msg.selectedDiceX] - 1;

                    let u = bocaDice.users[packet.currentIndex];
                    u.diceLeft -= msg.qty;
                    u.diceXLeft -= msg.qtyX;
                    packet = bocaDice.setBocaDicePacket("rollDice",
                        msg.name + " selected the " + (idx) + " die(" + msg.qty + ")",
                        "Pass Dice");
                    //  packet.players[packet.currentIndex].diceLeft -= msg.qty;
                    packet.totalDice -= (msg.qty + msg.qtyX);
                    packet.fieldColors[idx] = "gray";
                    packet.fieldPlayers[idx] = msg.fld;
                    packet.ofieldPlayers[idx] = msg.fld;
                    bocaDice.broadCastAll(packet);
                    setTimeout(this.passDice.bind(this), BocaDice.BOCA_DELAY);

                    packet.fieldColors[idx] = packet.ofieldColors[idx];
                } else {
                    packet = bocaDice.setBocaDicePacket("rollDice",
                        msg.name + " rolled his/her dice",
                        "Confirm");
                    packet.dice = msg.dice;
                    packet.selectedDice = msg.selectedDice;
                    packet.diceX = msg.diceX;
                    packet.selectedDiceX = msg.selectedDiceX;
                    bocaDice.broadCastMessage(msg.name, packet)
                }

                break;




            case "startBocaDice":
                bocaDice.setPlay(msg.name);
                ulst = bocaDice.getNonPlaying();

                str = "";
                if (ulst.length == 0) {
                    bocaDice.setBocaStarted (true);
                    let players = bocaDice.getPlaying();
                    ;
                    let num = Math.floor(Math.random() * players.length);
                    str = "Let the games begin! " +
                        players[num].name + " was randomly chosen to start the game";
                    packet = bocaDice.setBocaDicePacket("playerStart", str, "Roll!!");
                    packet.totalDice = players.length * (BocaDice.NUMBER_DICE + BocaDice.NUMBER_DICEX) ;
                    packet.startIndex = packet.currentIndex = num;
                    packet.currentPlayer = players[packet.currentIndex].name;

                    bocaDice.broadCastAll(packet);
                } else {
                    str = "Waiting for "
                    let cnt = 1;
                    let names = [];
                    for (let item in ulst) {
                        names.push(ulst[item].name);
                    }
                    str += bocaDice.formatNameList(names) + " to click Start";
                    packet = bocaDice.setBocaDicePacket("playerStart", str, "Start");
                    bocaDice.sendPacket(ulst, packet);
                    ulst = bocaDice.getPlaying();
                    packet.buttonText = "Roll";
                    bocaDice.sendPacket(ulst, packet);
                }


                break;

        }
    }



}
module.exports = {BocaActions};