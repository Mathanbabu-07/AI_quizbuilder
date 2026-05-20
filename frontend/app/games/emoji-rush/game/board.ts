import { getRoundEmojis, type EmojiRushRoundConfig } from "@/app/games/emoji-rush/game/config";

export type BoardPoint = {
  row: number;
  col: number;
};

export type EmojiTile = BoardPoint & {
  id: string;
  emoji: string;
  status: "idle" | "matched" | "new";
  power: number;
};

export type EmojiMatch = {
  id: string;
  cells: BoardPoint[];
  length: number;
  direction: "row" | "col";
};

let tileCounter = 0;

function nextTileId() {
  tileCounter += 1;
  return `emoji_tile_${tileCounter}`;
}

function randomEmoji(emojis: string[]) {
  return emojis[Math.floor(Math.random() * emojis.length)] ?? emojis[0] ?? "🍓";
}

function makeTile(row: number, col: number, emojis: string[], status: EmojiTile["status"] = "idle"): EmojiTile {
  return {
    id: nextTileId(),
    row,
    col,
    emoji: randomEmoji(emojis),
    status,
    power: 0
  };
}

function wouldCreateLine(board: EmojiTile[], size: number, row: number, col: number, emoji: string) {
  const leftOne = board.find((tile) => tile.row === row && tile.col === col - 1)?.emoji;
  const leftTwo = board.find((tile) => tile.row === row && tile.col === col - 2)?.emoji;
  const upOne = board.find((tile) => tile.row === row - 1 && tile.col === col)?.emoji;
  const upTwo = board.find((tile) => tile.row === row - 2 && tile.col === col)?.emoji;
  return (leftOne === emoji && leftTwo === emoji) || (upOne === emoji && upTwo === emoji) || size < 3;
}

export function createBoard(config: EmojiRushRoundConfig): EmojiTile[] {
  const emojis = getRoundEmojis(config);
  let attempts = 0;

  while (attempts < 8) {
    const board: EmojiTile[] = [];
    for (let row = 0; row < config.boardSize; row += 1) {
      for (let col = 0; col < config.boardSize; col += 1) {
        let tile = makeTile(row, col, emojis, "new");
        let guard = 0;
        while (wouldCreateLine(board, config.boardSize, row, col, tile.emoji) && guard < 14) {
          tile = makeTile(row, col, emojis, "new");
          guard += 1;
        }
        board.push(tile);
      }
    }

    if (hasAvailableMove(board, config.boardSize) || attempts === 7) {
      return board;
    }

    attempts += 1;
  }

  return [];
}

export function isAdjacent(a: BoardPoint, b: BoardPoint) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

export function tileAt(board: EmojiTile[], point: BoardPoint) {
  return board.find((tile) => tile.row === point.row && tile.col === point.col);
}

export function swapTiles(board: EmojiTile[], a: BoardPoint, b: BoardPoint): EmojiTile[] {
  const first = tileAt(board, a);
  const second = tileAt(board, b);

  if (!first || !second) {
    return board;
  }

  return board.map((tile) => {
    if (tile.id === first.id) {
      return { ...tile, row: b.row, col: b.col, status: "idle" as const };
    }

    if (tile.id === second.id) {
      return { ...tile, row: a.row, col: a.col, status: "idle" as const };
    }

    return tile;
  });
}

function matchKey(cells: BoardPoint[]) {
  return cells.map((cell) => `${cell.row}:${cell.col}`).join("|");
}

