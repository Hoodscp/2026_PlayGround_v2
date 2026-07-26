"use client";

import { useEffect, useRef, useState } from "react";

import { requestLiquidNavigation } from "../liquid-page-transition";
import { SECTIONS, type SectionName } from "./sections";

export function GooeyNavigation({
  current,
  onSectionChange,
  motionPage = false,
}: {
  current?: SectionName;
  onSectionChange?: (section: SectionName, index: number) => void;
  motionPage?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }

    function handleOutsideClick(event: MouseEvent) {
      if (open && !navRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [open]);

  function select(section: SectionName, index: number, button: HTMLButtonElement) {
    onSectionChange?.(section, index);

    if (section === "Motion") {
      setOpen(false);
      if (motionPage) return;
      const rect = button.getBoundingClientRect();
      requestLiquidNavigation("/motion", {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      });
    } else if (motionPage) {
      requestLiquidNavigation(`/?section=${section.toLowerCase()}`);
    }
  }

  return (
    <nav
      ref={navRef}
      className={`gooey-nav${open ? " is-open" : ""}`}
      aria-label="PlayGround 섹션"
    >
      <div className="gooey-nav__blob" aria-hidden="true" />
      <div className="gooey-nav__items">
        {SECTIONS.map((section, index) => (
          <button
            className={`nav-item nav-item--${index + 1}${current === section ? " is-active" : ""}`}
            key={section}
            type="button"
            aria-pressed={current === section}
            onClick={(event) => select(section, index, event.currentTarget)}
          >
            <span className="nav-item__number">{String(index + 1).padStart(2, "0")}</span>
            <span className="nav-item__label">{section}</span>
          </button>
        ))}
        <button
          ref={toggleRef}
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-label={open ? "탐색 메뉴 닫기" : "탐색 메뉴 열기"}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="menu-toggle__icon" aria-hidden="true" />
          <span className="menu-toggle__text">MENU</span>
        </button>
      </div>
    </nav>
  );
}
