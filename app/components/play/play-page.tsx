import { SectionIndicator } from "../navigation/section-indicator";
import { RouteBackButton } from "../route-back-button";
import { GameSelector } from "./game-selector";
import { MazeGame } from "./maze/maze-game";
import { BlobGame } from "./blob/blob-game";

const MAZE_SECTION_ID = "maze-escape";
const BLOB_SECTION_ID = "blob-liquid";

export function PlayPage() {
  return (
    <div className="route-page route-page--play">
      <main className="play-page">
        <GameSelector mazeTargetId={MAZE_SECTION_ID} blobTargetId={BLOB_SECTION_ID} />
        <div id={MAZE_SECTION_ID} className="play-game-anchor">
          <MazeGame />
        </div>
        <div id={BLOB_SECTION_ID} className="play-game-anchor">
          <BlobGame />
        </div>
        <footer className="play-footer">PLAYGROUND v2 / INTERACTIVE GAME LAB</footer>
      </main>
      <SectionIndicator number="01" name="PLAY" />
      <RouteBackButton />
    </div>
  );
}
