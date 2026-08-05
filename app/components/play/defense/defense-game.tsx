"use client";

import { useState, useEffect, useRef } from "react";
import {
  useDefenseEngine,
  ELEMENTAL_DETAILS,
  type ElementalType,
  type DifficultyType,
} from "./use-defense-engine";

interface UpgradeConfig {
  key: string;
  name: string;
  category: "STAT" | "SKILL";
  baseCost: number;
  scale: number;
  maxLevel: number;
  icon: string;
  desc: string;
}

const UPGRADE_CONFIGS: UpgradeConfig[] = [
  // Stats
  { key: "maxHp", name: "코어 최대 체력", category: "STAT", baseCost: 30, scale: 1.35, maxLevel: 25, icon: "❤️", desc: "코어 HP +45 증가" },
  { key: "hpRegen", name: "코어 체력 재생", category: "STAT", baseCost: 40, scale: 1.4, maxLevel: 20, icon: "💖", desc: "초당 체력 회복 속도 +0.5" },
  { key: "damage", name: "액체 탄환 공격력", category: "STAT", baseCost: 35, scale: 1.35, maxLevel: 30, icon: "⚔️", desc: "발사체 피해량 +7" },
  { key: "attackSpeed", name: "발사 연사 속도", category: "STAT", baseCost: 45, scale: 1.4, maxLevel: 20, icon: "⚡", desc: "초당 공격 횟수 연사 증가" },
  { key: "multiShot", name: "다중 주시 타겟팅 (Multi-Target)", category: "STAT", baseCost: 100, scale: 2.2, maxLevel: 5, icon: "🔱", desc: "한 번에 다수의 서로 다른 적 동시 자동 조준 사격!" },
  { key: "critChance", name: "치명타 확률", category: "STAT", baseCost: 50, scale: 1.45, maxLevel: 10, icon: "🎯", desc: "치명타 적중 확률 +6%" },
  { key: "goldMultiplier", name: "골드 획득 증폭", category: "STAT", baseCost: 60, scale: 1.5, maxLevel: 10, icon: "💰", desc: "적 처치 골드 획득량 +25%" },
  { key: "bulletSpeed", name: "탄속 & 사거리", category: "STAT", baseCost: 25, scale: 1.3, maxLevel: 15, icon: "💨", desc: "탄환 비행 속도 증가" },

  // Special Liquid Skills
  { key: "tentacles", name: "구이 촉수 (Gooey Tentacles)", category: "SKILL", baseCost: 150, scale: 2.0, maxLevel: 4, icon: "🐙", desc: "주변 및 달라붙은 적을 낚아채 파괴하는 유기적 촉수" },
  { key: "acidAura", name: "산성 웅덩이 (Acid Fluid Aura)", category: "SKILL", baseCost: 120, scale: 1.8, maxLevel: 5, icon: "🧪", desc: "코어 주변 적들을 감속시키고 지속 산성 피해" },
  { key: "explosiveShot", name: "폭발성 액체탄", category: "SKILL", baseCost: 140, scale: 1.85, maxLevel: 5, icon: "💣", desc: "적 충돌 시 넓은 광역 스플래시 범위 폭발" },
  { key: "liquidShield", name: "리퀴드 쉴드 (Barrier)", category: "SKILL", baseCost: 160, scale: 2.1, maxLevel: 5, icon: "🛡️", desc: "데미지를 먼저 흡수하는 자동 재생 방어막 +50" },
];

