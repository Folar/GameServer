const {Diver} = require('./../utils/Diver.js');


class DiverActions {

    constructor() {
        this.bt = "";
        this.bt2 = "";
        this.mes = "";
        this.packet = null;
        this.diver = null;

    }
    finishRound(){

    }
    chkAllOnPlatform(){
        let players =  this.diver.getPlaying();
        for (let i in players){
            if(players[i].direction == "Down" || players[i].position> -1)
                return false;
        }
        return true;
    }
    playerFinishRound(name){
        if(this.chkAllOnPlatform()){
            this.finishRound();
            return;
        }
        this.bt = "";
        this.bt2 = "";
        this.mes = name +  " reached the diving platform. ";
        this.packet = this.diver.setDiverPacket("notify", this.mes, this.bt,this.bt2);
        this.diver.sendToAll(msg.name, this.packet);
        setTimeout(this.pass.bind(this), Diver.DIVER_DELAY);
    }

    diverCmd(diver, msg) {
        let user = diver.getUser(msg.name);
        this.diver = diver;
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
                let steps = 0;
                let chip = diver.diverData.chips[user.position];;
                let total = sum - user.treasure.length;
                if(total <0) total = 0;
                diver.diverData.oxygen -= user.treasure.length;
                if ( diver.diverData.oxygen <1){
                    this.finishRound();
                    break;
                }
                if(user.direction == "Down" && total > 0) {
                    let   pos = user.position +1 ;

                    chip = diver.diverData.chips[pos];
                    while (total>0 && pos < diver.diverData.chips.length) {
                        chip =  diver.diverData.chips[pos];
                        if (chip.name.length == 0){
                            steps++;
                            if (steps == total){
                                break;
                            }
                        }
                        pos++;

                    }
                    if(pos == diver.diverData.chips.length) {
                        pos--;
                        chip =  diver.diverData.chips[pos];
                    }
                    if(pos!= user.position && user.position != -1){
                        diver.diverData.chips[user.position].name="";
                        if(diver.diverData.chips[user.position].color == "red")
                            diver.diverData.chips[user.position].type = 'F';
                    }
                    user.position =pos;
                    chip.name = user.name.toUpperCase();


                }  else if(total > 0) { //UP
                    let   pos = user.position -1 ;

                    chip = diver.diverData.chips[pos];
                    while (total>0 && pos > -1) {
                        chip =  diver.diverData.chips[pos];
                        if (chip.name.length == 0){
                            steps++;
                            if (steps == total){
                                break;
                            }
                        }
                        pos--;

                    }
                    if(pos <= -1) {
                        diver.diverData.chips[user.position].name="";
                        user.position = -1;
                       this.playerFinishRound(user.name);
                       break;
                    }
                    if(pos!= user.position && user.position != -1){
                        diver.diverData.chips[user.position].name="";
                        if(diver.diverData.chips[user.position].color == "red")
                            diver.diverData.chips[user.position].type = 'F';
                    }

                    user.position =pos;
                    chip.name = user.name.toLowerCase();


                }
                let players = diver.getPlaying();

                this.mes = user.name +  " rolled " + sum+". ";
                this.mes += user.name +  " has " + user.treasure.length +" treasure. he/she may move " + total+ " steps. ";
                if((chip.type == 'F' || chip.color =="red") && user.treasure.length >0){
                    this.bt = "Pass";
                    chip.type ='C';
                    this.bt2 = "Drop a tresaure";
                    this.mes += user.name+" can either drop a treasure(a small treasure is randomly chosen) or pass the dice ";
                    this.mes += "to the next player."
                } else if ((chip.type == 'F' || chip.color =="red") ){
                    chip.type ='C';
                    this.bt = "Pass";
                    this.bt2 = "";
                    this.mes += user.name+" has no treasure to drop. Pass the dice to the next player."
                } else {
                    this.bt = "Pass";
                    this.bt2 = "Pick up a treasure";
                    this.mes += user.name+" can either pick a treasure or pass the dice to the next player."

                }
                this.packet = diver.setDiverPacket("rollDice", this.mes, "","");
                this.packet.di1 = msg.di1;
                this.packet.di2 = msg.di2;
                diver.sendToAll(players[this.packet.currentIndex].name, this.packet);
                setTimeout(this.continueToAction.bind(this), Diver.DIVER_DELAY);
                break;

            case "pickup":
                let c = diver.diverData.chips[user.position];
                let clone = JSON.parse(JSON.stringify(c));

                user.treasure.push(clone);
                c.color = "red";
                c.textColor = "blue";
                this.packet = diver.setDiverPacket("pickup", msg.name +" picks up a treasure", "","");
                diver.sendToAll(msg.name, this.packet);
                setTimeout(this.pass.bind(this), Diver.DIVER_DELAY);
                break;

            case "drop":
                let min =.8;
                for (let i in user.treasure){
                    user.treasure[i].index =Number(i);
                     if(user.treasure[i].size<min)
                         min = user.treasure[i].size;
                }
                let cs =user.treasure.filter((chip) => chip.size == min);
                let idx = Math.floor(Math.random() * cs.length);
                diver.diverData.chips[user.position] = JSON.parse(JSON.stringify(cs[idx]));
                if(user.direction == "Up")
                    diver.diverData.chips[user.position].name =   user.name.toLowerCase();
                user.treasure= user.treasure.filter((ch) => Number(ch.index )!= idx);
                this.bt = "";
                this.bt2 = "";
                this.mes = user.name +  " drop one of the treasure(s). ";
                this.packet = diver.setDiverPacket("notify", this.mes, this.bt,this.bt2);
                diver.sendToAll(msg.name, this.packet);
                setTimeout(this.pass.bind(this), Diver.DIVER_DELAY);
                break;

            case "pass":
                this.pass();
                break;

            case "changeDirection":
                user.direction = "Up";
                let chip2 =  diver.diverData.chips[user.position];
                chip2.name = user.name.toLowerCase();
                this.bt = "";
                this.bt2 = "";
                this.mes = user.name +  " will return to the diving platform. ";
                this.packet = diver.setDiverPacket("notify", this.mes, this.bt,this.bt2);
                let players2 = diver.getPlaying();
                diver.sendToAll(players2[this.packet.currentIndex].name, this.packet);
                setTimeout(this.continueToRoll.bind(this), Diver.DIVER_DELAY);
                break;

        }
    }

    pass(){
        let players = this.diver.getPlaying();
        while(true){
            this.packet.currentIndex++;
            if (this.packet.currentIndex == this.packet.players.length)
                this.packet.currentIndex = 0;
            if(players[this.packet.currentIndex].direction == "Down" || players[this.packet.currentIndex].position> -1)
                break;
        }

        let user = players[this.packet.currentIndex];

        let bt = "Roll!!";
        let bt2 = "";
        if(user.direction == "Down" && user.treasure.length>0)
            bt2 = "Change Direction";
        let str = "It is now "+user.name + " turn";
        let packet = this.diver.setDiverPacket("playerRoll", str, bt,bt2);
        this.diver.sendToAll(players[packet.currentIndex].name, packet);

    }
    continueToAction(){
        let bt = this.bt;
        let bt2 = this.bt2;
        let mes = this.mes;
        let packet = this.diver.setDiverPacket("notifyRoll", mes, bt,bt2);
        let players = this.diver.getPlaying();
        this.diver.send(players[packet.currentIndex].name, packet);

    }
    continueToRoll(){
        let bt = "Roll!!";
        let bt2 = "";
        let players1 = this.diver.getPlaying();
        let mes = players1[this.packet.currentIndex].name +  " you can roll now. ";
        let packet = this.diver.setDiverPacket("notifyRoll", mes, bt,bt2);
        this.diver.send(players1[packet.currentIndex].name, packet);

    }
}
module.exports = {DiverActions};