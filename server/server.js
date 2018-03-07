var WebSocketServer = require('websocket').server;
var http = require('http');


var deck = new Array();

var values = [
    1, 1, 2, 1, 5, 1, 1, 3, 1, 1,
    1, 1, 2, 1, 5, 1, 1, 3, 1, 1,
    1, 1, 2, 1, 5, 1, 1, 3, 1, 1, //2
    1, 1, 2, 1, 5, 1, 1, 3, 1, 1,
    1, 1, 2, 1, 5, 1, 1, 3, 1, 1, //4
    1, 1, 2, 1, 5, 1, 1, 3, 1, 1,
    1, 1, 2, 1, 5, 1, 1, 3, 1, 1, // 6
    1, 1, 2, 1, 5, 1, 1, 3, 1, 1,
    1, 1, 2, 1, 5, 1, 1, 3, 1, 1, //8
    1, 1, 2, 1, 5, 1, 1, 3, 1, 1, //9
    1, 1, 2, 1
];


function getDeck()
{
    var deck = new Array();

        for(var i = 0; i < values.length; i++)
        {
            var card = {value: values[i], rank: i+1};
            deck.push(card);
        }

    return deck;
}

function shuffle()
{
    // for 1000 turns
    // switch the values of two random cards
    for (var i = 0; i < 1000; i++)
    {
        var location1 = Math.floor((Math.random() * deck.length));
        var location2 = Math.floor((Math.random() * deck.length));
        var tmp = deck[location1];

        deck[location1] = deck[location2];
        deck[location2] = tmp;
    }
}

function getOneCard()
{
    // remove top card from deck
    var card = deck[deck.length-1];
    deck.splice(deck.length-1, 1);
    return card;
}

deck = getDeck();
shuffle();

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(9081, function() {
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
 
wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('xReceived Message: ' + JSON.parse( message.utf8Data));
            connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});
