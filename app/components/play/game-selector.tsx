"use client";

import { useRef } from "react";

export type GameId = "maze-escape" | "blob-liquid" | "tetris-liquid" | "blob-defense";

const games = [
  {
    number: "01",
    title: "Maze Escape",
    type: "KEYBOARD + POINTER",
    description: "중앙에서 시작해 매번 달라지는 액체 미로의 출구를 찾으세요.",
    ready: true,
    targetId: "maze-escape" as GameId,
  },
  {
    number: "02",
    title: "Blob.io Liquid",
    type: "MULTIPLAYER ARENA",
    description: "닉네임을 설정하고 액체 세포를 키워 다른 유저와 실시간 대전하세요.",
    ready: true,
    targetId: "blob-liquid" as GameId,
  },
  {
    number: "03",
    title: "Liquid Tetris",
    type: "KEYBOARD + TOUCH",
    description: "SVG 필터 기반 액체 블록 융합과 바운스 효과가 적용된 감각적인 테트리스.",
    ready: true,
    targetId: "tetris-liquid" as GameId,
  },
  {
    number: "04",
    title: "Blob Defense",
    type: "AUTO TOWER + UPGRADES",
    description: "중앙의 액체 코어를 성장시키고 달라붙는 적들을 저지하는 디펜스.",
    ready: true,
    targetId: "blob-defense" as GameId,
  },
  { number: "05", title: "Color Relay", type: "COMING SOON", description: "혼합된 색의 순서를 빠르게 따라갑니다.", ready: false, targetId: undefined },
  { number: "06", title: "Gravity Draw", type: "COMING SOON", description: "중력장을 그려 방울을 목적지로 보냅니다.", ready: false, targetId: undefined },
] as const;

