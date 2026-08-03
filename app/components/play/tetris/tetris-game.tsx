"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  useTetrisEngine,
  BOARD_COLS,
  BOARD_ROWS,
  HIDDEN_ROWS,
  TOTAL_ROWS,
  TETROMINOES,
  type GameMode,
  type PieceType,
} from "./use-tetris-engine";

const CELL_SIZE = 30; // 30px per block cell
const BOARD_WIDTH = BOARD_COLS * CELL_SIZE; // 300px
const BOARD_HEIGHT = BOARD_ROWS * CELL_SIZE; // 600px

// Mini piece preview component for Next & Hold boxes
function PiecePreview({ type, size = 20 }: { type: PieceType | null; size?: number }) {
  if (!type) {
    return <div className="tetris-preview-empty">—</div>;
  }
  const { matrix, color } = TETROMINOES[type];
  const cols = matrix[0].length;
  const rows = matrix.length;
  const width = cols * size;
  const height = rows * size;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="tetris-piece-preview"
      aria-hidden="true"
    >
      <defs>
        <filter id={`preview-goo-${type}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feColorMatrix
            in="blur"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -6"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
      <g filter={`url(#preview-goo-${type})`}>
        {matrix.map((row, r) =>
          row.map((val, c) => {
            if (!val) return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={c * size + 1.5}
                y={r * size + 1.5}
                width={size - 3}
                height={size - 3}
                rx={size * 0.28}
                fill={color}
              />
            );
          })
        )}
      </g>
    </svg>
  );
}

