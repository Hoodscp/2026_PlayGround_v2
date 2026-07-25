"use client";

import type { MouseEvent } from "react";
import { useState } from "react";

import { requestLiquidNavigation } from "./liquid-page-transition";

type RouteBackButtonProps = {
  destination?: string;
  label?: string;
};

export function RouteBackButton({
  destination = "/",
  label = "RETURN TO THE SURFACE",
}: RouteBackButtonProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  function returnToSurface(event: MouseEvent<HTMLButtonElement>) {
    if (isLeaving) return;

    setIsLeaving(true);
    requestLiquidNavigation(destination, event);
    window.setTimeout(() => {
      if (window.location.pathname !== destination) window.location.assign(destination);
    }, 1400);
  }

  return (
    <button
      className="route-back-button"
      type="button"
      aria-label={`${label} — 홈으로 돌아가기`}
      disabled={isLeaving}
      onClick={returnToSurface}
    >
      <span>{isLeaving ? "RETURNING" : label}</span>
    </button>
  );
}
