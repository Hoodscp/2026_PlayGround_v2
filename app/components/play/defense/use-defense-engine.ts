"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { defenseSound } from "./defense-sound";

export type ElementalType = "NONE" | "TESLA" | "TOXIC" | "VAMPIRIC" | "PLASMA";
export type DifficultyType = "EASY" | "NORMAL" | "HARD";

export interface UpgradeItem {
  id: string;
  name: string;
  category: "STAT" | "SKILL";
  level: number;
  maxLevel: number;
  baseCost: number;
  costScale: number;
  description: string;
  icon: string;
}

export interface Enemy {
  id: string;
  type: "SPRINTER" | "TANK" | "SPLITTER" | "SPITTER" | "BOSS" | "MINI";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  color: string;
  reward: number;
  attached: boolean;
  attachAngle: number;
  attachOffset: number;
  attackCooldown: number;
  shootCooldown?: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isCrit: boolean;
  element: ElementalType;
  splashRadius: number;
  color: string;
  pierce: number;
  isEnemy?: boolean;
}

export interface Tentacle {
  id: string;
  targetId: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
  life: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  life: number;
}

export const ELEMENTAL_DETAILS: Record<ElementalType, { name: string; icon: string; desc: string; color: string }> = {
  NONE: { name: "순수 액체 (Standard)", icon: "💧", desc: "기본형 높은 균형 잡힌 융합 탄환", color: "#3b82f6" },
  TESLA: { name: "테슬라 뇌전 (Tesla Storm)", icon: "⚡", desc: "적 명중 시 3개 연쇄 전기 방전 (추가 범위 데미지)", color: "#eab308" },
  TOXIC: { name: "맹독 산성 (Toxic Acid)", icon: "🧪", desc: "지속 독 데미지 부여 및 적 이동속도 30% 감소", color: "#22c55e" },
  VAMPIRIC: { name: "흡혈 드레인 (Vampiric Goo)", icon: "🩸", desc: "입힌 데미지의 12%만큼 코어 체력 회복", color: "#ec4899" },
  PLASMA: { name: "플라즈마 버스트 (Plasma Nova)", icon: "💥", desc: "치명타 적중 시 100% 확률로 광역 플라즈마 폭발", color: "#a855f7" },
};

const DEFAULT_UPGRADES: Record<string, number> = {
  maxHp: 0,
  hpRegen: 0,
  damage: 0,
  attackSpeed: 0,
  multiShot: 0,
  bulletSpeed: 0,
  critChance: 0,
  goldMultiplier: 0,
  acidAura: 0,
  tentacles: 0,
  explosiveShot: 0,
  liquidShield: 0,
};

const SAVE_KEY = "playground_v2_defense_save";

