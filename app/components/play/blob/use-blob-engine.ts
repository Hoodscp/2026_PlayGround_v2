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
  "#ccff00", // Acid Green (Playground Signature)
  "#f4f4f0", // Paper White
  "#00e5ff", // Liquid Cyan
  "#ff3366", // Cyber Crimson
  "#ab47bc", // Velvet Purple
  "#ffaa00", // Amber Gold
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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Engine state references
  const playerIdRef = useRef<string>(`player_${Math.random().toString(36).substring(2, 9)}`);
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

    return () => {
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: "REMOVE_PLAYER",
          payload: { id: playerIdRef.current },
        });
        channelRef.current.close();
      }
    };
  }, [initWorld]);

  // Spawn Player
  const joinGame = (name: string, chosenColor: string) => {
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
  };

  // Spawn AI Bots
  const spawnBots = () => {
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
            isBot: true,
            name: botName,
            x: bx,
            y: by,
            vx: 0,
            vy: 0,
            radius: r,
            color: COLORS[(idx + 1) % COLORS.length],
            targetX: Math.random() * WORLD_SIZE,
            targetY: Math.random() * WORLD_SIZE,
            angle: 0,
            speed: 0,
            wallPenetrationX: 0,
            wallPenetrationY: 0,
            subParticles: createSubParticles(bx, by, r),
          },
        ]);
      }
    });
  };

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
        const speed = 4.5;

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
        const speed = 3.5;

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
      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameId = requestAnimationFrame(updateAndRender);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationFrameId = requestAnimationFrame(updateAndRender);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;

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

      // Smooth camera follow
      viewportRef.current.x += (avgX - viewportRef.current.x) * 0.05;
      viewportRef.current.y += (avgY - viewportRef.current.y) * 0.05;
      viewportRef.current.width = width;
      viewportRef.current.height = height;

      // Update Player Cells Position
      const mousePos = mousePosRef.current;
      myCells.forEach((cell) => {
        const dx = mousePos.x - cell.x;
        const dy = mousePos.y - cell.y;
        const dist = Math.hypot(dx, dy);

        const maxSpeed = Math.max(0.5, 2.0 - cell.radius * 0.007);

        if (dist > 8) {
          cell.vx += (dx / dist) * maxSpeed * 0.02;
          cell.vy += (dy / dist) * maxSpeed * 0.02;
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

          const botSpeed = Math.max(0.5, 1.8 - bot.radius * 0.006);
          bot.vx += (dx / dist) * botSpeed * 0.018;
          bot.vy += (dy / dist) * botSpeed * 0.018;

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

      // 2. Collision & Eating Logic
      const allPlayerCells: BlobCell[] = [];
      cellsRef.current.forEach((cells) => {
        allPlayerCells.push(...cells);
      });

      // Eat Food
      allPlayerCells.forEach((cell) => {
        foodsRef.current = foodsRef.current.filter((food) => {
          const dist = Math.hypot(food.x - cell.x, food.y - cell.y);
          if (dist < cell.radius) {
            cell.radius = Math.min(MAX_RADIUS, Math.sqrt(cell.radius * cell.radius + 1.2));
            return false;
          }
          return true;
        });

        // Eat Ejected mass
        ejectedRef.current = ejectedRef.current.filter((mass) => {
          const dist = Math.hypot(mass.x - cell.x, mass.y - cell.y);
          if (dist < cell.radius && cell.radius > mass.radius + 4) {
            cell.radius = Math.min(MAX_RADIUS, Math.sqrt(cell.radius * cell.radius + 8));
            return false;
          }
          return true;
        });

        // Hit Virus
        virusesRef.current.forEach((virus) => {
          const dist = Math.hypot(virus.x - cell.x, virus.y - cell.y);
          if (dist < cell.radius && cell.radius > virus.radius + 6) {
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

          const dist = Math.hypot(c1.x - c2.x, c1.y - c2.y);
          if (dist < c1.radius - c2.radius / 3 && c1.radius > c2.radius * 1.12) {
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

      // 4. Update Leaderboard
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

      // 5. RENDER CANVAS (Clean sharp background + Real Wall Clipping)
      const camX = viewportRef.current.x;
      const camY = viewportRef.current.y;
      const halfW = width / 2;
      const halfH = height / 2;

      ctx.fillStyle = "#0a0a0c";
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(halfW - camX, halfH - camY);

      // Grid Pattern (Clean sharp lines)
      ctx.strokeStyle = "rgba(244, 244, 240, 0.04)";
      ctx.lineWidth = 1;
      const gridSize = 80;
      const startX = Math.floor((camX - halfW) / gridSize) * gridSize;
      const endX = Math.ceil((camX + halfW) / gridSize) * gridSize;
      const startY = Math.floor((camY - halfH) / gridSize) * gridSize;
      const endY = Math.ceil((camY + halfH) / gridSize) * gridSize;

      for (let x = startX; x <= endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }

      // Arena Outer Boundary Wall Line (Crisp)
      ctx.strokeStyle = "rgba(244, 244, 240, 0.25)";
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

      // Foods
      foodsRef.current.forEach((food) => {
        ctx.fillStyle = food.color;
        ctx.beginPath();
        ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Ejected Mass
      ejectedRef.current.forEach((mass) => {
        ctx.fillStyle = mass.color;
        ctx.beginPath();
        ctx.arc(mass.x, mass.y, mass.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Viruses
      virusesRef.current.forEach((v) => {
        ctx.fillStyle = "rgba(204, 255, 0, 0.35)";
        ctx.beginPath();
        const points = 16;
        for (let i = 0; i < points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const r = i % 2 === 0 ? v.radius : v.radius - 8;
          const px = v.x + Math.cos(angle) * r;
          const py = v.y + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      });

      // =========================================================================
      // REAL WALL CLIPPING LAYER: Clip cell rendering exactly to [0, 0, WORLD_SIZE, WORLD_SIZE]
      // =========================================================================
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, WORLD_SIZE, WORLD_SIZE);
      ctx.clip(); // Wall Clipping Mask: Liquid cannot cross the arena wall boundary!

      // Render Blobs / Cells (Pure Organic Deformed Ellipse - No Inner Core Artifact)
      cellsRef.current.forEach((cells) => {
        cells.forEach((cell) => {
          // Calculate Dynamic Squash & Stretch from Movement Speed and Wall Penetration
          const speedStretch = Math.min(0.65, cell.speed * 0.35);

          // Volume-preserving Wall Squish:
          // If penetrating X-wall, reduce X-radius and expand Y-radius
          // If penetrating Y-wall, reduce Y-radius and expand X-radius
          let rx = cell.radius * (1 + speedStretch);
          let ry = cell.radius * (1 - speedStretch * 0.5);

          if (cell.wallPenetrationX > 0) {
            const penFactor = Math.min(cell.radius * 0.5, cell.wallPenetrationX);
            rx = Math.max(8, rx - penFactor * 0.8);
            ry = ry + penFactor * 0.6; // Volume preservation squish
          }
          if (cell.wallPenetrationY > 0) {
            const penFactor = Math.min(cell.radius * 0.5, cell.wallPenetrationY);
            ry = Math.max(8, ry - penFactor * 0.8);
            rx = rx + penFactor * 0.6; // Volume preservation squish
          }

          ctx.save();
          ctx.translate(cell.x, cell.y);
          if (cell.wallPenetrationX === 0 && cell.wallPenetrationY === 0) {
            ctx.rotate(cell.angle || 0);
          }

          const grad = ctx.createRadialGradient(-rx * 0.2, -ry * 0.2, rx * 0.05, 0, 0, Math.max(rx, ry));
          grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
          grad.addColorStop(0.35, cell.color);
          grad.addColorStop(1, cell.color);

          // Apply Gooey Filter ONLY to cell blob graphics
          ctx.filter = "url(#blob-gooey-filter)";
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(0, 0, Math.max(4, rx), Math.max(4, ry), 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();

          // Reset filter for crisp clear Nickname Label text
          ctx.filter = "none";
          if (cell.radius > 14) {
            ctx.fillStyle = cell.color === "#f4f4f0" ? "#0b0b0c" : "#ffffff";
            ctx.font = `600 ${Math.max(10, Math.min(20, cell.radius * 0.34))}px "Manrope Variable", sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(cell.name, cell.x, cell.y);
          }
        });
      });

      ctx.restore(); // Restore Wall Clipping Mask
      ctx.restore(); // Restore Camera Translate

      animationFrameId = requestAnimationFrame(updateAndRender);
    };

    animationFrameId = requestAnimationFrame(updateAndRender);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handlePointerMove = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
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

  return {
    canvasRef,
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
    viewportRef,
    COLORS,
  };
}
