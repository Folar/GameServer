class Choice {


    constructor() {
        this.users = [];
        this.watchers = [];
        this.choiceData = this.prepareChoicePacket();
        this.choiceStarted = false;


    }
    setChoiceStarted (f){
        this.choiceStarted = f;
    }
    hasChoiceStarted (){
        return this.choiceStarted;
    }
    formatNameList(ulst) {
        let cnt = 1;
        let str = "";
        for (let item in ulst) {
            str = str + ulst[item]
            if (cnt != ulst.length) {
                str = str + ", ";
            } else {
                str = str;
            }
            cnt++;

        }
        return str;
    }
    removeAllConnections(){
        let lst = this.users;
        this.closeSockets(lst);
        lst = this.watchers;
        this.closeSockets(lst);
        this.watchers = [];
        this.users = [];
        this.choiceData = this.prepareChoicePacket();

    }

    static get CHOICE_DELAY() {
        return  2000;
    }


    formatNameList(ulst) {
        let cnt = 1;
        let str = "";
        for (let item in ulst) {
            str = str + ulst[item]
            if (cnt != ulst.length) {
                str = str + ", ";
            } else {
                str = str;
            }
            cnt++;

        }
        return str;
    }

    nextRound(){

    }



    chkForDuplicateName(n) {
        let ulst = this.users;
        for (let item in ulst) {
            if (ulst[item].name == n) {
                return true;
            }
        }
        return false;
    }

    findMinMax() {
        let min = 20000;
        let max = -10000;
        let minNames = [];
        let maxNames = [];
        let ulst = this.users;
        for (let item in ulst) {
            if (ulst[item].score < min) {
                min = ulst[item].score;
                minNames = [];
                minNames.push(ulst[item].name);
            } else if (ulst[item].score == min) {
                minNames.push(ulst[item].name)
            }
            if (ulst[item].score > max) {
                max = ulst[item].score;
                maxNames = [];
                maxNames.push(ulst[item].name);
            } else if (ulst[item].score == max) {
                maxNames.push(ulst[item].name)
            }
        }
        return [min, minNames, max, maxNames];
    }




    getCurrentPacket(){
        return this.choiceData;
    }
    setChoicePacket(type, message,buttonText) {

        this.choiceData.type = type;
        this.choiceData.message = message;
        this.choiceData.players = this.getUserList();
        this.choiceData.buttonText= buttonText;
        return  this.choiceData;
    }

    prepareChoicePacket() {
        return {
            messageType: 0,
            message: "",
            dice:   {die1:'F',die2:'O',die3:'L',die4:'A',die5:'R'},
            players: [],
            currentIndex:0,
            startIndex:0,
            buttonText:"Start",
            buttonShow:true,
          
        }
    }
 


    addUser(connection, name) {
        var user = {
            connection: connection,
            name: name,
            score:0,
            done:false,
            confirm:false,
            playing: false
        };
        this.users.push(user);
        return user;
    }

    addWatchers(connection, name) {
        var user = {
            connection: connection,
            name: name,
            playing: false
        };
        this.watchers.push(user);
        return user;
    }

    removeUser(id) {
        var user = this.getUser(id);

        if (user) {
            this.users = this.users.filter((user) => user.name !== id);

        }

        return user;
    }

 




    stopPlaying(id) {
        this.users.filter((user) => user.name === id)[0].playing = false;

    }

  



    closeSockets(lst) {
        lst.map((u) => {
            u.connection.close();
        });
    }

    sendPacket(lst, packet) {
        lst.map((u) => {
            packet.state = u.state;
            packet.users = this.getUserList();
            u.connection.send(JSON.stringify(packet));
        });
    }


    sendToAll(id, packet){
        this.send(id, packet);
        packet.buttonText = "";
        packet.buttonText2 = "";
        this.broadCastMessage(id, packet);
    }

    broadCastAll(packet) {
        let lst = this.users;
        this.sendPacket(lst, packet);
        lst = this.watchers;
        this.sendPacket(lst, packet);
    }

    sendCustomPacket(id, packet) {
        let u = this.users.filter((user) => user.name === id)[0];
        u.connection.send(JSON.stringify(packet));
    }
    getPlaying(){
        return this.users.filter((user) => user.playing == true);
    }
    getNonPlaying(){
        return this.users.filter((user) => user.playing !== true);
    }


    getDone(){
        return this.users.filter((user) => user.done == true);
    }

    getNotDone(){
        return this.users.filter((user) => user.done != true);
    }

    getConfirmed(){
        return this.users.filter((user) => user.confirm == true);
    }

    getConfirmedNotDone(){
        return this.users.filter((user) => user.confirm == true && user.done != true);
    }
    getNotConfirmed(){
        return this.users.filter((user) => user.confirm != true);
    }
    setDone(id){
        let lst = this.users.filter((user) => user.name === id);
        lst[0].done = true;
    }
    setConfirm(id){
        let lst = this.users.filter((user) => user.name === id);
        lst[0].confirm = true;
    }

    setPlay(id){
        let lst = this.users.filter((user) => user.name === id);
        lst[0].playing = true;
    }
    send(id, packet) {
        let lst = this.users.filter((user) => user.name === id);
        this.sendPacket(lst, packet);
    }

    sendWatcher(id, packet) {
        let lst = this.watchers.filter((user) => user.name === id);
        this.sendPacket(lst, packet);
    }
    broadCastMessage(id, packet) {
        let lst = this.users.filter((user) => user.name !== id);
        this.sendPacket(lst, packet);
        lst = this.watchers;
        this.sendPacket(lst, packet);
    }
  
    getUser(id) {
        return this.users.filter((user) => user.name === id)[0]
    }

    getUserList() {
        var namesArray = this.users.map((user) => {
            return {
                name: user.name,
                score: user.score,
                confirm: user.confirm,
                done:user.done,
                playing:user.playing
            };
        });

        return namesArray;
    }

}

module.exports = {Choice};

