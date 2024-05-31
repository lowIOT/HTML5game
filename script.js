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
        this.gameOver = false;
        this.dropPuyo();
    }

    generatePuyo() {
        const color = colors[Math.floor(Math.random() * colors.length)];
        return new Puyo(color);
    }

    dropPuyo() {
        this.activePuyo.x = Math.floor(COLS / 2);
        this.activePuyo.y = 0;
        if (this.grid[0][this.activePuyo.x]) {
            this.gameOver = true;
        }
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
        if (this.gameOver) {
            alert("Game Over");
            return;
        }

        if (this.activePuyo.y + 1 < ROWS && !this.grid[this.activePuyo.y + 1][this.activePuyo.x]) {
            this.activePuyo.y += 1;
        } else {
            this.grid[this.activePuyo.y][this.activePuyo.x] = this.activePuyo;
            this.checkForMatches();
            this.activePuyo = this.generatePuyo();
            this.dropPuyo();
        }
        this.draw();
    }

    checkForMatches() {
        const toRemove = [];
        const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

        const directions = [
            { x: 0, y: 1 },
            { x: 1, y: 0 },
            { x: 0, y: -1 },
            { x: -1, y: 0 }
        ];

        const dfs = (x, y, color) => {
            const stack = [{ x, y }];
            const cells = [];

            while (stack.length) {
                const { x, y } = stack.pop();
                if (x < 0 || x >= COLS || y < 0 || y >= ROWS || visited[y][x] || !this.grid[y][x] || this.grid[y][x].color !== color) {
                    continue;
                }
                visited[y][x] = true;
                cells.push({ x, y });
                directions.forEach(dir => stack.push({ x: x + dir.x, y: y + dir.y }));
            }

            return cells;
        };

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (this.grid[row][col] && !visited[row][col]) {
                    const cells = dfs(col, row, this.grid[row][col].color);
                    if (cells.length >= 4) {
                        toRemove.push(...cells);
                    }
                }
            }
        }

        toRemove.forEach(({ x, y }) => {
            this.grid[y][x] = null;
        });

        this.applyGravity();
    }

    applyGravity() {
        for (let col = 0; col < COLS; col++) {
            for (let row = ROWS - 1; row >= 0; row--) {
                if (!this.grid[row][col]) {
                    for (let k = row - 1; k >= 0; k--) {
                        if (this.grid[k][col]) {
                            this.grid[row][col] = this.grid[k][col];
                            this.grid[k][col] = null;
                            break;
                        }
                    }
                }
            }
        }
    }

    start() {
        setInterval(() => this.update(), 500);
    }
}

const game = new Game();
game.start();
