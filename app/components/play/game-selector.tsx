"use client";

import { useRef } from "react";

const games = [
  {
    number: "01",
    title: "Maze Escape",
    type: "KEYBOARD + POINTER",
    description: "중앙에서 시작해 매번 달라지는 액체 미로의 출구를 찾으세요.",
    ready: true,
    targetId: "maze-escape",
  },
  {
    number: "02",
    title: "Blob.io Liquid",
    type: "MULTIPLAYER ARENA",
    description: "닉네임을 설정하고 액체 세포를 키워 다른 유저와 실시간 대전하세요.",
    ready: true,
    targetId: "blob-liquid",
  },
  { number: "03", title: "Blob Stack", type: "COMING SOON", description: "흐르는 형태를 무너지지 않게 쌓아 올립니다.", ready: false },
  { number: "04", title: "Echo Type", type: "COMING SOON", description: "사라지는 글자의 잔상을 기억하고 입력합니다.", ready: false },
  { number: "05", title: "Color Relay", type: "COMING SOON", description: "혼합된 색의 순서를 빠르게 따라갑니다.", ready: false },
  { number: "06", title: "Gravity Draw", type: "COMING SOON", description: "중력장을 그려 방울을 목적지로 보냅니다.", ready: false },
] as const;

export function GameSelector({
  mazeTargetId,
  blobTargetId,
}: {
  mazeTargetId?: string;
  blobTargetId?: string;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  function scrollToGame(targetId?: string) {
    if (!targetId) return;
    document.getElementById(targetId)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
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
          키보드와 포인터로 반응하는 인터랙티브 실험실입니다. Maze Escape와 
          멀티플레이 대전 Blob.io Liquid를 즐겨보세요.
        </p>
      </div>

      <div className="game-select__grid">
        {games.map((game, index) => (
          <button
            className={`game-card${game.ready ? " game-card--ready" : ""}`}
            key={game.number}
            type="button"
            disabled={!game.ready}
            aria-label={
              game.ready
                ? `${game.number} ${game.title} 시작`
                : `${game.number} ${game.title}, 준비 중`
            }
            onClick={
              game.ready
                ? () =>
                    scrollToGame(
                      game.targetId === "blob-liquid" ? blobTargetId : mazeTargetId
                    )
                : undefined
            }
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
              <g filter={`url(#game-card-goo-${index})`}>
                <circle className="game-card__blob game-card__blob--a" cx="126" cy="96" r={game.ready ? "58" : "48"} />
                <circle className="game-card__blob game-card__blob--b" cx="190" cy="88" r={game.ready ? "45" : "39"} />
                <circle className="game-card__blob game-card__blob--c" cx="226" cy="122" r={game.ready ? "26" : "21"} />
              </g>
              <path
                className="game-card__trace"
                d="M55 145 C105 22 218 168 276 44"
                filter={`url(#game-card-warp-${index})`}
              />
              <text x="24" y="38">{game.number}</text>
            </svg>

            <span className="game-card__meta">
              <strong>{game.title}</strong>
              <span>{game.type}</span>
            </span>
            <span className="game-card__description">{game.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
