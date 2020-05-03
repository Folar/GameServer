var WebSocketServer = require('websocket').server;
var http = require('http');
const {TakeSix} = require('./../utils/TakeSix.js');
const {BocaDice} = require('./../utils/BocaDice.js');
const {Diver} = require('./../utils/Diver.js');
const {DiverActions} = require('./DiverActions.js');
const {BocaActions} = require('./BocaActions.js');
const {TakeSixActions} = require('./TakeSixActions.js');
const {Choice} = require('./../utils/Choice.js');
const {ChoiceActions} = require('./ChoiceActions.js');
const {GameBoard} = require('./objects/GameBoard.js');
const {Acquire} = require('./../utils/Acquire.js');
const {Pan} = require('./../utils/Pan.js');
const {PanActions} = require('./PanActions.js');

let acquire = new Acquire();
let gameBoard = new GameBoard(acquire);

let takeSix = new TakeSix();
let takeSixActions = new TakeSixActions(takeSix);

let bocaDice = new BocaDice();
let bocaActions = new BocaActions(bocaDice);

let diver = new Diver();
let diverActions = new DiverActions(diver);

let choice = new Choice();
let choiceActions = new ChoiceActions(choice);

let pan = new Pan();
let panActions = new PanActions(pan);

var deck = new Array();
myTimer = null;

const port = process.env.PORT || 9081;


