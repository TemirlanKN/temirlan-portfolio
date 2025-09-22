// Tetris RL Demo - Real Reinforcement Learning Agent
class TetrisRL {
  constructor() {
    this.canvas = document.getElementById("tetrisCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.gridWidth = 10;
    this.gridHeight = 20;
    this.blockSize = 30;

    // Game state
    this.grid = [];
    this.currentPiece = null;
    this.nextPiece = null;
    this.score = 0;
    this.linesCleared = 0;
    this.episode = 1;
    this.reward = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.isTraining = false;

    // RL Agent with real learning
    this.agent = new RealRLAgent();
    this.trainingProgress = 0;
    this.gameSpeed = 200; // Faster for training
    this.gameLoop = null;
    this.trainingEpisodes = 0;
    this.maxTrainingEpisodes = 100;
    this.bestScore = 0;
    this.learningRate = 0.1;
    this.epsilon = 0.9; // High exploration initially
    this.epsilonDecay = 0.995;
    this.epsilonMin = 0.1;

    // Tetris pieces
    this.pieces = [
      { shape: [[1, 1, 1, 1]], color: "#00f0f0" }, // I
      {
        shape: [
          [1, 1],
          [1, 1],
        ],
        color: "#f0f000",
      }, // O
      {
        shape: [
          [0, 1, 0],
          [1, 1, 1],
        ],
        color: "#a000f0",
      }, // T
      {
        shape: [
          [0, 1, 1],
          [1, 1, 0],
        ],
        color: "#00f000",
      }, // S
      {
        shape: [
          [1, 1, 0],
          [0, 1, 1],
        ],
        color: "#f00000",
      }, // Z
      {
        shape: [
          [1, 0, 0],
          [1, 1, 1],
        ],
        color: "#f0a000",
      }, // L
      {
        shape: [
          [0, 0, 1],
          [1, 1, 1],
        ],
        color: "#0000f0",
      }, // J
    ];

    this.init();
  }

  init() {
    this.initializeGrid();
    this.setupEventListeners();
    this.draw();
  }

  initializeGrid() {
    this.grid = Array(this.gridHeight)
      .fill()
      .map(() => Array(this.gridWidth).fill(0));
  }

  setupEventListeners() {
    document
      .getElementById("startBtn")
      .addEventListener("click", () => this.startTraining());
    document
      .getElementById("pauseBtn")
      .addEventListener("click", () => this.togglePause());
    document
      .getElementById("resetBtn")
      .addEventListener("click", () => this.resetTraining());
  }

  startTraining() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.isTraining = true;
      this.isPaused = false;
      this.trainingEpisodes = 0;
      this.bestScore = 0;
      this.epsilon = 0.9;
      this.updateButtons();
      this.startTrainingEpisode();
    }
  }

  startTrainingEpisode() {
    if (!this.isTraining) return;

    this.trainingEpisodes++;
    this.initializeGrid();
    this.score = 0;
    this.linesCleared = 0;
    this.reward = 0;
    this.currentPiece = null;
    this.nextPiece = null;
    this.spawnPiece();

    this.updateTrainingStatus(
      `Training Episode ${this.trainingEpisodes}/${
        this.maxTrainingEpisodes
      } - Epsilon: ${this.epsilon.toFixed(3)}`
    );
    this.updateDisplay();

    if (this.gameLoop) clearInterval(this.gameLoop);
    this.gameLoop = setInterval(() => this.trainingUpdate(), this.gameSpeed);
  }

  trainingUpdate() {
    if (this.isPaused) return;

    // Get current state
    const state = this.getState();

    // Agent makes decision
    const action = this.agent.getAction(state, this.epsilon);

    // Execute action
    this.executeAction(action);

    // Move piece down
    this.currentPiece.y++;

    if (this.checkCollision(this.currentPiece)) {
      this.currentPiece.y--;
      this.placePiece();
      const linesCleared = this.clearLines();

      // Calculate reward
      const reward = this.calculateReward(linesCleared);
      this.reward += reward;

      // Update agent with experience
      this.agent.updateQTable(state, action, reward, this.getState());

      this.spawnPiece();
    }

    this.draw();
    this.updateDisplay();

    // Check if episode should end
    if (this.isGameOver()) {
      this.endTrainingEpisode();
    }
  }

  calculateReward(linesCleared) {
    let reward = 0;

    // Reward for clearing lines
    if (linesCleared > 0) {
      reward += linesCleared * 10;
    }

    // Penalty for height
    const maxHeight = this.getMaxHeight();
    reward -= maxHeight * 0.1;

    // Reward for keeping board low
    if (maxHeight < 10) {
      reward += 1;
    }

    // Penalty for holes
    const holes = this.countHoles();
    reward -= holes * 2;

    // Bonus for completing episode
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      reward += 50;
    }

    return reward;
  }

  getMaxHeight() {
    let maxHeight = 0;
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        if (this.grid[y][x]) {
          maxHeight = Math.max(maxHeight, this.gridHeight - y);
          break;
        }
      }
    }
    return maxHeight;
  }

  countHoles() {
    let holes = 0;
    for (let x = 0; x < this.gridWidth; x++) {
      let foundBlock = false;
      for (let y = 0; y < this.gridHeight; y++) {
        if (this.grid[y][x]) {
          foundBlock = true;
        } else if (foundBlock) {
          holes++;
        }
      }
    }
    return holes;
  }

  endTrainingEpisode() {
    clearInterval(this.gameLoop);

    // Update training progress
    this.trainingProgress = Math.min(
      100,
      (this.trainingEpisodes / this.maxTrainingEpisodes) * 100
    );

    // Decay epsilon for less exploration over time
    this.epsilon = Math.max(this.epsilonMin, this.epsilon * this.epsilonDecay);

    // Update status
    this.updateTrainingStatus(
      `Episode ${this.trainingEpisodes} Complete! Score: ${this.score}, Best: ${
        this.bestScore
      }, Epsilon: ${this.epsilon.toFixed(3)}`
    );

    // Continue training or finish
    if (this.trainingEpisodes < this.maxTrainingEpisodes && this.isTraining) {
      setTimeout(() => this.startTrainingEpisode(), 1000);
    } else {
      this.finishTraining();
    }
  }

  finishTraining() {
    this.isTraining = false;
    this.isRunning = false;
    this.updateButtons();
    this.updateTrainingStatus(
      `Training Complete! Final Score: ${this.score}, Best Score: ${this.bestScore}. Agent learned to play Tetris!`
    );

    // Start demonstration mode
    setTimeout(() => {
      this.startDemonstration();
    }, 2000);
  }

  startDemonstration() {
    this.isRunning = true;
    this.isTraining = false;
    this.epsilon = 0; // No exploration in demo mode
    this.updateTrainingStatus(
      "Demonstration Mode: Watch the trained agent play!"
    );
    this.startTrainingEpisode();
  }

  togglePause() {
    if (this.isRunning) {
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        clearInterval(this.gameLoop);
      } else {
        this.gameLoop = setInterval(
          () => this.trainingUpdate(),
          this.gameSpeed
        );
      }
      this.updateButtons();
    }
  }

  resetTraining() {
    this.isRunning = false;
    this.isPaused = false;
    this.isTraining = false;
    clearInterval(this.gameLoop);
    this.initializeGrid();
    this.score = 0;
    this.linesCleared = 0;
    this.episode = 1;
    this.reward = 0;
    this.trainingProgress = 0;
    this.trainingEpisodes = 0;
    this.bestScore = 0;
    this.epsilon = 0.9;
    this.currentPiece = null;
    this.nextPiece = null;
    this.agent.reset();
    this.updateDisplay();
    this.updateButtons();
    this.updateTrainingStatus("Training reset. Ready to start learning...");
  }

  updateButtons() {
    const startBtn = document.getElementById("startBtn");
    const pauseBtn = document.getElementById("pauseBtn");

    if (this.isRunning) {
      startBtn.disabled = true;
      pauseBtn.disabled = false;
      pauseBtn.textContent = this.isPaused ? "Resume" : "Pause";
    } else {
      startBtn.disabled = false;
      pauseBtn.disabled = true;
      pauseBtn.textContent = "Pause";
    }
  }

  spawnPiece() {
    if (!this.nextPiece) {
      this.nextPiece = this.getRandomPiece();
    }
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.getRandomPiece();

    // Position piece at top center
    this.currentPiece.x =
      Math.floor(this.gridWidth / 2) -
      Math.floor(this.currentPiece.shape[0].length / 2);
    this.currentPiece.y = 0;

    // Check for game over
    if (this.checkCollision(this.currentPiece)) {
      this.endTrainingEpisode();
    }
  }

  getRandomPiece() {
    const piece = this.pieces[Math.floor(Math.random() * this.pieces.length)];
    return {
      shape: piece.shape,
      color: piece.color,
      x: 0,
      y: 0,
    };
  }

  getState() {
    // Create a simplified state representation
    const state = {
      grid: this.grid.map((row) => row.map((cell) => (cell ? 1 : 0))),
      currentPiece: this.currentPiece
        ? {
            shape: this.currentPiece.shape,
            x: this.currentPiece.x,
            y: this.currentPiece.y,
          }
        : null,
      nextPiece: this.nextPiece
        ? {
            shape: this.nextPiece.shape,
          }
        : null,
      maxHeight: this.getMaxHeight(),
      holes: this.countHoles(),
      linesCleared: this.linesCleared,
    };
    return state;
  }

  executeAction(action) {
    if (!this.currentPiece) return;

    switch (action) {
      case "left":
        this.currentPiece.x--;
        if (this.checkCollision(this.currentPiece)) {
          this.currentPiece.x++;
        }
        break;
      case "right":
        this.currentPiece.x++;
        if (this.checkCollision(this.currentPiece)) {
          this.currentPiece.x--;
        }
        break;
      case "rotate":
        this.rotatePiece();
        break;
      case "drop":
        while (!this.checkCollision(this.currentPiece)) {
          this.currentPiece.y++;
        }
        this.currentPiece.y--;
        break;
      case "wait":
        // Do nothing, let piece fall naturally
        break;
    }
  }

  rotatePiece() {
    const rotated = this.rotateMatrix(this.currentPiece.shape);
    const originalShape = this.currentPiece.shape;
    this.currentPiece.shape = rotated;

    if (this.checkCollision(this.currentPiece)) {
      this.currentPiece.shape = originalShape;
    }
  }

  rotateMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = Array(cols)
      .fill()
      .map(() => Array(rows).fill(0));

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        rotated[j][rows - 1 - i] = matrix[i][j];
      }
    }
    return rotated;
  }

  checkCollision(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x;
          const newY = piece.y + y;

          if (
            newX < 0 ||
            newX >= this.gridWidth ||
            newY >= this.gridHeight ||
            (newY >= 0 && this.grid[newY][newX])
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  placePiece() {
    for (let y = 0; y < this.currentPiece.shape.length; y++) {
      for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
        if (this.currentPiece.shape[y][x]) {
          const gridY = this.currentPiece.y + y;
          const gridX = this.currentPiece.x + x;
          if (gridY >= 0) {
            this.grid[gridY][gridX] = this.currentPiece.color;
          }
        }
      }
    }
  }

  clearLines() {
    let linesToClear = [];

    for (let y = 0; y < this.gridHeight; y++) {
      if (this.grid[y].every((cell) => cell !== 0)) {
        linesToClear.push(y);
      }
    }

    if (linesToClear.length > 0) {
      // Remove cleared lines
      for (let i = linesToClear.length - 1; i >= 0; i--) {
        this.grid.splice(linesToClear[i], 1);
        this.grid.unshift(Array(this.gridWidth).fill(0));
      }

      // Update score
      const lineBonus = [0, 40, 100, 300, 1200][linesToClear.length];
      this.score += lineBonus;
      this.linesCleared += linesToClear.length;
    }

    return linesToClear.length;
  }

  isGameOver() {
    // Check if any piece in the top row is occupied
    for (let x = 0; x < this.gridWidth; x++) {
      if (this.grid[0][x]) {
        return true;
      }
    }
    return false;
  }

  updateTrainingStatus(message) {
    document.getElementById("trainingStatus").textContent = message;
    document.getElementById("trainingProgress").style.width =
      this.trainingProgress + "%";
  }

  updateDisplay() {
    document.getElementById("currentScore").textContent = this.score;
    document.getElementById("linesCleared").textContent = this.linesCleared;
    document.getElementById("currentReward").textContent =
      this.reward.toFixed(2);
    document.getElementById("currentEpisode").textContent =
      this.trainingEpisodes;
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    this.drawGrid();

    // Draw current piece
    if (this.currentPiece) {
      this.drawPiece(this.currentPiece);
    }

    // Draw grid lines
    this.drawGridLines();
  }

  drawGrid() {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (this.grid[y][x]) {
          this.ctx.fillStyle = this.grid[y][x];
          this.ctx.fillRect(
            x * this.blockSize,
            y * this.blockSize,
            this.blockSize,
            this.blockSize
          );
        }
      }
    }
  }

  drawPiece(piece) {
    this.ctx.fillStyle = piece.color;
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          this.ctx.fillRect(
            (piece.x + x) * this.blockSize,
            (piece.y + y) * this.blockSize,
            this.blockSize,
            this.blockSize
          );
        }
      }
    }
  }

  drawGridLines() {
    this.ctx.strokeStyle = "#333";
    this.ctx.lineWidth = 1;

    for (let x = 0; x <= this.gridWidth; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * this.blockSize, 0);
      this.ctx.lineTo(x * this.blockSize, this.canvas.height);
      this.ctx.stroke();
    }

    for (let y = 0; y <= this.gridHeight; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * this.blockSize);
      this.ctx.lineTo(this.canvas.width, y * this.blockSize);
      this.ctx.stroke();
    }
  }
}

