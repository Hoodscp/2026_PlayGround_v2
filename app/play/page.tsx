import type { Metadata } from "next";

import { PlayPage } from "../components/play/play-page";
import "./play.css";

export const metadata: Metadata = {
  title: "Play Lab — PlayGround v2",
  description: "키보드와 포인터로 즐기는 PlayGround v2 인터랙티브 게임 실험실",
};

export default function PlayRoute() {
  return <PlayPage />;
}
