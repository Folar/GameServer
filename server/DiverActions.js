
const {Diver} = require('./../utils/Diver.js');

let takeSix = new TakeSix();
let bocaDice = new BocaDice();


myTimer = null;



function diverCmd(diver,action) {
    let diverStarted = false;
    switch (action){
        case "startDiver":
            diver.setPlay(msg.name);
            ulst = diver.getNonPlaying();

            str = "";
            if (ulst.length == 0) {
                diverStarted = true;
                let players = diver.getPlaying();
                ;
                let num = Math.floor(Math.random() * players.length);
                str = "Let the games begin! " +
                    players[num].name + " was randomly chosen to start the game";
                packet = diver.setDiverPacket("playerStart", str, "Roll!!");
                packet.startIndex = packet.currentIndex = num;
                packet.currentPlayer = players[packet.currentIndex].name;
                diver.send(players[num].name, packet);
                packet.buttonText = "";
                diver.broadCastMessage(players[num].name, packet);
            } else {
                str = "Waiting for "
                let cnt = 1;
                let names = [];
                for (let item in ulst) {
                    names.push(ulst[item].name);
                }
                str += takeSix.formatNameList(names) + " to click Start";
                packet = diver.setDiverPacket("playerStart", str, "Start");
                diver.sendPacket(ulst, packet);
                ulst = diver.getPlaying();
                packet.buttonText = "Roll";
                diver.sendPacket(ulst, packet);
            }
            break;

    }

}