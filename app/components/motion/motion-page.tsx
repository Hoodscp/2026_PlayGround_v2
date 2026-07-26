import { RouteBackButton } from "../route-back-button";
import { MotionLab } from "./motion-lab";

export function MotionPage() {
  return (
    <div id="motion-page" className="route-page route-page--motion">
      <MotionLab />
      <RouteBackButton />
    </div>
  );
}
