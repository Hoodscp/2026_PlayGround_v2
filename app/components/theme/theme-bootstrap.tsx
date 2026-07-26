export function ThemeBootstrap() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(() => {
  try {
    const paper = localStorage.getItem("playground-paper");
    const ink = localStorage.getItem("playground-ink");
    if (paper) document.documentElement.style.setProperty("--paper", paper);
    if (ink) {
      document.documentElement.style.setProperty("--ink", ink);
      const value = ink.replace("#", "");
      const red = parseInt(value.slice(0, 2), 16);
      const green = parseInt(value.slice(2, 4), 16);
      const blue = parseInt(value.slice(4, 6), 16);
      const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
      document.documentElement.style.setProperty("--ink-contrast", brightness > 160 ? "#111111" : "#ffffff");
    }
    if (sessionStorage.getItem("playground-liquid-transition")) {
      document.documentElement.classList.add("liquid-transition-arriving");
    }
  } catch {}
})();`,
      }}
    />
  );
}
