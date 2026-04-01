import config from '/assets/config.json' with { type: 'json' }

export default class Game {
    static _instance;
    static get instance() { return this._instance }

    static CONTAINERS = {
        STOPWATCH: document.querySelector('#root #stopwatch'),
        MINES: document.querySelector('#root #mines-left'),
        FIELD: document.querySelector('#root #game-root')
    }

    static STATES = {
        IDLE: 0,
        ONGOING: 1,
        LOSE: 2,
        WIN: 3
    }

    _doShowMines = false;
    get doShowMines() { return this._doShowMines; }
    set doShowMines(value) {
        this._doShowMines = value;
        this.mines.forEach((mineCell, i) => { 
            setTimeout(() => {
                mineCell.classList.toggle('mine', this._doShowMines === true)                
            }, i * 50);
        });
    }

    _state = Game.STATES.IDLE;
    get state() { return Object.entries(Game.STATES).find(state => state[1] === this._state)[0] }
    set state(value) {
        this._state = value
        if (this._state !== Game.STATES.IDLE) {
            if (this._state == Game.STATES.ONGOING) this.triggerStopwatch(true);
            else {
                this.doShowMines = true;
                this.triggerStopwatch(false);
            }
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
    }

    _minesLeft;
    get minesLeft() { return this._minesLeft }
    set minesLeft(value) {
        this._minesLeft = value;
        Game.CONTAINERS.MINES.innerText = this._minesLeft;
    }

    _mines = [];
    get mines() {
        let arr = [];
        this._mines.forEach(mine => { arr.push(this._findCell(mine.x, mine.y)) })
        return arr;
    }

    _actions = [];
    _preset = { 
        width: config.width.min, 
        height: config.height.min, 
        minesPercent: config.minesPercent.min
    }
    set preset(value) {
        for (const [key, oldValue] of Object.entries(this._preset)) this._preset[key] = value[key];
    } 
    get width() { return this._preset.width }
    get height() { return this._preset.height }
    get minesCount() { return Math.floor(this._preset.width * this._preset.height * this._preset.minesPercent) }

    constructor(preset) {
        this.preset = preset;
        this.cellsLeft = this.width * this.height;
        this.minesLeft = this.minesCount;
        this.state = Game.STATES.ONGOING;
        this._renderField();

        Game._instance = this;
    }
    
    openCell(x, y) {
        let minesAbove, cellElement = this._findCell(x, y);

        if (this._state === Game.STATES.ONGOING) {
            if (this._mines.length < 1) this._generateMines(x, y);
            if (cellElement !== null && (!cellElement.classList.contains('flag') && !cellElement.classList.contains('open'))) {
                cellElement.classList.add('open');

                if (this._checkIsMine(x, y)) this.state = Game.STATES.LOSE;
                else {
                    minesAbove = this._checkNeighbors(x, y);

                    if (minesAbove > 0) cellElement.innerText = minesAbove;
                    else this.getNeighbors(x, y).forEach(neighbor => { this.openCell(neighbor.x, neighbor.y) });
                }
            }
        }
    }

    markCell(x, y) {
        let cellElement = this._findCell(x, y);

        if (this._state === Game.STATES.ONGOING && cellElement !== null && !cellElement.classList.contains('open')) {
            cellElement.classList.toggle('flag', !cellElement.classList.contains('flag'));
            this.minesLeft += cellElement.classList.contains('flag') ? -1 : 1;
        }
    }

    _checkNeighbors(x, y) {
        let minesCount = 0, 
            neighbors = this.getNeighbors(x, y);

        neighbors.forEach(neighbor => { minesCount += this._checkIsMine(neighbor.x, neighbor.y) ? 1 : 0; })
        return minesCount;
    }

    _checkIsMine(x, y) {
        return this._mines.find(pos => pos.x === x && pos.y === y) !== undefined;
    }

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

    getNeighbors(x, y) {
        x = Number(x); y = Number(y);

        let arr = []; 
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                if ((x + i) >= 0 && (x + i) < this.width && (y + j) >= 0 && (y + j) < this.height) {
                    arr.push({ x: x + i, y: y + j });
                }
            }
        }

        return arr.filter(pos => !(pos.x === x && pos.y === y));
    }

    _generateMines(excludeX, excludeY) {
        let x, y, exclude = [...this.getNeighbors(excludeX, excludeY), { x: excludeX, y: excludeY }];
        
        this._mines = [];

        do {
            x = Math.floor(Math.random() * this.width);
            y = Math.floor(Math.random() * this.height);

            if (!this._checkIsMine(x, y) && !exclude.find(pos => pos.x === x && pos.y === y)) this._mines.push({ x: x, y: y });
        } while (this._mines.length < this.minesCount);
    }

    _renderField() {
        let row, cell;
        Game.CONTAINERS.FIELD.innerHTML = '';


        for (let y = 0; y < this.height; y++) {
            setTimeout(() => {
                row = document.createElement('tr'); 
                for (let x = 0; x < this.width; x++) {
                    setTimeout(() => {
                        cell = document.createElement('td');
                        cell.dataset.x = x;
                        cell.dataset.y = y;

                        cell.onclick = e => { this.openCell(Number(e.currentTarget.dataset.x), Number(e.currentTarget.dataset.y)) } 
                        cell.oncontextmenu = e => {
                            e.preventDefault();
                            e.stopImmediatePropagation();

                            this.markCell(Number(e.currentTarget.dataset.x), Number(e.currentTarget.dataset.y));

                            return false;
                        }

                        row.appendChild(cell);
                    }, x * 10)
                }
                Game.CONTAINERS.FIELD.appendChild(row);
            }, y * this.width * 15);
        }
    }

    _findCell(x, y) {
        return Game.CONTAINERS.FIELD.querySelector(`td[data-x="${x}"][data-y="${y}"]`);
    }

    triggerStopwatch(doEnable) {
        if (doEnable) {
            this.secondsPassed = 0;
            if (this._stopwatchInterval !== null) clearInterval(this._stopwatchInterval);

            this._stopwatchInterval = setInterval(() => { this.secondsPassed = this._secondsPassed + 1 }, 1000);
        } else clearInterval(this._stopwatchInterval);
    }
}