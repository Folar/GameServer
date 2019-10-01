const {Diver} = require('./../utils/Diver.js');


class DiverActions {

    constructor(diver) {
        this.bt = "";
        this.bt2 = "";
        this.mes = "";
        this.packet = null;
        this.diver = diver;
        this.lastCmd = "";
        this.lastName = "";

    }
    finishRound(name){
        let msg = name;
        let players =  this.diver.getPlaying();
        if(this.chkAllOnPlatform()){
            msg += " was the last player to reach the platform and ended round " +this.diver.diverData.round+".\n";
        } else{
            msg +=" caused the oxygen to run out and ended round " +this.diver.diverData.round+".\n";
            let lst = players.filter((p) => p.position > -1);
            let names = [];
            for (let item in lst) {
                names.push(lst[item].name);
            }
            msg += this.diver.formatNameList(names) + " didn't return to the platform and will have to dump their treasure.\n";
        }
        this.diver.calcScore();
        let res = this.diver.findMinMax();
        if(this.diver.diverData.round == Diver.NUMBER_ROUNDS){
            msg += this.diver.formatNameList(res[3])+ " won the game with the score of " + res[2] ;
        } else{
            msg += this.diver.formatNameList(res[3])+ " leads the game with the score of " + res[2] ;
        }

        if(this.diver.diverData.round == Diver.NUMBER_ROUNDS){
            this.packet = this.diver.setDiverPacket("Restart", msg, "Restart","");
            this.diver.broadCastAll( this.packet);
            this.diver.setDiverStarted(false);
            this.diver.removeAllConnections();
        } else {
            this.packet = this.diver.setDiverPacket("Pass", msg, "","");
            this.diver.sendToAll(msg.name, this.packet);
            setTimeout(this.nextRound.bind(this), Diver.DIVER_DELAY);
        }
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
            this.finishRound(name);
            return;
        }
        this.bt = "";
        this.bt2 = "";
        this.mes = name +  " reached the diving platform. ";
        this.packet = this.diver.setDiverPacket("notify", this.mes, this.bt,this.bt2);
        this.diver.sendToAll(msg.name, this.packet);
        setTimeout(this.pass.bind(this), Diver.DIVER_DELAY);
    }



    diverCmd( msg) {
        let user = this.diver.getUser(msg.name);
        let diver =this.diver ;
        if(this.lastCmd == msg.action && this.lastName == msg.name){
            //console.log("dooubletap")
            return;
        }
        this.lastCmd = msg.action;
        this.lastName = msg.name;
        switch (msg.action) {
            case "startDiver":
                this.diver.setPlay(msg.name);
                let ulst = this.diver.getNonPlaying();

                let str = "";
                if (ulst.length == 0) {
                    this.diver.setDiverStarted(true);
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
                let oSum = sum;
                let extraMove = "";
                let shark = "";
                switch(msg.bonus){
                    case 1:
                        diver.diverData.oxygen +=2;
                        break;
                    case 2:
                        diver.diverData.oxygen -=1;
                        break;
                    case 3:
                        extraMove = " plus an extra move "
                        sum+=1;
                        break;
                    case 4:
                        extraMove = " plus 2 extra moves "
                        sum+=2;
                        break;
                    case 5:
                        if (this.sharkAttack(user))
                            shark = "A shark has attack so 1 treasure is lost ";
                        break;
                }
                let steps = 0;
                let chip = diver.diverData.chips[user.position];;
                let total = sum - user.treasure.length;

                if(total <0) total = 0;

                diver.diverData.oxygen -= user.treasure.length;
                if ( diver.diverData.oxygen <1){
                    diver.diverData.oxygen = 0;
                    chip.name = "";
                    if(chip.color==Diver.DIVER_COLOR)
                        chip.type = "F";
                    this.finishRound(msg.name);
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
                        //diver.diverData.chips[user.position].subContents="\n";

                        if(diver.diverData.chips[user.position].color == Diver.DIVER_COLOR)
                            diver.diverData.chips[user.position].type = 'F';
                    }
                    user.position =pos;
                    chip.name = user.name.toUpperCase() ;


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
                        if(diver.diverData.chips[user.position].color == Diver.DIVER_COLOR)
                            diver.diverData.chips[user.position].type = 'F';
                    }

                    user.position =pos;
                    chip.name = user.name.toLowerCase();


                }
                let players = diver.getPlaying();

                this.mes = user.name +  " rolled " + oSum+ extraMove+". "+ shark;
                this.mes += user.name +  " has " + user.treasure.length +" treasure. he/she may move " + total+ " steps. ";
                if((chip.type == 'F' || chip.color ==Diver.DIVER_COLOR) && user.treasure.length >0){
                    this.bt = "Pass";
                    chip.type ='C';
                    this.bt2 = "Drop a tresaure";
                    this.mes += user.name+" can either drop a treasure(a small treasure is randomly chosen) or pass the dice ";
                    this.mes += "to the next player."
                } else if ((chip.type == 'F' || chip.color ==Diver.DIVER_COLOR) ){
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
                this.packet.bonus = msg.bonus;
                diver.sendToAll(players[this.packet.currentIndex].name, this.packet);
                setTimeout(this.continueToAction.bind(this), Diver.DIVER_DELAY);
                break;

            case "pickup":
                let c = diver.diverData.chips[user.position];
                let clone = JSON.parse(JSON.stringify(c));

                user.treasure.push(clone);
                c.color = Diver.DIVER_COLOR;
                c.textColor = Diver.TEXT_COLOR;
                c.subContents = "\n";
                this.packet = diver.setDiverPacket("pickup", msg.name +" picks up a treasure", "","");
                diver.sendToAll(msg.name, this.packet);
                setTimeout(this.pass.bind(this), Diver.DIVER_DELAY);
                break;

            case "drop":
                let min =100;
                for (let i in user.treasure){
                    user.treasure[i].index =Number(i);
                     if(user.treasure[i].expectedValue<min)
                         min = user.treasure[i].expectedValue;
                }
                let cs =user.treasure.filter((chip) => chip.expectedValue == min);
                let idx = Math.floor(Math.random() * cs.length);
                diver.diverData.chips[user.position] = JSON.parse(JSON.stringify(cs[idx]));

                if(user.direction == "Up")
                    diver.diverData.chips[user.position].name =   user.name.toLowerCase();
                user.treasure= user.treasure.filter((ch) => Number(ch.index )!= cs[idx].index);
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
    nextRound(){
        this.reorgChips();
        this.redistributeChips();
        this.diver.resetForRound();
        let packet = this.diver.diverData;
        let players = this.diver.getPlaying();
        packet.startIndex++;
        if (packet.startIndex == players.length)
            packet.startIndex = 0;
        packet.currentIndex = packet.startIndex;
        packet.oxygen = Diver.DIVER_OXYGEN;
        packet.round++;
        let name = players[packet.currentIndex].name;
        let msg =name + " will start round " + packet.round;
        this.packet = this.diver.setDiverPacket("passDice",msg, "Roll!!","");
        this.lastCmd = "";
        this.lastName = "";
        this.diver.sendToAll(name,this.packet);
    }
    reorgChips() {
        let players = this.diver.getPlaying();
        let last = this.diver.diverData.chips.length -1;
        for (let i = last;i>-1;i--){
            let chip = this.diver.diverData.chips[i];
            if(this.diver.diverData.chips[i].color == Diver.DIVER_COLOR  ){
                this.diver.diverData.chips.splice(i,1);
            }

        }
    }
    cmpPosition(a, b) {
        return (a.position - b.position) ;
    }

    sharkAttack(user){
        if (user.treasure.length == 0) return false;
        let min =100;
        for (let i in user.treasure){
            user.treasure[i].index =Number(i);
            if(user.treasure[i].expectedValue<min)
                min = user.treasure[i].expectedValue;
        }
        let cs =user.treasure.filter((chip) => chip.expectedValue == min);
        let idx = Math.floor(Math.random() * cs.length);

        user.treasure= user.treasure.filter((ch) => Number(ch.index )!= cs[idx].index);
        let str = "";
        let lastIdx = this.diver.diverData.chips.length - 1;
        let lastChip = this.diver.diverData.chips[lastIdx];
        let lastChipCnt = 0;
        let chip = JSON.parse(JSON.stringify(cs[idx]));
        if (lastChip.color == Diver.MULTI_COLOR && lastChip.subChips.length <Diver.DIVER_COMBINE_CHIPS){
            let chip2 = null;
            if (chip.color == Diver.MULTI_COLOR && chip.subChips.length == Diver.DIVER_COMBINE_CHIPS){
                chip = chip.subChips[0];
                chip2 = chip.subChips[1];
            }
            lastChip.subChips.push(chip);
            lastChip.expectedValue += chip.expectedValue;
            lastChip.subContents +=  ",";
            switch (chip.size) {
                case .5:
                    lastChip.subContents +="S";
                    break;
                case .6:
                    lastChip.subContents += "M";
                    break;
                case .7:
                    lastChip.subContents +="L";
                    break;
                case .8:
                    lastChip.subContents +="XL";
                    break;

            }

            if(chip2!= null){
                let combo = [];
                let ev = chip2.expectedValue;

                combo.push(chip2);

                switch (chip2.size) {
                    case .5:
                        str = "\nS";
                        break;
                    case .6:
                        str = "\nM";
                        break;
                    case .7:
                        str = "\nL";
                        break;
                    case .8:
                        str = "\nXL";
                        break;

                }

                this.diver.diverData.chips.push({
                    name: "",
                    type: 'C',
                    color: Diver.MULTI_COLOR,
                    textColor: Diver.TEXT_COLOR,
                    value: 3,
                    size: .8,
                    subChips: combo,
                    subContents: str,
                    expectedValue: ev
                });
            }


        } else {
            if(chip.color == Diver.MULTI_COLOR){
                this.diver.diverData.chips.push(chip);
            }else {
                let combo = [];
                let ev = chip.expectedValue;

                combo.push(chip);

                switch (chip.size) {
                    case .5:
                        str = "\nS";
                        break;
                    case .6:
                        str = "\nM";
                        break;
                    case .7:
                        str = "\nL";
                        break;
                    case .8:
                        str = "\nXL";
                        break;

                }

                this.diver.diverData.chips.push({
                    name: "",
                    type: 'C',
                    color: Diver.MULTI_COLOR,
                    textColor: Diver.TEXT_COLOR,
                    value: 3,
                    size: .8,
                    subChips: combo,
                    subContents: str,
                    expectedValue: ev
                });
            }
        }
        return true;
    }


    redistributeChips(){
        let newChips=[];
        let pChips = [];

        let players = this.diver.getPlaying().filter((p) => p.position > -1);
        let arr=[];
        for(let i in players){
            let p = players[i];
            arr.push({
                idx:i,
                position:p.position
            });
        }
        if(arr.length== 0) return;
       arr.sort(this.cmpPosition);
        for(let i in arr ){
            pChips = [];
            for(let j in players[arr[i].idx].treasure ){

                let c = players[arr[i].idx].treasure[j];
                if(c.subChips.length == 0)
                    pChips.push(c);
                else{
                    for(let k in c.subChips ){
                        pChips.push(c.subChips[k]);
                    }
                }

            }
            this.shuffle(pChips);
            for (let n in pChips)
                newChips.push(pChips[n]);
        }

        let lastIdx = this.diver.diverData.chips.length - 1;
        let lastChip = this.diver.diverData.chips[lastIdx];
        let lastChipCnt = 0;
        if (lastChip.color == Diver.MULTI_COLOR && lastChip.subChips.length <Diver.DIVER_COMBINE_CHIPS){
            while (lastChip.subChips.length <Diver.DIVER_COMBINE_CHIPS){
                let chip = newChips[lastChipCnt];
                lastChip.subChips.push(chip);
                if(chip.expectedValue == undefined) {
                    chip.expectedValue = 1.5;
                }
                lastChip.expectedValue += chip.expectedValue;
                lastChip.subContents +=  ",";
                switch (chip.size) {
                    case .5:
                        lastChip.subContents +="S";
                        break;
                    case .6:
                        lastChip.subContents += "M";
                        break;
                    case .7:
                        lastChip.subContents +="L";
                        break;
                    case .8:
                        lastChip.subContents +="XL";
                        break;

                }
                lastChipCnt++;

            }

        }

        for (let i = lastChipCnt ; i<newChips.length; i= i + Diver.DIVER_COMBINE_CHIPS){
            let v = 0;
            let cnt = 0;
            let str = "\n";
            let combo = [];
            let ev = 0;
            while(cnt < Diver.DIVER_COMBINE_CHIPS && (i+cnt)<newChips.length){
                let chip = newChips[i+cnt];
                combo.push(chip);
                ev += chip.expectedValue;
                if (cnt > 0)
                    str +=  ",";
                switch (chip.size) {
                    case .5:
                        str+="S";
                        break;
                    case .6:
                        str+= "M";
                        break;
                    case .7:
                        str+="L";
                        break;
                    case .8:
                        str+="XL";
                        break;

                }
                cnt++;
            }
            this.diver.diverData.chips.push({ name: "",
                type: 'C',
                color: Diver.MULTI_COLOR,
                textColor:Diver.TEXT_COLOR,
                value: 3,
                size: .8,
                subChips:combo,
                subContents:str,
                expectedValue:ev});
        }

    }
    shuffle(deck) {
        // for 1000 turns
        // switch the values of two random cards
        for (let i = 0; i < 1000; i++) {
            let location1 = Math.floor((Math.random() * deck.length));
            let location2 = Math.floor((Math.random() *  deck.length));
            let tmp = deck[location1];

            deck[location1] = deck[location2];
            deck[location2] = tmp;
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
        let packet = this.diver.setDiverPacket("passDice", str, bt,bt2);
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