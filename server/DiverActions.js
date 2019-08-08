const {Diver} = require('./../utils/Diver.js');


class DiverActions {

    constructor() {


    }
    finishRound(){

    }
    playerFinishRound(name){

    }


    diverCmd(diver, msg) {

        switch (msg.action) {
            case "startDiver":
                diver.setPlay(msg.name);
                let ulst = diver.getNonPlaying();

                let str = "";
                if (ulst.length == 0) {
                    diver.setDiverStarted(true);
                    let players = diver.getPlaying();
                    let num = Math.floor(Math.random() * players.length);
                    str = "Let the games begin! " +
                        players[num].name + " was randomly chosen to start the game";
                    let packet = diver.setDiverPacket("playerStart", str, "Roll!!");
                    packet.startIndex = packet.currentIndex = num;
                    packet.currentPlayer = players[packet.currentIndex].name;
                    diver.sendToAll(players[num].name, packet);

                } else {
                    str = "Waiting for "
                    let cnt = 1;
                    let names = [];
                    for (let item in ulst) {
                        names.push(ulst[item].name);
                    }
                    str += diver.formatNameList(names) + " to click Start";
                    let packet = diver.setDiverPacket("playerStart", str, "Start");
                    diver.sendPacket(ulst, packet);
                    ulst = diver.getPlaying();
                    packet.buttonText = "";
                    diver.sendPacket(ulst, packet);
                }
                break;
            case "roll":
                let sum = msg.di1 + msg.di2;
                let user = diver.getUser(msg.name);
                let steps = 0;
                let chip =  null;
                let total = sum - user.treasure.length;
                if(total <0) total = 0;
                diver.diverData.oxygen -= user.treasure.length;
                if ( diver.diverData.oxygen <1){
                    this.finishRound();
                    break;
                }
                if(user.direction == "Down") {
                    let   pos = user.position +1 ;

                    chip = diver.diverData.chips[pos];
                    while (total>0 && pos < diver.diverData.chips.length) {
                        chip =  diver.diverData.chips[pos];
                        if (chip.name.length == 0){
                            steps++;
                            if (steps == total){
                                break;
                            }
                            pos++;
                        }

                    }
                    if(pos == diver.diverData.chips.length) {
                        pos--;
                        chip =  diver.diverData.chips[pos];
                    }
                    if(pos!= user.position && user.position != -1){
                        diver.diverData.chips[user.position].name="";
                    }
                    user.position =pos;
                    chip.name = user.name.toUpperCase();


                }  else  { //UP
                    let   pos = user.position -1 ;

                    let chip = diver.diverData.chips[pos];
                    while (total>0 && pos > -1) {
                        chip =  diver.diverData.chips[pos];
                        if (chip.name.length == 0){
                            steps++;
                            if (steps == total){
                                break;
                            }
                            pos--;
                        }

                    }
                    if(pos == -1) {
                       this.playerFinishRound(user.name);
                       break;
                    }
                    if(pos!= user.position && user.position != -1){
                        diver.diverData.chips[user.position].name="";
                    }

                    user.position =pos;
                    chip.name = user.name.toLowerCase();


                }
                let players = diver.getPlaying();
                let bt = "";
                let bt2 = "";
                let mes = user.name +  " rolled " + sum+". ";
                mes += user.name +  " has " + user.treasure.length +" treasure. he/she may move " + total+ " steps. ";
                if((chip.type == 'F' || chip.color =="red") && user.treasure.length >0){
                    bt = "Pass";
                    bt2 = "Drop a tresaure";
                    mes += user.name+" can either drop a treasure(a small treasure is randomly chosen) or pass the dice ";
                    mes += "to the next player."
                } else if ((chip.type == 'F' || chip.color =="red") ){
                    bt = "Pass";
                    bt2 = "";
                    mes += user.name+" has no treasure to drop. Pass the dice to the next player."
                } else {
                    bt = "Pass";
                    bt2 = "Pick up a treasure";
                    mes += user.name+" can either pick a treasure or pass the dice to the next player."

                }
                let packet = diver.setDiverPacket("rollDice", mes, bt,bt2);
                packet.di1 = msg.di1;
                packet.di2 = msg.di2;
                diver.sendToAll(players[packet.startIndex].name, packet);
                break;

        }
    }
}
module.exports = {DiverActions};