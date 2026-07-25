(() => {
const menu = document.querySelector(".gooey-nav");
const toggle = document.querySelector("#menu-toggle");
const items = [...document.querySelectorAll(".nav-item")];
const description = document.querySelector("#panel-description");
const sectionNumber = document.querySelector("#section-number");
const sectionName = document.querySelector("#section-name");
const motionLab = document.querySelector("#motion-lab");
const labControls = document.querySelector("#lab-controls-panel");
const controlsTrigger = document.querySelector("#controls-trigger");
const controlsTriggerIcon = document.querySelector("#controls-trigger-icon");
const paperColorControl = document.querySelector("#paper-color-control");
const inkColorControl = document.querySelector("#ink-color-control");
const resetTheme = document.querySelector("#reset-theme");
const heroLogo = document.querySelector(".hero-logo");
const logoGlitchMap = document.querySelector("#logo-glitch-map");
const logoGlitchNoise = document.querySelector("#logo-glitch-noise");
let controlsCloseTimer;

const initializationKey = motionLab
  ? "__PLAYGROUND_MOTION_INITIALIZED__"
  : "__PLAYGROUND_HOME_INITIALIZED__";

if (window[initializationKey]) return;
window[initializationKey] = true;

const sectionCopy = {
  Play: "규칙을 잠시 내려놓고, 형태와 움직임을 자유롭게 실험하는 공간입니다.",
  Ideas: "작은 질문에서 시작된 생각들을 모으고 서로 연결해 봅니다.",
  Motion: "속도, 리듬, 탄성으로 화면에 살아 있는 반응을 만들어 냅니다.",
  Type: "글자를 정보가 아닌 하나의 조형 재료처럼 다루는 실험실입니다.",
  Color: "색의 충돌과 혼합을 통해 예상 밖의 분위기와 감각을 탐색합니다.",
  About: "PlayGround v2는 웹의 시각 언어를 가볍게 시험하는 작은 연구 공간입니다.",
};

function setMenu(open) {
  menu.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "탐색 메뉴 닫기" : "탐색 메뉴 열기");
}

function setControlsOpen(open) {
  if (!controlsTrigger || !controlsTriggerIcon) return;
  window.clearTimeout(controlsCloseTimer);
  document.body.classList.toggle("controls-open", open);
  controlsTrigger.setAttribute("aria-expanded", String(open));
  controlsTriggerIcon.textContent = open ? "↑" : "↓";
}

function scheduleControlsClose() {
  if (!labControls || !controlsTrigger) return;
  window.clearTimeout(controlsCloseTimer);
  controlsCloseTimer = window.setTimeout(() => {
    if (!labControls.matches(":hover, :focus-within") && !controlsTrigger.matches(":hover")) {
      setControlsOpen(false);
    }
  }, 220);
}

if (controlsTrigger && labControls) {
  controlsTrigger.addEventListener("pointerenter", () => setControlsOpen(true));
  controlsTrigger.addEventListener("pointerleave", scheduleControlsClose);
  controlsTrigger.addEventListener("click", () => {
    setControlsOpen(!document.body.classList.contains("controls-open"));
  });
  labControls.addEventListener("pointerenter", () => {
    window.clearTimeout(controlsCloseTimer);
    setControlsOpen(true);
  });
  labControls.addEventListener("pointerleave", scheduleControlsClose);
  labControls.addEventListener("focusin", () => setControlsOpen(true));
  labControls.addEventListener("focusout", scheduleControlsClose);
}

function applyTheme(paper, ink) {
  const value = ink.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  document.documentElement.style.setProperty("--paper", paper);
  document.documentElement.style.setProperty("--ink", ink);
  document.documentElement.style.setProperty(
    "--ink-contrast",
    brightness > 160 ? "#111111" : "#ffffff",
  );
}

const savedPaper = window.localStorage.getItem("playground-paper") || "#f7f7f2";
const savedInk = window.localStorage.getItem("playground-ink") || "#111111";
applyTheme(savedPaper, savedInk);

if (paperColorControl && inkColorControl) {
  paperColorControl.value = savedPaper;
  inkColorControl.value = savedInk;

  const updateTheme = () => {
    applyTheme(paperColorControl.value, inkColorControl.value);
    window.localStorage.setItem("playground-paper", paperColorControl.value);
    window.localStorage.setItem("playground-ink", inkColorControl.value);
  };

  paperColorControl.addEventListener("input", updateTheme);
  inkColorControl.addEventListener("input", updateTheme);
  resetTheme?.addEventListener("click", () => {
    paperColorControl.value = "#f7f7f2";
    inkColorControl.value = "#111111";
    updateTheme();
  });
}

if (heroLogo && logoGlitchMap && logoGlitchNoise) {
  const logoReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let logoGlitchTimer;

  function scheduleLogoGlitch(delay = 1800) {
    window.clearTimeout(logoGlitchTimer);
    if (logoReducedMotion.matches) {
      logoGlitchMap.setAttribute("scale", "0");
      heroLogo.removeAttribute("data-glitching");
      return;
    }

    logoGlitchTimer = window.setTimeout(runLogoGlitch, delay);
  }

  function runLogoGlitch() {
    const seed = String(Math.floor(Math.random() * 97) + 3);
    const burst = [0, 16, 5, 22, 3, 13, 0];

    logoGlitchNoise.setAttribute("seed", seed);
    heroLogo.setAttribute("data-glitching", "true");

    burst.forEach((scale, index) => {
      window.setTimeout(() => {
        logoGlitchMap.setAttribute("scale", String(scale));
      }, index * 46);
    });

    window.setTimeout(() => {
      logoGlitchMap.setAttribute("scale", "0");
      heroLogo.removeAttribute("data-glitching");
      scheduleLogoGlitch(1200 + Math.random());
    }, burst.length * 46 + 40);
  }

  logoReducedMotion.addEventListener("change", () => scheduleLogoGlitch());
  scheduleLogoGlitch();
}

toggle.addEventListener("click", () => {
  setMenu(!menu.classList.contains("is-open"));
});

items.forEach((item, index) => {
  item.setAttribute("aria-pressed", "false");
  item.addEventListener("click", () => {
    const name = item.dataset.section;

    items.forEach((button) => {
      button.classList.toggle("is-active", button === item);
      button.setAttribute("aria-pressed", String(button === item));
    });

    if (description) {
      description.classList.add("is-changing");
      window.setTimeout(() => {
        description.textContent = sectionCopy[name];
        sectionNumber.textContent = String(index + 1).padStart(2, "0");
        sectionName.textContent = name.toUpperCase();
        description.classList.remove("is-changing");
      }, 180);
    }

    if (name === "Motion") {
      setMenu(false);
      if (motionLab) return;

      const rect = item.getBoundingClientRect();
      document.dispatchEvent(
        new CustomEvent("playground:liquid-navigate", {
          detail: {
            href: "/motion",
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          },
        }),
      );
      window.setTimeout(() => {
        if (window.location.pathname !== "/motion") window.location.assign("/motion");
      }, 1400);
    } else if (motionLab) {
      document.dispatchEvent(
        new CustomEvent("playground:liquid-navigate", {
          detail: { href: `/?section=${name.toLowerCase()}` },
        }),
      );
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenu(false);
    setControlsOpen(false);
    toggle.focus();
  }
});

document.addEventListener("click", (event) => {
  if (menu.classList.contains("is-open") && !menu.contains(event.target)) {
    setMenu(false);
  }
});

if (motionLab) {
  sectionNumber.textContent = "03";
  sectionName.textContent = "MOTION";

const cardObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        cardObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 },
);
document.querySelectorAll(".demo-card").forEach((card) => cardObserver.observe(card));

// Live controls
const controls = {
  blur: document.querySelector("#blur-control"),
  density: document.querySelector("#density-control"),
  size: document.querySelector("#size-control"),
  distance: document.querySelector("#distance-control"),
  speed: document.querySelector("#speed-control"),
  color: document.querySelector("#color-control"),
  blend: document.querySelector("#blend-control"),
};

const outputs = {
  blur: document.querySelector("#blur-output"),
  density: document.querySelector("#density-output"),
  size: document.querySelector("#size-output"),
  distance: document.querySelector("#distance-output"),
  speed: document.querySelector("#speed-output"),
};

const demoBlur = document.querySelector("#demo-blur");
const demoMatrix = document.querySelector("#demo-matrix");
const blendReadout = document.querySelector("#blend-readout");
const colorBlobs = document.querySelector("#color-blobs");

function matrixValue(density) {
  const cutoff = Math.round(density * -0.45);
  return `1 0 0 0 0
          0 1 0 0 0
          0 0 1 0 0
          0 0 0 ${density} ${cutoff}`;
}

function updateControls() {
  const blur = controls.blur.value;
  const density = controls.density.value;
  const size = controls.size.value;
  const distance = controls.distance.value;
  const speed = controls.speed.value;

  demoBlur.setAttribute("stdDeviation", blur);
  demoMatrix.setAttribute("values", matrixValue(density));
  motionLab.style.setProperty("--demo-size", size);
  motionLab.style.setProperty("--demo-distance", `${distance}px`);
  motionLab.style.setProperty("--demo-speed", speed);
  motionLab.style.setProperty("--demo-color", controls.color.value);
  colorBlobs.style.setProperty("--blend-mode", controls.blend.value);

  outputs.blur.value = blur;
  outputs.density.value = density;
  outputs.size.value = Number(size).toFixed(2);
  outputs.distance.value = distance;
  outputs.speed.value = Number(speed).toFixed(1);
  blendReadout.textContent = controls.blend.value.toUpperCase();

  drawElasticBridge();
}

Object.values(controls).forEach((control) => {
  control.addEventListener("input", updateControls);
});

document.querySelector("#reset-controls").addEventListener("click", () => {
  controls.blur.value = 8;
  controls.density.value = 20;
  controls.size.value = 1;
  controls.distance.value = 110;
  controls.speed.value = 1;
  controls.color.value = "#ffffff";
  controls.blend.value = "multiply";
  updateControls();
});

// 01 Magnetic cursor
const cursorStage = document.querySelector("#cursor-stage");
const cursorDots = [...document.querySelectorAll(".cursor-dot")];
const cursorTarget = { x: 0, y: 0 };
const cursorPositions = cursorDots.map(() => ({ x: 0, y: 0 }));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let cursorAnimationFrame = 0;
let cursorStageVisible = false;

function centerCursorDots() {
  const rect = cursorStage.getBoundingClientRect();
  cursorTarget.x = rect.width / 2;
  cursorTarget.y = rect.height / 2;
  cursorPositions.forEach((point) => {
    point.x = cursorTarget.x;
    point.y = cursorTarget.y;
  });
}

cursorStage.addEventListener("pointermove", (event) => {
  const rect = cursorStage.getBoundingClientRect();
  cursorTarget.x = event.clientX - rect.left;
  cursorTarget.y = event.clientY - rect.top;
});

cursorStage.addEventListener("pointerleave", centerCursorDots);

function animateCursor() {
  cursorAnimationFrame = 0;
  let lead = cursorTarget;
  cursorPositions.forEach((point, index) => {
    const ease = 0.22 - index * 0.027;
    point.x += (lead.x - point.x) * ease * Number(controls.speed.value);
    point.y += (lead.y - point.y) * ease * Number(controls.speed.value);
    cursorDots[index].style.transform =
      `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`;
    lead = point;
  });
  if (cursorStageVisible && !reducedMotion.matches) {
    cursorAnimationFrame = requestAnimationFrame(animateCursor);
  }
}

function updateCursorAnimation() {
  if (cursorStageVisible && !reducedMotion.matches && !cursorAnimationFrame) {
    cursorAnimationFrame = requestAnimationFrame(animateCursor);
  } else if ((!cursorStageVisible || reducedMotion.matches) && cursorAnimationFrame) {
    cancelAnimationFrame(cursorAnimationFrame);
    cursorAnimationFrame = 0;
  }
}

centerCursorDots();
const cursorObserver = new IntersectionObserver(
  ([entry]) => {
    cursorStageVisible = entry.isIntersecting;
    updateCursorAnimation();
  },
  { threshold: 0.05 },
);
cursorObserver.observe(cursorStage);
reducedMotion.addEventListener("change", updateCursorAnimation);
window.addEventListener("resize", centerCursorDots);

// 03 Gooey burst button
const burstWrap = document.querySelector("#burst-wrap");
document.querySelector("#burst-button").addEventListener("click", () => {
  burstWrap.classList.remove("is-popped");
  void burstWrap.offsetWidth;
  burstWrap.classList.add("is-popped");
  window.setTimeout(() => burstWrap.classList.remove("is-popped"), 720);
});

// 04 Fluid tab navigation
const blobTabs = document.querySelector("#blob-tabs");
const blobTabButtons = [...blobTabs.querySelectorAll("button")];
blobTabButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    blobTabs.style.setProperty("--active-index", index);
    blobTabButtons.forEach((tab) => tab.classList.toggle("is-selected", tab === button));
  });
});