export function useDefenseEngine() {
  // Load saved progress lazily from localStorage
  const [savedData] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore
    }
    return null;
  });

  const [gameStatus, setGameStatus] = useState<"IDLE" | "PLAYING" | "PAUSED" | "GAMEOVER">("IDLE");
  const [wave, setWave] = useState(1);
  const [difficulty, setDifficulty] = useState<DifficultyType>(() => savedData?.difficulty || "EASY");
  const [gold, setGold] = useState(() => savedData?.gold ?? 120);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => savedData?.highScore || 0);
  const [maxWaveReached, setMaxWaveReached] = useState(() => savedData?.maxWaveReached || 1);
  const [gameSpeed, setGameSpeed] = useState<0.5 | 1 | 2 | 3>(1);
  const [muted, setMuted] = useState(false);
  const [mutation, setMutation] = useState<ElementalType>(() => savedData?.mutation || "NONE");

  const tickFractionRef = useRef(0);

  // Shop Upgrades State loaded from localStorage
  const [upgrades, setUpgrades] = useState<Record<string, number>>(() => ({
    ...DEFAULT_UPGRADES,
    ...(savedData?.upgrades || {}),
  }));

  const upgradesRef = useRef(upgrades);
  useEffect(() => {
    upgradesRef.current = upgrades;
  }, [upgrades]);

  // Upgrade Calculations Helper
  const calculateStatValues = useCallback((u: Record<string, number>) => {
    const maxHp = 250 + u.maxHp * 50;
    const hpRegen = 0.5 + u.hpRegen * 0.6;
    const damage = 24 + u.damage * 8;
    const attackSpeed = 1.5 + u.attackSpeed * 0.4;
    const multiShot = 1 + u.multiShot; // 1 to 6 multi-target shots!
    const bulletSpeed = 8.0 + u.bulletSpeed * 1.5;
    const critChance = u.critChance * 0.06;
    const goldMulti = 1 + u.goldMultiplier * 0.15;
    const maxShield = u.liquidShield * 50;

    return {
      maxHp,
      hpRegen,
      damage,
      attackSpeed,
      multiShot,
      bulletSpeed,
      critChance,
      goldMulti,
      maxShield,
      acidAura: u.acidAura,
      tentacles: u.tentacles,
      explosiveShot: u.explosiveShot,
    };
  }, []);

  const getStatValues = useCallback(() => {
    return calculateStatValues(upgrades);
  }, [upgrades, calculateStatValues]);

  const initialStats = calculateStatValues(upgrades);

  // Core Stats state for HUD display
  const [coreHp, setCoreHp] = useState(initialStats.maxHp);
  const [coreMaxHp, setCoreMaxHp] = useState(initialStats.maxHp);
  const [coreShield, setCoreShield] = useState(initialStats.maxShield);
  const [coreMaxShield, setCoreMaxShield] = useState(initialStats.maxShield);

  // Wave metrics
  const [enemiesRemaining, setEnemiesRemaining] = useState(0);

  // Layered Canvas Refs for SVG Gooey Filter integration
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const blobsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const labelsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core Blob State
  const coreRef = useRef({
    x: 400,
    y: 300,
    radius: 48,
    hp: initialStats.maxHp,
    maxHp: initialStats.maxHp,
    hpRegen: initialStats.hpRegen,
    shield: initialStats.maxShield,
    maxShield: initialStats.maxShield,
    shieldRegenTimer: 0,
    wobblePhase: 0,
    wobbleIntensity: 0,
    lastShotTime: 0,
  });

  const waveRef = useRef({
    current: 1,
    spawned: 0,
    totalToSpawn: 10,
    spawnTimer: 0,
    spawnInterval: 140,
    inWave: false,
    bossSpawned: false,
  });

  const goldRef = useRef(savedData?.gold ?? 120);
  const scoreRef = useRef(0);
  const highScoreRef = useRef(savedData?.highScore || 0);
  const maxWaveRef = useRef(savedData?.maxWaveReached || 1);
  const speedRef = useRef<number>(1);
  const difficultyRef = useRef<DifficultyType>(difficulty);

  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const tentaclesRef = useRef<Tentacle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const mutationRef = useRef<ElementalType>(mutation);

  const lastTimeRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);

  // Save Progress Helper to localStorage
  const saveProgress = useCallback(
    (
      currentGold = goldRef.current,
      currentUpgrades?: Record<string, number>,
      currentMutation = mutationRef.current,
      currentDiff = difficultyRef.current,
      currentHighScore = highScoreRef.current,
      currentMaxWave = maxWaveRef.current
    ) => {
      if (typeof window === "undefined") return;
      try {
        const payload = {
          gold: currentGold,
          upgrades: currentUpgrades || upgradesRef.current,
          mutation: currentMutation,
          difficulty: currentDiff,
          highScore: currentHighScore,
          maxWaveReached: currentMaxWave,
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      } catch {
        // Ignore
      }
    },
    []
  );

  // Reset Progress
  const resetSaveProgress = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(SAVE_KEY);
      } catch {
        // Ignore
      }
    }
    goldRef.current = 120;
    highScoreRef.current = 0;
    maxWaveRef.current = 1;
    setGold(120);
    setHighScore(0);
    setMaxWaveReached(1);
    setUpgrades({ ...DEFAULT_UPGRADES });
    setMutation("NONE");
    mutationRef.current = "NONE";
  }, []);

  // Synchronize speedRef
  useEffect(() => {
    speedRef.current = gameSpeed;
  }, [gameSpeed]);

  // Synchronize muted
  useEffect(() => {
    defenseSound.setMuted(muted);
  }, [muted]);

  // Synchronize mutation
  useEffect(() => {
    mutationRef.current = mutation;
    saveProgress(goldRef.current, upgrades, mutation, difficultyRef.current);
  }, [mutation, saveProgress, upgrades]);

  // Synchronize difficulty
  useEffect(() => {
    difficultyRef.current = difficulty;
    saveProgress(goldRef.current, upgrades, mutationRef.current, difficulty);
  }, [difficulty, saveProgress, upgrades]);

  // Spawn Enemy Logic along perimeter
  const spawnEnemy = useCallback((type: Enemy["type"]) => {
    const stage = blobsCanvasRef.current || bgCanvasRef.current;
    const width = stage ? stage.width : 800;
    const height = stage ? stage.height : 600;

    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;

    if (side === 0) {
      x = Math.random() * width;
      y = -35;
    } else if (side === 1) {
      x = width + 35;
      y = Math.random() * height;
    } else if (side === 2) {
      x = Math.random() * width;
      y = height + 35;
    } else {
      x = -35;
      y = Math.random() * height;
    }

    const currentWave = waveRef.current.current;
    const diff = difficultyRef.current;

    let hpScaleFactor = 0.08;
    let speedScaleFactor = 0.01;

    if (diff === "NORMAL") {
      hpScaleFactor = 0.16;
      speedScaleFactor = 0.025;
    } else if (diff === "HARD") {
      hpScaleFactor = 0.28;
      speedScaleFactor = 0.04;
    }

    const hpScale = 1 + (currentWave - 1) * hpScaleFactor;
    const speedScale = Math.min(1.6, 1 + (currentWave - 1) * speedScaleFactor);

    let enemyConfig = {
      radius: 13,
      hp: Math.floor(16 * hpScale),
      speed: 1.35 * speedScale,
      color: "#ef4444",
      reward: Math.floor(4 * (1 + currentWave * 0.04)),
    };

    if (type === "SPRINTER") {
      enemyConfig = {
        radius: 10,
        hp: Math.floor(10 * hpScale),
        speed: 2.1 * speedScale,
        color: "#f59e0b",
        reward: Math.floor(5 * (1 + currentWave * 0.04)),
      };
    } else if (type === "TANK") {
      enemyConfig = {
        radius: 17,
        hp: Math.floor(32 * hpScale),
        speed: 0.6 * speedScale,
        color: "#8b5cf6",
        reward: Math.floor(12 * (1 + currentWave * 0.04)),
      };
    } else if (type === "SPLITTER") {
      enemyConfig = {
        radius: 15,
        hp: Math.floor(25 * hpScale),
        speed: 1.15 * speedScale,
        color: "#06b6d4",
        reward: Math.floor(7 * (1 + currentWave * 0.04)),
      };
    } else if (type === "SPITTER") {
      enemyConfig = {
        radius: 14,
        hp: Math.floor(22 * hpScale),
        speed: 1.0 * speedScale,
        color: "#10b981",
        reward: Math.floor(8 * (1 + currentWave * 0.04)),
      };
    } else if (type === "BOSS") {
      enemyConfig = {
        radius: 35,
        hp: Math.floor(280 * hpScale),
        speed: 0.65 * speedScale,
        color: "#ec4899",
        reward: Math.floor(50 * (1 + currentWave * 0.06)),
      };
    } else if (type === "MINI") {
      enemyConfig = {
        radius: 8,
        hp: Math.floor(8 * hpScale),
        speed: 1.8 * speedScale,
        color: "#38bdf8",
        reward: Math.floor(2 * (1 + currentWave * 0.02)),
      };
    }

    enemiesRef.current.push({
      id: `enemy_${Date.now()}_${Math.random()}`,
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: enemyConfig.radius,
      hp: enemyConfig.hp,
      maxHp: enemyConfig.hp,
      speed: enemyConfig.speed,
      color: enemyConfig.color,
      reward: enemyConfig.reward,
      attached: false,
      attachAngle: 0,
      attachOffset: 0,
      attackCooldown: 0,
      shootCooldown: 60,
    });
  }, []);

  // Add Particles
  const addParticles = useCallback((x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 4,
        color,
        alpha: 1,
        life: 1,
        maxLife: 20 + Math.floor(Math.random() * 15),
      });
    }
  }, []);

  // Add Floating Text
  const addFloatingText = useCallback((text: string, x: number, y: number, color = "#ffffff") => {
    floatingTextsRef.current.push({
      id: `text_${Date.now()}_${Math.random()}`,
      text,
      x,
      y,
      color,
      alpha: 1,
      life: 0,
    });
  }, []);

  // Core Multi-Target Firing Logic: Shoots N DIFFERENT targets simultaneously!
  const fireProjectiles = useCallback((targetEnemies: Enemy[]) => {
    const stats = getStatValues();
    const core = coreRef.current;

    const elem = mutationRef.current;
    const elemColor = ELEMENTAL_DETAILS[elem].color;

    const count = stats.multiShot; // multi-target count
    for (let i = 0; i < count; i++) {
      // Distribute bullets among distinct targets
      const target = targetEnemies[i % targetEnemies.length];
      const dx = target.x - core.x;
      const dy = target.y - core.y;
      const angle = Math.atan2(dy, dx);

      const isCrit = Math.random() < stats.critChance;
      const baseDamage = isCrit ? stats.damage * 2.0 : stats.damage;

      const vx = Math.cos(angle) * stats.bulletSpeed;
      const vy = Math.sin(angle) * stats.bulletSpeed;

      projectilesRef.current.push({
        id: `proj_${Date.now()}_${i}_${Math.random()}`,
        x: core.x + Math.cos(angle) * core.radius,
        y: core.y + Math.sin(angle) * core.radius,
        vx,
        vy,
        radius: isCrit ? 7 : 5.5,
        damage: baseDamage,
        isCrit,
        element: elem,
        splashRadius: stats.explosiveShot > 0 ? 35 + stats.explosiveShot * 15 : 0,
        color: elemColor,
        pierce: elem === "TESLA" ? 2 : 1,
      });
    }

    core.wobbleIntensity = Math.min(14, core.wobbleIntensity + 2.8);
    defenseSound.playShoot(1.0 + (count - 1) * 0.05);
  }, [getStatValues]);

  // Main Game Loop Update
  const updateGame = useCallback(() => {
    if (isPausedRef.current) return;

    const speed = speedRef.current;
    const stats = getStatValues();
    const core = coreRef.current;
    const waveInfo = waveRef.current;

    tickFractionRef.current += speed;
    const ticksToRun = Math.floor(tickFractionRef.current);
    tickFractionRef.current -= ticksToRun;

    for (let s = 0; s < ticksToRun; s++) {
      // 1. Core HP & Shield Regeneration
      if (core.hp < core.maxHp) {
        core.hp = Math.min(core.maxHp, core.hp + stats.hpRegen / 60);
      }
      if (stats.maxShield > 0) {
        if (core.shield < stats.maxShield) {
          core.shield = Math.min(stats.maxShield, core.shield + 0.1);
        }
      }

      core.wobblePhase += 0.08;
      core.wobbleIntensity = Math.max(0, core.wobbleIntensity * 0.94);

      // 2. Wave Spawner Logic based on Difficulty
      if (waveInfo.inWave) {
        waveInfo.spawnTimer++;
        if (waveInfo.spawned < waveInfo.totalToSpawn && waveInfo.spawnTimer >= waveInfo.spawnInterval) {
          waveInfo.spawnTimer = 0;
          waveInfo.spawned++;

          const isBossWave = waveInfo.current % 5 === 0;

          if (isBossWave && !waveInfo.bossSpawned && waveInfo.spawned === Math.floor(waveInfo.totalToSpawn / 2)) {
            spawnEnemy("BOSS");
            waveInfo.bossSpawned = true;
            addFloatingText("⚠️ BOSS OVERLORD APPROACHING!", core.x - 120, core.y - 100, "#ec4899");
          } else {
            const currentWave = waveInfo.current;
            if (currentWave <= 2) {
              // Wave 1~2: Only standard red & fast orange sprinter enemies!
              spawnEnemy("SPRINTER");
            } else if (currentWave <= 4) {
              // Wave 3~4: Add cyan splitter enemies!
              const rand = Math.random();
              if (rand < 0.6) spawnEnemy("SPRINTER");
              else spawnEnemy("SPLITTER");
            } else {
              // Wave 5+: All enemies unlocked, purple tank appears late with low chance!
              const rand = Math.random();
              if (rand < 0.35) spawnEnemy("SPRINTER");
              else if (rand < 0.65) spawnEnemy("SPLITTER");
              else if (rand < 0.85) spawnEnemy("SPITTER");
              else spawnEnemy("TANK");
            }
          }
        }

        // Check Wave Clear Condition
        if (waveInfo.spawned >= waveInfo.totalToSpawn && enemiesRef.current.length === 0) {
          waveInfo.inWave = false;
          defenseSound.playWaveClear();
          const bonusGold = Math.floor((15 + waveInfo.current * 3) * stats.goldMulti);
          goldRef.current += bonusGold;
          setGold(goldRef.current);
          addFloatingText(`WAVE ${waveInfo.current} CLEAR! +${bonusGold} G`, core.x - 80, core.y - 80, "#22c55e");

          if (waveInfo.current > maxWaveRef.current) {
            maxWaveRef.current = waveInfo.current;
            setMaxWaveReached(waveInfo.current);
          }

          saveProgress(goldRef.current, upgrades, mutationRef.current, difficultyRef.current, highScoreRef.current, maxWaveRef.current);

          setTimeout(() => {
            waveRef.current.current++;
            setWave(waveRef.current.current);
            waveRef.current.spawned = 0;
            waveRef.current.totalToSpawn = 10 + waveRef.current.current * 4;

            let baseInterval = 150;
            let intervalDec = 2;
            if (difficultyRef.current === "NORMAL") {
              baseInterval = 120;
              intervalDec = 2.5;
            } else if (difficultyRef.current === "HARD") {
              baseInterval = 95;
              intervalDec = 3;
            }

            waveRef.current.spawnInterval = Math.max(30, baseInterval - waveRef.current.current * intervalDec);
            waveRef.current.bossSpawned = false;
            waveRef.current.inWave = true;
          }, 2000);
        }
      }

      // 3. Multi-Target Auto Firing: Sort enemies by proximity to core
      const now = Date.now();
      const fireInterval = 1000 / stats.attackSpeed;
      if (now - core.lastShotTime >= fireInterval && enemiesRef.current.length > 0) {
        const sortedEnemies = [...enemiesRef.current].sort((a, b) => {
          const distA = Math.hypot(a.x - core.x, a.y - core.y);
          const distB = Math.hypot(b.x - core.x, b.y - core.y);
          return distA - distB;
        });

        // Pick top N closest distinct enemies
        const targets = sortedEnemies.slice(0, stats.multiShot);
        if (targets.length > 0) {
          fireProjectiles(targets);
          core.lastShotTime = now;
        }
      }

      // 4. Update Poison Acid Aura Skill
      if (stats.acidAura > 0) {
        const auraRadius = core.radius + 40 + stats.acidAura * 20;
        enemiesRef.current.forEach((enemy) => {
          const dist = Math.hypot(enemy.x - core.x, enemy.y - core.y);
          if (dist <= auraRadius) {
            enemy.hp -= (0.4 + stats.acidAura * 0.3) * (60 / 60);
            enemy.speed = Math.max(0.4, enemy.speed * 0.98);
            if (Math.random() < 0.2) addParticles(enemy.x, enemy.y, "#22c55e", 1);
          }
        });
      }

      // 5. Update Gooey Tentacles Skill
      if (stats.tentacles > 0 && enemiesRef.current.length > 0) {
        if (tentaclesRef.current.length < stats.tentacles && Math.random() < 0.05) {
          const attachedOrNear = enemiesRef.current.filter((e) => Math.hypot(e.x - core.x, e.y - core.y) < 180);
          if (attachedOrNear.length > 0) {
            const target = attachedOrNear[Math.floor(Math.random() * attachedOrNear.length)];
            tentaclesRef.current.push({
              id: `tentacle_${Date.now()}_${Math.random()}`,
              targetId: target.id,
              startX: core.x,
              startY: core.y,
              targetX: target.x,
              targetY: target.y,
              progress: 0,
              life: 25,
            });
            defenseSound.playTentacle();
          }
        }
      }

      // Update active Tentacles
      tentaclesRef.current = tentaclesRef.current.filter((t) => {
        t.life--;
        t.progress = Math.min(1, t.progress + 0.08);
        const target = enemiesRef.current.find((e) => e.id === t.targetId);
        if (target) {
          t.targetX = target.x;
          t.targetY = target.y;
          target.hp -= 1.5;
          if (Math.random() < 0.3) addParticles(target.x, target.y, "#a855f7", 2);
        }
        return t.life > 0;
      });

      // 6. Update Projectiles
      projectilesRef.current = projectilesRef.current.filter((proj) => {
        proj.x += proj.vx;
        proj.y += proj.vy;

        // Enemy projectiles hitting core
        if (proj.isEnemy) {
          const distToCore = Math.hypot(proj.x - core.x, proj.y - core.y);
          if (distToCore < core.radius + proj.radius) {
            let dmg = proj.damage;
            if (core.shield > 0) {
              const shieldAbsorb = Math.min(core.shield, dmg);
              core.shield -= shieldAbsorb;
              dmg -= shieldAbsorb;
            }
            core.hp = Math.max(0, core.hp - dmg);
            core.wobbleIntensity = Math.min(16, core.wobbleIntensity + 4);
            addFloatingText(`-${Math.floor(proj.damage)}`, core.x, core.y - 30, "#ef4444");
            addParticles(proj.x, proj.y, "#ef4444", 8);
            defenseSound.playHit();
            return false;
          }
          const stage = blobsCanvasRef.current;
          if (stage && (proj.x < 0 || proj.x > stage.width || proj.y < 0 || proj.y > stage.height)) {
            return false;
          }
          return true;
        }

        // Player projectiles hitting enemies
        let hit = false;
        for (let i = 0; i < enemiesRef.current.length; i++) {
          const enemy = enemiesRef.current[i];
          const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
          if (dist < enemy.radius + proj.radius) {
            hit = true;
            enemy.hp -= proj.damage;
            addParticles(proj.x, proj.y, proj.color, proj.isCrit ? 10 : 5);
            addFloatingText(
              `${Math.floor(proj.damage)}${proj.isCrit ? "!" : ""}`,
              enemy.x,
              enemy.y - 15,
              proj.isCrit ? "#f59e0b" : "#ffffff"
            );
            defenseSound.playHit();

            // Vampiric Heal Effect
            if (proj.element === "VAMPIRIC") {
              const heal = proj.damage * 0.12;
              core.hp = Math.min(core.maxHp, core.hp + heal);
              addParticles(core.x, core.y, "#ec4899", 3);
            }

            // Tesla Chain Lightning Effect
            if (proj.element === "TESLA") {
              const nearby = enemiesRef.current.filter((e) => e.id !== enemy.id && Math.hypot(e.x - enemy.x, e.y - enemy.y) < 110);
              nearby.slice(0, 3).forEach((chainEnemy) => {
                chainEnemy.hp -= proj.damage * 0.5;
                addParticles(chainEnemy.x, chainEnemy.y, "#eab308", 4);
              });
            }

            // Splash AoE Explosive Shot
            if (proj.splashRadius > 0) {
              enemiesRef.current.forEach((aoeEnemy) => {
                if (aoeEnemy.id !== enemy.id) {
                  const d = Math.hypot(aoeEnemy.x - proj.x, aoeEnemy.y - proj.y);
                  if (d <= proj.splashRadius) {
                    aoeEnemy.hp -= proj.damage * 0.65;
                    addParticles(aoeEnemy.x, aoeEnemy.y, "#f97316", 4);
                  }
                }
              });
            }

            proj.pierce--;
            if (proj.pierce <= 0) break;
          }
        }

        const stage = blobsCanvasRef.current;
        if (stage && (proj.x < 0 || proj.x > stage.width || proj.y < 0 || proj.y > stage.height)) {
          return false;
        }

        return !hit || proj.pierce > 0;
      });

      // 7. Update Enemies & Core Attach Logic
      enemiesRef.current = enemiesRef.current.filter((enemy) => {
        if (enemy.hp <= 0) {
          defenseSound.playEnemyDeath();
          addParticles(enemy.x, enemy.y, enemy.color, 14);

          const gainedGold = Math.floor(enemy.reward * stats.goldMulti);
          goldRef.current += gainedGold;
          scoreRef.current += enemy.reward * 10;

          if (scoreRef.current > highScoreRef.current) {
            highScoreRef.current = scoreRef.current;
            setHighScore(scoreRef.current);
          }

          setGold(goldRef.current);
          setScore(scoreRef.current);
          addFloatingText(`+${gainedGold} G`, enemy.x, enemy.y, "#f59e0b");

          if (enemy.type === "SPLITTER") {
            for (let k = 0; k < 2; k++) {
              enemiesRef.current.push({
                id: `mini_${Date.now()}_${k}_${Math.random()}`,
                type: "MINI",
                x: enemy.x + (Math.random() * 20 - 10),
                y: enemy.y + (Math.random() * 20 - 10),
                vx: 0,
                vy: 0,
                radius: 9,
                hp: Math.floor(enemy.maxHp * 0.35),
                maxHp: Math.floor(enemy.maxHp * 0.35),
                speed: enemy.speed * 1.4,
                color: "#38bdf8",
                reward: 5,
                attached: false,
                attachAngle: 0,
                attachOffset: 0,
                attackCooldown: 0,
              });
            }
          }

          return false;
        }

        const dx = core.x - enemy.x;
        const dy = core.y - enemy.y;
        const dist = Math.hypot(dx, dy);
        const touchDist = core.radius + enemy.radius;

        // Spitter Ranged Attack Logic
        if (enemy.type === "SPITTER" && dist < 260 && !enemy.attached) {
          enemy.shootCooldown = (enemy.shootCooldown || 60) - 1;
          if (enemy.shootCooldown <= 0) {
            enemy.shootCooldown = 90;
            const angle = Math.atan2(dy, dx);
            projectilesRef.current.push({
              id: `spit_${Date.now()}_${Math.random()}`,
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(angle) * 4,
              vy: Math.sin(angle) * 4,
              radius: 5,
              damage: 10 + waveRef.current.current * 1.5,
              isCrit: false,
              element: "NONE",
              splashRadius: 0,
              color: "#10b981",
              pierce: 1,
              isEnemy: true,
            });
          }
        }

        if (!enemy.attached) {
          if (dist <= touchDist) {
            enemy.attached = true;
            enemy.attachAngle = Math.atan2(enemy.y - core.y, enemy.x - core.x);
            enemy.attachOffset = Math.random() * 4 - 2;
          } else {
            enemy.vx = (dx / dist) * enemy.speed;
            enemy.vy = (dy / dist) * enemy.speed;
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;
          }
        } else {
          // Attached enemy stays on core rim
          enemy.x = core.x + Math.cos(enemy.attachAngle) * (core.radius + enemy.attachOffset);
          enemy.y = core.y + Math.sin(enemy.attachAngle) * (core.radius + enemy.attachOffset);

          enemy.attackCooldown++;
          if (enemy.attackCooldown >= 45) {
            enemy.attackCooldown = 0;
            let dmg = 3 + (enemy.type === "TANK" ? 3 : 0) + (enemy.type === "BOSS" ? 10 : 0);
            if (core.shield > 0) {
              const absorb = Math.min(core.shield, dmg);
              core.shield -= absorb;
              dmg -= absorb;
            }
            core.hp = Math.max(0, core.hp - dmg);
            core.wobbleIntensity = Math.min(16, core.wobbleIntensity + 3.5);
            addParticles(enemy.x, enemy.y, "#ef4444", 4);
            addFloatingText(`-${Math.floor(dmg)}`, core.x, core.y - 30, "#ef4444");
            defenseSound.playHit();
          }
        }

        return true;
      });

      // 8. Update Particles & Floating Text
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = 1 - p.life / p.maxLife;
        return p.life < p.maxLife;
      });

      floatingTextsRef.current = floatingTextsRef.current.filter((ft) => {
        ft.y -= 0.8;
        ft.life++;
        ft.alpha = 1 - ft.life / 40;
        return ft.life < 40;
      });

      // 9. Check Game Over
      if (core.hp <= 0) {
        defenseSound.playGameOver();

        // Massive Core Explosion Particles Burst
        for (let i = 0; i < 80; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = 3 + Math.random() * 12;
          particlesRef.current.push({
            x: core.x,
            y: core.y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            radius: 4 + Math.random() * 8,
            color: Math.random() < 0.5 ? ELEMENTAL_DETAILS[mutationRef.current].color : "#ef4444",
            alpha: 1,
            life: 1,
            maxLife: 40 + Math.floor(Math.random() * 30),
          });
        }
        addFloatingText("💥 CORE DESTROYED!", core.x - 70, core.y - 60, "#ef4444");

        setGameStatus("GAMEOVER");
        isPausedRef.current = true;
        saveProgress(goldRef.current, upgrades, mutationRef.current, difficultyRef.current, highScoreRef.current, maxWaveRef.current);
        break;
      }
    }

    setCoreHp(Math.ceil(core.hp));
    setCoreMaxHp(core.maxHp);
    setCoreShield(Math.ceil(core.shield));
    setCoreMaxShield(core.maxShield);
    setEnemiesRemaining(enemiesRef.current.length + (waveInfo.totalToSpawn - waveInfo.spawned));
  }, [getStatValues, spawnEnemy, fireProjectiles, addParticles, addFloatingText, saveProgress, upgrades]);

  // Render Canvas Across 3 Crisp Layers
  const renderCanvas = useCallback(() => {
    const bgCanvas = bgCanvasRef.current;
    const blobsCanvas = blobsCanvasRef.current;
    const labelsCanvas = labelsCanvasRef.current;
    if (!bgCanvas || !blobsCanvas || !labelsCanvas) return;

    const bgCtx = bgCanvas.getContext("2d");
    const blobsCtx = blobsCanvas.getContext("2d");
    const labelsCtx = labelsCanvas.getContext("2d");
    if (!bgCtx || !blobsCtx || !labelsCtx) return;

    const width = blobsCanvas.width;
    const height = blobsCanvas.height;

    // DYNAMIC CENTERING: Core is guaranteed to be in the exact center of stage!
    const coreX = width / 2;
    const coreY = height / 2;
    coreRef.current.x = coreX;
    coreRef.current.y = coreY;

    // --- 1. Background Canvas Layer ---
    bgCtx.clearRect(0, 0, width, height);

    const bgGrad = bgCtx.createRadialGradient(coreX, coreY, 20, coreX, coreY, width * 0.7);
    bgGrad.addColorStop(0, "#0b1220");
    bgGrad.addColorStop(0.6, "#070b14");
    bgGrad.addColorStop(1, "#04070d");
    bgCtx.fillStyle = bgGrad;
    bgCtx.fillRect(0, 0, width, height);

    // Grid lines
    bgCtx.strokeStyle = "rgba(255, 255, 255, 0.025)";
    bgCtx.lineWidth = 1;
    const gridSize = 45;
    for (let x = 0; x < width; x += gridSize) {
      bgCtx.beginPath();
      bgCtx.moveTo(x, 0);
      bgCtx.lineTo(x, height);
      bgCtx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      bgCtx.beginPath();
      bgCtx.moveTo(0, y);
      bgCtx.lineTo(width, y);
      bgCtx.stroke();
    }

    // Ambient Center Glow Ring
    const elemColor = ELEMENTAL_DETAILS[mutationRef.current].color;
    bgCtx.save();
    bgCtx.beginPath();
    bgCtx.arc(coreX, coreY, 140, 0, Math.PI * 2);
    bgCtx.fillStyle = `${elemColor}08`;
    bgCtx.fill();
    bgCtx.restore();

    // --- 2. Liquid Blobs Stage Layer (SVG Gooey Filter Applied in CSS) ---
    blobsCtx.clearRect(0, 0, width, height);

    const core = coreRef.current;
    const stats = getStatValues();

    // Draw Acid Aura Ring if active
    if (stats.acidAura > 0) {
      const auraRadius = core.radius + 40 + stats.acidAura * 20;
      blobsCtx.save();
      blobsCtx.beginPath();
      blobsCtx.arc(coreX, coreY, auraRadius, 0, Math.PI * 2);
      blobsCtx.fillStyle = "rgba(34, 197, 94, 0.14)";
      blobsCtx.fill();
      blobsCtx.strokeStyle = "rgba(34, 197, 94, 0.4)";
      blobsCtx.lineWidth = 3;
      blobsCtx.stroke();
      blobsCtx.restore();
    }

    // Draw Tentacles
    tentaclesRef.current.forEach((t) => {
      blobsCtx.save();
      blobsCtx.beginPath();
      blobsCtx.moveTo(t.startX, t.startY);

      const midX = (t.startX + t.targetX) / 2 + Math.sin(t.progress * 10) * 20;
      const midY = (t.startY + t.targetY) / 2 + Math.cos(t.progress * 10) * 20;

      blobsCtx.quadraticCurveTo(midX, midY, t.targetX, t.targetY);
      blobsCtx.strokeStyle = "#a855f7";
      blobsCtx.lineWidth = 8;
      blobsCtx.lineCap = "round";
      blobsCtx.stroke();
      blobsCtx.restore();
    });

    // Draw Central Core Blob with Soft-Body Organic Wobble
    blobsCtx.save();
    blobsCtx.beginPath();
    const points = 18;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const wobble = Math.sin(angle * 5 + core.wobblePhase) * (3.5 + core.wobbleIntensity);
      const r = core.radius + wobble;
      const px = coreX + Math.cos(angle) * r;
      const py = coreY + Math.sin(angle) * r;
      if (i === 0) blobsCtx.moveTo(px, py);
      else blobsCtx.lineTo(px, py);
    }
    blobsCtx.closePath();

    const coreGrad = blobsCtx.createRadialGradient(coreX, coreY, 5, coreX, coreY, core.radius + 8);
    coreGrad.addColorStop(0, "#ffffff");
    coreGrad.addColorStop(0.35, elemColor);
    coreGrad.addColorStop(1, "#1e1b4b");

    blobsCtx.fillStyle = coreGrad;
    blobsCtx.shadowColor = elemColor;
    blobsCtx.shadowBlur = 24 + core.wobbleIntensity * 2;
    blobsCtx.fill();

    // Draw Liquid Shield Ring around core
    if (core.shield > 0) {
      blobsCtx.beginPath();
      blobsCtx.arc(coreX, coreY, core.radius + 12, 0, Math.PI * 2);
      blobsCtx.strokeStyle = "rgba(56, 189, 248, 0.85)";
      blobsCtx.lineWidth = 5;
      blobsCtx.shadowColor = "#38bdf8";
      blobsCtx.shadowBlur = 14;
      blobsCtx.stroke();
    }
    blobsCtx.restore();

    // Draw Enemies
    enemiesRef.current.forEach((enemy) => {
      blobsCtx.save();
      blobsCtx.beginPath();
      blobsCtx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      blobsCtx.fillStyle = enemy.color;
      blobsCtx.shadowColor = enemy.color;
      blobsCtx.shadowBlur = 12;
      blobsCtx.fill();
      blobsCtx.restore();
    });

    // Draw Projectiles
    projectilesRef.current.forEach((proj) => {
      blobsCtx.save();
      blobsCtx.beginPath();
      blobsCtx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      blobsCtx.fillStyle = proj.color;
      blobsCtx.shadowColor = proj.color;
      blobsCtx.shadowBlur = proj.isCrit ? 16 : 10;
      blobsCtx.fill();
      blobsCtx.restore();
    });

    // Draw Liquid Splat Particles
    particlesRef.current.forEach((p) => {
      blobsCtx.save();
      blobsCtx.globalAlpha = p.alpha;
      blobsCtx.beginPath();
      blobsCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      blobsCtx.fillStyle = p.color;
      blobsCtx.fill();
      blobsCtx.restore();
    });

    // --- 3. UI/Labels Layer ---
    labelsCtx.clearRect(0, 0, width, height);

    // Enemy Health Bars
    enemiesRef.current.forEach((enemy) => {
      if (enemy.hp < enemy.maxHp) {
        labelsCtx.save();
        const barWidth = enemy.radius * 2.2;
        const barHeight = 4;
        const hpPercent = Math.max(0, enemy.hp / enemy.maxHp);
        labelsCtx.fillStyle = "rgba(0,0,0,0.6)";
        labelsCtx.fillRect(enemy.x - enemy.radius * 1.1, enemy.y - enemy.radius - 9, barWidth, barHeight);
        labelsCtx.fillStyle = "#22c55e";
        labelsCtx.fillRect(enemy.x - enemy.radius * 1.1, enemy.y - enemy.radius - 9, barWidth * hpPercent, barHeight);
        labelsCtx.restore();
      }
    });

    // Draw Floating Damage & Gold Gain Texts
    floatingTextsRef.current.forEach((ft) => {
      labelsCtx.save();
      labelsCtx.globalAlpha = Math.max(0, ft.alpha);
      labelsCtx.font = "bold 13px system-ui, sans-serif";
      labelsCtx.fillStyle = ft.color;
      labelsCtx.fillText(ft.text, ft.x, ft.y);
      labelsCtx.restore();
    });
  }, [getStatValues]);

  // Main Loop Tick Ref Callback
  const loopRef = useRef<(ts: number) => void>(() => {});

  useEffect(() => {
    loopRef.current = (timestamp: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
      updateGame();
      renderCanvas();
      if (gameStatus === "PLAYING") {
        animFrameRef.current = requestAnimationFrame(loopRef.current);
      }
    };
  }, [gameStatus, updateGame, renderCanvas]);

  // Handle Game Loop Lifecycle
  useEffect(() => {
    if (gameStatus === "PLAYING") {
      isPausedRef.current = false;
      animFrameRef.current = requestAnimationFrame((ts) => loopRef.current(ts));
    } else {
      isPausedRef.current = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameStatus]);

  // Start New Game
  const startGame = useCallback(() => {
    const stage = blobsCanvasRef.current || bgCanvasRef.current;
    const width = stage ? stage.width : 800;
    const height = stage ? stage.height : 600;

    const stats = getStatValues();

    coreRef.current = {
      x: width / 2,
      y: height / 2,
      radius: 48,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      hpRegen: stats.hpRegen,
      shield: stats.maxShield,
      maxShield: stats.maxShield,
      shieldRegenTimer: 0,
      wobblePhase: 0,
      wobbleIntensity: 0,
      lastShotTime: 0,
    };

    let baseInterval = 150;
    if (difficultyRef.current === "NORMAL") baseInterval = 120;
    else if (difficultyRef.current === "HARD") baseInterval = 95;

    waveRef.current = {
      current: 1,
      spawned: 0,
      totalToSpawn: 10,
      spawnTimer: 0,
      spawnInterval: baseInterval,
      inWave: true,
      bossSpawned: false,
    };

    scoreRef.current = 0;
    enemiesRef.current = [];
    projectilesRef.current = [];
    tentaclesRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];

    setWave(1);
    setScore(0);
    setGameStatus("PLAYING");
  }, [getStatValues]);

  // Continue Game after Game Over (-5 Wave Rewind Checkpoint Penalty)
  const continueFromCheckpoint = useCallback(() => {
    const prevWave = waveRef.current.current;
    const newWave = Math.max(1, prevWave - 5);

    waveRef.current.current = newWave;
    waveRef.current.spawned = 0;
    waveRef.current.totalToSpawn = 10 + newWave * 4;
    waveRef.current.spawnTimer = 0;
    waveRef.current.bossSpawned = false;
    waveRef.current.inWave = true;

    const stats = getStatValues();
    coreRef.current.hp = stats.maxHp;
    coreRef.current.shield = stats.maxShield;

    enemiesRef.current = [];
    projectilesRef.current = [];

    setWave(newWave);
    setGameStatus("PLAYING");
    addFloatingText(`REWOUND TO WAVE ${newWave}`, coreRef.current.x - 80, coreRef.current.y - 80, "#38bdf8");
  }, [getStatValues, addFloatingText]);

  // Buy Upgrade
  const buyUpgrade = useCallback((key: string, baseCost: number, scale: number) => {
    const currentLvl = upgrades[key] || 0;
    const cost = Math.floor(baseCost * Math.pow(scale, currentLvl));

    if (goldRef.current >= cost) {
      goldRef.current -= cost;
      setGold(goldRef.current);

      const nextUpgrades = { ...upgrades, [key]: currentLvl + 1 };
      setUpgrades(nextUpgrades);

      const nextStats = calculateStatValues(nextUpgrades);
      coreRef.current.maxHp = nextStats.maxHp;
      coreRef.current.maxShield = nextStats.maxShield;
      setCoreMaxHp(nextStats.maxHp);
      setCoreMaxShield(nextStats.maxShield);

      saveProgress(goldRef.current, nextUpgrades);

      defenseSound.playUpgrade();
      return true;
    }
    return false;
  }, [upgrades, calculateStatValues, saveProgress]);

  // Select Mutation
  const selectMutation = useCallback((newElem: ElementalType) => {
    setMutation(newElem);
    mutationRef.current = newElem;
    saveProgress(goldRef.current, upgrades, newElem);
    defenseSound.playUpgrade();
  }, [saveProgress, upgrades]);

  return {
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
  };
}
