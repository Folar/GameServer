const {PanPlayer} = require('./objects/PanPlayer.js');
const {PanCard} = require('./objects/PanCard.js');


class PanActions {


    constructor(pan) {
        this.pan= pan;
        this.deck = [];
        this.deckIndex = 0;
        this.players = [];
        this.current = 0;
        this.playerNum = 0;
        this.gameState = PanActions.OTHER;

        this.currentPlayer = 0;

        this.playing = false;
        this.gameStarted = false;

        this.lastAnte = 0;
        this.panStarted = false;


        this.lostPlayers = [];
        this.stopProcessing = false;
        this.lastCmd = "";
        this.initDeck();
        pan.setPanActions(this);
    }

    static get OTHER() {
        return 0
    };
    static get FIRST_PLAYER_DRAW() {
        return 1
    };

    static get DRAW() {
        return 2
    };

    static get PICKUP() {
        return 3
    };


    static get PLAY_AND_MUCK() {
        return 4
    };

    static get PICKUP_OR_DRAW() {
        return 5
    };

    static get FIRST_PLAYER_PICKUP_OR_DRAW() {
        return 6
    };

    static get PASS() {
        return 7
    };

    static get FORFEIT() {
        return 8
    };

    static get ERROR() {
        return 9
    };

    static get WAITING() {
        return 10
    };

    static get MOVE() {
        return 11
    };

    static get START() {
        return 100;
    }

    static get ANTE() {
        return 101;
    }
    static get FIRST_ANTE() {
        return 102;
    }

    static get DEAL() {
        return 103;
    }

    static get GAMEOVER() {
        return 110;
    }

    static get TOPS() {
        return 1;
    }

    getGameState() {
        return this.gameState;
    }

    setGameState(s) {
        this.gameState = s;
    }



    lostConnection(players) {
        this.lostPlayers = players;

        if(this.currentPlayer  == undefined ||this.currentPlayer <0 || this.players[this.currentPlayer].name == undefined) {
            console.log("XXX in lostConnection this.currentPlayer ="+ this.currentPlayer);
            console.log(JSON.stringify(this.players));
            pan.removeAllConnections();
            return;
        }
        let str = "Everyone is reconnected, "+this.players[this.currentPlayer].name +" may resume play"
        if (this.lostPlayers.length != 0) {
            let p = this.pan.formatNameList(players);
            this.stopProcessing = true;
            str = p + " has lost their connections please wait";
        } else {
            this.stopProcessing = false;
        }
        let packet = this.pan.setPanPacket("playerStart", str, "");
        this.pan.broadCastAll(packet);

    }



    initDeck() {
        this.deck = [];
        this.deckIndex =0;
        for (let i = 0; i < 40; i++) {
            let k = [];
            for (let j = 0; j < 8; j++) {
                this.deck.push(new PanCard(i))
            }
        }

       // this.shuffle();

    }

    shuffle() {
        // for 1000 turns
        // switch the values of two random cards
        for (let i = 0; i < 8000; i++) {
            let location1 = Math.floor((Math.random() * this.deck.length));
            let location2 = Math.floor((Math.random() * this.deck.length));
            let tmp = this.deck[location1];
            this.deck[location1] = this.deck[location2];
            this.deck[location2] = tmp;
        }
    }




    getPlayer(id) {
        return this.players.filter((player) => player.name === id)[0];
    }

    processMsg(cmd) {
        if (this.stopProcessing) {
            console.log(" WWWW stop process");
            return;
        }
        if (this.lastCmd == JSON.stringify(cmd)){
            console.log("dup command " + cmd.name);
            return;
        }
        this.lastCmd = JSON.stringify(cmd)



        switch (cmd.action) {
            case PanActions.START:
                this.lostPlayers = [];
                return this.startPlayer(cmd);

            case PanActions.DRAW:
                return this.draw(cmd);

            case PanActions.PICKUP:
                return this.pickup(cmd);

            case PanActions.PASS:
                return this.pass(cmd);

            case PanActions.PLAY_AND_MUCK:
                return this.muck(cmd);

            case PanActions.MOVE:
                return this.move(cmd)

            case PanActions.ERROR:
                return this.error(cmd);

            case PanActions.FORFEIT:
                return this.forfeit(cmd);

            case PanActions.ANTE:
                return this.ante(cmd);

            case PanActions.DEAL:
                return this.deal(cmd)
        }
        return null;
    }
    transfer(target, source) {
        target.suit = source.suit;
        target.rank = source.rank;
        target.ordinal = source.ordinal;
        target.rankOrdinal = source.rankOrdinal
    }