// 07 Elastic connection
const elasticStage = document.querySelector("#elastic-stage");
const elasticSvg = document.querySelector("#elastic-svg");
const elasticHandle = document.querySelector("#elastic-handle");
const elasticBridge = document.querySelector("#elastic-bridge");
const elasticAnchor = { x: 245, y: 140, r: 52 };
const elasticPoint = { x: 480, y: 140, r: 52 };
let draggingElastic = false;

function drawElasticBridge() {
  if (!elasticBridge) return;
  const dx = elasticPoint.x - elasticAnchor.x;
  const dy = elasticPoint.y - elasticAnchor.y;
  const distance = Math.hypot(dx, dy);
  const maxDistance = Number(controls.distance.value) * 2.8;

  if (distance > maxDistance || distance < 1) {
    elasticBridge.setAttribute("d", "");
    return;
  }

  const angle = Math.atan2(dy, dx);
  const perpendicular = angle + Math.PI / 2;
  const tension = Math.max(12, 42 * (1 - distance / maxDistance));
  const ax1 = elasticAnchor.x + Math.cos(perpendicular) * tension;
  const ay1 = elasticAnchor.y + Math.sin(perpendicular) * tension;
  const ax2 = elasticAnchor.x - Math.cos(perpendicular) * tension;
  const ay2 = elasticAnchor.y - Math.sin(perpendicular) * tension;
  const bx1 = elasticPoint.x + Math.cos(perpendicular) * tension;
  const by1 = elasticPoint.y + Math.sin(perpendicular) * tension;
  const bx2 = elasticPoint.x - Math.cos(perpendicular) * tension;
  const by2 = elasticPoint.y - Math.sin(perpendicular) * tension;
  const mx = (elasticAnchor.x + elasticPoint.x) / 2;
  const my = (elasticAnchor.y + elasticPoint.y) / 2;

  elasticBridge.setAttribute(
    "d",
    `M ${ax1} ${ay1} Q ${mx} ${my} ${bx1} ${by1}
     L ${bx2} ${by2} Q ${mx} ${my} ${ax2} ${ay2} Z`,
  );
}

