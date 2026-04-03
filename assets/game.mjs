import config from './config.json' with { type: 'json' }

export default class Game {
    static _instance;
    static get instance() { return this._instance }

    static CONTAINERS = {
        STATE:  document.querySelector('#root #mine-pic'),
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

    _generationTimeouts = [];

    _doShowMines = false;
    get doShowMines() { return this._doShowMines; }
    set doShowMines(value) {
        this._doShowMines = value;
        this.mines.forEach((mineCell, i) => { 
            setTimeout(() => {
                mineCell.classList.toggle('mine', this._doShowMines === true)
                mineCell.classList.toggle('win', this._state == Game.STATES.WIN);
            }, i * 50);
        });
    }

    _state = Game.STATES.IDLE;
    get state() { return Object.entries(Game.STATES).find(state => state[1] === this._state)[0] }
    set state(value) {
        this._state = value
        if (this._state !== Game.STATES.IDLE) {
            if (this._state == Game.STATES.ONGOING) {
                this.triggerStopwatch(true);
                Game.CONTAINERS.STATE.classList.remove('finish', 'win', 'lose');
            } else {
                this.doShowMines = true;
                this.triggerStopwatch(false);
                this._generationTimeouts.forEach(timeout => { clearTimeout(timeout) });

                Game.CONTAINERS.STATE.classList.add('finish', this._state == Game.STATES.WIN ? 'win' : 'lose');   
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
        this.cellsLeft = this.width * this.height - this.minesCount;
        this.minesLeft = this.minesCount;
        this.state = Game.STATES.ONGOING;
        this._renderField();

        Game._instance = this;
    }
    
    openCell(x, y, isAccordion = false) {
        let minesAbove, flagsAbove, cellElement = this._findCell(x, y);

        if (this._state === Game.STATES.ONGOING) {
            if (this._mines.length < 1) this._generateMines(x, y);
            if (cellElement !== null) {
                [minesAbove, flagsAbove] = this._checkNeighbors(x, y);
                if (!cellElement.classList.contains('flag') && !cellElement.classList.contains('open')) {
                    cellElement.classList.add('open');

                    if (this._checkIsMine(x, y)) this.state = Game.STATES.LOSE;
                    else {
                        this.cellsLeft--;

                        if (minesAbove == 0) this.getNeighbors(x, y).forEach(neighbor => { this.openCell(neighbor.x, neighbor.y, true) })
                        else {
                            cellElement.innerText = minesAbove;
                            switch (minesAbove) {
                                case 1: cellElement.style.color = '#35bfa0'; break;
                                case 2: cellElement.style.color = '#43bf35'; break;
                                case 3: cellElement.style.color = '#d9d51e'; break;
                                case 4: cellElement.style.color = '#dd9b45'; break;
                                case 5: cellElement.style.color = '#ff0000'; break;
                                case 6: cellElement.style.color = '#ff0097'; break;
                                case 7: cellElement.style.color = '#da00ff'; break;
                                case 8: cellElement.style.color = '#390983'; break;
                            }
                        }

                        if (this.cellsLeft == 0) this.state = Game.STATES.WIN;
                    }
                } else if (isAccordion == false && cellElement.classList.contains('open') && flagsAbove == minesAbove) {
                    this.getNeighbors(x, y).forEach(neighbor => { this.openCell(neighbor.x, neighbor.y, true) });
                } else if (isAccordion == false && cellElement.classList.contains('open') && flagsAbove != minesAbove) {
                    this.getNeighbors(x, y).forEach(neighbor => { 
                        let neighborCell = this._findCell(neighbor.x, neighbor.y)
                        if (!neighborCell.classList.contains('open') && !neighborCell.classList.contains('flag')) {
                            neighborCell.classList.add('blink');
                            setTimeout(() => { neighborCell.classList.remove('blink') }, 200)
                        }
                    });
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
            flagsCount = 0,
            neighbors = this.getNeighbors(x, y);

        neighbors.forEach(neighbor => { 
            flagsCount += this._findCell(neighbor.x, neighbor.y).classList.contains('flag') ? 1 : 0; 
            minesCount += this._checkIsMine(neighbor.x, neighbor.y) ? 1 : 0;
        })

        return [minesCount, flagsCount];
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
            this._generationTimeouts.push(setTimeout(() => {
                row = document.createElement('tr'); 
                for (let x = 0; x < this.width; x++) {
                    this._generationTimeouts.push(setTimeout(() => {
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
                    }, x * 10))
                }
                Game.CONTAINERS.FIELD.appendChild(row);
            }, y * this.width * 15));
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