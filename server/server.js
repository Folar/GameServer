var WebSocketServer = require('websocket').server;
var http = require('http');
const {TakeSix} = require('./../utils/TakeSix.js');

takeSix = new TakeSix();
var deck = new Array();

var values = [
    1, 1, 1, 1, 2, 1, 1, 1, 1,
    3, 5, 1, 1, 1, 2, 1, 1, 1, 1,
    3, 1, 5, 1, 1, 2, 1, 1, 1, 1, //2
    3, 1, 1, 5, 1, 2, 1, 1, 1, 1,
    3, 1, 1, 1, 5, 2, 1, 1, 1, 1, //4
    3, 1, 1, 1, 1, 7, 1, 1, 1, 1,
    3, 1, 1, 1, 1, 2, 5, 1, 1, 1, // 6
    1, 1, 1, 1, 1, 2, 1, 5, 1, 1,
    3, 1, 1, 1, 1, 2, 1, 1, 5, 1, //8
    3, 1, 1, 1, 1, 2, 1, 1, 1, 5, //9
    3, 1, 1, 1
];


function getDeck() {
    var deck = new Array();

    for (var i = 0; i < values.length; i++) {
        var card = {value: values[i], rank: i + 1,state:0};
        deck.push(card);
    }

    return deck;
}

function shuffle() {
    // for 1000 turns
    // switch the values of two random cards
    for (var i = 0; i < 1000; i++) {
        var location1 = Math.floor((Math.random() * deck.length));
        var location2 = Math.floor((Math.random() * deck.length));
        var tmp = deck[location1];

        deck[location1] = deck[location2];
        deck[location2] = tmp;
    }
}

function getOneCard() {
    // remove top card from deck
    var card = deck[deck.length - 1];
    deck.splice(deck.length - 1, 1);
    return card;
}

deck = getDeck();
shuffle();
let row1 = [getOneCard()];
let row2 = [getOneCard()];
let row3 = [getOneCard()];
let row4 = [getOneCard()];


takeSix.addCardRows(row1, row2, row3, row4);

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

    function preparePacket(type, message, userCards) {
        return {
            messageType: type,
            cards: {},
            row1: row1,
            row2: row2,
            row3: row3,
            row4: row4,
            message: message,
            state:0,
            users: takeSix.getUserList()
        }
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
            let ulst;
            let str;
            switch (msg.type) {
                case "selectCard":
                    takeSix.setState(msg.name,4) ;
                    takeSix.removeCard(msg.name,msg.card.rank);
                    ulst = takeSix.getByNotState(4);
                    if (ulst.length== 0){
                        takeSix.sortUsersByCardRank();
                        str = "All players have selected their card for this round. " +
                        takeSix.getUserList()[0].name +" places their card first";
                        takeSix.setAllState(5) ;
                        packet = preparePacket("message", str );
                    }else {
                        packet = preparePacket("message", msg.name + " selected a card for this round ");
                    }
                    takeSix.broadCastAll(packet);
                    break;
                case "startingGame":
                    takeSix.setState(msg.name,2) ;
                    ulst = takeSix.getByNotState(2);
                    str = "";
                    if (ulst.length== 0){
                        str = "Let the games begin! Select your first Card";
                        takeSix.setAllState(3) ;

                    }else {
                        str = "Wating for "
                        let cnt = 1;
                        for (let item in ulst) {
                            str = str + ulst[item].id;
                            if (cnt != ulst.length) {
                                str = str + ", ";
                            } else {
                                str = str + " to click Start";
                            }
                            cnt++;

                        }
                    }
                    packet = preparePacket("message", str);
                    takeSix.broadCastAll(packet);
                    break;
                case "newUser":
                    let userCards = [];
                    for (i = 0; i < 10; i++) {
                        userCards.push(getOneCard());
                    }
                    let user = takeSix.addUser(connection, msg.name, userCards);
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