function pointerToSvg(event) {
  const point = elasticSvg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(elasticSvg.getScreenCTM().inverse());
}

elasticHandle.addEventListener("pointerdown", (event) => {
  draggingElastic = true;
  elasticHandle.setPointerCapture(event.pointerId);
});

elasticHandle.addEventListener("pointermove", (event) => {
  if (!draggingElastic) return;
  const point = pointerToSvg(event);
  elasticPoint.x = Math.max(80, Math.min(720, point.x));
  elasticPoint.y = Math.max(65, Math.min(215, point.y));
  elasticHandle.setAttribute("cx", elasticPoint.x);
  elasticHandle.setAttribute("cy", elasticPoint.y);
  drawElasticBridge();
});

elasticHandle.addEventListener("pointerup", () => {
  draggingElastic = false;
});

elasticStage.addEventListener("pointerleave", () => {
  draggingElastic = false;
});

// 08 Bubble toggle
const bubbleToggle = document.querySelector("#bubble-toggle");
bubbleToggle.addEventListener("click", () => {
  const enabled = !bubbleToggle.classList.contains("is-on");
  bubbleToggle.classList.toggle("is-on", enabled);
  bubbleToggle.setAttribute("aria-checked", String(enabled));
});

// 09 Fluid progress
const fluidProgress = document.querySelector("#fluid-progress");
const progressStep = document.querySelector("#progress-step");
let currentStep = 1;

function renderProgress() {
  const width = ((currentStep - 1) / 3) * 86;
  fluidProgress.dataset.step = currentStep;
  fluidProgress.style.setProperty("--progress-width", `${width}%`);
  progressStep.textContent = currentStep;
}

fluidProgress.addEventListener("click", () => {
  currentStep = (currentStep % 4) + 1;
  renderProgress();
});
renderProgress();

// 12 Pointer trail
const trailStage = document.querySelector("#trail-stage");
const trailLayer = document.querySelector("#trail-layer");
let lastTrailTime = 0;

trailStage.addEventListener("pointermove", (event) => {
  const now = performance.now();
  if (now - lastTrailTime < 22 / Number(controls.speed.value)) return;
  lastTrailTime = now;
  const rect = trailStage.getBoundingClientRect();
  const dot = document.createElement("i");
  dot.className = "trail-dot";
  dot.style.left = `${event.clientX - rect.left}px`;
  dot.style.top = `${event.clientY - rect.top}px`;
  trailLayer.append(dot);
  dot.addEventListener("animationend", () => dot.remove());
});

drawElasticBridge();
updateControls();
}
})();