export function TetrisGame() {
  const {
    grid,
    activePiece,
    ghostY,
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
  } = useTetrisEngine();

  const boardRef = useRef<HTMLDivElement>(null);

  // Keyboard Navigation & Control Handling
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (gameStatus === "IDLE" || gameStatus === "GAMEOVER") {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          startGame(gameMode);
        }
        return;
      }

      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          e.preventDefault();
          move(-1, 0);
          break;

        case "ArrowRight":
        case "KeyD":
          e.preventDefault();
          move(1, 0);
          break;

        case "ArrowDown":
        case "KeyS":
          e.preventDefault();
          softDrop();
          break;

        case "ArrowUp":
        case "KeyW":
        case "KeyX":
          e.preventDefault();
          rotate(1);
          break;

        case "KeyZ":
          e.preventDefault();
          rotate(-1);
          break;

        case "Space":
          e.preventDefault();
          hardDrop();
          break;

        case "KeyC":
        case "ShiftLeft":
        case "ShiftRight":
          e.preventDefault();
          hold();
          break;

        case "KeyP":
        case "Escape":
          e.preventDefault();
          pauseGame();
          break;

        default:
          break;
      }
    },
    [gameStatus, gameMode, move, softDrop, rotate, hardDrop, hold, pauseGame, startGame]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <section className="tetris-game" aria-labelledby="tetris-game-title">
      {/* SVG Defs for Gooey Fusion Filter & Liquid Ripple */}
      <svg
        className="tetris-svg-defs"
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
        aria-hidden="true"
      >
        <defs>
          <filter id="tetris-gooey-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5.5" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -7"
              result="goo"
            />
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015 0.04"
              numOctaves="1"
              seed="14"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                values="0.015 0.04;0.03 0.07;0.015 0.04"
                dur="3s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="goo"
              in2="noise"
              scale="2.5"
              xChannelSelector="R"
              yChannelSelector="B"
            />
          </filter>

          <filter id="tetris-ghost-wave" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04 0.09" numOctaves="1" seed="5" result="noise">
              <animate attributeName="baseFrequency" values="0.04 0.09;0.08 0.12;0.04 0.09" dur="2s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
          </filter>
        </defs>
      </svg>

      {/* Top Header Bar */}
      <div className="tetris-game__bar">
        <div>
          <p className="play-kicker">GAME 03 / LIQUID TETRIS</p>
          <h2 id="tetris-game-title">Fuse the liquid blocks.</h2>
        </div>

        {/* Mode Selector */}
        <div className="tetris-mode-selector" aria-label="테트리스 모드 선택">
          {(["CLASSIC", "CASCADE", "RUSH"] as GameMode[]).map((mode) => (
            <button
              key={mode}
              className={gameMode === mode ? "is-active" : ""}
              type="button"
              onClick={() => {
                setGameMode(mode);
                if (gameStatus === "PLAYING" || gameStatus === "PAUSED") {
                  startGame(mode);
                }
              }}
            >
              {mode === "CLASSIC" ? "CLASSIC GOO" : mode === "CASCADE" ? "LIQUID CASCADE" : "SPEED RUSH"}
              <span>
                {mode === "CLASSIC"
                  ? "SVG GOOEY FUSION"
                  : mode === "CASCADE"
                  ? "LIQUID GRAVITY DROP"
                  : "ACCELERATED FLOW"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="tetris-game__status">
        <span>GRID / 10×20 MATRIX</span>
        <span>SCORE / {String(score).padStart(6, "0")}</span>
        <span>HIGH SCORE / {String(highScore).padStart(6, "0")}</span>
        <span>
          LEVEL / {String(level).padStart(2, "0")} · LINES / {String(lines).padStart(3, "0")}
        </span>
      </div>

      {/* Main Board Shell */}
      <div className="tetris-board-shell">
        <div
          ref={boardRef}
          className="tetris-layout-container"
          style={{
            transform: boardShake ? `translate(${(Math.random() - 0.5) * boardShake}px, ${(Math.random() - 0.5) * boardShake}px)` : "none",
          }}
        >
          {/* Left Panel: Hold & Mode Info */}
          <div className="tetris-panel tetris-panel--left">
            <div className="tetris-card">
              <span className="tetris-card__label">HOLD (C / SHIFT)</span>
              <div className="tetris-card__box">
                <PiecePreview type={holdPiece} size={22} />
              </div>
            </div>

            <div className="tetris-card tetris-card--stats">
              <div className="stat-item">
                <span className="stat-label">MODE</span>
                <span className="stat-val">{gameMode}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">LEVEL</span>
                <span className="stat-val">{level}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">LINES</span>
                <span className="stat-val">{lines}</span>
              </div>
              {combo > 1 && (
                <div className="stat-item stat-item--combo">
                  <span className="stat-label">COMBO</span>
                  <span className="stat-val">{combo}x!</span>
                </div>
              )}
            </div>
          </div>

          {/* Center Play Board */}
          <div className="tetris-board-wrapper">
            <svg
              className="tetris-board-svg"
              width={BOARD_WIDTH}
              height={BOARD_HEIGHT}
              viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
              role="application"
              tabIndex={0}
              aria-label="액체 테트리스 게임 보드"
            >
              {/* Background Grid Pattern */}
              <g className="tetris-board__grid-lines">
                {Array.from({ length: BOARD_ROWS + 1 }).map((_, r) => (
                  <line
                    key={`h-${r}`}
                    x1={0}
                    y1={r * CELL_SIZE}
                    x2={BOARD_WIDTH}
                    y2={r * CELL_SIZE}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="1"
                  />
                ))}
                {Array.from({ length: BOARD_COLS + 1 }).map((_, c) => (
                  <line
                    key={`v-${c}`}
                    x1={c * CELL_SIZE}
                    y1={0}
                    x2={c * CELL_SIZE}
                    y2={BOARD_HEIGHT}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="1"
                  />
                ))}
              </g>

              {/* 1. Settled Grid Cells rendered through Liquid SVG Gooey Filter */}
              <g className="tetris-settled-layer" filter="url(#tetris-gooey-filter)">
                {grid.flatMap((row, r) => {
                  if (r < HIDDEN_ROWS) return [];
                  const visibleR = r - HIDDEN_ROWS;
                  const isClearing = clearingRows.includes(r);

                  return row.map((cell, c) => {
                    if (!cell) return null;
                    return (
                      <rect
                        key={`cell-${r}-${c}`}
                        x={c * CELL_SIZE + 1.5}
                        y={visibleR * CELL_SIZE + 1.5}
                        width={CELL_SIZE - 3}
                        height={CELL_SIZE - 3}
                        rx={CELL_SIZE * 0.32}
                        fill={cell.color}
                        opacity={isClearing ? 0.2 : 1}
                        className={isClearing ? "tetris-cell--clearing" : ""}
                      />
                    );
                  });
                })}
              </g>

              {/* 2. Ghost Piece Preview Layer */}
              {gameStatus === "PLAYING" && activePiece && (
                <g className="tetris-ghost-layer" filter="url(#tetris-ghost-wave)">
                  {activePiece.matrix.map((row, r) =>
                    row.map((val, c) => {
                      if (!val) return null;
                      const gx = activePiece.x + c;
                      const gy = ghostY + r;
                      if (gy < HIDDEN_ROWS) return null;
                      const visibleY = gy - HIDDEN_ROWS;

                      return (
                        <rect
                          key={`ghost-${r}-${c}`}
                          x={gx * CELL_SIZE + 2}
                          y={visibleY * CELL_SIZE + 2}
                          width={CELL_SIZE - 4}
                          height={CELL_SIZE - 4}
                          rx={CELL_SIZE * 0.25}
                          fill="none"
                          stroke={activePiece.color}
                          strokeWidth="1.5"
                          strokeDasharray="4 3"
                          opacity="0.55"
                        />
                      );
                    })
                  )}
                </g>
              )}

              {/* 3. Falling Active Piece Layer (with Gooey filter & shine) */}
              {gameStatus === "PLAYING" && activePiece && (
                <g className="tetris-active-layer" filter="url(#tetris-gooey-filter)">
                  {activePiece.matrix.map((row, r) =>
                    row.map((val, c) => {
                      if (!val) return null;
                      const px = activePiece.x + c;
                      const py = activePiece.y + r;
                      if (py < HIDDEN_ROWS) return null;
                      const visibleY = py - HIDDEN_ROWS;

                      return (
                        <g key={`active-${r}-${c}`}>
                          <rect
                            x={px * CELL_SIZE + 1.5}
                            y={visibleY * CELL_SIZE + 1.5}
                            width={CELL_SIZE - 3}
                            height={CELL_SIZE - 3}
                            rx={CELL_SIZE * 0.32}
                            fill={activePiece.color}
                          />
                          <circle
                            cx={px * CELL_SIZE + 8}
                            cy={visibleY * CELL_SIZE + 8}
                            r={3}
                            fill="#ffffff"
                            opacity="0.45"
                          />
                        </g>
                      );
                    })
                  )}
                </g>
              )}

              {/* 4. Particle Splash Overlay */}
              <g className="tetris-particles-layer">
                {particles.map((p) => (
                  <circle
                    key={p.id}
                    cx={p.x}
                    cy={p.y}
                    r={p.size * (1 - p.life / p.maxLife)}
                    fill={p.color}
                    opacity={1 - p.life / p.maxLife}
                  />
                ))}
              </g>
            </svg>
          </div>

          {/* Right Panel: Next Queue & Actions */}
          <div className="tetris-panel tetris-panel--right">
            <div className="tetris-card">
              <span className="tetris-card__label">NEXT PIECES</span>
              <div className="tetris-card__queue">
                {nextQueue.slice(0, 3).map((type, idx) => (
                  <div key={idx} className="queue-item">
                    <PiecePreview type={type} size={18} />
                  </div>
                ))}
              </div>
            </div>

            <div className="tetris-card tetris-card--controls">
              <button
                type="button"
                className="sound-toggle-btn"
                onClick={toggleSound}
                aria-label={muted ? "음소거 해제" : "음소거"}
              >
                SOUND / {muted ? "MUTED" : "ON"}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Overlay for Game States */}
        {gameStatus === "IDLE" && (
          <div className="tetris-modal" role="dialog" aria-modal="true" aria-labelledby="tetris-start-title">
            <div className="tetris-modal-card">
              <span className="tetris-modal__kicker">SVG LIQUID EXPERIMENT</span>
              <h3 id="tetris-start-title">Liquid Tetris</h3>
              <p>
                SVG 융합 필터가 블록 연결을 부드러운 액체 형태로 이어줍니다.
                <br />
                모드를 선택하고 게임을 시작하세요.
              </p>
              <button
                type="button"
                className="tetris-action-btn"
                onClick={() => startGame(gameMode)}
              >
                START EXPERIMENT
              </button>
            </div>
          </div>
        )}

        {gameStatus === "PAUSED" && (
          <div className="tetris-modal" role="dialog" aria-modal="true" aria-labelledby="tetris-pause-title">
            <div className="tetris-modal-card">
              <span className="tetris-modal__kicker">PAUSED</span>
              <h3 id="tetris-pause-title">Game Paused</h3>
              <p>다시 계속하려면 아래 버튼을 누르거나 [P] 키를 입력하세요.</p>
              <button type="button" className="tetris-action-btn" onClick={pauseGame}>
                RESUME GAME
              </button>
            </div>
          </div>
        )}

        {gameStatus === "GAMEOVER" && (
          <div className="tetris-modal" role="dialog" aria-modal="true" aria-labelledby="tetris-over-title">
            <div className="tetris-modal-card">
              <span className="tetris-modal__kicker">MATRIX OVERFLOW</span>
              <h3 id="tetris-over-title">Game Over</h3>
              <p>
                최종 점수: <strong>{score}</strong>
                {score >= highScore && score > 0 && <span className="new-high-badge"> NEW HIGH SCORE!</span>}
              </p>

              <button
                type="button"
                className="tetris-action-btn"
                onClick={() => startGame(gameMode)}
              >
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>

      {/* On-screen Touch Controls for Mobile / Pointer */}
      <div className="tetris-touch-controls" aria-label="터치 게임 조작">
        <div className="touch-group touch-group--dpad">
          <button type="button" onClick={() => move(-1, 0)} aria-label="왼쪽 이동">
            ←
          </button>
          <button type="button" onClick={() => softDrop()} aria-label="소프트 드롭">
            ↓
          </button>
          <button type="button" onClick={() => move(1, 0)} aria-label="오른쪽 이동">
            →
          </button>
        </div>

        <div className="touch-group touch-group--actions">
          <button type="button" onClick={() => hold()} aria-label="홀드">
            HOLD
          </button>
          <button type="button" onClick={() => rotate(1)} aria-label="회전">
            ROTATE
          </button>
          <button type="button" className="touch-btn--drop" onClick={() => hardDrop()} aria-label="하드 드롭">
            DROP
          </button>
        </div>
      </div>

      {/* Footer Instructions */}
      <p id="tetris-instructions" className="tetris-instructions">
        KEYBOARD — [←/→] MOVE · [↑/W/X] ROTATE · [↓] SOFT DROP · [SPACE] HARD DROP · [C/SHIFT] HOLD · [P] PAUSE
      </p>

      {/* Bottom Action Buttons */}
      <div className="tetris-actions">
        <button type="button" onClick={() => startGame(gameMode)}>
          RESTART
          <span>RESET MATRIX</span>
        </button>
        <button type="button" onClick={pauseGame} disabled={gameStatus !== "PLAYING" && gameStatus !== "PAUSED"}>
          {gameStatus === "PAUSED" ? "RESUME" : "PAUSE"}
          <span>[P] / ESC</span>
        </button>
      </div>
    </section>
  );
}