    getCardString(c){
        let suit ="";
        let rank = "";

        switch (c.suit) {
            case 's':
                suit = "Spades";
                break;
            case 'h':
                suit = "Hearts";
                break;
            case 'd':
                suit = "Diamonds";
                break;
            case 'c':
                suit = "Clubs";
                break;
        }
        rank = c.rank;
        switch (c.rank) {
            case 1:
                rank = "Ace";
                break;
            case 11:
                rank = "Jack";
                break;
            case 12:
                rank = "Queen";
                break;
            case 13:
                rank = "King";
                break;
        }
        return rank + " of " + suit;
    }
    draw(msg){
        let c = this.pickACard();
        let str = msg.name+" draws the " + this.getCardString(c);
        if (msg.args.firstDraw){
            str =  msg.name+ " makes the first draw of " + this.getCardString(c);
        }
        let packet = this.pan.setPanPacket("draw", str, "");
        let lst = this.players.filter((player) => player.name === msg.name);
        let p = lst[0];
        p.state = msg.args.newState;
        p.hand = msg.args.hand;
        p.cards = msg.args.cards;
        packet.currentCard =  JSON.parse(JSON.stringify(c));    // fix BUG
        this.pan.broadCastAll(packet);
    }
    pickup(msg){
        let  c = this.pan.getCurrentPacket().currentCard;
        if(c.rank == 'card_back')
            c = this.pan.getCurrentPacket().passCard
        let packet = this.pan.setPanPacket("pickup", msg.name +" picks up the " + this.getCardString(c), "");
        let lst = this.players.filter((player) => player.name === msg.name);
        let p = lst[0];
        p.state = msg.args.newState;
        p.hand = msg.args.hand;
        p.cards = msg.args.cards;
        packet.currentCard.rank = 'card_back';
        packet.currentCard.suit = '';

        this.pan.broadCastAll(packet);
    }

    examineDeck(){
        for (let i = 0;i<this.deck.length;i++){
            if(this.deck[i].suit.length == 0)
                debugger;
        }
    }
    pass(msg) {
        let packet = this.pan.getCurrentPacket();

        this.transfer(packet.passCard, packet.currentCard);
        packet.currentCard.rank = 'card_back';
        packet.currentCard.suit = '';
        //this.examineDeck();

        let lst = this.players.filter((player) => player.name === msg.name);
        let p = lst[0];
        p.hand = msg.args.hand;
        p.cards = msg.args.cards;
        p.state = 0;
        this.nextPlayer(packet,5);
        let cards = this.players[packet.currentPlayer].cards;

        packet.journal = this.players[packet.currentPlayer].name + " can pickup the " + this.getCardString(packet.passCard) +
            " or draw a card from the deck\n\n" +msg.name + " passes the " + this.getCardString(packet.passCard) + " to " +
            this.players[packet.currentPlayer].name ;
        ;
        this.createDropSpot(cards);
        this.pan.broadCastAll(packet);
    }

    move(msg) {
        let packet = this.pan.getCurrentPacket();

        let lst = this.players.filter((player) => player.name === msg.name);
        let p = lst[0];
        p.hand = msg.args.hand;
        p.cards = msg.args.cards;
        this.pan.broadCastAll(packet);
    }

