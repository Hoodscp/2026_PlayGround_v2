export type Difficulty = "low" | "medium" | "hard";
export type Direction = "north" | "east" | "south" | "west";

export type MazePoint = {
  row: number;
  col: number;
};

export type MazeExit = MazePoint & {
  side: Direction;
};

export type MazeData = {
  size: number;
  walls: number[][];
  start: MazePoint;
  exit: MazeExit;
  seed: number;
};

export const DIFFICULTY_SIZE: Record<Difficulty, number> = {
  low: 9,
  medium: 15,
  hard: 21,
};

export const WALL = {
  north: 1,
  east: 2,
  south: 4,
  west: 8,
} as const;

export const DIRECTION = {
  north: { row: -1, col: 0, opposite: "south" },
  east: { row: 0, col: 1, opposite: "west" },
  south: { row: 1, col: 0, opposite: "north" },
  west: { row: 0, col: -1, opposite: "east" },
} as const satisfies Record<
  Direction,
  { row: number; col: number; opposite: Direction }
>;

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function chooseExitSide(point: MazePoint, size: number, random: () => number) {
  const sides: Direction[] = [];
  if (point.row === 0) sides.push("north");
  if (point.col === size - 1) sides.push("east");
  if (point.row === size - 1) sides.push("south");
  if (point.col === 0) sides.push("west");
  return sides[Math.floor(random() * sides.length)];
}

export function generateMaze(difficulty: Difficulty, seed = Date.now()): MazeData {
  const size = DIFFICULTY_SIZE[difficulty];
  const random = seededRandom(seed);
  const walls = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => 15),
  );
  const visited = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );
  const start = { row: Math.floor(size / 2), col: Math.floor(size / 2) };
  const stack: MazePoint[] = [start];
  visited[start.row][start.col] = true;

  while (stack.length) {
    const current = stack[stack.length - 1];
    const candidates = (Object.keys(DIRECTION) as Direction[])
      .map((direction) => {
        const delta = DIRECTION[direction];
        return {
          direction,
          row: current.row + delta.row,
          col: current.col + delta.col,
        };
      })
      .filter(
        ({ row, col }) =>
          row >= 0 &&
          row < size &&
          col >= 0 &&
          col < size &&
          !visited[row][col],
      );

    if (!candidates.length) {
      stack.pop();
      continue;
    }

    const next = candidates[Math.floor(random() * candidates.length)];
    const opposite = DIRECTION[next.direction].opposite;
    walls[current.row][current.col] &= ~WALL[next.direction];
    walls[next.row][next.col] &= ~WALL[opposite];
    visited[next.row][next.col] = true;
    stack.push({ row: next.row, col: next.col });
  }

  const distances = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => -1),
  );
  const queue: MazePoint[] = [start];
  distances[start.row][start.col] = 0;

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const direction of Object.keys(DIRECTION) as Direction[]) {
      if (walls[current.row][current.col] & WALL[direction]) continue;
      const delta = DIRECTION[direction];
      const row = current.row + delta.row;
      const col = current.col + delta.col;
      if (
        row < 0 ||
        row >= size ||
        col < 0 ||
        col >= size ||
        distances[row][col] >= 0
      ) {
        continue;
      }
      distances[row][col] = distances[current.row][current.col] + 1;
      queue.push({ row, col });
    }
  }

  const boundary = queue.filter(
    ({ row, col }) => row === 0 || col === 0 || row === size - 1 || col === size - 1,
  );
  const maxDistance = Math.max(...boundary.map(({ row, col }) => distances[row][col]));
  const farthest = boundary.filter(
    ({ row, col }) => distances[row][col] === maxDistance,
  );
  const exitPoint = farthest[Math.floor(random() * farthest.length)];
  const side = chooseExitSide(exitPoint, size, random);
  walls[exitPoint.row][exitPoint.col] &= ~WALL[side];

  return {
    size,
    walls,
    start,
    exit: { ...exitPoint, side },
    seed,
  };
}

export function canMove(maze: MazeData, point: MazePoint, direction: Direction) {
  if (maze.walls[point.row][point.col] & WALL[direction]) return null;
  const delta = DIRECTION[direction];
  const next = { row: point.row + delta.row, col: point.col + delta.col };
  if (
    next.row < 0 ||
    next.row >= maze.size ||
    next.col < 0 ||
    next.col >= maze.size
  ) {
    return null;
  }
  return next;
}
