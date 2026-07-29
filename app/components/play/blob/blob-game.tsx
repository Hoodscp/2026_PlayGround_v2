"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useBlobEngine } from "./use-blob-engine";

export function BlobGame() {
  const {
    canvasRef,
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
    viewportRef,
    COLORS,
  } = useBlobEngine();

  const [inputNickname, setInputNickname] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  // Sync canvas size with parent container
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        const rect = canvasRef.current.parentElement.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [canvasRef]);

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
    <div className="blob-game">
      {/* Pure Organic Gooey Liquid Filter Definition */}
      <svg className="blob-svg-defs" style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="blob-gooey-filter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
            />
          </filter>
        </defs>
      </svg>

      <div className="blob-game__bar">
        <div>
          <p className="play-kicker">02 / EXPERIMENT — MULTIPLAYER ARENA</p>
          <h2>Blob.io Liquid</h2>
        </div>
        <div className="blob-game__subinfo">
          <span>REALTIME BROADCAST MULTIPLAYER</span>
          <p>마우스로 조종하며 세포를 키우세요. 탭을 여러 개 열면 실시간 대전이 가능합니다.</p>
        </div>
      </div>

      {/* Main Board Container */}
      <div className="blob-board-shell">
        {/* 1. Canvas Layer (Liquid Blobs Only) */}
        <div
          className="blob-canvas-wrapper"
          onPointerMove={(e) => handlePointerMove(e.clientX, e.clientY)}
          onTouchMove={(e) => {
            if (e.touches.length > 0) {
              handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
        >
          <canvas ref={canvasRef} className="blob-canvas" />
        </div>

        {/* 2. Crisp & Clear UI Overlay Layer (Completely Isolated from SVG Filter Blur) */}
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

              <div className="blob-hud__controls">
                <span>[Space] 세포 분열 (Split)</span>
                <span>[W] 먹이 방출 (Eject Mass)</span>
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

          {/* Join Modal Overlay */}
          {!joined && (
            <div className="blob-join-modal">
              <form onSubmit={handleJoinSubmit} className="blob-join-card">
                <div className="blob-join-card__kicker">LIQUID BATTLE ARENA</div>
                <h3>Enter Blob Arena</h3>
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

          {/* Game Over Modal */}
          {joined && isDead && (
            <div className="blob-death-modal">
              <div className="blob-death-card">
                <span>ABSORBED BY ENEMY</span>
                <h3>Cell Dissolved!</h3>
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
    </div>
  );
}
