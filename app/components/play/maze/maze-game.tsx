"use client";

import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { canMove, DIRECTION, type Difficulty, type Direction, type MazeData, type MazePoint, generateMaze, WALL } from "./maze-generator";
import { useLiquidPlayer } from "./use-liquid-player";
import { LeaderboardModal } from "@/app/components/play/leaderboard-modal";
import { getStoredGuestUser } from "@/lib/guest-session";

const CELL = 32;
const PADDING = 28;
const SWIPE_THRESHOLD = 24;
const WALL_CLIP_INSET = 1.5;

const keyDirections: Record<string, Direction | undefined> = {
  ArrowUp: "north",
  w: "north",
  W: "north",
  ArrowRight: "east",
  d: "east",
  D: "east",
  ArrowDown: "south",
  s: "south",
  S: "south",
  ArrowLeft: "west",
  a: "west",
  A: "west",
};

function pointKey(point: MazePoint) {
  return `${point.row}-${point.col}`;
}

function center(point: MazePoint) {
  return {
    x: PADDING + point.col * CELL + CELL / 2,
    y: PADDING + point.row * CELL + CELL / 2,
  };
}

function liquidClipRects(maze: MazeData, points: MazePoint[]) {
  const uniquePoints = [...new Map(points.map((point) => [pointKey(point), point])).values()];

  return uniquePoints.flatMap((point) => {
    const left = PADDING + point.col * CELL;
    const top = PADDING + point.row * CELL;
    const right = left + CELL;
    const bottom = top + CELL;
    const innerSize = CELL - WALL_CLIP_INSET * 2;
    const walls = maze.walls[point.row][point.col];
    const rects = [
      {
        key: `${pointKey(point)}-cell`,
        x: left + WALL_CLIP_INSET,
        y: top + WALL_CLIP_INSET,
        width: innerSize,
        height: innerSize,
      },
    ];

    if (!(walls & WALL.north)) {
      rects.push({
        key: `${pointKey(point)}-north`,
        x: left + WALL_CLIP_INSET,
        y: top - CELL,
        width: innerSize,
        height: CELL + WALL_CLIP_INSET,
      });
    }
    if (!(walls & WALL.east)) {
      rects.push({
        key: `${pointKey(point)}-east`,
        x: right - WALL_CLIP_INSET,
        y: top + WALL_CLIP_INSET,
        width: CELL + WALL_CLIP_INSET,
        height: innerSize,
      });
    }
    if (!(walls & WALL.south)) {
      rects.push({
        key: `${pointKey(point)}-south`,
        x: left + WALL_CLIP_INSET,
        y: bottom - WALL_CLIP_INSET,
        width: innerSize,
        height: CELL + WALL_CLIP_INSET,
      });
    }
    if (!(walls & WALL.west)) {
      rects.push({
        key: `${pointKey(point)}-west`,
        x: left - CELL,
        y: top + WALL_CLIP_INSET,
        width: CELL + WALL_CLIP_INSET,
        height: innerSize,
      });
    }

    return rects;
  });
}

function exitPosition(maze: MazeData) {
  const point = center(maze.exit);
  if (maze.exit.side === "north") point.y = PADDING - 10;
  if (maze.exit.side === "east") point.x = PADDING + maze.size * CELL + 10;
  if (maze.exit.side === "south") point.y = PADDING + maze.size * CELL + 10;
  if (maze.exit.side === "west") point.x = PADDING - 10;
  return point;
}

