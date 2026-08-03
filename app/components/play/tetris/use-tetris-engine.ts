"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { tetrisSound } from "./tetris-sound";

export type PieceType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";
export type GameMode = "CLASSIC" | "CASCADE" | "RUSH";
export type GameStatus = "IDLE" | "PLAYING" | "PAUSED" | "GAMEOVER";

export interface CellData {
  color: string;
  type: PieceType;
  alpha?: number;
  glow?: boolean;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface ActivePiece {
  type: PieceType;
  matrix: number[][];
  x: number;
  y: number;
  color: string;
}

export const BOARD_COLS = 10;
export const BOARD_ROWS = 20;
export const HIDDEN_ROWS = 2;
export const TOTAL_ROWS = BOARD_ROWS + HIDDEN_ROWS;

export const TETROMINOES: Record<
  PieceType,
  { matrix: number[][]; color: string }
> = {
  I: {
    matrix: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: "#00f0ff", // Neon Cyan
  },
  J: {
    matrix: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#3b82f6", // Electric Blue
  },
  L: {
    matrix: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#f97316", // Coral Orange
  },
  O: {
    matrix: [
      [1, 1],
      [1, 1],
    ],
    color: "#d4ff00", // Acid Yellow / Neon
  },
  S: {
    matrix: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: "#22c55e", // Bright Lime Green
  },
  T: {
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#a855f7", // Deep Purple
  },
  Z: {
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: "#ec4899", // Hot Pink
  },
};

// Standard SRS Wall Kicks offsets for 3x3 and 4x4 pieces
const WALL_KICKS_JLSTZ: Record<string, [number, number][]> = {
  "0->1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "1->0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "1->2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "2->1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "2->3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "3->2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "3->0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "0->3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const WALL_KICKS_I: Record<string, [number, number][]> = {
  "0->1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "1->0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "1->2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  "2->1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "2->3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "3->2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "3->0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "0->3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

// Helper: Rotate 2D matrix
function rotateMatrix(matrix: number[][], dir: 1 | -1): number[][] {
  const n = matrix.length;
  const result = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (dir === 1) {
        result[c][n - 1 - r] = matrix[r][c];
      } else {
        result[n - 1 - c][r] = matrix[r][c];
      }
    }
  }
  return result;
}

// 7-Bag Generator
function createBag(): PieceType[] {
  const pieces: PieceType[] = ["I", "J", "L", "O", "S", "T", "Z"];
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  return pieces;
}

function emptyGrid(): (CellData | null)[][] {
  return Array.from({ length: TOTAL_ROWS }, () =>
    Array(BOARD_COLS).fill(null)
  );
}

export function useTetrisEngine() {
  const [grid, setGrid] = useState<(CellData | null)[][]>(emptyGrid);
  const [activePiece, setActivePiece] = useState<ActivePiece | null>(null);
  const [holdPiece, setHoldPiece] = useState<PieceType | null>(null);
  const [canHold, setCanHold] = useState(true);
  const [nextQueue, setNextQueue] = useState<PieceType[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>("IDLE");
  const [gameMode, setGameMode] = useState<GameMode>("CLASSIC");
  const [boardShake, setBoardShake] = useState(0);
  const [clearingRows, setClearingRows] = useState<number[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [muted, setMuted] = useState(false);

  // Refs for animation loop and non-react state
  const bagRef = useRef<PieceType[]>([]);
  const gridRef = useRef<(CellData | null)[][]>(emptyGrid());
  const activePieceRef = useRef<ActivePiece | null>(null);
  const rotationStateRef = useRef<number>(0); // 0, 1, 2, 3
  const statusRef = useRef<GameStatus>("IDLE");
  const modeRef = useRef<GameMode>("CLASSIC");
  const levelRef = useRef(1);
  const scoreRef = useRef(0);
  const linesRef = useRef(0);
  const comboRef = useRef(0);

  const lastDropTimeRef = useRef(0);
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLockingRef = useRef(false);

  // Load high score on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("playground_v2_tetris_highscore");
      if (saved) setHighScore(parseInt(saved, 10) || 0);
    } catch {
      // Ignore
    }
  }, []);

  const getNextPieceFromBag = useCallback((): PieceType => {
    if (bagRef.current.length < 7) {
      bagRef.current = [...bagRef.current, ...createBag()];
    }
    return bagRef.current.shift()!;
  }, []);