export function DefenseGame() {
  const {
    bgCanvasRef,
    blobsCanvasRef,
    labelsCanvasRef,
    gameStatus,
    setGameStatus,
    wave,
    difficulty,
    setDifficulty,
    gold,
    score,
    highScore,
    maxWaveReached,
    gameSpeed,
    setGameSpeed,
    muted,
    setMuted,
    mutation,
    selectMutation,
    coreHp,
    coreMaxHp,
    coreShield,
    coreMaxShield,
    enemiesRemaining,
    upgrades,
    buyUpgrade,
    getStatValues,
    startGame,
    continueFromCheckpoint,
    resetSaveProgress,
  } = useDefenseEngine();

  const [activeTab, setActiveTab] = useState<"STATS" | "SKILLS" | "MUTATION" | "OVERVIEW">("STATS");
  const stageWrapperRef = useRef<HTMLDivElement | null>(null);

  // Synchronize 3 canvas layers to stage bounds
  useEffect(() => {
    const updateCanvasSizes = () => {
      if (stageWrapperRef.current) {
        const rect = stageWrapperRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height || 540;

        [bgCanvasRef.current, blobsCanvasRef.current, labelsCanvasRef.current].forEach((cv) => {
          if (cv) {
            cv.width = width;
            cv.height = height;
          }
        });
      }
    };
    updateCanvasSizes();
    window.addEventListener("resize", updateCanvasSizes);
    return () => window.removeEventListener("resize", updateCanvasSizes);
  }, [bgCanvasRef, blobsCanvasRef, labelsCanvasRef]);

  const checkpointWave = Math.max(1, wave - 5);
  const currentStats = getStatValues();

  return (
    <section className="defense-game" aria-labelledby="defense-game-title">
      {/* SVG Gooey Filter Definitions */}
      <svg className="filter-defs" aria-hidden="true">
        <defs>
          <filter id="defense-gooey-filter" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* 1. Header Bar */}
      <div className="defense-game__bar">
        <div>
          <p className="play-kicker">GAME 04 / BLOB DEFENSE</p>
          <h2 id="defense-game-title">Defend the liquid core.</h2>
        </div>

        {/* Difficulty Selector */}
        <div className="defense-mode-selector">
          {(["EASY", "NORMAL", "HARD"] as DifficultyType[]).map((d) => (
            <button
              key={d}
              type="button"
              className={difficulty === d ? "is-active" : ""}
              onClick={() => setDifficulty(d)}
            >
              {d === "EASY" ? "EASY" : d === "NORMAL" ? "NORMAL" : "HARD"}
              <span>{d === "EASY" ? "입문용 밸런스" : d === "NORMAL" ? "표준 난이도" : "고난도 시련"}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Monospace Status Bar */}
      <div className="defense-game__status">
        <span>CORE HP / {coreHp}/{coreMaxHp}</span>
        {coreMaxShield > 0 && <span>SHIELD / {coreShield}/{coreMaxShield}</span>}
        <span>WAVE / {String(wave).padStart(2, "0")} (MAX {maxWaveReached})</span>
        <span>GOLD / {gold} G</span>
        <span>SCORE / {String(score).padStart(6, "0")} (BEST {highScore})</span>
        <span>ENEMIES / {enemiesRemaining}</span>
        <button
          type="button"
          className="defense-status-btn"
          onClick={() => setGameSpeed(gameSpeed === 0.5 ? 1 : gameSpeed === 1 ? 2 : gameSpeed === 2 ? 3 : 0.5)}
        >
          SPEED / {gameSpeed}X
        </button>
        <button
          type="button"
          className={`defense-status-btn ${activeTab === "OVERVIEW" ? "is-active" : ""}`}
          onClick={() => setActiveTab(activeTab === "OVERVIEW" ? "STATS" : "OVERVIEW")}
        >
          MY STATS
        </button>
        <button
          type="button"
          className="defense-status-btn"
          onClick={() => setMuted(!muted)}
        >
          {muted ? "AUDIO / OFF" : "AUDIO / ON"}
        </button>
        {gameStatus === "PLAYING" && (
          <button
            type="button"
            className="defense-status-btn"
            onClick={() => setGameStatus("PAUSED")}
          >
            PAUSE
          </button>
        )}
      </div>

      {/* 2.5 Visual Health & Shield Progress Gauge Bar Row */}
      <div className="defense-health-bar-row">
        <div className="defense-bar-item defense-bar-item--hp">
          <div className="defense-bar-label">
            <span>CORE HEALTH</span>
            <span>{coreHp} / {coreMaxHp} HP ({Math.max(0, Math.min(100, Math.round((coreHp / coreMaxHp) * 100)))}%)</span>
          </div>
          <div className="defense-bar-track">
            <div
              className="defense-bar-fill defense-bar-fill--hp"
              style={{ width: `${Math.max(0, Math.min(100, (coreHp / coreMaxHp) * 100))}%` }}
            />
          </div>
        </div>

        {coreMaxShield > 0 && (
          <div className="defense-bar-item defense-bar-item--shield">
            <div className="defense-bar-label">
              <span>LIQUID BARRIER</span>
              <span>{coreShield} / {coreMaxShield} ({Math.max(0, Math.min(100, Math.round((coreShield / coreMaxShield) * 100)))}%)</span>
            </div>
            <div className="defense-bar-track">
              <div
                className="defense-bar-fill defense-bar-fill--shield"
                style={{ width: `${Math.max(0, Math.min(100, (coreShield / coreMaxShield) * 100))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Main Board Shell */}
      <div className="defense-board-shell">
        {/* Stage Wrapper Area */}
        <div ref={stageWrapperRef} className="defense-stage-wrapper">
          <canvas ref={bgCanvasRef} className="defense-canvas defense-canvas--bg" />
          <canvas ref={blobsCanvasRef} className="defense-canvas defense-canvas--blobs" />
          <canvas ref={labelsCanvasRef} className="defense-canvas defense-canvas--labels" />

          {/* Idle Start Modal Overlay */}
          {gameStatus === "IDLE" && (
            <div className="defense-modal-overlay">
              <div className="defense-modal-card">
                <span className="defense-modal-card__kicker">LIQUID TOWER DEFENSE</span>
                <h3 className="defense-modal-card__title">BLOB DEFENSE</h3>
                <p className="defense-modal-card__desc">
                  중앙에 위치한 리퀴드 코어를 성장시키세요. 다가오는 적들을 다중 
                  타겟팅 사격으로 저지하고 유기적 촉수 및 속성을 진화시키세요!
                  <br />
                  <small style={{ color: "#38bdf8", marginTop: 4, display: "block" }}>
                    💾 플레이 정보 및 강화 레벨이 브라우저에 자동 저장됩니다.
                  </small>
                </p>
                <div className="defense-gameover-actions">
                  <button type="button" className="defense-btn defense-btn--primary" onClick={startGame}>
                    START EXPERIMENT
                  </button>
                  <button type="button" className="defense-btn defense-btn--secondary" onClick={resetSaveProgress}>
                    RESET SAVED PROGRESS (초기화)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Paused Modal Overlay */}
          {gameStatus === "PAUSED" && (
            <div className="defense-modal-overlay">
              <div className="defense-modal-card">
                <span className="defense-modal-card__kicker">PAUSED</span>
                <h3 className="defense-modal-card__title">GAME PAUSED</h3>
                <p className="defense-modal-card__desc">실험이 잠시 일시정지되었습니다.</p>
                <button type="button" className="defense-btn defense-btn--primary" onClick={() => setGameStatus("PLAYING")}>
                  RESUME GAME
                </button>
              </div>
            </div>
          )}

          {/* Game Over Modal Overlay */}
          {gameStatus === "GAMEOVER" && (
            <div className="defense-modal-overlay">
              <div className="defense-modal-card defense-modal-card--danger">
                <span className="defense-modal-card__kicker">CORE DESTROYED</span>
                <h3 className="defense-modal-card__title">GAME OVER</h3>
                <p className="defense-modal-card__desc">
                  코어 체력이 소진되었습니다. 획득한 골드 및 업그레이드를 유지한 채 
                  -5 웨이브 전 지점에서 체크포인트 재도전이 가능합니다.
                </p>
                <div className="defense-gameover-stats">
                  <div>WAVE / <strong>{wave}</strong></div>
                  <div>SCORE / <strong>{score}</strong></div>
                  <div>BEST / <strong>{highScore}</strong></div>
                </div>
                <div className="defense-gameover-actions">
                  <button type="button" className="defense-btn defense-btn--accent" onClick={continueFromCheckpoint}>
                    REWIND TO WAVE {checkpointWave}
                  </button>
                  <button type="button" className="defense-btn defense-btn--secondary" onClick={startGame}>
                    RESTART FROM WAVE 01
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side In-Game Shop & Stats Panel */}
        <div className="defense-shop-panel">
          <div className="defense-shop__tabs">
            <button
              type="button"
              className={`defense-tab-btn ${activeTab === "STATS" ? "is-active" : ""}`}
              onClick={() => setActiveTab("STATS")}
            >
              STATS
            </button>
            <button
              type="button"
              className={`defense-tab-btn ${activeTab === "SKILLS" ? "is-active" : ""}`}
              onClick={() => setActiveTab("SKILLS")}
            >
              SKILLS
            </button>
            <button
              type="button"
              className={`defense-tab-btn ${activeTab === "MUTATION" ? "is-active" : ""}`}
              onClick={() => setActiveTab("MUTATION")}
            >
              ELEMENT
            </button>
            <button
              type="button"
              className={`defense-tab-btn ${activeTab === "OVERVIEW" ? "is-active" : ""}`}
              onClick={() => setActiveTab("OVERVIEW")}
            >
              MY STATS
            </button>
          </div>

          <div className="defense-shop__content">
            {activeTab === "STATS" && (
              <div className="defense-grid">
                {UPGRADE_CONFIGS.filter((item) => item.category === "STAT").map((item) => {
                  const currentLvl = upgrades[item.key] || 0;
                  const cost = Math.floor(item.baseCost * Math.pow(item.scale, currentLvl));
                  const isMax = currentLvl >= item.maxLevel;
                  const canAfford = gold >= cost && !isMax;

                  return (
                    <div key={item.key} className="defense-card">
                      <div className="defense-card__header">
                        <span className="icon">{item.icon}</span>
                        <span className="title">{item.name}</span>
                        <span className="lvl">LV.{currentLvl}/{item.maxLevel}</span>
                      </div>
                      <p className="defense-card__desc">{item.desc}</p>
                      <button
                        type="button"
                        className={`defense-btn defense-btn--shop ${canAfford ? "is-buyable" : ""}`}
                        disabled={!canAfford || isMax}
                        onClick={() => buyUpgrade(item.key, item.baseCost, item.scale)}
                      >
                        {isMax ? "MAX LEVEL" : `${cost} G UPGRADE`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "SKILLS" && (
              <div className="defense-grid">
                {UPGRADE_CONFIGS.filter((item) => item.category === "SKILL").map((item) => {
                  const currentLvl = upgrades[item.key] || 0;
                  const cost = Math.floor(item.baseCost * Math.pow(item.scale, currentLvl));
                  const isMax = currentLvl >= item.maxLevel;
                  const canAfford = gold >= cost && !isMax;

                  return (
                    <div key={item.key} className="defense-card defense-card--skill">
                      <div className="defense-card__header">
                        <span className="icon">{item.icon}</span>
                        <span className="title">{item.name}</span>
                        <span className="lvl">LV.{currentLvl}/{item.maxLevel}</span>
                      </div>
                      <p className="defense-card__desc">{item.desc}</p>
                      <button
                        type="button"
                        className={`defense-btn defense-btn--shop ${canAfford ? "is-buyable" : ""}`}
                        disabled={!canAfford || isMax}
                        onClick={() => buyUpgrade(item.key, item.baseCost, item.scale)}
                      >
                        {isMax ? "MAX LEVEL" : `${cost} G UPGRADE`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "MUTATION" && (
              <div className="defense-grid">
                {(Object.keys(ELEMENTAL_DETAILS) as ElementalType[]).map((elemKey) => {
                  const details = ELEMENTAL_DETAILS[elemKey];
                  const isSelected = mutation === elemKey;

                  return (
                    <div
                      key={elemKey}
                      className={`defense-card defense-card--mutation ${isSelected ? "is-selected" : ""}`}
                    >
                      <div className="defense-card__header">
                        <span className="icon">{details.icon}</span>
                        <span className="title" style={{ color: details.color }}>
                          {details.name}
                        </span>
                      </div>
                      <p className="defense-card__desc">{details.desc}</p>
                      <button
                        type="button"
                        className={`defense-btn defense-btn--shop ${isSelected ? "is-active-elem" : ""}`}
                        onClick={() => selectMutation(elemKey)}
                      >
                        {isSelected ? "EQUIPPED" : "EQUIP"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Current Stats Real-time Summary Dashboard */}
            {activeTab === "OVERVIEW" && (
              <div className="defense-overview-grid">
                <div className="defense-overview-card">
                  <span className="label">⚔️ 공격 피해량 (Damage)</span>
                  <span className="val">{currentStats.damage} HP</span>
                </div>
                <div className="defense-overview-card">
                  <span className="label">⚡ 연사 속도 (Fire Rate)</span>
                  <span className="val">{currentStats.attackSpeed.toFixed(2)} 회/초</span>
                </div>
                <div className="defense-overview-card">
                  <span className="label">🔱 동시 조준 사격 (Multi-Target)</span>
                  <span className="val">{currentStats.multiShot} 타겟 동시 조준</span>
                </div>
                <div className="defense-overview-card">
                  <span className="label">💖 체력 회복 (HP Regen)</span>
                  <span className="val">+{currentStats.hpRegen.toFixed(1)} /초</span>
                </div>
                <div className="defense-overview-card">
                  <span className="label">🎯 치명타율 (Crit Chance)</span>
                  <span className="val">{Math.round(currentStats.critChance * 100)}% (x2.0)</span>
                </div>
                <div className="defense-overview-card">
                  <span className="label">💰 골드 증폭 (Gold Multi)</span>
                  <span className="val">+{Math.round((currentStats.goldMulti - 1) * 100)}%</span>
                </div>
                <div className="defense-overview-card">
                  <span className="label">🛡️ 방어막 용량 (Barrier)</span>
                  <span className="val">{currentStats.maxShield} HP</span>
                </div>
                <div className="defense-overview-card">
                  <span className="label">💨 탄환 속도 (Speed)</span>
                  <span className="val">{currentStats.bulletSpeed.toFixed(1)}</span>
                </div>
                <div className="defense-overview-card defense-overview-card--full">
                  <span className="label">🧬 현재 융합 속성</span>
                  <span className="val" style={{ color: ELEMENTAL_DETAILS[mutation].color }}>
                    {ELEMENTAL_DETAILS[mutation].icon} {ELEMENTAL_DETAILS[mutation].name}
                  </span>
                </div>
                <div className="defense-overview-card defense-overview-card--full">
                  <span className="label">🧪 활성화 스킬 목록</span>
                  <div className="defense-overview-skills">
                    <span>🐙 촉수: {currentStats.tentacles > 0 ? `${currentStats.tentacles}개` : "미습득"}</span>
                    <span>🧪 산성 웅덩이: {currentStats.acidAura > 0 ? `Lv.${currentStats.acidAura}` : "미습득"}</span>
                    <span>💣 폭발탄: {currentStats.explosiveShot > 0 ? `Lv.${currentStats.explosiveShot}` : "미습득"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Instructions Footer */}
      <footer className="defense-instructions">
        코어 블롭은 다가오는 서로 다른 적들을 동시에 자동 조준하여 사격합니다. 난이도 조절과 
        브라우저 자동 저장 기능이 적용되었습니다.
      </footer>
    </section>
  );
}