export function findMatches(board: EmojiTile[], size: number): EmojiMatch[] {
  const matches: EmojiMatch[] = [];

  for (let row = 0; row < size; row += 1) {
    let run: EmojiTile[] = [];
    for (let col = 0; col < size; col += 1) {
      const tile = tileAt(board, { row, col });
      const previous = run[0];
      if (tile && previous && tile.emoji === previous.emoji) {
        run.push(tile);
      } else {
        if (run.length >= 3) {
          const cells = run.map(({ row: tileRow, col: tileCol }) => ({ row: tileRow, col: tileCol }));
          matches.push({ id: `row-${matchKey(cells)}`, cells, length: run.length, direction: "row" });
        }
        run = tile ? [tile] : [];
      }
    }
    if (run.length >= 3) {
      const cells = run.map(({ row: tileRow, col: tileCol }) => ({ row: tileRow, col: tileCol }));
      matches.push({ id: `row-${matchKey(cells)}`, cells, length: run.length, direction: "row" });
    }
  }

  for (let col = 0; col < size; col += 1) {
    let run: EmojiTile[] = [];
    for (let row = 0; row < size; row += 1) {
      const tile = tileAt(board, { row, col });
      const previous = run[0];
      if (tile && previous && tile.emoji === previous.emoji) {
        run.push(tile);
      } else {
        if (run.length >= 3) {
          const cells = run.map(({ row: tileRow, col: tileCol }) => ({ row: tileRow, col: tileCol }));
          matches.push({ id: `col-${matchKey(cells)}`, cells, length: run.length, direction: "col" });
        }
        run = tile ? [tile] : [];
      }
    }
    if (run.length >= 3) {
      const cells = run.map(({ row: tileRow, col: tileCol }) => ({ row: tileRow, col: tileCol }));
      matches.push({ id: `col-${matchKey(cells)}`, cells, length: run.length, direction: "col" });
    }
  }

  return matches;
}

export function scoreMatches(matches: EmojiMatch[]) {
  return matches.reduce(
    (summary, match) => {
      if (match.length >= 5) {
        summary.points += 3;
        summary.match5 += 1;
      } else {
        summary.points += 2;
        summary.match3 += 1;
      }
      return summary;
    },
    { points: 0, match3: 0, match5: 0 }
  );
}

export function markMatches(board: EmojiTile[], matches: EmojiMatch[]): EmojiTile[] {
  const powerByCell = new Map<string, number>();
  matches.forEach((match) => {
    match.cells.forEach((cell) => {
      powerByCell.set(`${cell.row}:${cell.col}`, Math.max(powerByCell.get(`${cell.row}:${cell.col}`) ?? 0, match.length));
    });
  });

  return board.map((tile) => {
    const power = powerByCell.get(`${tile.row}:${tile.col}`);
    return power ? { ...tile, status: "matched" as const, power } : tile;
  });
}

export function collapseBoard(board: EmojiTile[], config: EmojiRushRoundConfig): EmojiTile[] {
  const emojis = getRoundEmojis(config);
  const nextBoard: EmojiTile[] = [];
  const matchedIds = new Set(board.filter((tile) => tile.status === "matched").map((tile) => tile.id));

  for (let col = 0; col < config.boardSize; col += 1) {
    const survivors = board
      .filter((tile) => tile.col === col && !matchedIds.has(tile.id))
      .sort((a, b) => b.row - a.row);

    let rowCursor = config.boardSize - 1;
    survivors.forEach((tile) => {
      nextBoard.push({ ...tile, row: rowCursor, col, status: "idle", power: 0 });
      rowCursor -= 1;
    });

    for (let row = rowCursor; row >= 0; row -= 1) {
      nextBoard.push(makeTile(row, col, emojis, "new"));
    }
  }

  return nextBoard;
}

export function clearNewFlags(board: EmojiTile[]): EmojiTile[] {
  return board.map((tile) => (tile.status === "new" ? { ...tile, status: "idle" } : tile));
}

export function hasAvailableMove(board: EmojiTile[], size: number) {
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const current = { row, col };
      const right = { row, col: col + 1 };
      const down = { row: row + 1, col };

      if (col + 1 < size && findMatches(swapTiles(board, current, right), size).length > 0) {
        return true;
      }

      if (row + 1 < size && findMatches(swapTiles(board, current, down), size).length > 0) {
        return true;
      }
    }
  }

  return false;
}

export function pointsEqual(a: BoardPoint, b: BoardPoint) {
  return a.row === b.row && a.col === b.col;
}
