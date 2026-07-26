import type { Metadata } from "next";

import { MotionPage as MotionPageContent } from "../components/motion/motion-page";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Motion Lab — PlayGround v2",
  description: "SVG Gooey 필터를 직접 조작하는 PlayGround v2 모션 실험실",
};

export default function MotionPage() {
  return <MotionPageContent />;
}
