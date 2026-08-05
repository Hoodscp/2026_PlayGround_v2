"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface SubParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface BlobCell {
  id: string;
  isPlayer: boolean;
  isBot?: boolean;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  targetX?: number;
  targetY?: number;
  splitCooldown?: number;
  angle: number;
  speed: number;
  wallPenetrationX: number; // For wall clipping squish
  wallPenetrationY: number; // For wall clipping squish
  subParticles: SubParticle[];
}

export interface FoodPellet {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface EjectedMass {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  ownerId: string;
}

export interface Virus {
  id: string;
  x: number;
  y: number;
  radius: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  isPlayer: boolean;
}

const WORLD_SIZE = 2400;
const INITIAL_RADIUS = 42; // Generous satisfying initial size
const MIN_RADIUS = 20;
const MAX_RADIUS = 260;
const SUB_PARTICLE_COUNT = 6;

const BOT_NAMES = [
  "GooeyMaster", "LiquidLord", "BlobKing", "SlimeQueen",
  "NeonDrop", "ApexPolymer", "ViscousVip", "JellyJack",
  "BioPlasma", "HydroMatrix", "FluxCell", "CyberOsmosis"
];

const COLORS = [
  "#dfff47", // Acid Green (Playground Signature)
  "#f7f7f2", // Paper White
  "#79d7ff", // Liquid Cyan
  "#ff7bc4", // Cyber Pink
  "#b388ff", // Soft Purple
  "#ffb74d", // Amber Gold
];

function createSubParticles(x: number, y: number, baseRadius: number): SubParticle[] {
  return Array.from({ length: SUB_PARTICLE_COUNT }, (_, idx) => ({
    x,
    y,
    vx: 0,
    vy: 0,
    radius: baseRadius * (0.85 - idx * 0.1),
  }));
}

export function useBlobEngine() {
  const [joined, setJoined] = useState(false);
  const [nickname, setNickname] = useState("");
  const [playerColor, setPlayerColor] = useState(COLORS[0]);
  const [isDead, setIsDead] = useState(false);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const blobsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const labelsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [playerId] = useState(() => `player_${Math.random().toString(36).substring(2, 9)}`);
  const playerIdRef = useRef<string>(playerId);

  const [viewportPos, setViewportPos] = useState({ x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 });
  const nicknameRef = useRef<string>("");
  const colorRef = useRef<string>(COLORS[0]);
  const joinedRef = useRef<boolean>(false);
  const isDeadRef = useRef<boolean>(false);

  const cellsRef = useRef<Map<string, BlobCell[]>>(new Map());
  const foodsRef = useRef<FoodPellet[]>([]);
  const ejectedRef = useRef<EjectedMass[]>([]);
  const virusesRef = useRef<Virus[]>([]);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 });
  const viewportRef = useRef<{ x: number; y: number; width: number; height: number }>({
    x: WORLD_SIZE / 2,
    y: WORLD_SIZE / 2,
    width: 800,
    height: 600,
  });

  const channelRef = useRef<BroadcastChannel | null>(null);

  // Initialize foods and viruses
  const initWorld = useCallback(() => {
    const foods: FoodPellet[] = [];
    for (let i = 0; i < 350; i++) {
      foods.push({
        id: `food_${i}_${Date.now()}`,
        x: Math.random() * WORLD_SIZE,
        y: Math.random() * WORLD_SIZE,
        radius: 4.5 + Math.random() * 4.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
    foodsRef.current = foods;

    const viruses: Virus[] = [];
    for (let i = 0; i < 12; i++) {
      viruses.push({
        id: `virus_${i}`,
        x: 150 + Math.random() * (WORLD_SIZE - 300),
        y: 150 + Math.random() * (WORLD_SIZE - 300),
        radius: 48,
      });
    }
    virusesRef.current = viruses;
  }, []);

  // Broadcast Channel setup for multi-tab real-time sync
  useEffect(() => {
    initWorld();

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel("liquid_blob_arena_v2");
      channelRef.current = bc;

      bc.onmessage = (event) => {
        const { type, payload } = event.data;

        if (type === "SYNC_CELLS") {
          if (payload.id !== playerIdRef.current) {
            cellsRef.current.set(payload.id, payload.cells);
          }
        } else if (type === "REMOVE_PLAYER") {
          cellsRef.current.delete(payload.id);
        } else if (type === "ANNOUNCE_JOIN") {
          if (joinedRef.current && !isDeadRef.current) {
            bc.postMessage({
              type: "SYNC_CELLS",
              payload: {
                id: playerIdRef.current,
                cells: cellsRef.current.get(playerIdRef.current) || [],
              },
            });
          }
        }
      };

      bc.postMessage({ type: "ANNOUNCE_JOIN", payload: {} });
    }

    const activePlayerId = playerIdRef.current;
    return () => {
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: "REMOVE_PLAYER",
          payload: { id: activePlayerId },
        });
        channelRef.current.close();
      }
    };
  }, [initWorld]);

  // Spawn AI Bots
  const spawnBots = useCallback(() => {
    BOT_NAMES.forEach((botName, idx) => {
      const botId = `bot_${idx}`;
      if (!cellsRef.current.has(botId)) {
        const bx = Math.random() * WORLD_SIZE;
        const by = Math.random() * WORLD_SIZE;
        const r = INITIAL_RADIUS + Math.random() * 20;
        cellsRef.current.set(botId, [
          {
            id: `${botId}_0`,
            isPlayer: false,
            name: botName,
            x: bx,
            y: by,
            vx: 0,
            vy: 0,
            radius: r,
            color: COLORS[(idx + 1) % COLORS.length],
            angle: Math.random() * Math.PI * 2,
            speed: 1,
            wallPenetrationX: 0,
            wallPenetrationY: 0,
            subParticles: createSubParticles(bx, by, r),
          },
        ]);
      }
    });
  }, []);

  // Spawn Player
  const joinGame = useCallback((name: string, chosenColor: string) => {
    const finalName = name.trim() || "GooeyBlob";
    nicknameRef.current = finalName;
    colorRef.current = chosenColor;
    setNickname(finalName);
    setPlayerColor(chosenColor);
    setIsDead(false);
    isDeadRef.current = false;

    const startX = 200 + Math.random() * (WORLD_SIZE - 400);
    const startY = 200 + Math.random() * (WORLD_SIZE - 400);

    const playerCells: BlobCell[] = [
      {
        id: `${playerIdRef.current}_0`,
        isPlayer: true,
        name: finalName,
        x: startX,
        y: startY,
        vx: 0,
        vy: 0,
        radius: INITIAL_RADIUS,
        color: chosenColor,
        angle: 0,
        speed: 0,
        wallPenetrationX: 0,
        wallPenetrationY: 0,
        subParticles: createSubParticles(startX, startY, INITIAL_RADIUS),
      },
    ];

    cellsRef.current.set(playerIdRef.current, playerCells);
    spawnBots();

    setJoined(true);
    joinedRef.current = true;

    if (channelRef.current) {
      channelRef.current.postMessage({
        type: "SYNC_CELLS",
        payload: { id: playerIdRef.current, cells: playerCells },
      });
    }
  }, [spawnBots]);

  // Split Player Cells (Spacebar) - Generous size preservation!
  const splitPlayer = useCallback(() => {
    if (!joinedRef.current || isDeadRef.current) return;
    const myCells = cellsRef.current.get(playerIdRef.current);
    if (!myCells || myCells.length >= 8) return;

    const newCells: BlobCell[] = [];
    const mousePos = mousePosRef.current;

    myCells.forEach((cell) => {
      if (cell.radius >= 26 && myCells.length + newCells.length < 8) {
        // Generous size: 80% of radius preserved for generous satisfying split
        const splitRadius = Math.max(MIN_RADIUS, cell.radius * 0.78);
        cell.radius = splitRadius;

        const angle = Math.atan2(mousePos.y - cell.y, mousePos.x - cell.x);
        const speed = 6.75; // 1.5x faster split impulse

        const nx = cell.x + Math.cos(angle) * (splitRadius + 8);
        const ny = cell.y + Math.sin(angle) * (splitRadius + 8);

        newCells.push({
          id: `${playerIdRef.current}_${Date.now()}_${Math.random()}`,
          isPlayer: true,
          name: cell.name,
          x: nx,
          y: ny,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: splitRadius,
          color: cell.color,
          splitCooldown: 400,
          angle,
          speed,
          wallPenetrationX: 0,
          wallPenetrationY: 0,
          subParticles: createSubParticles(nx, ny, splitRadius),
        });
      }
    });

    if (newCells.length > 0) {
      cellsRef.current.set(playerIdRef.current, [...myCells, ...newCells]);
    }
  }, []);

  // Eject Mass (W Key)
  const ejectMass = useCallback(() => {
    if (!joinedRef.current || isDeadRef.current) return;
    const myCells = cellsRef.current.get(playerIdRef.current);
    if (!myCells) return;

    const mousePos = mousePosRef.current;

    myCells.forEach((cell) => {
      if (cell.radius > 28) {
        cell.radius = Math.max(MIN_RADIUS, Math.sqrt(cell.radius * cell.radius - 25));

        const angle = Math.atan2(mousePos.y - cell.y, mousePos.x - cell.x);
        const speed = 5.25; // 1.5x faster eject speed

        ejectedRef.current.push({
          id: `eject_${Date.now()}_${Math.random()}`,
          x: cell.x + Math.cos(angle) * (cell.radius + 10),
          y: cell.y + Math.sin(angle) * (cell.radius + 10),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 6,
          color: cell.color,
          ownerId: playerIdRef.current,
        });
      }
    });
  }, []);

  // Main Physics & Render Loop
  useEffect(() => {
    let animationFrameId: number;
    let syncCounter = 0;

    const updateAndRender = () => {
      const bgCanvas = bgCanvasRef.current;
      const blobsCanvas = blobsCanvasRef.current;
      const labelsCanvas = labelsCanvasRef.current;
      if (!bgCanvas || !blobsCanvas || !labelsCanvas) {
        animationFrameId = requestAnimationFrame(updateAndRender);
        return;
      }

      const bgCtx = bgCanvas.getContext("2d");
      const blobsCtx = blobsCanvas.getContext("2d");
      const labelsCtx = labelsCanvas.getContext("2d");
      if (!bgCtx || !blobsCtx || !labelsCtx) {
        animationFrameId = requestAnimationFrame(updateAndRender);
        return;
      }

      const width = bgCanvas.width;
      const height = bgCanvas.height;

      // 1. Update Player & Bot Movements
      const myCells = cellsRef.current.get(playerIdRef.current) || [];

      let avgX = WORLD_SIZE / 2;
      let avgY = WORLD_SIZE / 2;
      let totalRadius = 0;

      if (myCells.length > 0 && !isDeadRef.current) {
        let sumX = 0;
        let sumY = 0;
        let totalMass = 0;

        myCells.forEach((cell) => {
          sumX += cell.x * cell.radius;
          sumY += cell.y * cell.radius;
          totalMass += cell.radius;
          totalRadius += cell.radius;
        });

        if (totalMass > 0) {
          avgX = sumX / totalMass;
          avgY = sumY / totalMass;
        }

        setScore(Math.floor(totalRadius * 10));
      }

      // Smooth camera follow (1.5x faster tracking)
      viewportRef.current.x += (avgX - viewportRef.current.x) * 0.08;
      viewportRef.current.y += (avgY - viewportRef.current.y) * 0.08;
      viewportRef.current.width = width;
      viewportRef.current.height = height;
      setViewportPos({ x: viewportRef.current.x, y: viewportRef.current.y });

      // Update Player Cells Position (1.5x faster speed & acceleration)
      const mousePos = mousePosRef.current;
      myCells.forEach((cell) => {
        const dx = mousePos.x - cell.x;
        const dy = mousePos.y - cell.y;
        const dist = Math.hypot(dx, dy);

        const maxSpeed = Math.max(0.75, 3.0 - cell.radius * 0.01);

        if (dist > 8) {
          cell.vx += (dx / dist) * maxSpeed * 0.032;
          cell.vy += (dy / dist) * maxSpeed * 0.032;
        }

        cell.vx *= 0.93;
        cell.vy *= 0.93;

        cell.x += cell.vx;
        cell.y += cell.vy;

        cell.speed = Math.hypot(cell.vx, cell.vy);
        if (cell.speed > 0.02) {
          cell.angle = Math.atan2(cell.vy, cell.vx);
        }

        // Wall Clipping Physics: Detect Exact Penetration Deep Into Boundaries
        let penX = 0;
        let penY = 0;

        // Allow cell center to press against boundary up to 60% of radius (Wall Squish Clipping)
        const minPos = cell.radius * 0.4;
        const maxPos = WORLD_SIZE - cell.radius * 0.4;

        if (cell.x < cell.radius) {
          penX = cell.radius - cell.x;
          if (cell.x < minPos) {
            cell.x = minPos;
            cell.vx = 0;
          }
        } else if (cell.x > WORLD_SIZE - cell.radius) {
          penX = cell.x - (WORLD_SIZE - cell.radius);
          if (cell.x > maxPos) {
            cell.x = maxPos;
            cell.vx = 0;
          }
        }

        if (cell.y < cell.radius) {
          penY = cell.radius - cell.y;
          if (cell.y < minPos) {
            cell.y = minPos;
            cell.vy = 0;
          }
        } else if (cell.y > WORLD_SIZE - cell.radius) {
          penY = cell.y - (WORLD_SIZE - cell.radius);
          if (cell.y > maxPos) {
            cell.y = maxPos;
            cell.vy = 0;
          }
        }

        cell.wallPenetrationX = penX;
        cell.wallPenetrationY = penY;

        if (cell.splitCooldown && cell.splitCooldown > 0) {
          cell.splitCooldown -= 1;
        }

        // Update Sub-particles
        if (!cell.subParticles || cell.subParticles.length === 0) {
          cell.subParticles = createSubParticles(cell.x, cell.y, cell.radius);
        }

        let lead = { x: cell.x, y: cell.y };
        cell.subParticles.forEach((sp, idx) => {
          sp.radius = cell.radius * (0.85 - idx * 0.1);
          const spDx = lead.x - sp.x;
          const spDy = lead.y - sp.y;
          const stiffness = Math.max(0.04, 0.12 - idx * 0.018);

          sp.vx = (sp.vx + spDx * stiffness) * 0.80;
          sp.vy = (sp.vy + spDy * stiffness) * 0.80;

          sp.x += sp.vx;
          sp.y += sp.vy;

          // Restrict subparticles within world boundary
          sp.x = Math.max(5, Math.min(WORLD_SIZE - 5, sp.x));
          sp.y = Math.max(5, Math.min(WORLD_SIZE - 5, sp.y));
          lead = sp;
        });
      });

      // Update AI Bots logic
      cellsRef.current.forEach((cells, id) => {
        if (id.startsWith("bot_") && cells.length > 0) {
          const bot = cells[0];
          if (bot.targetX === undefined || bot.targetY === undefined || Math.hypot(bot.targetX - bot.x, bot.targetY - bot.y) < 40) {
            bot.targetX = Math.random() * WORLD_SIZE;
            bot.targetY = Math.random() * WORLD_SIZE;
          }

          const targetX = bot.targetX;
          const targetY = bot.targetY;
          const dx = targetX - bot.x;
          const dy = targetY - bot.y;
          const dist = Math.hypot(dx, dy);

          const botSpeed = Math.max(0.75, 2.7 - bot.radius * 0.009);
          bot.vx += (dx / dist) * botSpeed * 0.027;
          bot.vy += (dy / dist) * botSpeed * 0.027;

          bot.vx *= 0.93;
          bot.vy *= 0.93;

          bot.x += bot.vx;
          bot.y += bot.vy;

          bot.speed = Math.hypot(bot.vx, bot.vy);
          if (bot.speed > 0.02) {
            bot.angle = Math.atan2(bot.vy, bot.vx);
          }

          let penX = 0;
          let penY = 0;
          const minPos = bot.radius * 0.4;
          const maxPos = WORLD_SIZE - bot.radius * 0.4;

          if (bot.x < bot.radius) {
            penX = bot.radius - bot.x;
            if (bot.x < minPos) bot.x = minPos;
          } else if (bot.x > WORLD_SIZE - bot.radius) {
            penX = bot.x - (WORLD_SIZE - bot.radius);
            if (bot.x > maxPos) bot.x = maxPos;
          }

          if (bot.y < bot.radius) {
            penY = bot.radius - bot.y;
            if (bot.y < minPos) bot.y = minPos;
          } else if (bot.y > WORLD_SIZE - bot.radius) {
            penY = bot.y - (WORLD_SIZE - bot.radius);
            if (bot.y > maxPos) bot.y = maxPos;
          }

          bot.wallPenetrationX = penX;
          bot.wallPenetrationY = penY;

          if (!bot.subParticles || bot.subParticles.length === 0) {
            bot.subParticles = createSubParticles(bot.x, bot.y, bot.radius);
          }

          let lead = { x: bot.x, y: bot.y };
          bot.subParticles.forEach((sp, idx) => {
            sp.radius = bot.radius * (0.85 - idx * 0.1);
            const spDx = lead.x - sp.x;
            const spDy = lead.y - sp.y;
            const stiffness = Math.max(0.04, 0.12 - idx * 0.018);
            sp.vx = (sp.vx + spDx * stiffness) * 0.80;
            sp.vy = (sp.vy + spDy * stiffness) * 0.80;
            sp.x += sp.vx;
            sp.y += sp.vy;
            sp.x = Math.max(5, Math.min(WORLD_SIZE - 5, sp.x));
            sp.y = Math.max(5, Math.min(WORLD_SIZE - 5, sp.y));
            lead = sp;
          });
        }
      });

      // Ejected mass physics
      ejectedRef.current.forEach((mass) => {
        mass.x += mass.vx;
        mass.y += mass.vy;
        mass.vx *= 0.95;
        mass.vy *= 0.95;
      });

      // 2. Collision & Eating Logic (Optimized fast squared distance checks)
      const allPlayerCells: BlobCell[] = [];
      cellsRef.current.forEach((cells) => {
        allPlayerCells.push(...cells);
      });

      allPlayerCells.forEach((cell) => {
        const cellRSq = cell.radius * cell.radius;
        foodsRef.current = foodsRef.current.filter((food) => {
          const dx = food.x - cell.x;
          const dy = food.y - cell.y;
          if (dx * dx + dy * dy < cellRSq) {
            cell.radius = Math.min(MAX_RADIUS, Math.sqrt(cellRSq + 1.2));
            return false;
          }
          return true;
        });

        // Eat Ejected mass
        ejectedRef.current = ejectedRef.current.filter((mass) => {
          const dx = mass.x - cell.x;
          const dy = mass.y - cell.y;
          if (cell.radius > mass.radius + 4 && dx * dx + dy * dy < cellRSq) {
            cell.radius = Math.min(MAX_RADIUS, Math.sqrt(cellRSq + 8));
            return false;
          }
          return true;
        });

        // Hit Virus
        virusesRef.current.forEach((virus) => {
          const dx = virus.x - cell.x;
          const dy = virus.y - cell.y;
          if (cell.radius > virus.radius + 6 && dx * dx + dy * dy < cellRSq) {
            cell.radius = Math.max(MIN_RADIUS, cell.radius * 0.6);
          }
        });
      });

      // Respawn foods if low
      if (foodsRef.current.length < 300) {
        for (let i = 0; i < 30; i++) {
          foodsRef.current.push({
            id: `food_respawn_${Date.now()}_${Math.random()}`,
            x: Math.random() * WORLD_SIZE,
            y: Math.random() * WORLD_SIZE,
            radius: 3.5 + Math.random() * 3.5,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
          });
        }
      }

      // Cell vs Cell eating
      for (let i = 0; i < allPlayerCells.length; i++) {
        for (let j = 0; j < allPlayerCells.length; j++) {
          if (i === j) continue;
          const c1 = allPlayerCells[i];
          const c2 = allPlayerCells[j];

          if (c1.name === c2.name && c1.isPlayer && c2.isPlayer) continue;

          const dx = c1.x - c2.x;
          const dy = c1.y - c2.y;
          const distSq = dx * dx + dy * dy;
          const eatDistThreshold = c1.radius - c2.radius / 3;

          if (distSq < eatDistThreshold * eatDistThreshold && c1.radius > c2.radius * 1.12) {
            c1.radius = Math.min(MAX_RADIUS, Math.sqrt(c1.radius * c1.radius + c2.radius * c2.radius));
            c2.radius = 0;

            if (c2.id.startsWith(playerIdRef.current)) {
              const remaining = myCells.filter((c) => c.radius > 0);
              if (remaining.length === 0) {
                setIsDead(true);
                isDeadRef.current = true;
              }
            }
          }
        }
      }

      // Clean dead cells
      cellsRef.current.forEach((cells, ownerId) => {
        const alive = cells.filter((c) => c.radius > 0);
        if (alive.length === 0) {
          cellsRef.current.delete(ownerId);
          if (ownerId.startsWith("bot_")) {
            const idx = parseInt(ownerId.split("_")[1], 10) || 0;
            const bx = Math.random() * WORLD_SIZE;
            const by = Math.random() * WORLD_SIZE;
            const r = INITIAL_RADIUS + Math.random() * 15;
            cellsRef.current.set(ownerId, [
              {
                id: `${ownerId}_${Date.now()}`,
                isPlayer: false,
                isBot: true,
                name: BOT_NAMES[idx % BOT_NAMES.length],
                x: bx,
                y: by,
                vx: 0,
                vy: 0,
                radius: r,
                color: COLORS[(idx + 1) % COLORS.length],
                angle: 0,
                speed: 0,
                wallPenetrationX: 0,
                wallPenetrationY: 0,
                subParticles: createSubParticles(bx, by, r),
              },
            ]);
          }
        } else {
          cellsRef.current.set(ownerId, alive);
        }
      });

      // 3. Broadcast sync message periodically
      syncCounter++;
      if (syncCounter % 3 === 0 && channelRef.current && joinedRef.current && !isDeadRef.current) {
        channelRef.current.postMessage({
          type: "SYNC_CELLS",
          payload: {
            id: playerIdRef.current,
            cells: cellsRef.current.get(playerIdRef.current) || [],
          },
        });
      }

      // 4. Update Leaderboard (Throttled once every 15 frames for 60FPS performance)
      if (syncCounter % 15 === 0) {
        const leaderboardData: LeaderboardEntry[] = [];
        cellsRef.current.forEach((cells, id) => {
          if (cells.length > 0) {
            const totalCellMass = cells.reduce((acc, c) => acc + c.radius, 0);
            leaderboardData.push({
              id,
              name: cells[0].name,
              score: Math.floor(totalCellMass * 10),
              isPlayer: id === playerIdRef.current,
            });
          }
        });
        leaderboardData.sort((a, b) => b.score - a.score);
        setLeaderboard(leaderboardData.slice(0, 5));
      }

      // 5. RENDER DUAL CANVASES (bgCtx for crisp world & text, blobsCtx for GPU liquid metaballs)
      const camX = viewportRef.current.x;
      const camY = viewportRef.current.y;
      const halfW = width / 2;
      const halfH = height / 2;

      // Clear all 3 canvases
      bgCtx.fillStyle = "#090909";
      bgCtx.fillRect(0, 0, width, height);
      blobsCtx.clearRect(0, 0, width, height);
      labelsCtx.clearRect(0, 0, width, height);

      bgCtx.save();
      bgCtx.translate(halfW - camX, halfH - camY);

      blobsCtx.save();
      blobsCtx.translate(halfW - camX, halfH - camY);

      labelsCtx.save();
      labelsCtx.translate(halfW - camX, halfH - camY);

      // --- A. CRISP WORLD LAYER (bgCtx) ---
      // Floor Radial Light Aura
      const auraGrad = bgCtx.createRadialGradient(camX, camY, 10, camX, camY, Math.max(width, height) * 0.75);
      auraGrad.addColorStop(0, "rgba(247, 247, 242, 0.08)");
      auraGrad.addColorStop(1, "rgba(247, 247, 242, 0)");
      bgCtx.fillStyle = auraGrad;
      bgCtx.fillRect(camX - width, camY - height, width * 2, height * 2);

      // Grid Pattern
      bgCtx.strokeStyle = "rgba(247, 247, 242, 0.035)";
      bgCtx.lineWidth = 1;
      const gridSize = 64;
      const startX = Math.floor((camX - halfW) / gridSize) * gridSize;
      const endX = Math.ceil((camX + halfW) / gridSize) * gridSize;
      const startY = Math.floor((camY - halfH) / gridSize) * gridSize;
      const endY = Math.ceil((camY + halfH) / gridSize) * gridSize;

      for (let x = startX; x <= endX; x += gridSize) {
        bgCtx.beginPath();
        bgCtx.moveTo(x, startY);
        bgCtx.lineTo(x, endY);
        bgCtx.stroke();
      }
      for (let y = startY; y <= endY; y += gridSize) {
        bgCtx.beginPath();
        bgCtx.moveTo(startX, y);
        bgCtx.lineTo(endX, y);
        bgCtx.stroke();
      }

      // Arena Outer Boundary Wall Line (Crisp)
      bgCtx.strokeStyle = "rgba(247, 247, 242, 0.35)";
      bgCtx.lineWidth = 2.5;
      bgCtx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

      // Foods (Crisp energy droplets)
      foodsRef.current.forEach((food) => {
        bgCtx.fillStyle = food.color;
        bgCtx.beginPath();
        bgCtx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
        bgCtx.fill();

        bgCtx.fillStyle = "rgba(255, 255, 255, 0.7)";
        bgCtx.beginPath();
        bgCtx.arc(food.x - food.radius * 0.25, food.y - food.radius * 0.25, food.radius * 0.3, 0, Math.PI * 2);
        bgCtx.fill();
      });

      // Ejected Mass (Crisp)
      ejectedRef.current.forEach((mass) => {
        bgCtx.fillStyle = mass.color;
        bgCtx.beginPath();
        bgCtx.arc(mass.x, mass.y, mass.radius, 0, Math.PI * 2);
        bgCtx.fill();
      });

      // Viruses (Crisp hazard saw-tooth portals)
      virusesRef.current.forEach((v) => {
        bgCtx.fillStyle = "rgba(223, 255, 71, 0.22)";
        bgCtx.strokeStyle = "#dfff47";
        bgCtx.lineWidth = 2;
        bgCtx.beginPath();
        const points = 18;
        for (let i = 0; i < points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const r = i % 2 === 0 ? v.radius : v.radius - 9;
          const px = v.x + Math.cos(angle) * r;
          const py = v.y + Math.sin(angle) * r;
          if (i === 0) bgCtx.moveTo(px, py);
          else bgCtx.lineTo(px, py);
        }
        bgCtx.closePath();
        bgCtx.fill();
        bgCtx.stroke();

        bgCtx.fillStyle = "#dfff47";
        bgCtx.beginPath();
        bgCtx.arc(v.x, v.y, 8, 0, Math.PI * 2);
        bgCtx.fill();
      });

      // --- B. LIQUID GOOEY METABALL CELLS LAYER (blobsCtx) ---
      blobsCtx.save();
      blobsCtx.beginPath();
      blobsCtx.rect(0, 0, WORLD_SIZE, WORLD_SIZE);
      blobsCtx.clip();

      // --- C. CRISP LABELS OVERLAY LAYER (labelsCtx: z-index 3) ---
      labelsCtx.save();
      labelsCtx.beginPath();
      labelsCtx.rect(0, 0, WORLD_SIZE, WORLD_SIZE);
      labelsCtx.clip();

      cellsRef.current.forEach((cells) => {
        cells.forEach((cell) => {
          const speedStretch = Math.min(0.45, cell.speed * 0.25);
          let rx = cell.radius * (1 + speedStretch);
          let ry = cell.radius * (1 - speedStretch * 0.4);

          const isCollidingWall = cell.wallPenetrationX > 0 || cell.wallPenetrationY > 0;
          if (cell.wallPenetrationX > 0) {
            const squish = Math.min(cell.radius * 0.4, cell.wallPenetrationX * 0.65);
            rx = Math.max(12, rx - squish);
            ry = ry + squish * 0.55;
          }
          if (cell.wallPenetrationY > 0) {
            const squish = Math.min(cell.radius * 0.4, cell.wallPenetrationY * 0.65);
            ry = Math.max(12, ry - squish);
            rx = rx + squish * 0.55;
          }

          // 1. Trailing subparticles (Fused into metaballs by CSS filter on blobsCanvas)
          if (cell.subParticles && cell.subParticles.length > 0) {
            blobsCtx.fillStyle = cell.color;
            [...cell.subParticles].reverse().forEach((sp) => {
              blobsCtx.beginPath();
              blobsCtx.arc(sp.x, sp.y, Math.max(4, sp.radius * 0.88), 0, Math.PI * 2);
              blobsCtx.fill();
            });
          }

          // 2. Main Body Ellipse
          blobsCtx.save();
          blobsCtx.translate(cell.x, cell.y);
          if (!isCollidingWall) {
            blobsCtx.rotate(cell.angle || 0);
          }
          blobsCtx.fillStyle = cell.color;
          blobsCtx.beginPath();
          blobsCtx.ellipse(0, 0, Math.max(6, rx), Math.max(6, ry), 0, 0, Math.PI * 2);
          blobsCtx.fill();
          blobsCtx.restore();

          // 3. Crisp Nickname Text drawn on labelsCtx (z-index: 3, 100% on top of blobs & 100% sharp!)
          if (cell.radius > 14) {
            labelsCtx.fillStyle = cell.color === "#f7f7f2" ? "#0b0b0c" : "#ffffff";
            labelsCtx.font = `600 ${Math.max(10, Math.min(20, cell.radius * 0.34))}px "Manrope Variable", sans-serif`;
            labelsCtx.textAlign = "center";
            labelsCtx.textBaseline = "middle";
            labelsCtx.fillText(cell.name, cell.x, cell.y);
          }
        });
      });

      blobsCtx.restore();
      labelsCtx.restore();

      bgCtx.restore();
      blobsCtx.restore();
      labelsCtx.restore();

      animationFrameId = requestAnimationFrame(updateAndRender);
    };

    animationFrameId = requestAnimationFrame(updateAndRender);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handlePointerMove = (clientX: number, clientY: number) => {
    const canvas = bgCanvasRef.current || blobsCanvasRef.current || labelsCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const screenX = relX * scaleX;
    const screenY = relY * scaleY;

    const worldX = viewportRef.current.x + (screenX - canvas.width / 2);
    const worldY = viewportRef.current.y + (screenY - canvas.height / 2);

    mousePosRef.current = {
      x: Math.max(0, Math.min(WORLD_SIZE, worldX)),
      y: Math.max(0, Math.min(WORLD_SIZE, worldY)),
    };
  };

  const resetWorld = useCallback(() => {
    initWorld();
    cellsRef.current.clear();
    if (joinedRef.current && !isDeadRef.current) {
      joinGame(nicknameRef.current || "GooeyBlob", colorRef.current || COLORS[0]);
    } else {
      spawnBots();
    }
  }, [initWorld, joinGame, spawnBots]);

  return {
    bgCanvasRef,
    blobsCanvasRef,
    labelsCanvasRef,
    joined,
    nickname,
    playerColor,
    isDead,
    score,
    leaderboard,
    WORLD_SIZE,
    joinGame,
    splitPlayer,
    ejectMass,
    handlePointerMove,
    resetWorld,
    viewportRef,
    viewportPos,
    COLORS,
  };
}
