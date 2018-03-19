var WebSocketServer = require('websocket').server;
var http = require('http');
const {TakeSix} = require('./../utils/TakeSix.js');

takeSix = new TakeSix();
var deck = new Array();


var server = http.createServer(function (request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(9081, function () {
    console.log((new Date()) + ' Server is listening on port 9081');
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

    function preparePacket(type, message) {
        return {
            messageType: type,
            cards: {},
            row1: null,
            row2: null,
            row3: null,
            row4: null,
            message: message,
            state: 0,
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

        console.log("prepareForPlacement rank =" + rank);
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
                    console.log("prepareForPlacement row=" + idx + " card=" + rows[item][rows[item].length - 1].rank
                        + " min=" + min);
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

    let payload = "";
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function (message) {
        if (message.type === 'utf8') {
            console.log('xReceived Message: ' + JSON.parse(message.utf8Data));
            msg = JSON.parse(message.utf8Data);
            let lst = takeSix.getUserList();
            let packet = null;
            let pkt = null;
            let ulst;
            let str;
            switch (msg.type) {
                case "placeCard":
                    takeSix.setState(msg.name, 6);
                    takeSix.stopPlaying(msg.name);
                    str = msg.name + " placed their card for this round. ";
                    let rows = takeSix.getCardRows();

                    if (rows[msg.row - 1][rows[msg.row - 1].length - 1].rank < takeSix.getCurrentCard(msg.name).rank &&
                        rows[msg.row - 1].length < TakeSix.NUMBER_TAKE) {
                        rows[msg.row - 1].push(takeSix.getCurrentCard(msg.name));
                    } else {
                        takeSix.score(msg.name, rows[msg.row - 1]);
                        let newRow = [];
                        newRow.push(takeSix.getCurrentCard(msg.name));
                        takeSix.setOneRow(msg.row, newRow);
                    }

                    ulst = takeSix.getByNotState(6);
                    if (ulst.length == 0) {
                        takeSix.setAllState(3);
                        if (takeSix.users[0].cards.length != 0) {
                            str += " Start round " + (11 - takeSix.users[0].cards.length ) + ".";
                        } else {
                            let tally = takeSix.findMinMax();
                            let min = tally[0];
                            let minNames = tally[1];
                            let max = tally[2];
                            let maxNames = tally[3];

                            if(max >= TakeSix.NUMBER_GOAL){
                                str += "With a score of "+ min +" "+
                                    takeSix.formatNameList(minNames)+ " is/are  the WINNER(S)!!";
                                str += " With a score of "+ max +" "+
                                    takeSix.formatNameList(maxNames)+ " is/are  the LOSER(S)!!";
                            }
                            else {
                                takeSix.reshuffle();
                                str += "With a score of "+ min +" "+
                                    takeSix.formatNameList(minNames)+ " is/are  the leader(s). ";
                                str += " With a score of "+ max +" "+
                                    takeSix.formatNameList(maxNames)+ " is/are  bringing up the rear";
                                str += " The deck will be reshuffle and play will continue."
                            }


                        }
                        packet = preparePacket("message", str);
                        takeSix.broadCastAll(packet);

                    } else {
                        packet = preparePacket("message", "");
                        pkt = preparePacket("message", str + ulst[0].id);

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
                        str = "All players have selected their card for this round. " + takeSix.getUserList()[0].name;
                        takeSix.setAllState(5);

                        packet = preparePacket("message", str);
                        pkt = preparePacket("message", str);

                        takeSix.fillinPacket(takeSix.getUserList()[0].name, pkt);
                        pkt = prepareForPlacement(pkt, takeSix.users[0].currentCard.rank)
                        packet.message = pkt.message;
                        takeSix.broadCastMessage(takeSix.getUserList()[0].name, packet);

                        takeSix.sendCustomPacket(takeSix.getUserList()[0].name, pkt);
                    } else {
                        packet = preparePacket("message", msg.name + " selected a card for this round ");
                        takeSix.broadCastAll(packet);
                    }
                    break;
                case "startingGame":
                    takeSix.setState(msg.name, 2);
                    ulst = takeSix.getByNotState(2);
                    str = "";
                    if (ulst.length == 0) {
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
                    packet = preparePacket("message", str);
                    takeSix.broadCastAll(packet);
                    break;
                case "newUser":

                    let user = takeSix.addUser(connection, msg.name);
                    packet = preparePacket("newUser", "Welcome! Press the Start button when all the players have joined");
                    takeSix.send(msg.name, packet);

                    packet.messageType = "newPlayer";
                    packet.message = msg.name + " is now Playing\n\n";
                    takeSix.broadCastMessage(msg.name, packet);
                    break;
            }

        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function (reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});
