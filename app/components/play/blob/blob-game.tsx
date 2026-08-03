"use client";

import { useState, useEffect, FormEvent } from "react";
import { useBlobEngine } from "./use-blob-engine";

export function BlobGame() {
  const {
    bgCanvasRef,
    blobsCanvasRef,
    labelsCanvasRef,
    joined,
    nickname,
    playerColor,
    isDead,
    score,
    leaderboard,
    WORLD_SIZE,
    joinGame,
    splitPlayer,
    ejectMass,
    handlePointerMove,
    resetWorld,
    viewportRef,
    COLORS,
  } = useBlobEngine();

  const [inputNickname, setInputNickname] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [activeMode, setActiveMode] = useState<"solo" | "multi">("solo");

  // Sync canvas size with parent container
  useEffect(() => {
    const updateCanvasSize = () => {
      const parent = bgCanvasRef.current?.parentElement || blobsCanvasRef.current?.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        [bgCanvasRef.current, blobsCanvasRef.current, labelsCanvasRef.current].forEach((cv) => {
          if (cv) {
            cv.width = rect.width;
            cv.height = rect.height;
          }
        });
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [bgCanvasRef, blobsCanvasRef, labelsCanvasRef]);

  // Handle Keyboard actions (Space = Split, W = Eject)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        splitPlayer();
      } else if (e.code === "KeyW") {
        e.preventDefault();
        ejectMass();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [splitPlayer, ejectMass]);

  const handleJoinSubmit = (e: FormEvent) => {
    e.preventDefault();
    joinGame(inputNickname, selectedColor);
  };

  return (
    <section className="blob-game" aria-labelledby="blob-game-title">
      {/* Organic Gooey & Liquid Distortion SVG Defs (Matching Maze SVG Filter style) */}
      <svg className="blob-svg-defs" style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <filter id="blob-gooey-filter" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6.5" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
              result="goo"
            />
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.02 0.05"
              numOctaves="1"
              seed="7"
              result="blob-noise"
            >
              <animate
                attributeName="baseFrequency"
                values="0.02 0.05;0.04 0.08;0.02 0.05"
                dur="2.5s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="goo"
              in2="blob-noise"
              scale="3.2"
              xChannelSelector="R"
              yChannelSelector="B"
            />
          </filter>
        </defs>
      </svg>

      {/* Top Header Bar (Matching Maze Header Bar layout & typography) */}
      <div className="blob-game__bar">
        <div>
          <p className="play-kicker">GAME 02 / BLOB LIQUID ARENA</p>
          <h2 id="blob-game-title">Survive the liquid arena.</h2>
        </div>

        <div className="blob-mode-selector" aria-label="아레나 모드 선택">
          <button
            className={activeMode === "solo" ? "is-active" : ""}
            type="button"
            onClick={() => setActiveMode("solo")}
          >
            SOLO ARENA
            <span>2400×2400 · BOTS</span>
          </button>
          <button
            className={activeMode === "multi" ? "is-active" : ""}
            type="button"
            onClick={() => setActiveMode("multi")}
          >
            LOCAL MULTIPLAYER
            <span>REALTIME SYNC</span>
          </button>
        </div>
      </div>

      {/* Status Bar (Matching Maze Status Bar) */}
      <div className="blob-game__status">
        <span>ARENA / 2400×2400 GRID</span>
        <span>MASS / {String(score).padStart(3, "0")}</span>
        <span>STATUS / {joined ? (isDead ? "DISSOLVED" : "ACTIVE CELL") : "WAITING ENTRANCE"}</span>
      </div>

      {/* Main Board Container */}
      <div className="blob-board-shell">
        {/* 1. Canvas Layer (Liquid Blobs & World) */}
        <div
          className="blob-canvas-wrapper"
          onPointerMove={(e) => handlePointerMove(e.clientX, e.clientY)}
          onTouchMove={(e) => {
            if (e.touches.length > 0) {
              handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
        >
          <canvas ref={bgCanvasRef} className="blob-canvas blob-canvas--bg" />
          <canvas ref={blobsCanvasRef} className="blob-canvas blob-canvas--blobs" />
          <canvas ref={labelsCanvasRef} className="blob-canvas blob-canvas--labels" />
        </div>

        {/* 2. Crisp UI Overlay Layer */}
        <div className="blob-ui-overlay">
          {/* HUD Overlay when playing */}
          {joined && !isDead && (
            <>
              {/* Leaderboard */}
              <div className="blob-hud__leaderboard">
                <div className="blob-hud__title">TOP PLAYERS</div>
                <ol>
                  {leaderboard.map((item, idx) => (
                    <li key={item.id} className={item.isPlayer ? "is-player" : ""}>
                      <span className="rank">{idx + 1}.</span>
                      <span className="name">{item.name}</span>
                      <span className="score">{item.score}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Player Stats & Controls Info */}
              <div className="blob-hud__stats">
                <div className="blob-stat-card">
                  <span className="label">NICKNAME</span>
                  <span className="val">{nickname}</span>
                </div>
                <div className="blob-stat-card">
                  <span className="label">MASS / SCORE</span>
                  <span className="val">{score}</span>
                </div>
              </div>

              {/* Minimap */}
              <div className="blob-hud__minimap">
                <div
                  className="blob-hud__minimap-pin"
                  style={{
                    left: `${(viewportRef.current.x / WORLD_SIZE) * 100}%`,
                    top: `${(viewportRef.current.y / WORLD_SIZE) * 100}%`,
                    backgroundColor: playerColor,
                  }}
                />
              </div>
            </>
          )}

          {/* Join Modal Overlay (Matching Maze Success Modal aesthetic) */}
          {!joined && (
            <div className="blob-join-modal" role="dialog" aria-modal="true" aria-labelledby="blob-join-title">
              <form onSubmit={handleJoinSubmit} className="blob-join-card">
                <span className="blob-join-card__kicker">LIQUID BATTLE ARENA</span>
                <h3 id="blob-join-title">Enter Blob Arena</h3>
                <p>닉네임과 세포 액체 색상을 선택하고 입장하세요.</p>

                <div className="blob-join-card__field">
                  <label htmlFor="blob-nickname-input">NICKNAME</label>
                  <input
                    id="blob-nickname-input"
                    type="text"
                    maxLength={14}
                    placeholder="Enter nickname..."
                    value={inputNickname}
                    onChange={(e) => setInputNickname(e.target.value)}
                    required
                  />
                </div>

                <div className="blob-join-card__colors">
                  <label>BLOB COLOR</label>
                  <div className="color-picker-grid">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`color-btn ${selectedColor === c ? "is-selected" : ""}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setSelectedColor(c)}
                        aria-label={`Select color ${c}`}
                      />
                    ))}
                  </div>
                </div>

                <button type="submit" className="blob-join-btn">
                  JOIN ARENA NOW
                </button>
              </form>
            </div>
          )}

          {/* Game Over Modal (Matching Maze Win Modal aesthetic) */}
          {joined && isDead && (
            <div className="blob-death-modal" role="dialog" aria-modal="true" aria-labelledby="blob-death-title">
              <div className="blob-death-card">
                <span>ABSORBED BY ENEMY</span>
                <h3 id="blob-death-title">Cell Dissolved!</h3>
                <p>다른 세포에 의해 흡수되었습니다. 최종 점수: <strong>{score}</strong></p>

                <button
                  type="button"
                  className="blob-respawn-btn"
                  onClick={() => joinGame(nickname, playerColor)}
                >
                  RE-ENTER ARENA
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions below board (Matching Maze instructions) */}
      <p id="blob-instructions" className="blob-instructions">
        KEYBOARD — [SPACE] SPLIT CELL / [W] EJECT MASS · POINTER — MOVE CURSOR TO GUIDE
      </p>

      {/* Action Buttons (Matching Maze Action Buttons) */}
      <div className="blob-actions">
        <button
          type="button"
          onClick={() => {
            if (joined && nickname) joinGame(nickname, playerColor);
            else resetWorld();
          }}
        >
          RESPAWN
          <span>{joined ? "RE-ENTER ARENA" : "NEW CELL"}</span>
        </button>
        <button type="button" onClick={resetWorld}>
          RESET WORLD
          <span>RESPAWN BOTS & FOOD</span>
        </button>
      </div>
    </section>
  );
}
