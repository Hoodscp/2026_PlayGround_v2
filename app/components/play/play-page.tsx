import { GooeyNavigation } from "../navigation/gooey-navigation";
import { SectionIndicator } from "../navigation/section-indicator";
import { RouteBackButton } from "../route-back-button";
import { GameSelector } from "./game-selector";
import { MazeGame } from "./maze/maze-game";

const MAZE_SECTION_ID = "maze-escape";

export function PlayPage() {
  return (
    <div className="route-page route-page--play">
      <main className="play-page">
        <GameSelector gameTargetId={MAZE_SECTION_ID} />
        <div id={MAZE_SECTION_ID} className="play-game-anchor">
          <MazeGame />
        </div>
        <footer className="play-footer">PLAYGROUND v2 / INTERACTIVE GAME LAB</footer>
      </main>
      {/* <GooeyNavigation current="Play" page="play" /> */}
      <SectionIndicator number="01" name="PLAY" />
      <RouteBackButton />
    </div>
  );
}