var server = http.createServer(function (request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(port, function () {
    console.log((new Date()) + ' Server is listening on port ' + port);
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


    let canReset = true;

    function restartGame() {
        canReset = false;
        console.log("start of restartgame");


        let packet = takeSixActions.prepareTakeSixPacket("message", "There has been no game activity for " + TakeSix.NUMBER_TlME_WARN
            + " minutes.The Game Server has been restarted. Reload FolarGames in your browser");
        takeSix.setTakeSixStarted(false);
        takeSix.broadCastAll(packet);
        takeSix.removeAllConnections();

        packet = acquire.setAcquirePacket("message", "There has been no game activity for " + TakeSix.NUMBER_TlME_WARN
            + " minutes.The Game Server has been restarted. Reload FolarGames in your browser", "Reload");
        acquire.setAcquireStarted(false);
        acquire.broadCastAll(packet);
        acquire.removeAllConnections();

        packet = pan.setPanPacket("message", "There has been no game activity for " + TakeSix.NUMBER_TlME_WARN
            + " minutes.The Game Server has been restarted. Reload FolarGames in your browser", "Reload");
        pan.setPanStarted(false);
        pan.broadCastAll(packet);
        pan.removeAllConnections();

        packet = choice.setChoicePacket("message", "There has been no game activity for " + TakeSix.NUMBER_TlME_WARN
            + " minutes.The Game Server has been restarted. Reload FolarGames in your browser", "Reload");
        choice.setChoiceStarted(false);
        choice.broadCastAll(packet);
        choice.removeAllConnections();

        packet = bocaDice.setBocaDicePacket("message", "There has been no game activity for " + TakeSix.NUMBER_TlME_WARN
            + " minutes.The Game Server has been restarted. Reload FolarGames in your browser", "Reload");
        bocaDice.setBocaStarted(false);
        bocaDice.broadCastAll(packet);
        bocaDice.removeAllConnections();

        diver.setDiverStarted(false);
        packet = diver.setDiverPacket("message", "There has been no game activity for " + TakeSix.NUMBER_TlME_WARN
            + " minutes.The Game Server has been restarted. Reload FolarGames in your browser", "Reload", "");

        diver.broadCastAll(packet);
        diver.removeAllConnections();
        if (myTimer != null) {
            clearTimeout(myTimer);
        }
        myTimer = null;
        canReset = true;
        console.log("end of restartgame");
    }

    function resetTimer() {
        if (!canReset) {
            console.log("no of reset timer")
            return;
        }

        if (myTimer != null) {
            clearTimeout(myTimer);
        }
        myTimer = setTimeout(restartGame, 60000 * TakeSix.NUMBER_TlME_WARN);

    }

    let payload = "";
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function (message) {
        if (message.type === 'utf8') {

            msg = JSON.parse(message.utf8Data);
            let lst = takeSix.getUserList();
            let packet = null;
            let pkt = null;
            let ulst;
            let str;
            resetTimer();
            console.log("testing  name=" + msg.name+ " action="+msg.action);
            switch (msg.type) {
                case "PAN":
                    panActions.processMsg(msg);
                    break;
                case "ACQ":
                    gameBoard.processMsg(msg);
                    break;
                case "BOCA":
                    bocaActions.bocaCmd(msg);
                    break;
                case "DIVER":
                    diverActions.diverCmd(msg);
                    break;
                case "TAKE6":
                    takeSixActions.take6Cmd(msg);
                    break;
                case "CHOICE":
                    choiceActions.choiceCmd(msg);
                    break

                case "restartTake6":
                    restartGame();
                    break;


                case "newUser":

                    switch (msg.gameType) {
                        case 2:
                            if (takeSix.chkForDuplicateName(msg.name)) {
                                packet = takeSixActions.prepareTakeSixPacket("dupUser", msg.name + " has already signed on, please choose another");
                                connection.send(JSON.stringify(packet));
                                break;
                            } else {
                                let user = null
                                if (takeSix.hasTakeSixStarted()) {
                                    user = takeSix.addWatchers(connection, msg.name);
                                    packet = takeSixActions.prepareTakeSixPacket("newWatcher", "The game has already started, but you can still watch the game");
                                    takeSix.sendWatcher(msg.name, packet);

                                } else if (takeSix.users.length == TakeSix.NUMBER_PLAYERS) {
                                    user = takeSix.addWatchers(connection, msg.name);
                                    packet = takeSixActions.prepareTakeSixPacket("newWatcher", "The game has already has " + TakeSix.NUMBER_PLAYERS +
                                        " players, but you can still watch the game");
                                    takeSix.sendWatcher(msg.name, packet);
                                } else {
                                    user = takeSix.addUser(connection, msg.name);
                                    packet = takeSixActions.prepareTakeSixPacket("newUser", "Welcome! Press the Start button when all the players have joined");
                                    takeSix.send(msg.name, packet);
                                    packet.reanimate = true;
                                    packet.messageType = "newPlayer";
                                    packet.message = msg.name + " is now Playing\n\n";
                                    takeSix.broadCastMessage(msg.name, packet);
                                }
                            }
                            break;

                        case 3:
                            if (choice.chkForDuplicateName(msg.name)) {
                                packet = choice.setChoicePacket("dupUser",
                                    msg.name + " has already signed on, please choose another", "");
                                packet.messageType = "dupUser";
                                connection.send(JSON.stringify(packet));
                                break;
                            } else {
                                let user = null
                                if (choice.hasChoiceStarted()) {
                                    user = choice.addWatchers(connection, msg.name);
                                    packet = choice.setChoicePacket("newWatcher",
                                        "The game has already started, but you can still watch the game", "");
                                    choice.sendWatcher(msg.name, packet);

                                } else {
                                    user = choice.addUser(connection, msg.name);

                                    packet = choice.setChoicePacket("newUser",
                                        "Welcome! Press the Start button when all the players have joined", "Start");
                                    packet.messageType = "newPlayer";
                                    choice.send(msg.name, packet);
                                    packet.messageType = "newPlayer";
                                    packet.message = msg.name + " is now Playing\n\n";
                                    choice.broadCastMessage(msg.name, packet);
                                }
                            }
                            break;


                        case 4:
                            if (bocaDice.chkForDuplicateName(msg.name)) {
                                packet = bocaDice.prepareBocaDicePacket("dupUser", msg.name + " has already signed on, please choose another");

                                packet.messageType = "dupUser";
                                connection.send(JSON.stringify(packet));
                                break;
                            } else {
                                let user = null
                                if (bocaDice.hasBocaStarted()) {
                                    user = bocaDice.addWatchers(connection, msg.name);
                                    packet = bocaDice.setBocaDicePacket("newWatcher", "The game has already started, but you can still watch the game", "");
                                    packet.messageType = "newWatcher";
                                    bocaDice.sendWatcher(msg.name, packet);

                                } else if (bocaDice.users.length == BocaDice.NUMBER_PLAYERS) {
                                    user = bocaDice.addWatchers(connection, msg.name);
                                    packet = bocaDice.setBocaDicePacket("newWatcher", "The game has already has " + BocaDice.NUMBER_PLAYERS +
                                        " players, but you can still watch the game", "");
                                    bocaDice.sendWatcher(msg.name, packet);
                                } else {
                                    user = bocaDice.addUser(connection, msg.name);
                                    packet = bocaDice.setBocaDicePacket("newUser",
                                        "Welcome! Press the Start button when all the players have joined",
                                        "Start");
                                    bocaDice.send(msg.name, packet);
                                    packet.messageType = "newPlayer";
                                    packet.message = msg.name + " is now Playing\n\n";
                                    bocaDice.broadCastMessage(msg.name, packet);
                                }
                            }
                            break;
                        case 5:
                            if (diver.chkForDuplicateName(msg.name)) {
                                packet = diver.prepareDiverPacket("dupUser", msg.name + " has already signed on, please choose another", "");

                                packet.messageType = "dupUser";
                                connection.send(JSON.stringify(packet));
                                break;
                            } else {
                                let user = null
                                if (diver.hasDiverStarted()) {
                                    user = diver.addWatchers(connection, msg.name);
                                    packet = diver.setDiverPacket("newWatcher", "The game has already started, but you can still watch the game", "", "");
                                    packet.messageType = "newWatcher";
                                    diver.sendWatcher(msg.name, packet);

                                } else if (diver.users.length == diver.NUMBER_PLAYERS) {
                                    user = diver.addWatchers(connection, msg.name);
                                    packet = diver.setdiverPacket("newWatcher", "The game has already has " + diver.NUMBER_PLAYERS +
                                        " players, but you can still watch the game", "", "");
                                    diver.sendWatcher(msg.name, packet);
                                } else {
                                    user = diver.addUser(connection, msg.name);
                                    packet = diver.setDiverPacket("newUser",
                                        "Welcome! Press the Start button when all the players have joined",
                                        "Start", "");
                                    diver.send(msg.name, packet);
                                    packet.messageType = "newPlayer";
                                    packet.message = msg.name + " is now Playing\n\n";
                                    diver.broadCastMessage(msg.name, packet);
                                }
                            }
                            break;
                        case 6:
                            if (acquire.chkForDuplicateName(msg.name)) {
                                if (acquire.chkForReconnect(msg.name) == -1) {
                                    packet = acquire.prepareAcquirePacket("dupUser", msg.name + " has already signed on, please choose another", "");

                                    packet.messageType = "dupUser";
                                    connection.send(JSON.stringify(packet));
                                } else {
                                    acquire.reconnectUser(connection, msg.name);

                                }
                                break;
                            } else {
                                let user = null
                                if (acquire.hasAcquireStarted()) {
                                    user = acquire.addWatchers(connection, msg.name);
                                    packet = acquire.setAcquirePacket("newWatcher", "The game has already started, but you can still watch the game", "", "");
                                    packet.messageType = "newWatcher";
                                    acquire.sendWatcher(msg.name, packet);

                                } else if (acquire.users.length == Acquire.NUMBER_PLAYERS) {
                                    user = acquire.addWatchers(connection, msg.name);

                                    packet = acquire.setAcquirePacket("newWatcher",
                                        "The game has already has " + Acquire.NUMBER_PLAYERS +
                                        " players, but you can still watch the game", "");
                                    packet.messageType = "newWatcher";
                                    acquire.sendWatcher(msg.name, packet);
                                } else {
                                    user = acquire.addUser(connection, msg.name);
                                    packet = acquire.setAcquirePacket("newUser", "",
                                        "xxx",
                                        "Start");
                                    acquire.send(msg.name, packet);
                                    packet.messageType = "newPlayer";
                                    packet.instructions = "";
                                    packet.message = msg.name + " is now Playing\n\n";
                                    acquire.broadCastMessage(msg.name, packet);
                                }
                            }
                            break;

                        case 7:
                            if (pan.chkForDuplicateName(msg.name)) {
                                if (pan.chkForReconnect(msg.name) == -1) {
                                    packet = pan.preparePanPacket("dupUser", msg.name + " has already signed on, please choose another", "");

                                    packet.messageType = "dupUser";
                                    connection.send(JSON.stringify(packet));
                                } else {
                                    pan.reconnectUser(connection, msg.name);

                                }
                                break;
                            } else {
                                let user = null
                                if (pan.hasPanStarted()) {
                                    user = pan.addWatchers(connection, msg.name);
                                    packet = pan.setPanPacket("newWatcher", "The game has already started, but you can still watch the game", "", "");
                                    packet.messageType = "newWatcher";
                                    pan.sendWatcher(msg.name, packet);

                                } else if (pan.users.length == Pan.NUMBER_PLAYERS) {
                                    user = pan.addWatchers(connection, msg.name);

                                    packet = pan.setPanPacket("newWatcher",
                                        "The game has already has " + Pan.NUMBER_PLAYERS +
                                        " players, but you can still watch the game", "");
                                    packet.messageType = "newWatcher";
                                    pan.sendWatcher(msg.name, packet);
                                } else {
                                    user = pan.addUser(connection, msg.name);
                                    packet = pan.setPanPacket("newUser", "Welcome to Panguingue",
                                        "xxx",
                                        "Start");
                                    pan.send(msg.name, packet,false);
                                    packet.messageType = "newPlayer";
                                    packet.instructions = "";
                                    packet.journal = msg.name + " is now Playing";
                                    packet = pan.setPanPacket("newUser",  msg.name + " is now Playing",
                                        "xxx",
                                        "Start");
                                    pan.broadCastMessage(msg.name, packet);
                                }
                            }
                            break;
                    }


                    break;
            }

        } else if (message.type === 'binary') {
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
        acquire.lookForDropConnection();
        pan.lookForDropConnection();
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});
