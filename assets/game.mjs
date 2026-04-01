import config from '/assets/config.json' with { type: 'json' }

export default class Game {
    static CONTAINERS = {
        STOPWATCH: document.querySelector('#root #stopwatch'),
        CELLS: document.querySelector('#root #cells-left'),
        MINES: document.querySelector('#root #mines-left'),
    }

    static STATES = {
        IDLE: 0,
        ONGOING: 1,
        LOSE: 2,
        WIN: 3
    }

    _state;
    get state() { return Object.entries(Game.STATES).find(state => state[1] === this._state)[0] }
    set state(value) {
        this._state = value
        if (this._state !== Game.STATES.IDLE) {
            if (this._state == Game.STATES.ONGOING) this.triggerStopwatch(true);
            else this.triggerStopwatch(false);
        }
    }

    _stopwatchInterval;
    _secondsPassed = 0;

    get secondsPassed() {
        let seconds, minutes, hours;
        seconds = String(this._secondsPassed % 60).padStart(2,0);
        minutes = String(Math.floor(this._secondsPassed / 60)).padStart(2,0);
        hours = String(Math.floor(minutes / 60)).padStart(2,0);

        return `${hours == '00' ? '' : `${hours}:`}${minutes}:${seconds}`;
    }

    set secondsPassed(value) {
        this._secondsPassed = value;
        Game.CONTAINERS.STOPWATCH.innerText = this.secondsPassed;
    }

    _cellsLeft;
    get cellsLeft() { return this._cellsLeft }
    set cellsLeft(value) {
        this._cellsLeft = value;
        Game.CONTAINERS.CELLS.innerText = this._cellsLeft;
    }

    _minesLeft;
    get minesLeft() { return this._minesLeft }
    set minesLeft(value) {
        this._minesLeft = value;
        Game.CONTAINERS.MINES.innerText = this._minesLeft;
    }

    _mines;
    _actions = [];
    _preset = { width, height, minesPercent }
    set preset(value) {
        for (const [key, value] of Object.entries(this._preset)) this._preset[key] = value[key];
    } 

    constructor(preset) {
        this.preset = preset;
    }
    
    openCell(x, y) { }

    static generatePreset() {
        let preset = { };
        const randomize = (min, max, doRoundPrecision = false) => { 
            let result = Math.random() * (max - min) + min;
            return doRoundPrecision ? Math.precisionRound(result, 2) : Math.round(result);
        }

        preset.width = randomize(config.width.min, config.width.max);
        preset.height = randomize(config.height.min, config.height.max);
        preset.minesPercent = randomize(config.minesPercent.min, config.minesPercent.max, true);
        
        return preset;
    }

    generateMines(excludeX, excludeY) {

    }

    triggerStopwatch(doEnable) {
        if (doEnable) {
            if (this._stopwatchInterval !== null) {
                clearInterval(this._stopwatchInterval);
                this.secondsPassed = 0;
            }

            this._stopwatchInterval = setInterval(() => { this.secondsPassed++ }, 1000);
        } else clearInterval(this._stopwatchInterval);
    }
}