    error(msg) {
        let packet = this.pan.getCurrentPacket();

        let lst = this.players.filter((player) => player.name === msg.name);
        let p = lst[0];
        p.hand = msg.args.hand;
        p.cards = msg.args.cards;
        this.players[packet.currentPlayer].state = 8;
        packet.journal = msg.name +" has the illegal melds: "+ msg.args.txt ;
        this.pan.broadCastAll(packet);
    }
    nextPlayer(packet,state,chkForSitOutOrForfeit = true){
        do {
            packet.currentPlayer++
            if (packet.currentPlayer == packet.players.length)
                packet.currentPlayer = 0;
            if( chkForSitOutOrForfeit &&( this.players[packet.currentPlayer].sitOut || this.players[packet.currentPlayer].forfeit) )
                continue;
            this.players[packet.currentPlayer].state = state;
            this.currentPlayer = packet.currentPlayer;
            break;
        } while (true);
    }

    forfeit(msg) {
        let packet = this.pan.getCurrentPacket();

        packet.currentCard.rank = 'card_back';
        packet.currentCard.suit = '';
        let money = 0;
        let lst = this.players.filter((player) => player.name === msg.name);
        let p = lst[0];
        p.hand = msg.args.hand;
        p.cards = msg.args.cards;
        p.state = 0;
        p.forfeit = true;
        let cnt = 0;
        let cnt2 =0;
        let lastPlayer = 0;
        if(this.players.length>1){ // 1 only for testing
            cnt = -1;
            for(let j = 0;j<this.players.length;j++){
                if( !this.players[j].sitOut){
                    cnt++;
                    if( !this.players[j].forfeit){
                        cnt2++;
                        lastPlayer = j;
                    }

                }
            }



            money = Math.floor(p.current/cnt);
            let others = this.players.filter((player) => player.name != msg.name);
            for(let i = 0;i<others.length;i++){
                if( !others[i].sitOut) {
                    if(!others[i].forfeit) {
                        others[i].total += money;
                        others[i].round += money;
                    } else {
                        packet.kitty += money;
                    }
                }
            }

        }
        p.total -= money *  cnt;
        p.round -= p.current;
        p.current =0;
        if(cnt2 == 1){
            return this.makePan(packet,this.players[lastPlayer], "\n"+this.players[lastPlayer].name +
                " WINS the ROUND because everyone else has forfeit.\n","\n"+ msg.name +" refunds everyone "+ money + " chip(s)") ;

        }
        this.nextPlayer(packet,2);

        packet.journal = "\n"+msg.name +" refunds everyone "+ money + " chip(s)" ;

        this.pan.broadCastAll(packet);
    }


    makePan(packet,player,txt,postTxt = ""){
        let  str ="";
        let money = 0;
        player.winner = true;
        for (let i = 0;i<player.cards.length;i++){
            if ( player.cards[i].money == 0)
                continue;
            str += player.cards[i].str + " is worth " + player.cards[i].money;
            if(i!= player.cards.length-1)
                str += "\n";
            money += player.cards[i].money;
        }
        if(money) {
            str ="\nAll players must pay "+ player.name +" for the following conditions:\n"+ str;
            str = str+ "\nEveryone should pay " + player.name + " " + money + " chip(s)\n";
            let others = this.players.filter((p) => p.name != player.name);
            let cnt = 0;

            for(let i = 0;i<others.length;i++){
                if (others[i].sitOut) continue;
                cnt++;
                others[i].total -= money;
                others[i].round -= money;
            }


            player.total += money * cnt;
            player.current += money * cnt;
            player.round += money * cnt;
        }
        player.total += packet.kitty;
        player.round += packet.kitty;
        str =  str +"\n" + player.name + " collects "+ packet.kitty + " chips from the kitty.";
        if(postTxt.length>0)
            str +="\n";
        packet.kitty = 0;
        packet.winner =  player.playerId;
        packet.currentPlayer = packet.dealer;
        this.currentPlayer = packet.dealer;
        this.nextPlayer(packet,PanActions.DEAL,false);
        packet.dealer = this.currentPlayer;
        str = this.removeDoubleReturns(txt +str) ;
        if(postTxt.length>0)
            str = str +postTxt;
        packet = this.pan.setPanPacket("ante",str, "");
        this.pan.broadCastAll(packet);
    }
    removeDoubleReturns(str){
        let strA =  str.split("");
        let trg = strA[0];

        for(let i = 1;i<str.length;i++){
            if(strA[i-1] == strA[i] && strA[i] == '\n') continue;
            trg += strA[i];
        }
        return trg;

    }

