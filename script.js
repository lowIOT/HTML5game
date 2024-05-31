const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

const COLS = 6;
const ROWS = 12;
const PUYO_SIZE = 32;

const colors = ['red', 'green', 'blue', 'yellow', 'purple'];

// 音楽と効果音のファイル
const bgm = new Audio('bgm.mp3'); // BGMファイルのパス
const popSound = new Audio('pop.mp3'); // 効果音ファイルのパス

class Puyo {
    constructor(color) {
        this.color = color;
        this.x = 0;
        this.y = 0;
    }

    // ぷよをキャンバスに描画
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x * PUYO_SIZE, this.y * PUYO_SIZE, PUYO_SIZE, PUYO_SIZE);
    }
}

class PuyoPair {
    constructor(puyo1, puyo2) {
        this.puyo1 = puyo1;
        this.puyo2 = puyo2;
        this.rotationState = 0; // 0: 上, 1: 右, 2: 下, 3: 左
    }

    // ぷよペアを描画
    draw() {
        this.puyo1.draw();
        this.puyo2.draw();
    }

    // ぷよペアの回転処理
    rotate(grid) {
        const { x, y } = this.puyo1;
        const newPositions = [
            { x: x, y: y - 1 }, // 上
            { x: x + 1, y: y }, // 右
            { x: x, y: y + 1 }, // 下
            { x: x - 1, y: y }  // 左
        ];
        const newPos = newPositions[(this.rotationState + 1) % 4];
        if (newPos.x >= 0 && newPos.x < COLS && newPos.y >= 0 && newPos.y < ROWS && !grid[newPos.y][newPos.x]) {
            this.puyo2.x = newPos.x;
            this.puyo2.y = newPos.y;
            this.rotationState = (this.rotationState + 1) % 4;
        }
    }
}

class Game {
    constructor() {
        this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
        this.activePuyoPair = this.generatePuyoPair();
        this.gameOver = false;
        this.score = 0;
        this.dropPuyoPair();
        this.setupControls();
        this.startBGM();
    }

    // BGMの再生
    startBGM() {
        bgm.loop = true;
        bgm.play();
    }

    // 新しいぷよペアを生成
    generatePuyoPair() {
        const puyo1 = new Puyo(colors[Math.floor(Math.random() * colors.length)]);
        const puyo2 = new Puyo(colors[Math.floor(Math.random() * colors.length)]);
        return new PuyoPair(puyo1, puyo2);
    }

    // ぷよペアをグリッド上にドロップ
    dropPuyoPair() {
        this.activePuyoPair.puyo1.x = Math.floor(COLS / 2);
        this.activePuyoPair.puyo1.y = 0;
        this.activePuyoPair.puyo2.x = Math.floor(COLS / 2);
        this.activePuyoPair.puyo2.y = 1;
        if (this.grid[0][this.activePuyoPair.puyo1.x] || this.grid[1][this.activePuyoPair.puyo2.x]) {
            this.gameOver = true;
        }
        this.draw();
    }

    // キャンバスに全てのぷよを描画
    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (this.grid[row][col]) {
                    this.grid[row][col].draw();
                }
            }
        }
        this.activePuyoPair.draw();
    }

    // ゲームの更新処理
    update() {
        if (this.gameOver) {
            alert("Game Over");
            bgm.pause();
            return;
        }

        if (this.canMoveDown()) {
            this.activePuyoPair.puyo1.y += 1;
            this.activePuyoPair.puyo2.y += 1;
        } else {
            this.placePuyoPair();
            this.checkForMatches();
            this.activePuyoPair = this.generatePuyoPair();
            this.dropPuyoPair();
        }
        this.draw();
    }

    // ぷよペアが下に移動できるかチェック
    canMoveDown() {
        const { puyo1, puyo2 } = this.activePuyoPair;
        return (
            puyo1.y + 1 < ROWS && !this.grid[puyo1.y + 1][puyo1.x] &&
            puyo2.y + 1 < ROWS && !this.grid[puyo2.y + 1][puyo2.x]
        );
    }

    // ぷよペアをグリッドに配置
    placePuyoPair() {
        const { puyo1, puyo2 } = this.activePuyoPair;
        this.grid[puyo1.y][puyo1.x] = puyo1;
        this.grid[puyo2.y][puyo2.x] = puyo2;
    }

    // 連結されたぷよをチェック
    checkForMatches() {
        const toRemove = [];
        const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

        const directions = [
            { x: 0, y: 1 },
            { x: 1, y: 0 },
            { x: 0, y: -1 },
            { x: -1, y: 0 }
        ];

        // 深さ優先探索で連結を確認
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

        // 連結ぷよを探して消去
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

        // 効果音再生
        if (toRemove.length > 0) {
            popSound.play();
        }

        // 連結ぷよをグリッドから消去
        toRemove.forEach(({ x, y }) => {
            this.grid[y][x] = null;
        });

        this.updateScore(toRemove.length);
        this.applyGravity();
    }

    // ぷよが消えた後の重力処理
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

    // スコアの更新
    updateScore(numRemoved) {
        const points = numRemoved * 10; // 10点/ぷよ
        this.score += points;
        scoreElement.textContent = `Score: ${this.score}`;
    }

    // キーボード入力の設定
    setupControls() {
        document.addEventListener('keydown', (event) => {
            if (this.gameOver) return;

            switch (event.key) {
                case 'ArrowLeft':
                    if (this.canMoveLeft()) {
                        this.activePuyoPair.puyo1.x -= 1;
                        this.activePuyoPair.puyo2.x -= 1;
                    }
                    break;
                case 'ArrowRight':
                    if (this.canMoveRight()) {
                        this.activePuyoPair.puyo1.x += 1;
                        this.activePuyoPair.puyo2.x += 1;
                    }
                    break;
                case 'ArrowDown':
                    if (this.canMoveDown()) {
                        this.activePuyoPair.puyo1.y += 1;
                        this.activePuyoPair.puyo2.y += 1;
                    }
                    break;
                case ' ':
                    this.activePuyoPair.rotate(this.grid);
                    break;
            }
            this.draw();
        });
    }

    // ぷよが左に移動できるかチェック
    canMoveLeft() {
        const { puyo1, puyo2 } = this.activePuyoPair;
        return (
            puyo1.x > 0 && !this.grid[puyo1.y][puyo1.x - 1] &&
            puyo2.x > 0 && !this.grid[puyo2.y][puyo2.x - 1]
        );
    }

    // ぷよが右に移動できるかチェック
    canMoveRight() {
        const { puyo1, puyo2 } = this.activePuyoPair;
        return (
            puyo1.x < COLS - 1 && !this.grid[puyo1.y][puyo1.x + 1] &&
            puyo2.x < COLS - 1 && !this.grid[puyo2.y][puyo2.x + 1]
        );
    }

    // ゲームの開始
    start() {
        setInterval(() => this.update(), 500);
    }
}

const game = new Game();
game.start();

// ゲーム操作方法
// - 左矢印キー: ぷよペアを左に移動
// - 右矢印キー: ぷよペアを右に移動
// - 下矢印キー: ぷよペアを下に早く移動
// - スペースキー: ぷよペアを回転