export function GameSelector({
  activeGame,
  onSelectGame,
}: {
  activeGame: GameId | null;
  onSelectGame: (gameId: GameId) => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  function handleCardClick(targetId?: GameId) {
    if (!targetId) return;
    onSelectGame(targetId);
    setTimeout(() => {
      document.getElementById("play-game-display")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    }, 50);
  }

  function renderGameCardVisual(targetId?: GameId, index: number = 0) {
    switch (targetId) {
      case "maze-escape":
        return (
          <>
            {/* Maze Grid & Flow Liquid Path Visual */}
            <g filter={`url(#game-card-goo-${index})`}>
              <circle className="game-card__blob game-card__blob--a" cx="75" cy="115" r="28" />
              <circle className="game-card__blob game-card__blob--b" cx="130" cy="115" r="22" />
              <circle className="game-card__blob game-card__blob--a" cx="130" cy="65" r="24" />
              <circle className="game-card__blob game-card__blob--b" cx="210" cy="65" r="26" />
              <circle className="game-card__blob game-card__blob--c" cx="245" cy="120" r="16" />
            </g>
            {/* Grid Maze Path Lines */}
            <path
              className="game-card__trace"
              d="M 60 115 H 130 V 65 H 210 V 120 H 260"
              strokeDasharray="4 4"
              strokeWidth="2"
              opacity="0.6"
            />
            {/* Goal exit marker */}
            <rect x="250" y="110" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.8" />
          </>
        );

      case "blob-liquid":
        return (
          <>
            {/* Agario Split & Eject Liquid Blob Cells */}
            <g filter={`url(#game-card-goo-${index})`}>
              {/* Main divided player cells */}
              <circle className="game-card__blob game-card__blob--a" cx="140" cy="95" r="42" />
              <circle className="game-card__blob game-card__blob--b" cx="195" cy="115" r="28" />
              <circle className="game-card__blob game-card__blob--c" cx="95" cy="125" r="20" />
            </g>
            {/* Small ejected mass food particles */}
            <circle cx="230" cy="70" r="6" fill="currentColor" opacity="0.9" />
            <circle cx="245" cy="85" r="5" fill="currentColor" opacity="0.8" />
            <circle cx="225" cy="140" r="7" fill="currentColor" opacity="0.9" />
            <circle cx="70" cy="75" r="6" fill="currentColor" opacity="0.7" />
          </>
        );

      case "tetris-liquid":
        return (
          <>
            {/* Falling Soft-body Liquid Tetrimino Blocks */}
            <g filter={`url(#game-card-goo-${index})`}>
              {/* T-Piece Block Fusion */}
              <rect x="110" y="55" width="28" height="28" rx="8" className="game-card__blob game-card__blob--a" />
              <rect x="135" y="55" width="28" height="28" rx="8" className="game-card__blob game-card__blob--a" />
              <rect x="160" y="55" width="28" height="28" rx="8" className="game-card__blob game-card__blob--a" />
              <rect x="135" y="80" width="28" height="28" rx="8" className="game-card__blob game-card__blob--a" />
              
              {/* L-Piece Landing Block Fusion below */}
              <rect x="160" y="110" width="26" height="26" rx="7" className="game-card__blob game-card__blob--b" />
              <rect x="184" y="110" width="26" height="26" rx="7" className="game-card__blob game-card__blob--b" />
              <rect x="208" y="110" width="26" height="26" rx="7" className="game-card__blob game-card__blob--b" />
              <rect x="208" y="86" width="26" height="26" rx="7" className="game-card__blob game-card__blob--b" />
            </g>
            {/* Matrix Drop Guide Lines */}
            <line x1="124" y1="30" x2="124" y2="150" stroke="currentColor" strokeDasharray="3 3" opacity="0.2" />
            <line x1="174" y1="30" x2="174" y2="150" stroke="currentColor" strokeDasharray="3 3" opacity="0.2" />
          </>
        );

      case "blob-defense":
        return (
          <>
            {/* Center Core, Shield Ring & Multi-Target Lasers */}
            <g filter={`url(#game-card-goo-${index})`}>
              {/* Center Core */}
              <circle className="game-card__blob game-card__blob--a" cx="160" cy="95" r="38" />
              {/* Surrounding tentacles / orbit defense blobs */}
              <circle className="game-card__blob game-card__blob--b" cx="115" cy="70" r="16" />
              <circle className="game-card__blob game-card__blob--b" cx="205" cy="70" r="16" />
              <circle className="game-card__blob game-card__blob--b" cx="115" cy="120" r="16" />
              <circle className="game-card__blob game-card__blob--b" cx="205" cy="120" r="16" />
            </g>
            {/* Barrier Shield Orbit */}
            <circle cx="160" cy="95" r="54" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.7" />
            {/* Multi-Target Firing Rays */}
            <line x1="160" y1="95" x2="65" y2="45" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
            <line x1="160" y1="95" x2="255" y2="45" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
            <line x1="160" y1="95" x2="65" y2="145" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
            <line x1="160" y1="95" x2="255" y2="145" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
          </>
        );

      default:
        return (
          <g filter={`url(#game-card-goo-${index})`}>
            <circle className="game-card__blob game-card__blob--a" cx="140" cy="95" r="40" />
            <circle className="game-card__blob game-card__blob--b" cx="185" cy="95" r="26" />
          </g>
        );
    }
  }

  return (
    <section className="game-select" aria-labelledby="game-select-title">
      <div className="game-select__intro">
        <p className="play-kicker">01 / PLAY</p>
        <h1 ref={headingRef} id="game-select-title">
          Choose your
          <br />
          experiment.
        </h1>
        <p>
          키보드와 포인터로 반응하는 인터랙티브 실험실입니다. 게임을 선택하면 해당 
          실험실만 동적으로 로드되어 즉시 시작할 수 있습니다.
        </p>
      </div>

      <div className="game-select__grid">
        {games.map((game, index) => {
          const isActive = game.ready && activeGame === game.targetId;
          return (
            <button
              className={`game-card${game.ready ? " game-card--ready" : ""}${isActive ? " is-active" : ""}`}
              key={game.number}
              type="button"
              disabled={!game.ready}
              aria-label={
                game.ready
                  ? `${game.number} ${game.title} 실행`
                  : `${game.number} ${game.title}, 준비 중`
              }
              onClick={() => handleCardClick(game.targetId)}
            >
              <svg
                className="game-card__visual"
                viewBox="0 0 320 190"
                aria-hidden="true"
              >
                <defs>
                  <filter
                    id={`game-card-goo-${index}`}
                    x="-40%"
                    y="-60%"
                    width="180%"
                    height="220%"
                  >
                    <feGaussianBlur in="SourceGraphic" stdDeviation={game.ready ? "10" : "7"} result="blur" />
                    <feColorMatrix
                      in="blur"
                      values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10"
                      result="goo"
                    />
                    <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                  </filter>
                  <filter id={`game-card-warp-${index}`}>
                    <feTurbulence
                      type="fractalNoise"
                      baseFrequency="0.015 0.08"
                      numOctaves="1"
                      seed={index + 4}
                      result="noise"
                    >
                      {game.ready && (
                        <animate
                          attributeName="baseFrequency"
                          values="0.015 0.08;0.025 0.12;0.015 0.08"
                          dur="4s"
                          repeatCount="indefinite"
                        />
                      )}
                    </feTurbulence>
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale={game.ready ? "11" : "4"} />
                  </filter>
                </defs>

                {/* Unique SVG Visual tailored to each game's characteristic */}
                {renderGameCardVisual(game.targetId, index)}

                <text x="24" y="38">{game.number}</text>
              </svg>

              <span className="game-card__meta">
                <strong>{game.title}</strong>
                <span>{isActive ? "LOADED & RUNNING" : game.type}</span>
              </span>
              <span className="game-card__description">{game.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