    muck(msg) {
        let packet = this.pan.getCurrentPacket();

        packet.currentCard.rank = 'card_back';
        packet.currentCard.suit = '';

        let lst = this.players.filter((player) => player.name === msg.name);
        let p = lst[0];
        p.hand = msg.args.hand;
        p.cards = msg.args.cards;
        p.state = 0;

        let money =  msg.args.money;
        let others = this.players.filter((player) => player.name != msg.name);
        let cnt = 0;

        for(let i = 0;i<others.length;i++){
            if (others[i].sitOut) continue;
            cnt++;
            others[i].total -= money;
            others[i].round -= money;
        }


        p.total += money * cnt;
        p.current += money *  cnt;
        p.round += money *  cnt;
        msg.args.txt  = msg.args.txt.slice(0,-1);
        msg.args.txt = msg.args.txt.replace(/;/g, "\n");
        msg.args.txt = this.removeDoubleReturns(msg.args.txt);
        if(msg.args.pan){

            return this.makePan(packet,p,msg.name +" has PAN!! While making  "+ msg.args.txt);
        }
        this.nextPlayer(packet,2);



        packet.journal = "\n"+msg.name +" has made "+ msg.args.txt;


        this.pan.broadCastAll(packet);
    }

    createDropSpot(cards) {

        if (cards.length > 0 && cards[cards.length - 1].money == -1)
            return;
        cards.push({
            str:"",
            group: cards.length,
            sels: [false, false, false, false, false, false, false, false, false, false],
            money: -1,
            error:false,
            cards: [
                {
                    rank: "empty"
                }
            ]

        });
    }
    setPlay(id) {
        let lst = this.players.filter((player) => player.name === id);
        let p = lst[0];
        p.state = PanActions.WAITING;
        p.playing = true;
    }

    getNonPlaying() {
        return this.players.filter((player) => player.playing !== true);
    }

    getPlaying() {
        return this.players.filter((player) => player.playing === true);
    }
    resetPlayers(){
        for(let i= 0;i<this.players.length;i++){
            this.players[i].resetPlayer();
        }
    }
    ante(msg){

        let str ;
        let lst = this.players.filter((player) => player.name === msg.name);
        let p = lst[0];
        p.state = 0;
        p.hand = msg.args.hand;
        p.cards = msg.args.cards;
        let packet = this.pan.getCurrentPacket();

        if(msg.args.play){
            if (msg.args.oldState == PanActions.ANTE){
                packet.kitty += PanActions.TOPS;
                p.total -= PanActions.TOPS;
                p.round -= PanActions.TOPS;
                this.lastAnte = p.playerId;
            }
            str =  "\n" +msg.name +" has chosen to play this round. ";

        }else{
            p.sitOut = true;
            str = "\n" + msg.name +" has chosen to sit out this round. ";
            let cnt = 0;
            for(let i= 0;i<this.players.length;i++){
                if(!this.players[i].sitOut){
                    cnt++;
                }
            }
            if(cnt == 0){
                this.resetPlayers();
                packet.currentPlayer = 0;
                this.players[0].state = PanActions.FIRST_ANTE;
                this.nextPlayer(packet,PanActions.FIRST_ANTE);
                packet.dealer = 0;
                packet.kitty = PanActions.TOPS;
                this.players[0].total += PanActions.TOPS;
                this.players[0].total -= PanActions.TOPS;
                this.players[0].round -= PanActions.TOPS;
                this.lastAnte = 0;

                str = this.players[packet.currentPlayer].name + " will redeal, since only 1 player wants to play.\n" + str;
                packet = this.pan.setPanPacket("ante",str, "");
                this.pan.broadCastAll(packet);
                return;
            }
            if( cnt == 1) { //redeal
                this.resetPlayers();
                packet.currentPlayer = packet.dealer;
                this.currentPlayer = packet.dealer;
                this.nextPlayer(packet,PanActions.FIRST_ANTE);
                packet.dealer = this.currentPlayer;
                packet.kitty = PanActions.TOPS;
                this.players[this.lastAnte].total += PanActions.TOPS;
                this.players[this.currentPlayer].total -= PanActions.TOPS;
                this.players[this.currentPlayer].round -= PanActions.TOPS;
                this.lastAnte = this.currentPlayer;

                str = this.players[packet.currentPlayer].name + " will redeal, since only 1 player wants to play.\n" + str;
                packet = this.pan.setPanPacket("ante",str, "");
                this.pan.broadCastAll(packet);
                return;
            }
        }

        this.nextPlayer(packet,PanActions.ANTE,false);
        if(this.currentPlayer == packet.dealer){
            packet.currentPlayer = packet.winner;
            this.currentPlayer = packet.winner;

                if( this.players[packet.currentPlayer].sitOut){
                    this.nextPlayer(packet,1)
                }
                str = this.players[packet.currentPlayer].name + " can now start by drawing a card.\n" + str;
                this.players[packet.currentPlayer].state = PanActions.FIRST_PLAYER_DRAW
        } else {
            str = this.players[packet.currentPlayer].name + " can now decide if he/she wants to play.\n" + str;

        }
        packet = this.pan.setPanPacket("ante",str, "");
        this.pan.broadCastAll(packet);
    }