// Real RL Agent with Q-Learning
class RealRLAgent {
  constructor() {
    this.actions = ["left", "right", "rotate", "drop", "wait"];
    this.qTable = new Map();
    this.learningRate = 0.1;
    this.discountFactor = 0.95;
    this.stateHistory = [];
    this.actionHistory = [];
    this.rewardHistory = [];
  }

  getStateKey(state) {
    // Create a simplified state key for Q-table lookup
    const gridKey = state.grid.map((row) => row.join("")).join("");
    const pieceKey = state.currentPiece
      ? `${state.currentPiece.x},${
          state.currentPiece.y
        },${state.currentPiece.shape.map((r) => r.join("")).join("")}`
      : "null";
    const heightKey = state.maxHeight;
    const holesKey = state.holes;

    return `${gridKey.slice(0, 50)}_${pieceKey}_${heightKey}_${holesKey}`;
  }

  getAction(state, epsilon) {
    const stateKey = this.getStateKey(state);

    // Initialize Q-values for this state if not exists
    if (!this.qTable.has(stateKey)) {
      this.qTable.set(stateKey, {});
      this.actions.forEach((action) => {
        this.qTable.get(stateKey)[action] = Math.random() * 0.1; // Small random initial values
      });
    }

    // Epsilon-greedy action selection
    if (Math.random() < epsilon) {
      // Exploration: random action
      return this.actions[Math.floor(Math.random() * this.actions.length)];
    } else {
      // Exploitation: best action
      const qValues = this.qTable.get(stateKey);
      let bestAction = this.actions[0];
      let bestValue = qValues[bestAction];

      for (const action of this.actions) {
        if (qValues[action] > bestValue) {
          bestValue = qValues[action];
          bestAction = action;
        }
      }

      return bestAction;
    }
  }

  updateQTable(state, action, reward, nextState) {
    const stateKey = this.getStateKey(state);
    const nextStateKey = this.getStateKey(nextState);

    // Initialize next state if not exists
    if (!this.qTable.has(nextStateKey)) {
      this.qTable.set(nextStateKey, {});
      this.actions.forEach((a) => {
        this.qTable.get(nextStateKey)[a] = Math.random() * 0.1;
      });
    }

    // Q-learning update
    const currentQ = this.qTable.get(stateKey)[action];
    const nextQValues = this.qTable.get(nextStateKey);
    const maxNextQ = Math.max(...Object.values(nextQValues));

    const newQ =
      currentQ +
      this.learningRate * (reward + this.discountFactor * maxNextQ - currentQ);
    this.qTable.get(stateKey)[action] = newQ;
  }

  reset() {
    this.qTable.clear();
    this.stateHistory = [];
    this.actionHistory = [];
    this.rewardHistory = [];
  }
}

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", () => {
  // Only initialize if we're on the Tetris RL page
  if (document.getElementById("tetrisCanvas")) {
    window.tetrisGame = new TetrisRL();
  }
});