export function MazeGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("low");
  const [maze, setMaze] = useState<MazeData | null>(null);
  const [player, setPlayer] = useState<MazePoint | null>(null);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const submittedScoreRef = useRef<number | null>(null);
  const [startTime, setStartTime] = useState<number>(() => Date.now());

  // Auto-submit score to MongoDB backend when maze is escaped (won)
  useEffect(() => {
    if (won && moves > 0 && submittedScoreRef.current !== moves) {
      submittedScoreRef.current = moves;
      const clearTimeSec = Math.max(1, (Date.now() - startTime) / 1000);
      const score = Math.max(10, Math.round(10000 / clearTimeSec - moves * 10));
      const user = getStoredGuestUser();

      fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId: user.guestId,
          nickname: user.nickname,
          gameId: "maze",
          difficulty: difficulty.toUpperCase(),
          score,
          clearTime: clearTimeSec,
          extraStats: { moves },
        }),
      }).catch((err) => console.error("Failed to submit maze score to DB:", err));
    }
  }, [won, moves, startTime, difficulty]);
  const [motionReset, setMotionReset] = useState(0);
  const [collision, setCollision] = useState({ version: 0, x: 0, y: 0 });
  const [liquidCells, setLiquidCells] = useState<MazePoint[]>([]);
  const playerRef = useRef<MazePoint | null>(null);
  const swipe = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    consumed: boolean;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const successButtonRef = useRef<HTMLButtonElement>(null);

  const loadMaze = useCallback((nextDifficulty: Difficulty, seed: number) => {
    const nextMaze = generateMaze(nextDifficulty, seed);
    setMaze(nextMaze);
    setPlayer(nextMaze.start);
    playerRef.current = nextMaze.start;
    setMoves(0);
    setWon(false);
    setStartTime(Date.now());
    setCollision({ version: 0, x: 0, y: 0 });
    setLiquidCells([nextMaze.start]);
    setMotionReset((version) => version + 1);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() =>
      loadMaze("low", Date.now() ^ Math.floor(Math.random() * 0x7fffffff)),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [loadMaze]);

  useEffect(() => {
    if (!won) return;
    const frame = window.requestAnimationFrame(() => successButtonRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [won]);

  const wallLines = useMemo(() => {
    if (!maze) return [];
    const lines: Array<{ key: string; x1: number; y1: number; x2: number; y2: number }> = [];

    maze.walls.forEach((row, rowIndex) => {
      row.forEach((walls, colIndex) => {
        const left = PADDING + colIndex * CELL;
        const top = PADDING + rowIndex * CELL;
        const right = left + CELL;
        const bottom = top + CELL;

        if (walls & WALL.north) {
          lines.push({ key: `${rowIndex}-${colIndex}-n`, x1: left, y1: top, x2: right, y2: top });
        }
        if (walls & WALL.west) {
          lines.push({ key: `${rowIndex}-${colIndex}-w`, x1: left, y1: top, x2: left, y2: bottom });
        }
        if (rowIndex === maze.size - 1 && walls & WALL.south) {
          lines.push({ key: `${rowIndex}-${colIndex}-s`, x1: left, y1: bottom, x2: right, y2: bottom });
        }
        if (colIndex === maze.size - 1 && walls & WALL.east) {
          lines.push({ key: `${rowIndex}-${colIndex}-e`, x1: right, y1: top, x2: right, y2: bottom });
        }
      });
    });

    return lines;
  }, [maze]);

  const playerCenter = player ? center(player) : { x: 0, y: 0 };
  const liquidPlayer = useLiquidPlayer(playerCenter, motionReset, collision);
  const liquidParticles = liquidPlayer.particles;

  const move = useCallback(
    (direction: Direction) => {
      const current = playerRef.current;
      if (!maze || !current || won) return;
      const next = canMove(maze, current, direction);
      if (!next) {
        const delta = DIRECTION[direction];
        setCollision((currentCollision) => ({
          version: currentCollision.version + 1,
          x: delta.col,
          y: delta.row,
        }));
        return;
      }

      setCollision((currentCollision) =>
        currentCollision.x === 0 && currentCollision.y === 0
          ? currentCollision
          : { version: currentCollision.version + 1, x: 0, y: 0 },
      );
      playerRef.current = next;
      setLiquidCells([current, next]);
      setPlayer(next);
      setMoves((count) => count + 1);
      if (pointKey(next) === pointKey(maze.exit)) {
        setWon(true);
        swipe.current = null;
      }
    },
    [maze, won],
  );

  function restart() {
    if (!maze) return;
    setPlayer(maze.start);
    playerRef.current = maze.start;
    setMoves(0);
    setWon(false);
    setCollision({ version: 0, x: 0, y: 0 });
    setLiquidCells([maze.start]);
    setMotionReset((version) => version + 1);
    svgRef.current?.focus();
  }

  function newGame(nextDifficulty = difficulty) {
    loadMaze(
      nextDifficulty,
      Date.now() ^ Math.floor(Math.random() * 0x7fffffff),
    );
    window.requestAnimationFrame(() => svgRef.current?.focus());
  }

  if (!maze || !player) {
    return <div className="maze-loading">GENERATING RANDOM PATHS…</div>;
  }

  const boardSize = maze.size * CELL + PADDING * 2;
  const startCenter = center(maze.start);
  const portal = exitPosition(maze);
  const playerClipRects = liquidClipRects(
    maze,
    liquidCells.length ? liquidCells : [player],
  );

  return (
    <section className="maze-game" aria-labelledby="maze-game-title">
      <div className="maze-game__bar">
        <div>
          <p className="play-kicker">GAME 01 / MAZE ESCAPE</p>
          <h2 id="maze-game-title">Find the liquid exit.</h2>
        </div>

        <div className="maze-difficulty" aria-label="미로 난이도">
          {(["low", "medium", "hard"] as Difficulty[]).map((level) => (
            <button
              className={difficulty === level ? "is-active" : ""}
              key={level}
              type="button"
              aria-pressed={difficulty === level}
              onClick={() => {
                setDifficulty(level);
                newGame(level);
              }}
            >
              {level.toUpperCase()}
              <span>{level === "low" ? "9×9" : level === "medium" ? "15×15" : "21×21"}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="maze-game__status">
        <span>START / CENTER</span>
        <span>MOVES / {String(moves).padStart(3, "0")}</span>
        <span>STATUS / {won ? "ESCAPED" : "EXPLORING"}</span>
        <span>SEED / {String(maze.seed >>> 0).slice(-6).padStart(6, "0")}</span>
        <button
          type="button"
          className="play-rankings-btn"
          onClick={() => setShowLeaderboard(true)}
        >
          🏆 RANKINGS
        </button>
      </div>

      <div className="maze-board-shell">
        <svg
          ref={svgRef}
          className="maze-board"
          viewBox={`0 0 ${boardSize} ${boardSize}`}
          role="application"
          tabIndex={0}
          aria-label={`${difficulty} 난이도 미로. 중앙에서 출구까지 이동하세요.`}
          aria-describedby="maze-instructions maze-live-status"
          onKeyDown={(event: KeyboardEvent<SVGSVGElement>) => {
            const direction = keyDirections[event.key];
            if (!direction) return;
            event.preventDefault();
            move(direction);
          }}
          onPointerDown={(event) => {
            swipe.current = {
              pointerId: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
              consumed: false,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
            event.currentTarget.focus();
          }}
          onPointerMove={(event) => {
            const gesture = swipe.current;
            if (
              !gesture ||
              gesture.pointerId !== event.pointerId ||
              gesture.consumed
            ) {
              return;
            }

            const x = event.clientX - gesture.startX;
            const y = event.clientY - gesture.startY;
            if (Math.max(Math.abs(x), Math.abs(y)) < SWIPE_THRESHOLD) return;

            gesture.consumed = true;
            if (Math.abs(x) > Math.abs(y)) {
              move(x > 0 ? "east" : "west");
            } else {
              move(y > 0 ? "south" : "north");
            }
          }}
          onPointerUp={() => {
            swipe.current = null;
          }}
          onPointerCancel={() => {
            swipe.current = null;
          }}
          onLostPointerCapture={() => {
            swipe.current = null;
          }}
        >
          <defs>
            <radialGradient id="maze-floor-light">
              <stop offset="0%" stopColor="var(--paper)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="var(--paper)" stopOpacity="0" />
            </radialGradient>
            <clipPath id="maze-player-path-clip" clipPathUnits="userSpaceOnUse">
              {playerClipRects.map(({ key, ...rect }) => (
                <rect key={key} {...rect} />
              ))}
            </clipPath>
            <filter id="maze-player-goo" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
              <feColorMatrix
                in="blur"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -10"
                result="goo"
              />
              <feComposite in="SourceGraphic" in2="goo" operator="atop" result="goo-shape" />
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.035 0.085"
                numOctaves="1"
                seed="9"
                result="player-noise"
              >
                <animate
                  attributeName="baseFrequency"
                  values="0.035 0.085;0.055 0.11;0.035 0.085"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              </feTurbulence>
              <feDisplacementMap
                in="goo-shape"
                in2="player-noise"
                scale="3.5"
                xChannelSelector="R"
                yChannelSelector="B"
              />
            </filter>
            <filter id="maze-portal-wave" x="-100%" y="-100%" width="300%" height="300%">
              <feTurbulence type="fractalNoise" baseFrequency="0.018 0.08" numOctaves="2" seed="12" result="noise">
                <animate attributeName="seed" values="3;11;19;3" dur="2.8s" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="13" />
            </filter>
          </defs>

          <rect className="maze-board__floor" width={boardSize} height={boardSize} rx="18" />
          <circle className="maze-board__aura" cx={startCenter.x} cy={startCenter.y} r={boardSize * 0.42} />

          <g className="maze-walls">
            {wallLines.map(({ key, ...line }) => <line {...line} key={key} />)}
          </g>

          <g className="maze-start">
            <circle cx={startCenter.x} cy={startCenter.y} r="12" />
            <circle cx={startCenter.x} cy={startCenter.y} r="20" />
          </g>

          <g className="maze-exit" filter="url(#maze-portal-wave)">
            <circle cx={portal.x} cy={portal.y} r="17" />
            <circle cx={portal.x} cy={portal.y} r="9" />
          </g>

          <g
            className="maze-player"
            filter="url(#maze-player-goo)"
            clipPath="url(#maze-player-path-clip)"
          >
            {[...liquidParticles].reverse().map((particle, reverseIndex) => {
              const index = liquidParticles.length - reverseIndex - 1;
              if (index === 0) {
                const stretch = Math.min(9, particle.speed * 0.7);
                const collisionSquash = liquidPlayer.impact * 8;
                return (
                  <ellipse
                    key="player-head"
                    cx={particle.x}
                    cy={particle.y}
                    rx={Math.max(8.5, 14 + stretch - collisionSquash)}
                    ry={Math.max(9, 14 - stretch * 0.38 + collisionSquash * 0.92)}
                    transform={`rotate(${particle.angle} ${particle.x} ${particle.y})`}
                  />
                );
              }
              return (
                <circle
                  key={`player-tail-${index}`}
                  cx={particle.x}
                  cy={particle.y}
                  r={Math.max(4.5, 11 - index * 0.85)}
                  opacity={Math.max(0.22, 0.9 - index * 0.1)}
                />
              );
            })}
            {liquidParticles[0] && (
              <circle
                className="maze-player__spark"
                cx={liquidParticles[0].x + 7}
                cy={liquidParticles[0].y - 7}
                r="5"
              />
            )}
          </g>
        </svg>

        {won && (
          <div className="maze-success" role="dialog" aria-modal="true" aria-labelledby="maze-success-title">
            <span>EXIT FOUND</span>
            <h3 id="maze-success-title">You escaped.</h3>
            <p>{moves}번의 움직임으로 액체 미로를 빠져나왔습니다.</p>
            <div className="maze-success-actions">
              <button ref={successButtonRef} type="button" className="maze-success-btn maze-success-btn--secondary" onClick={() => newGame()}>
                NEW RANDOM MAZE
              </button>
              <button type="button" className="maze-success-btn maze-success-btn--primary" onClick={() => setShowLeaderboard(true)}>
                🏆 VIEW RANKINGS
              </button>
            </div>
          </div>
        )}
      </div>

      <p id="maze-instructions" className="maze-instructions">
        KEYBOARD — ARROW KEYS / WASD · POINTER — SWIPE UP / DOWN / LEFT / RIGHT
      </p>
      <p id="maze-live-status" className="sr-only" aria-live="polite">
        {won ? `미로 탈출 성공. ${moves}번 이동했습니다.` : `현재 ${player ? player.row + 1 : 0}행 ${player ? player.col + 1 : 0}열`}
      </p>

      <div className="maze-actions">
        <button type="button" onClick={restart}>
          RESTART
          <span>SAME MAZE</span>
        </button>
        <button type="button" onClick={() => newGame()}>
          NEW GAME
          <span>RANDOM MAZE</span>
        </button>
      </div>

      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        gameId="maze"
        gameTitle="Maze Escape"
      />
    </section>
  );
}
