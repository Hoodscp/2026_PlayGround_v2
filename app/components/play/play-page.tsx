"use client";

import { useState } from "react";
import { SectionIndicator } from "../navigation/section-indicator";
import { RouteBackButton } from "../route-back-button";
import { GameSelector, type GameId } from "./game-selector";
import { MazeGame } from "./maze/maze-game";
import { BlobGame } from "./blob/blob-game";
import { TetrisGame } from "./tetris/tetris-game";

export function PlayPage() {
  const [activeGame, setActiveGame] = useState<GameId | null>("maze-escape");

  return (
    <div className="route-page route-page--play">
      <main className="play-page">
        <GameSelector
          activeGame={activeGame}
          onSelectGame={(gameId) => setActiveGame(gameId)}
        />

        {/* Dynamic Game Loader Container (Mounts ONLY the selected game component) */}
        <div id="play-game-display" className="play-game-anchor">
          {activeGame === "maze-escape" && <MazeGame key="maze-game" />}
          {activeGame === "blob-liquid" && <BlobGame key="blob-game" />}
          {activeGame === "tetris-liquid" && <TetrisGame key="tetris-game" />}
        </div>

        <footer className="play-footer">PLAYGROUND v2 / INTERACTIVE GAME LAB</footer>
      </main>
      <SectionIndicator number="01" name="PLAY" />
      <RouteBackButton />
    </div>
  );
}
