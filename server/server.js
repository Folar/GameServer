var WebSocketServer = require('websocket').server;
var http = require('http');
const {TakeSix} = require('./../utils/TakeSix.js');
const {BocaDice} = require('./../utils/BocaDice.js');

let takeSix = new TakeSix();
let bocaDice= new BocaDice();
var deck = new Array();
myTimer = null;
let bocaDiceStarted = false;
let takeSixStarted = false;
const port = process.env.PORT || 9081;


var server = http.createServer(function (request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(port, function () {
    console.log((new Date()) + ' Server is listening on port '+port);
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}


wsServer.on('request', function (request) {


    if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }
    function compare(a, b) {
        if (a.rank < b.rank) {
            return -1;
        }
        if (a.rank > b.rank) {
            return 1;
        }
        // a must be equal to b
        return 0;
    }



    function prepareTakeSixPacket(type, message) {
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
            reanimate:false,
            users: []
        }
    }

    function reshuffle() {
        deck = getDeck();
        shuffle();
        let row1 = [getOneCard()];
        let row2 = [getOneCard()];
        let row3 = [getOneCard()];
        let row4 = [getOneCard()];

        takeSix.setCardRows(row1, row2, row3, row4);

    }

    function prepareForPlacement(packet, rank) {

       // console.log("prepareForPlacement rank =" + rank);
        let pkt = JSON.parse(JSON.stringify(packet));  //deepCopy
        let rows = [pkt.row1, pkt.row2, pkt.row3, pkt.row4];
        let min = 200;
        let rmin = -1;
        let idx = 0;
        for (item in rows) {
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
            for (item in rows) {
                rows[item][0].state = 1;

            }

        }
        return pkt;
    }

    let canReset = true;
    function restartGame() {
        canReset =false;
        console.log("start of restartgame") ;
        let packet = prepareTakeSixPacket("message", "There has been no game activity for "+TakeSix.NUMBER_TlME_WARN
            +" minutes.The Game Server has been restarted. Reload FolarGames in your browser");
        takeSixStarted = false;
        takeSix.broadCastAll(packet);
        takeSix.removeAllConnections();
        packet=bocaDice.setBocaDicePacket("message", "There has been no game activity for "+TakeSix.NUMBER_TlME_WARN
            +" minutes.The Game Server has been restarted. Reload FolarGames in your browser","Reload");
        bocaDiceStarted = false;
        bocaDice.broadCastAll(packet);
        bocaDice.removeAllConnections();
        if (myTimer != null){
            clearTimeout(myTimer);
        }
        myTimer = null;
        canReset = true;
        console.log("end of restartgame") ;
    }

    function resetTimer(){
        if (!canReset){
            console.log("no of reset timer")
            return;
        }

        if (myTimer != null){
            clearTimeout(myTimer);
        }
        myTimer = setTimeout(restartGame, 60000 * TakeSix.NUMBER_TlME_WARN );
        
    }


    let payload = "";
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function (message) {
        if (message.type === 'utf8') {
            //console.log('xReceived Message: ' + JSON.parse(message.utf8Data));
            msg = JSON.parse(message.utf8Data);
            let lst = takeSix.getUserList();
            let packet = null;
            let pkt = null;
            let ulst;
            let str;
            resetTimer();
            switch (msg.type) {
                case "nextRoundBocaDice":
                    bocaDice.nextRound();
                    let players = bocaDice.getPlaying();
                    packet = bocaDice.getCurrentPacket();
                    packet.totalDice = players.length * BocaDice.NUMBER_DICE;
                    packet =  bocaDice.setBocaDicePacket("passDice",
                        packet.currentPlayer +" is starting her/his turn",
                        "Roll!!");
                    bocaDice.broadCastAll(packet)


                    break;
                case "passBocaDice":
                    packet = bocaDice.getCurrentPacket();
                    while(true){
                        if (packet.totalDice <= 0){
                            packet.startIndex++;
                            if(packet.startIndex == packet.players.length)
                                packet.startIndex = 0;
                            packet.currentIndex =  packet.startIndex;
                            packet.currentPlayer = packet.players[packet.currentIndex].name;
                            let prevMoney = JSON.parse(JSON.stringify({ money: packet.money}));
                            bocaDice.distributePlayerCash();
                            let afterMoney = JSON.parse(JSON.stringify({ money: packet.money}));
                            packet.round++;
                            if (packet.round<=BocaDice.NUMBER_ROUNDS) {
                                packet = bocaDice.setBocaDicePacket("startRound",
                                    packet.currentPlayer + " will start round " + packet.round +
                                    "\n\n  *subtotals for round " + (packet.round - 1),
                                    "Start Rnd " + packet.round);
                                packet.money = prevMoney.money;
                                bocaDice.broadCastAll(packet);
                                packet.money = afterMoney.money;
                            }else{
                                bocaDice.setMoneyTotalDiceLeft();
                                let res= bocaDice.findMinMax();
                                packet = bocaDice.setBocaDicePacket("Restart",
                                    bocaDice.formatNameList(res[3]) + " won the game with " + res[2]+ " grand",
                                    "Restart");
                                bocaDice.diceNum = 8;
                                bocaDiceStarted = false;
                                bocaDice.broadCastAll(packet);
                                bocaDice.removeAllConnections();
                            }
                            break;
                        }
                        packet.currentIndex++;
                        if(packet.currentIndex == packet.players.length)
                            packet.currentIndex =0;
                        if(packet.players[packet.currentIndex].diceLeft!=0){
                            packet.currentPlayer = packet.players[packet.currentIndex].name;
                            packet.diceNum = packet.players[packet.currentIndex].diceLeft;
                            packet =  bocaDice.setBocaDicePacket("passDice",
                                packet.currentPlayer +" is starting her/his turn",
                                "Roll!!");
                            bocaDice.broadCastAll( packet);
                            break;
                        }
                    }
                    break;

                case "rollBocaDice":





                    if(msg.selectedDice != -1){
                        packet = bocaDice.getCurrentPacket();
                        packet.dice = msg.dice;
                        packet.selectedDice = msg.selectedDice;

                        let u =bocaDice.users[packet.currentIndex];
                        u.diceLeft -= msg.qty;
                        packet =  bocaDice.setBocaDicePacket("rollDice",
                            msg.name +" selected the "  +( msg.dice[msg.selectedDice])+ " die("+msg.qty+")",
                            "Pass Dice");
                      //  packet.players[packet.currentIndex].diceLeft -= msg.qty;
                        packet.totalDice -= msg.qty;
                        packet.fieldColors[msg.dice[msg.selectedDice]-1] ="gray";
                        packet.fieldPlayers[msg.dice[msg.selectedDice]-1]= msg.fld;
                        packet.ofieldPlayers[msg.dice[msg.selectedDice]-1]= msg.fld;
                        bocaDice.broadCastAll( packet);
                    } else{
                        packet =  bocaDice.setBocaDicePacket("rollDice",
                            msg.name +" rolled his/her dice",
                            "Confirm");
                        packet.dice = msg.dice;
                        packet.selectedDice = msg.selectedDice;
                        bocaDice.broadCastMessage(msg.name,packet)
                    }

                    packet.fieldColors[msg.dice[msg.selectedDice]-1] =   packet.ofieldColors[msg.dice[msg.selectedDice]-1];
                    break;

                case "startBocaDice":
                    bocaDice.setPlay(msg.name);
                    ulst = bocaDice.getNonPlaying();

                    str = "";
                    if (ulst.length == 0) {
                        bocaDiceStarted = true;
                        let players = bocaDice.getPlaying();;
                        let num =  Math.floor(Math.random() * players.length);
                        str = "Let the games begin! " +
                            players[num].name+" was randomly chosen to start the game";
                        packet =  bocaDice.setBocaDicePacket("playerStart", str,"Roll!!");
                        packet.totalDice = players.length * BocaDice.NUMBER_DICE;
                        packet.startIndex =packet.currentIndex = num;
                        packet.currentPlayer =players[packet.currentIndex].name;

                        bocaDice.broadCastAll(packet);
                    } else {
                        str = "Wating for "
                        let cnt = 1;
                        let names = [];
                        for (let item in ulst) {
                            names.push(ulst[item].name);
                        }
                        str += takeSix.formatNameList(names) + " to click Start";
                        packet =  bocaDice.setBocaDicePacket("playerStart", str,"Start");
                        bocaDice.sendPacket(ulst,packet);
                        ulst = bocaDice.getPlaying();
                        packet.buttonText ="Roll";
                        bocaDice.sendPacket(ulst,packet);
                    }


                    break;



                case "restartTake6":
                   restartGame();
                    break;

                case "placeCard":
                    console.log("ZZZZZZZ "+takeSix.getState(msg.name ));
                    if (takeSix.getState(msg.name )!= 5){
                        console.log("XXXXXXXXXXXXX AAAAAAAA");
                        return;
                    }
                    takeSix.setState(msg.name, 6);
                    console.log("YYYYYYY "+takeSix.getState(msg.name ));
                    takeSix.stopPlaying(msg.name);
                    str = msg.name + " placed their card for this round. ";
                    let rows = takeSix.getCardRows();
                    let moo = false;
                    let score = 0;
                    let msgType = "message"

                    if (rows[msg.row - 1][rows[msg.row - 1].length - 1].rank < takeSix.getCurrentCard(msg.name).rank &&
                        rows[msg.row - 1].length < TakeSix.NUMBER_TAKE) {
                        rows[msg.row - 1].push(takeSix.getCurrentCard(msg.name));
                    } else {
                        score =takeSix.score(msg.name, rows[msg.row - 1]);
                        str += msg.name + " added "+score+ " bulls to their score. ";
                        let newRow = [];
                        if(rows[msg.row - 1].length ==  TakeSix.NUMBER_TAKE)
                            msgType ="mooSound";
                        newRow.push(takeSix.getCurrentCard(msg.name));
                        takeSix.setOneRow(msg.row, newRow);
                    }

                    ulst = takeSix.getByNotState(6);
                    if (ulst.length == 0) {
                        takeSix.setAllState(3);
                        if (takeSix.users[0].cards.length != 0) {
                            str += " Start round " + (11 - takeSix.users[0].cards.length ) + ".";
                            packet = prepareTakeSixPacket(msgType, str);
                            takeSix.broadCastAll(packet);
                        } else {
                            let tally = takeSix.findMinMax();
                            let min = tally[0];
                            let minNames = tally[1];
                            let max = tally[2];
                            let maxNames = tally[3];
                            let wstatus = minNames.length > 1? " are the WINNERS!!" : " is the WINNER!!";
                            let lstatus = minNames.length > 1? " are the LOOSERS!!" : " is the LOOSER!!";
                            let astatus = minNames.length > 1? " are the leaders." : " is the leader.";
                            let rstatus = minNames.length > 1? " are bringing up the rear." : " is bringing up the rear.";
                            if(max >= TakeSix.NUMBER_GOAL){
                                str += "With a score of "+ min +" "+
                                    takeSix.formatNameList(minNames)+ wstatus;
                                str += " With a score of "+ max +" "+
                                    takeSix.formatNameList(maxNames)+ lstatus;
                                takeSixStarted = false;
                                packet = prepareTakeSixPacket(msgType, str);
                                packet.buttonText = "Again?";
                                takeSix.broadCastAll(packet);
                                takeSix.removeAllConnections();
                            }
                            else {
                                takeSix.reshuffle();
                                str += "With a score of "+ min +" "+
                                    takeSix.formatNameList(minNames)+ astatus;
                                str += " With a score of "+ max +" "+
                                    takeSix.formatNameList(maxNames)+ rstatus;
                                str += " The deck will be reshuffle and play will continue."
                                packet = prepareTakeSixPacket(msgType, str);
                                packet.reanimate = true;
                                takeSix.broadCastAll(packet);
                            }


                        }




                    } else {
                        packet = prepareTakeSixPacket(msgType, "");
                        pkt = prepareTakeSixPacket(msgType, str + ulst[0].id);

                        takeSix.fillinPacket(ulst[0].id, pkt);
                        pkt = prepareForPlacement(pkt, ulst[0].currentCard.rank)
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
                        str =msg.name + " selected a card for this round. All cards have now been Selected. " +
                             takeSix.getUserList()[0].name;
                        takeSix.setAllState(5);

                        packet = prepareTakeSixPacket("message", str);
                        pkt = prepareTakeSixPacket("message", str);

                        takeSix.fillinPacket(takeSix.getUserList()[0].name, pkt);
                        pkt = prepareForPlacement(pkt, takeSix.users[0].currentCard.rank)
                        packet.message = pkt.message;
                        takeSix.broadCastMessage(takeSix.getUserList()[0].name, packet);

                        takeSix.sendCustomPacket(takeSix.getUserList()[0].name, pkt);
                    } else {
                        packet = prepareTakeSixPacket("message", msg.name + " selected  a card for this round.");
                        takeSix.broadCastAll(packet);
                    }
                    break;
                case "startingGame":
                    takeSix.setState(msg.name, 2);
                    ulst = takeSix.getByNotState(2);
                    str = "";
                    if (ulst.length == 0) {
                        takeSixStarted = true;
                        str = "Let the games begin! Select your first Card";
                        takeSix.setAllState(3);

                    } else {
                        str = "Wating for "
                        let cnt = 1;
                        let names = [];
                        for (let item in ulst) {
                            names.push(ulst[item].id);
                        }
                        str += takeSix.formatNameList(names) + " to click Start";

                    }
                    packet = prepareTakeSixPacket("message", str);
                    takeSix.broadCastAll(packet);
                    break;
                case "newUser":

                    switch (msg.gameType) {
                        case 2:
                            if(takeSix.chkForDuplicateName(msg.name)){
                                packet = prepareTakeSixPacket("dupUser", msg.name +" has already signed on, please choose another");
                                connection.send(JSON.stringify(packet));
                                break;
                            } else {
                                let user = null
                                if(takeSixStarted){
                                    user = takeSix.addWatchers(connection, msg.name);
                                    packet = prepareTakeSixPacket("newWatcher", "The game has already started, but you can still watch the game");
                                    takeSix.sendWatcher(msg.name, packet);

                                } else if (takeSix.users.length == TakeSix.NUMBER_PLAYERS ){
                                    user = takeSix.addWatchers(connection, msg.name);
                                    packet = prepareTakeSixPacket("newWatcher", "The game has already has "+TakeSix.NUMBER_PLAYERS+
                                        " players, but you can still watch the game");
                                    takeSix.sendWatcher(msg.name, packet);
                                }
                                else {
                                    user = takeSix.addUser(connection, msg.name);
                                    packet = prepareTakeSixPacket("newUser", "Welcome! Press the Start button when all the players have joined");
                                    takeSix.send(msg.name, packet);
                                    packet.reanimate = true;
                                    packet.messageType = "newPlayer";
                                    packet.message = msg.name + " is now Playing\n\n";
                                    takeSix.broadCastMessage(msg.name, packet);
                                }
                            }
                            break;

                        case 4:
                            if(bocaDice.chkForDuplicateName(msg.name)){
                                packet = bocaDice.prepareBocaDicePacket("dupUser", msg.name +" has already signed on, please choose another");

                                packet.messageType = "dupUser";
                                connection.send(JSON.stringify(packet));
                                break;
                            } else {
                                let user = null
                                if(bocaDiceStarted){
                                    user = bocaDice.addWatchers(connection, msg.name);
                                    packet = bocaDice.setBocaDicePacket("newWatcher", "The game has already started, but you can still watch the game","");
                                    packet.messageType = "newWatcher";
                                    bocaDice.sendWatcher(msg.name, packet);

                                } else if (bocaDice.users.length == BocaDice.NUMBER_PLAYERS ){
                                    user = bocaDice.addWatchers(connection, msg.name);
                                    packet =  bocaDice.setBocaDicePacket("newWatcher", "The game has already has "+BocaDice.NUMBER_PLAYERS+
                                        " players, but you can still watch the game","");
                                    bocaDice.sendWatcher(msg.name, packet);
                                }
                                else {
                                    user = bocaDice.addUser(connection, msg.name);
                                    packet =  bocaDice.setBocaDicePacket("newUser",
                                        "Welcome! Press the Start button when all the players have joined",
                                        "Start");
                                    bocaDice.send(msg.name, packet);
                                    packet.messageType = "newPlayer";
                                    packet.message = msg.name + " is now Playing\n\n";
                                    bocaDice.broadCastMessage(msg.name, packet);
                                }
                            }
                            break;

                    }



                    break;
            }

        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });

    connection.on('error', function (evt) {
        // packet = prepareTakeSixPacket("message", "Someone left the game,please start again");
        //
        // ;
        // takeSix.broadCastAll(packet);
        // takeSix.removeAllConnections();
        // console.log((new Date()) + ' error ' + connection.remoteAddress + ' disconnected.');
    });
    connection.on('close', function (reasonCode, description) {
        // if(takeSix.users.length == 1){
        //     takeSix.removeAllConnections();
        // }
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});
