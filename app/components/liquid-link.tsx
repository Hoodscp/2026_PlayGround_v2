"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";

import { requestLiquidNavigation } from "./liquid-page-transition";

type LiquidLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

export function LiquidLink({ href, onClick, target, ...props }: LiquidLinkProps) {
  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      target === "_blank" ||
      href.startsWith("#")
    ) {
      return;
    }

    const destination = new URL(href, window.location.href);
    if (
      destination.origin !== window.location.origin ||
      `${destination.pathname}${destination.search}` ===
        `${window.location.pathname}${window.location.search}`
    ) {
      return;
    }

    event.preventDefault();
    requestLiquidNavigation(
      `${destination.pathname}${destination.search}${destination.hash}`,
      event,
    );
  }

  return <a {...props} href={href} target={target} onClick={navigate} />;
}
