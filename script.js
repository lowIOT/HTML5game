const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const COLS = 6;
const ROWS = 12;
const PUYO_SIZE = 32;

const colors = ['red', 'green', 'blue', 'yellow', 'purple'];

class Puyo {
    constructor(color) {
        this.color = color;
        this.x = 0;
        this.y = 0;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x * PUYO_SIZE, this.y * PUYO_SIZE, PUYO_SIZE, PUYO_SIZE);
    }
}

class Game {
    constructor() {
        this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
        this.activePuyo = this.generatePuyo();
        this.dropPuyo();
    }

    generatePuyo() {
        const color = colors[Math.floor(Math.random() * colors.length)];
        return new Puyo(color);
    }

    dropPuyo() {
        this.activePuyo.x = Math.floor(COLS / 2);
        this.activePuyo.y = 0;
        this.draw();
    }

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (this.grid[row][col]) {
                    this.grid[row][col].draw();
                }
            }
        }
        this.activePuyo.draw();
    }

    update() {
        if (this.activePuyo.y + 1 < ROWS && !this.grid[this.activePuyo.y + 1][this.activePuyo.x]) {
            this.activePuyo.y += 1;
        } else {
            this.grid[this.activePuyo.y][this.activePuyo.x] = this.activePuyo;
            this.activePuyo = this.generatePuyo();
            this.dropPuyo();
        }
        this.draw();
    }

    start() {
        setInterval(() => this.update(), 500);
    }
}

const game = new Game();
game.start();
