"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export function DemoCard({
  number,
  title,
  description,
  action,
  wide = false,
  children,
}: {
  number: string;
  title: string;
  description: string;
  action: string;
  wide?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <article
      ref={ref}
      className={`demo-card${wide ? " demo-card--wide" : ""}${visible ? " is-visible" : ""}`}
    >
      <header className="demo-card__header">
        <span>{number}</span>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <span>{action}</span>
      </header>
      {children}
    </article>
  );
}