    deal(msg){
        let packet = this.pan.getCurrentPacket();
        this.resetPlayers();
        this.players[packet.currentPlayer].state = PanActions.FIRST_ANTE;
        packet.kitty = PanActions.TOPS;
        this.players[this.currentPlayer].total -= PanActions.TOPS;
        this.players[this.currentPlayer].round -= PanActions.TOPS;
        this.lastAnte = this.currentPlayer;
        packet = this.pan.setPanPacket("ante",this.players[this.currentPlayer].name+ " started the next round. ", "");
        this.pan.broadCastAll(packet);
    }

    startPlayer(msg) {
        this.setPlay(msg.name);
        let ulst = this.getNonPlaying();

        let str = "";
        if (ulst.length == 0) {
            this.pan.setPanStarted(true);
            let players = this.getPlaying();
            let num = Math.floor(Math.random() * players.length);

            str = "Let the games begin! " +
                players[num].name + " was randomly chosen to bid and deal first. "+ players[num].name + " puts in the tops of "+
                PanActions.TOPS + " chips";
            let packet = this.pan.setPanPacket("playerStart", str, "");

            this.currentPlayer = num;
            packet.dealer = num;
            packet.winner = num;
            for(let i = 0;i<players.length;i++)
                players[i].state = 0;
            players[num].state = PanActions.FIRST_ANTE;
            players[num].total -= PanActions.TOPS;
            packet.kitty = PanActions.TOPS;
            this.players[this.currentPlayer].round -= PanActions.TOPS;
            this.lastAnte = this.currentPlayer;
            this.pan.broadCastAll(packet);

        } else {
            str = "Waiting for "
            let cnt = 1;
            let names = [];
            for (let item in ulst) {
                names.push(ulst[item].name);
            }
            str += this.pan.formatNameList(names) + " to click Start";
            let packet = this.pan.setPanPacket("playerStart", str, "");
            this.pan.broadCastAll(packet);
        }
    }

    pickACard() {
        if (this.deckIndex == 280){
            console.log("YYYYY reset index");
            this.deckIndex =0;
        }
        let i=Math.floor( Math.random()* (320 - this.deckIndex));

        let tmp = this.deck[this.deckIndex];
        this.deck[this.deckIndex] = this.deck[i+this.deckIndex];
        this.deck[i+this.deckIndex] = tmp;


        return this.deck[this.deckIndex++];
    }

}

module.exports = {PanActions};