  // Check collision of piece at (x, y) with matrix
  const checkCollision = useCallback(
    (pieceMatrix: number[][], px: number, py: number, currentGrid = gridRef.current): boolean => {
      for (let r = 0; r < pieceMatrix.length; r++) {
        for (let c = 0; c < pieceMatrix[r].length; c++) {
          if (pieceMatrix[r][c]) {
            const targetX = px + c;
            const targetY = py + r;

            // Out of bounds checks
            if (targetX < 0 || targetX >= BOARD_COLS || targetY >= TOTAL_ROWS) {
              return true;
            }
            if (targetY >= 0 && currentGrid[targetY][targetX]) {
              return true;
            }
          }
        }
      }
      return false;
    },
    []
  );

  // Compute ghost piece Y position
  const getGhostY = useCallback(
    (piece: ActivePiece | null): number => {
      if (!piece) return 0;
      let ghostY = piece.y;
      while (!checkCollision(piece.matrix, piece.x, ghostY + 1)) {
        ghostY++;
      }
      return ghostY;
    },
    [checkCollision]
  );

  // Create Splash Particles
  const spawnParticles = useCallback((cx: number, cy: number, color: string, count = 12) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      newParticles.push({
        id: Math.random(),
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: 3 + Math.random() * 5,
        color,
        life: 1,
        maxLife: 20 + Math.floor(Math.random() * 20),
      });
    }
    setParticles((prev) => [...prev.slice(-40), ...newParticles]);
  }, []);

  // Spawn a new piece
  const spawnNewPiece = useCallback(() => {
    setNextQueue((prev) => {
      let queue = [...prev];
      while (queue.length < 4) {
        queue.push(getNextPieceFromBag());
      }
      const nextType = queue.shift()!;

      // Refill queue if needed
      while (queue.length < 4) {
        queue.push(getNextPieceFromBag());
      }

      const template = TETROMINOES[nextType];
      const startX = Math.floor((BOARD_COLS - template.matrix[0].length) / 2);
      const startY = 0; // In top hidden rows

      const newPiece: ActivePiece = {
        type: nextType,
        matrix: template.matrix,
        x: startX,
        y: startY,
        color: template.color,
      };

      rotationStateRef.current = 0;

      // Check immediate game over
      if (checkCollision(newPiece.matrix, newPiece.x, newPiece.y)) {
        statusRef.current = "GAMEOVER";
        setGameStatus("GAMEOVER");
        tetrisSound.playGameOver();
        setHighScore((prevHigh) => {
          const finalScore = scoreRef.current;
          if (finalScore > prevHigh) {
            try {
              localStorage.setItem(
                "playground_v2_tetris_highscore",
                String(finalScore)
              );
            } catch {
              // Ignore
            }
            return finalScore;
          }
          return prevHigh;
        });
        setActivePiece(null);
        activePieceRef.current = null;
        return queue;
      }

      activePieceRef.current = newPiece;
      setActivePiece(newPiece);
      setCanHold(true);
      return queue;
    });
  }, [checkCollision, getNextPieceFromBag]);

  // Handle Liquid Cascade Mode Physics (Gravity collapses floating cells)
  const applyCascadePhysics = useCallback((): boolean => {
    let changed = false;
    const currentGrid = gridRef.current.map((row) => [...row]);

    for (let r = TOTAL_ROWS - 2; r >= 0; r--) {
      for (let c = 0; c < BOARD_COLS; c++) {
        if (currentGrid[r][c] && !currentGrid[r + 1][c]) {
          currentGrid[r + 1][c] = currentGrid[r][c];
          currentGrid[r][c] = null;
          changed = true;
        }
      }
    }

    if (changed) {
      gridRef.current = currentGrid;
      setGrid(currentGrid);
    }
    return changed;
  }, []);

  // Check & Process Line Clears
  const processLineClears = useCallback(() => {
    const currentGrid = gridRef.current;
    const fullRows: number[] = [];

    for (let r = 0; r < TOTAL_ROWS; r++) {
      if (currentGrid[r].every((cell) => cell !== null)) {
        fullRows.push(r);
      }
    }

    if (fullRows.length === 0) return;

    // Trigger visual line clear state
    setClearingRows(fullRows);
    tetrisSound.playLineClear(fullRows.length);

    // Spawn splash particles along cleared lines
    fullRows.forEach((r) => {
      for (let c = 0; c < BOARD_COLS; c += 2) {
        const cell = currentGrid[r][c];
        if (cell) {
          spawnParticles(c * 32 + 16, (r - HIDDEN_ROWS) * 32 + 16, cell.color, 4);
        }
      }
    });

    // Delayed clear removal
    setTimeout(() => {
      const nextGrid = gridRef.current.filter((_, idx) => !fullRows.includes(idx));
      const clearedCount = fullRows.length;

      // Add new empty rows at top
      while (nextGrid.length < TOTAL_ROWS) {
        nextGrid.unshift(Array(BOARD_COLS).fill(null));
      }

      gridRef.current = nextGrid;
      setGrid(nextGrid);
      setClearingRows([]);

      // Calculate score & level
      const basePoints = [0, 100, 300, 500, 800];
      const lineScore = (basePoints[clearedCount] || 1000) * levelRef.current;
      const comboBonus = comboRef.current * 50 * levelRef.current;

      const newScore = scoreRef.current + lineScore + comboBonus;
      const newLines = linesRef.current + clearedCount;
      const newLevel = Math.floor(newLines / 10) + 1;
      const newCombo = comboRef.current + 1;

      scoreRef.current = newScore;
      linesRef.current = newLines;
      comboRef.current = newCombo;

      setScore(newScore);
      setLines(newLines);
      setCombo(newCombo);

      if (newLevel > levelRef.current) {
        levelRef.current = newLevel;
        setLevel(newLevel);
        tetrisSound.playLevelUp();
      }

      // In Cascade Mode, run gravity cascade pass
      if (modeRef.current === "CASCADE") {
        setTimeout(() => {
          applyCascadePhysics();
        }, 150);
      }
    }, 220);
  }, [spawnParticles, applyCascadePhysics]);

  // Lock Piece into Grid
  const lockPiece = useCallback(() => {
    const piece = activePieceRef.current;
    if (!piece) return;

    const newGrid = gridRef.current.map((row) => [...row]);
    let landedVisible = false;

    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (piece.matrix[r][c]) {
          const gx = piece.x + c;
          const gy = piece.y + r;
          if (gy >= 0 && gy < TOTAL_ROWS && gx >= 0 && gx < BOARD_COLS) {
            newGrid[gy][gx] = {
              color: piece.color,
              type: piece.type,
            };
            if (gy >= HIDDEN_ROWS) landedVisible = true;
          }
        }
      }
    }

    gridRef.current = newGrid;
    setGrid(newGrid);

    if (landedVisible) {
      tetrisSound.playDrop();
    }

    // Reset combo if no line cleared previously
    comboRef.current = 0;
    setCombo(0);

    // Process potential line clears
    processLineClears();

    // Spawn next piece
    spawnNewPiece();
  }, [processLineClears, spawnNewPiece]);

  // Move active piece
  const move = useCallback(
    (dx: number, dy: number): boolean => {
      const piece = activePieceRef.current;
      if (!piece || statusRef.current !== "PLAYING") return false;

      const nextX = piece.x + dx;
      const nextY = piece.y + dy;

      if (!checkCollision(piece.matrix, nextX, nextY)) {
        const updated = { ...piece, x: nextX, y: nextY };
        activePieceRef.current = updated;
        setActivePiece(updated);
        if (dx !== 0) tetrisSound.playMove();
        return true;
      }

      // If moving down failed, piece has landed
      if (dy > 0) {
        lockPiece();
      }
      return false;
    },
    [checkCollision, lockPiece]
  );

  // Rotate active piece (with SRS Wall Kicks)
  const rotate = useCallback(
    (dir: 1 | -1 = 1) => {
      const piece = activePieceRef.current;
      if (!piece || statusRef.current !== "PLAYING") return;

      const rotatedMatrix = rotateMatrix(piece.matrix, dir);
      const oldState = rotationStateRef.current;
      const newState = (oldState + (dir === 1 ? 1 : 3)) % 4;
      const kickKey = `${oldState}->${newState}`;

      const kickTable = piece.type === "I" ? WALL_KICKS_I : WALL_KICKS_JLSTZ;
      const kicks = kickTable[kickKey] || [[0, 0]];

      for (const [kx, ky] of kicks) {
        const testX = piece.x + kx;
        const testY = piece.y - ky; // Y axis inverted in SRS table
        if (!checkCollision(rotatedMatrix, testX, testY)) {
          rotationStateRef.current = newState;
          const updated = {
            ...piece,
            matrix: rotatedMatrix,
            x: testX,
            y: testY,
          };
          activePieceRef.current = updated;
          setActivePiece(updated);
          tetrisSound.playRotate();
          return;
        }
      }
    },
    [checkCollision]
  );

  // Hard Drop
  const hardDrop = useCallback(() => {
    const piece = activePieceRef.current;
    if (!piece || statusRef.current !== "PLAYING") return;

    const ghostY = getGhostY(piece);
    const dropDistance = ghostY - piece.y;

    scoreRef.current += dropDistance * 2;
    setScore(scoreRef.current);

    const updated = { ...piece, y: ghostY };
    activePieceRef.current = updated;
    setActivePiece(updated);

    // Screen Shake & Particles
    setBoardShake(6);
    setTimeout(() => setBoardShake(0), 120);

    for (let c = 0; c < piece.matrix[0].length; c++) {
      if (piece.matrix[piece.matrix.length - 1][c]) {
        spawnParticles(
          (piece.x + c) * 32 + 16,
          (ghostY - HIDDEN_ROWS) * 32 + 28,
          piece.color,
          3
        );
      }
    }

    lockPiece();
  }, [getGhostY, lockPiece, spawnParticles]);

  // Soft Drop
  const softDrop = useCallback(() => {
    if (move(0, 1)) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    }
  }, [move]);

  // Hold Piece
  const hold = useCallback(() => {
    const piece = activePieceRef.current;
    if (!piece || !canHold || statusRef.current !== "PLAYING") return;

    tetrisSound.playHold();
    setCanHold(false);

    const currentType = piece.type;
    const nextHoldType = holdPiece;

    setHoldPiece(currentType);

    if (nextHoldType) {
      const template = TETROMINOES[nextHoldType];
      const newPiece: ActivePiece = {
        type: nextHoldType,
        matrix: template.matrix,
        x: Math.floor((BOARD_COLS - template.matrix[0].length) / 2),
        y: 0,
        color: template.color,
      };
      rotationStateRef.current = 0;
      activePieceRef.current = newPiece;
      setActivePiece(newPiece);
    } else {
      spawnNewPiece();
    }
  }, [canHold, holdPiece, spawnNewPiece]);

  // Start / Restart Game
  const startGame = useCallback((mode: GameMode = "CLASSIC") => {
    bagRef.current = createBag();
    const initialGrid = emptyGrid();
    gridRef.current = initialGrid;
    setGrid(initialGrid);

    modeRef.current = mode;
    setGameMode(mode);

    levelRef.current = 1;
    scoreRef.current = 0;
    linesRef.current = 0;
    comboRef.current = 0;

    setLevel(1);
    setScore(0);
    setLines(0);
    setCombo(0);
    setHoldPiece(null);
    setCanHold(true);
    setClearingRows([]);
    setParticles([]);

    // Initialize Next Queue
    const q: PieceType[] = [
      getNextPieceFromBag(),
      getNextPieceFromBag(),
      getNextPieceFromBag(),
      getNextPieceFromBag(),
    ];

    const firstType = q.shift()!;
    q.push(getNextPieceFromBag());
    setNextQueue(q);

    const template = TETROMINOES[firstType];
    const firstPiece: ActivePiece = {
      type: firstType,
      matrix: template.matrix,
      x: Math.floor((BOARD_COLS - template.matrix[0].length) / 2),
      y: 0,
      color: template.color,
    };

    activePieceRef.current = firstPiece;
    setActivePiece(firstPiece);

    statusRef.current = "PLAYING";
    setGameStatus("PLAYING");
    lastDropTimeRef.current = performance.now();
  }, [getNextPieceFromBag]);

  const pauseGame = useCallback(() => {
    if (statusRef.current === "PLAYING") {
      statusRef.current = "PAUSED";
      setGameStatus("PAUSED");
    } else if (statusRef.current === "PAUSED") {
      statusRef.current = "PLAYING";
      setGameStatus("PLAYING");
      lastDropTimeRef.current = performance.now();
    }
  }, []);

  // Main Animation / Game Loop
  useEffect(() => {
    let animId: number;

    const gameLoop = (time: number) => {
      if (statusRef.current === "PLAYING") {
        // Calculate drop speed based on level and mode
        const baseSpeed = Math.max(80, 800 - (levelRef.current - 1) * 70);
        const dropInterval = modeRef.current === "RUSH" ? baseSpeed * 0.55 : baseSpeed;

        if (time - lastDropTimeRef.current >= dropInterval) {
          move(0, 1);
          lastDropTimeRef.current = time;
        }

        // Update particles
        setParticles((prev) =>
          prev
            .map((p) => ({
              ...p,
              x: p.x + p.vx,
              y: p.y + p.vy,
              vy: p.vy + 0.2, // gravity
              life: p.life + 1,
            }))
            .filter((p) => p.life < p.maxLife)
        );
      }
      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [move]);

  const toggleSound = useCallback(() => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    tetrisSound.setMuted(nextMuted);
  }, [muted]);

  return {
    grid,
    activePiece,
    ghostY: getGhostY(activePiece),
    holdPiece,
    nextQueue,
    score,
    highScore,
    lines,
    level,
    combo,
    gameStatus,
    gameMode,
    boardShake,
    clearingRows,
    particles,
    muted,
    move,
    rotate,
    softDrop,
    hardDrop,
    hold,
    startGame,
    pauseGame,
    toggleSound,
    setGameMode,
  };
}
