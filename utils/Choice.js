class Choice {


    constructor() {
        this.resetState();
    }

    resetBeforeRoll() {
        this.state.choices = [];
        this.state.currentClicks = 0;
        for (let i = 2; i < 13; i++) {
            this.state.diceData[i].currentRoll = [];
        }
    }

    resetState() {
        this.state = {
            dice: [0, 0, 0, 0, 0],
            currentClicks: 0,
            gaitors: [2, 5, 6],
            gaitorData: [],
            choices: [],
            diceState: [
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            ],
            diceData: [
                {
                    count: 0,
                    score: 0,
                    currentRoll: []
                },
                {
                    count: 0,
                    score: 0,
                    currentRoll: []
                },
                {
                    count: 3,  //2
                    score: 0,
                    currentRoll: []
                },
                {
                    count: 0,
                    score: 0,
                    currentRoll: []
                },
                {
                    count: 0,  //4
                    score: 0,
                    currentRoll: []
                },
                {
                    count: 5, //
                    score: 0,
                    currentRoll: []
                },
                {
                    count: 0,
                    score: 0,
                    currentRoll: []
                },
                {
                    count: 0,
                    score: 0,
                    currentRoll: []
                },
                {
                    count: 0,
                    score: 0,
                    currentRoll: []
                },
                {
                    count: 0,
                    score: 0,
                    currentRoll: []
                },
                {
                    count: 0,
                    score: 0,
                    currentRoll: []
                },
                {
                    count: 0,
                    score: 0,
                    currentRoll: []
                },
                {
                    count: 0,
                    score: 0,
                    currentRoll: []
                }
            ]

        }
    }


    isGaitorsFull() {
        return ( this.state.gaitors.length === 3);
    }


    howManyGaitorsInRoll(dice) {
        let cnt = 0;
        for (let item in dice) {
            if (this.isAGaitor(dice[item]))
                cnt++;
        }
        return cnt;
    }


    isAGaitor(d) {
        return ( this.state.gaitors.includes(d));
    }

    setCheckState() {
        let data = this.state.diceData;

        for (let item in data) {
            for (let i = 0; i < data[item].count; i++) {
                this.state.diceState[item][i] = 4;
            }
            for (let i = data[item].count; i < 9; i++) {
                this.state.diceState[item][i] = 0;
            }
        }
    }

    setFirstDieChoices(results) {
        for (let item in results) {
            let data = this.state.diceData[results[item]];
            this.state.diceState[results[item]][data.count] = 2;
        }

    }

    chkPairs(idx1, idx2, results) {
        let d1 = this.state.dice[idx1];
        let d2 = this.state.dice[idx2];
        if (this.isGaitorsFull()) {
            if (this.howManyGaitorsInRoll(this.state.dice) == 1) {
                if (this.isAGaitor(d1) || this.isAGaitor(d2)) {
                    return;
                }
            }
            if (this.howManyGaitorsInRoll(this.state.dice) == 2) {
                if (this.isAGaitor(d1) && this.isAGaitor(d2)) {
                    return;
                }
            }
        }
        if (this.state.diceData[d1 + d2].currentRoll.length == 0) {
            this.state.diceData[d1 + d2].currentRoll.push([idx1, idx2]);
            results.push(d1 + d2);
        } else if (this.state.diceData[d1 + d2].currentRoll.length == 1 &&
            !(this.state.diceData[d1 + d2].currentRoll.includes(idx1) || this.state.diceData[d1 + d2].currentRoll.includes(idx2))) {
            this.state.diceData[d1 + d2].currentRoll.push([idx1, idx2]);
        }


    }

    findLastThree(firstChoice) {
        let res = [];
        for (let i = 0; i < 5; i++) {
            if (firstChoice.includes(i)) {
                continue;
            }
            res.push(i)
        }
        return res;

    }

    chk2ndPairs(d1, d2, d3) {
        let data = this.state.diceData[d1 + d2];
        if (this.isGaitorsFull() && !this.isAGaitor(d3)) {
            return;
        }
        if (this.state.diceState[d1 + d2][data.count] == 3) {
            this.state.diceState[d1 + d2][data.count + 1] = 2;
        } else {
            this.state.diceState[d1 + d2][data.count] = 2;
        }

    }
    undoSecondChoice(val, pos){
        this.state.choices = [];
        this.roll(this.state.dice);
        return this.setSecondDieChoices(val, pos);
    }
    setSecondDieChoices(val, pos) {
        let data = this.state.diceData[val];
        let results = []
        let cr = data.currentRoll;

        if (this.state.diceState[val][pos] == 3) {
            if (this.state.choices.length == 1) {
                this.state.choices = [];
                return this.roll(this.state.dice);
            } else {
                // remove a second choice
                if (val == this.state.choices[0]) {
                    this.state.choices.splice(0, 1);
                } else {
                    this.state.choices.splice(1, 1);
                }
                let v = this.state.choices[0];
                return this.undoSecondChoice(v, this.state.diceData[v].count)

            }
        } else {
            this.state.choices.push(val);

            if ( this.state.choices.length == 1) {
                this.setCheckState();
                this.state.diceState[val][data.count] = 3;
                for (let item in cr) {
                    let indexes = this.findLastThree(cr[item]);
                    this.chk2ndPairs(this.state.dice[indexes[0]], this.state.dice[indexes[1]], this.state.dice[indexes[2]]);
                    this.chk2ndPairs(this.state.dice[indexes[0]], this.state.dice[indexes[2]], this.state.dice[indexes[1]]);
                    this.chk2ndPairs(this.state.dice[indexes[1]], this.state.dice[indexes[2]], this.state.dice[indexes[0]]);
                }
            } else {
                this.setSecondCheckState(val);
            }
        }
        return this.state;

    }
    setSecondCheckState(val) {
        let data = this.state.diceData;
        for (let item in data) {
            for (let i = 0; i < data[item].count; i++) {
                this.state.diceState[item][i] = 4;
            }
            for (let i = data[item].count; i < 9; i++) {
                if (this.state.diceState[item][i] != 3){
                    this.state.diceState[item][i] = 0;
                }
            }

        }
        if (this.state.diceState[val][data[val].count] == 3) {
            this.state.diceState[val][data[val].count + 1] = 3;
        } else {
            this.state.diceState[val][data[val].count] = 3;
        }
    }

    roll(dice) {
        let results = [];
        this.resetBeforeRoll();
        let d = this.state.dice = dice;
        this.chkPairs(0, 1, results);
        this.chkPairs(2, 3, results);
        this.chkPairs(2, 4, results);
        this.chkPairs(3, 4, results);
        this.chkPairs(0, 2, results);
        this.chkPairs(1, 3, results);
        this.chkPairs(1, 4, results);
        this.chkPairs(0, 3, results);
        this.chkPairs(1, 2, results);
        this.chkPairs(0, 4, results);
        this.setCheckState();
        this.setFirstDieChoices(results);
        return this.state;

    }
}

module.exports = {Choice};

