import type { Metadata } from "next";

import { RouteBackButton } from "../components/route-back-button";
import { getMotionMarkup } from "../lib/legacy-content";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Motion Lab — PlayGround v2",
  description: "SVG Gooey 필터를 직접 조작하는 PlayGround v2 모션 실험실",
};

export default function MotionPage() {
  const markup = getMotionMarkup();

  return (
    <>
      <div
        id="motion-page"
        className="route-page route-page--motion"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: markup }}
      />
      <RouteBackButton />
      <script src="/legacy-script" defer />
    </>
  );
}
