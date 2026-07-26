"use client";

import { useState } from "react";

import { GooeyNavigation } from "../navigation/gooey-navigation";
import { SECTION_COPY, type SectionName } from "../navigation/sections";
import { SectionIndicator } from "../navigation/section-indicator";
import { Hero } from "./hero";

const DEFAULT_DESCRIPTION =
  "아이디어가 서로 붙고, 늘어나고, 새로운 형태로 바뀌는 디지털 플레이그라운드입니다.";

export function HomePage({ initialSection }: { initialSection?: SectionName }) {
  const [current, setCurrent] = useState<SectionName | undefined>(initialSection);
  const [description, setDescription] = useState(
    initialSection ? SECTION_COPY[initialSection] : DEFAULT_DESCRIPTION,
  );

  function changeSection(section: SectionName) {
    setCurrent(section);
    window.setTimeout(() => setDescription(SECTION_COPY[section]), 180);
  }

  const index = current ? Object.keys(SECTION_COPY).indexOf(current) + 1 : 0;

  return (
    <div id="home-page" className="route-page route-page--home">
      <main>
        <Hero description={description} />
      </main>
      <GooeyNavigation current={current} onSectionChange={changeSection} />
      <SectionIndicator
        number={String(index).padStart(2, "0")}
        name={current?.toUpperCase() ?? "HOME"}
      />
    </div>
  );
}
