"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Application, extend, useTick } from "@pixi/react";
import { useDrag } from "@use-gesture/react";
import { Container, Graphics, Text, type Ticker } from "pixi.js";
import { getRoundConfig, type EmojiRushPiece } from "@/app/games/emoji-rush/game/config";
import type { BoardPoint, EmojiTile } from "@/app/games/emoji-rush/game/board";
import { useEmojiRushStore, type EmojiRushEffect } from "@/app/games/emoji-rush/store/emojiRushStore";

extend({ Container, Graphics, Text });

type BoardLayout = {
  boardSize: number;
  inset: number;
  gap: number;
  tileSize: number;
  boardPixels: number;
};

const TILE_COLORS: Record<EmojiRushPiece, { base: number; deep: number; shine: number; rim: number; glow: number }> = {
  berry: { base: 0xff335d, deep: 0xd71948, shine: 0xff9dae, rim: 0xffffff, glow: 0xff5e84 },
  lemon: { base: 0xffcf31, deep: 0xff9e1f, shine: 0xfff3a8, rim: 0xffffff, glow: 0xffdf5d },
  grape: { base: 0xa94dff, deep: 0x6f2bd1, shine: 0xd9a6ff, rim: 0xffffff, glow: 0xbc6cff },
  candy: { base: 0x34d95d, deep: 0x0ca84d, shine: 0xbaffc8, rim: 0xffffff, glow: 0x60ff8a },
  diamond: { base: 0x2aa8ff, deep: 0x0f61d8, shine: 0xb8ecff, rim: 0xffffff, glow: 0x60d8ff },
  star: { base: 0xffa026, deep: 0xf36d13, shine: 0xffe68e, rim: 0xffffff, glow: 0xffc65a },
  cherry: { base: 0xff365e, deep: 0xd31944, shine: 0xff94a9, rim: 0xffffff, glow: 0xff5279 },
  cupcake: { base: 0xff66bd, deep: 0xc72986, shine: 0xffc2eb, rim: 0xffffff, glow: 0xff8bda }
};

function useBoardPixels() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState(360);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const next = Math.floor(Math.min(entry.contentRect.width, entry.contentRect.height));
      if (next > 0) {
        setSize(next);
      }
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

function getBoardLayout(width: number, boardSize: number): BoardLayout {
  const inset = Math.max(5, Math.round(width * 0.018));
  const gap = Math.max(2, Math.round(width * 0.006));
  const tileSize = Math.floor((width - inset * 2 - gap * (boardSize - 1)) / boardSize);
  const boardPixels = tileSize * boardSize + gap * (boardSize - 1);

  return { boardSize, inset, gap, tileSize, boardPixels };
}

function cellCenter(layout: BoardLayout, row: number, col: number) {
  return {
    x: layout.inset + col * (layout.tileSize + layout.gap) + layout.tileSize / 2,
    y: layout.inset + row * (layout.tileSize + layout.gap) + layout.tileSize / 2
  };
}

function cellFromClientPoint(node: HTMLDivElement, x: number, y: number, layout: BoardLayout): BoardPoint | null {
  const rect = node.getBoundingClientRect();
  const localX = x - rect.left;
  const localY = y - rect.top;
  const scale = rect.width / (layout.inset * 2 + layout.boardPixels);
  const boardLeft = layout.inset * scale;
  const boardTop = layout.inset * scale;
  const boardPixels = layout.boardPixels * scale;

  if (localX < boardLeft || localY < boardTop || localX > boardLeft + boardPixels || localY > boardTop + boardPixels) {
    return null;
  }

  const stride = (layout.tileSize + layout.gap) * scale;
  return {
    row: Math.max(0, Math.min(layout.boardSize - 1, Math.floor((localY - boardTop) / stride))),
    col: Math.max(0, Math.min(layout.boardSize - 1, Math.floor((localX - boardLeft) / stride)))
  };
}

function drawPieceIcon(graphics: Graphics, piece: EmojiRushPiece, size: number) {
  const colors = TILE_COLORS[piece];
  const r = size / 2;

  if (piece === "diamond") {
    graphics.setFillStyle({ color: colors.shine, alpha: 0.98 });
    graphics.poly([0, -r * 0.76, r * 0.72, -r * 0.08, 0, r * 0.82, -r * 0.72, -r * 0.08]);
    graphics.fill();
    graphics.setFillStyle({ color: colors.base, alpha: 0.98 });
    graphics.poly([-r * 0.72, -r * 0.08, 0, r * 0.82, 0, -r * 0.08]);
    graphics.fill();
    graphics.setStrokeStyle({ width: Math.max(1.5, size * 0.045), color: 0xffffff, alpha: 0.72 });
    graphics.poly([0, -r * 0.76, r * 0.72, -r * 0.08, 0, r * 0.82, -r * 0.72, -r * 0.08, 0, -r * 0.76]);
    graphics.stroke();
    return;
  }

  if (piece === "star") {
    const points: number[] = [];
    for (let index = 0; index < 10; index += 1) {
      const angle = -Math.PI / 2 + index * (Math.PI / 5);
      const radius = index % 2 === 0 ? r * 0.84 : r * 0.38;
      points.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    graphics.setFillStyle({ color: colors.base, alpha: 1 });
    graphics.poly(points);
    graphics.fill();
    graphics.setFillStyle({ color: colors.shine, alpha: 0.7 });
    graphics.circle(-r * 0.18, -r * 0.22, r * 0.18);
    graphics.fill();
    graphics.setStrokeStyle({ width: Math.max(1.5, size * 0.045), color: 0xffffff, alpha: 0.56 });
    graphics.poly([...points, points[0], points[1]]);
    graphics.stroke();
    return;
  }

  if (piece === "grape") {
    const grapes = [
      [-0.2, -0.34],
      [0.18, -0.32],
      [-0.38, 0],
      [0, 0.02],
      [0.36, 0],
      [-0.18, 0.34],
      [0.2, 0.34]
    ];
    grapes.forEach(([x, y]) => {
      graphics.setFillStyle({ color: colors.deep, alpha: 0.34 });
      graphics.circle(x * size + 2, y * size + 3, r * 0.25);
      graphics.fill();
      graphics.setFillStyle({ color: colors.base, alpha: 1 });
      graphics.circle(x * size, y * size, r * 0.25);
      graphics.fill();
      graphics.setFillStyle({ color: colors.shine, alpha: 0.68 });
      graphics.circle(x * size - r * 0.08, y * size - r * 0.08, r * 0.08);
      graphics.fill();
    });
    graphics.setStrokeStyle({ width: Math.max(1.5, size * 0.04), color: 0x45b85c, alpha: 0.86 });
    graphics.moveTo(0, -r * 0.55);
    graphics.quadraticCurveTo(r * 0.18, -r * 0.78, r * 0.44, -r * 0.64);
    graphics.stroke();
    return;
  }

  if (piece === "candy") {
    graphics.setFillStyle({ color: colors.shine, alpha: 0.96 });
    graphics.poly([-r * 0.98, -r * 0.27, -r * 0.56, 0, -r * 0.98, r * 0.27]);
    graphics.fill();
    graphics.poly([r * 0.98, -r * 0.27, r * 0.56, 0, r * 0.98, r * 0.27]);
    graphics.fill();
    graphics.setFillStyle({ color: colors.base, alpha: 1 });
    graphics.roundRect(-r * 0.58, -r * 0.36, r * 1.16, r * 0.72, r * 0.26);
    graphics.fill();
    graphics.setStrokeStyle({ width: Math.max(1.5, size * 0.042), color: 0xffffff, alpha: 0.62 });
    graphics.roundRect(-r * 0.58, -r * 0.36, r * 1.16, r * 0.72, r * 0.26);
    graphics.stroke();
    return;
  }

  if (piece === "lemon") {
    graphics.setFillStyle({ color: colors.deep, alpha: 0.3 });
    graphics.ellipse(2, 4, r * 0.67, r * 0.5);
    graphics.fill();
    graphics.setFillStyle({ color: colors.base, alpha: 1 });
    graphics.ellipse(0, 0, r * 0.7, r * 0.52);
    graphics.fill();
    graphics.setFillStyle({ color: colors.shine, alpha: 0.78 });
    graphics.ellipse(-r * 0.18, -r * 0.18, r * 0.24, r * 0.1);
    graphics.fill();
    graphics.setFillStyle({ color: 0x77c65a, alpha: 0.9 });
    graphics.ellipse(r * 0.34, -r * 0.42, r * 0.26, r * 0.12);
    graphics.fill();
    return;
  }

  if (piece === "cherry") {
    graphics.setStrokeStyle({ width: Math.max(1.4, size * 0.035), color: 0x48b355, alpha: 0.95 });
    graphics.moveTo(-r * 0.18, -r * 0.14);
    graphics.quadraticCurveTo(0, -r * 0.72, r * 0.36, -r * 0.58);
    graphics.stroke();
    [-0.24, 0.2].forEach((x) => {
      graphics.setFillStyle({ color: colors.deep, alpha: 0.38 });
      graphics.circle(x * size + 2, r * 0.12 + 3, r * 0.28);
      graphics.fill();
      graphics.setFillStyle({ color: colors.base, alpha: 1 });
      graphics.circle(x * size, r * 0.12, r * 0.28);
      graphics.fill();
      graphics.setFillStyle({ color: colors.shine, alpha: 0.72 });
      graphics.circle(x * size - r * 0.1, r * 0.02, r * 0.08);
      graphics.fill();
    });
    return;
  }

  if (piece === "cupcake") {
    graphics.setFillStyle({ color: colors.shine, alpha: 1 });
    graphics.circle(-r * 0.28, -r * 0.18, r * 0.28);
    graphics.circle(0, -r * 0.28, r * 0.34);
    graphics.circle(r * 0.28, -r * 0.18, r * 0.28);
    graphics.fill();
    graphics.setFillStyle({ color: colors.base, alpha: 1 });
    graphics.roundRect(-r * 0.58, -r * 0.06, r * 1.16, r * 0.7, r * 0.12);
    graphics.fill();
    graphics.setFillStyle({ color: 0xffe16f, alpha: 0.95 });
    graphics.circle(0, -r * 0.56, r * 0.12);
    graphics.fill();
    return;
  }

  graphics.setFillStyle({ color: colors.deep, alpha: 0.34 });
  graphics.circle(2, 4, r * 0.64);
  graphics.fill();
  graphics.setFillStyle({ color: colors.base, alpha: 1 });
  graphics.circle(0, 0, r * 0.64);
  graphics.fill();
  graphics.setFillStyle({ color: colors.shine, alpha: 0.74 });
  graphics.ellipse(-r * 0.18, -r * 0.24, r * 0.22, r * 0.11);
  graphics.fill();
  graphics.setFillStyle({ color: 0x56c766, alpha: 0.92 });
  graphics.ellipse(r * 0.16, -r * 0.64, r * 0.26, r * 0.12);
  graphics.fill();
}

function TileGem({ tile, layout }: { tile: EmojiTile; layout: BoardLayout }) {
  const ref = useRef<Container | null>(null);
  const center = cellCenter(layout, tile.row, tile.col);
  const target = useRef({
    x: center.x,
    y: center.y,
    scale: tile.status === "matched" ? 0.25 : tile.status === "new" ? 1.12 : 1,
    alpha: tile.status === "matched" ? 0.04 : 1
  });
  const colors = TILE_COLORS[tile.emoji] ?? TILE_COLORS.berry;
  const radius = layout.tileSize * 0.22;
  const gemSize = layout.tileSize;
  const iconSize = layout.tileSize * 0.56;

  useEffect(() => {
    const nextCenter = cellCenter(layout, tile.row, tile.col);
    target.current = {
      x: nextCenter.x,
      y: nextCenter.y,
      scale: tile.status === "matched" ? 0.25 : tile.status === "new" ? 1.12 : 1,
      alpha: tile.status === "matched" ? 0.04 : 1
    };
  }, [layout, tile.col, tile.row, tile.status]);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    node.x = target.current.x;
    node.y = target.current.y;
    node.scale.set(tile.status === "new" ? 0.72 : 1);
    node.alpha = 1;
  }, [tile.id, tile.status]);

  const onTick = useCallback((ticker: Ticker) => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const speed = Math.min(1, 0.25 * ticker.deltaTime);
    const next = target.current;
    node.x += (next.x - node.x) * speed;
    node.y += (next.y - node.y) * speed;
    node.alpha += (next.alpha - node.alpha) * Math.min(1, 0.32 * ticker.deltaTime);
    const nextScale = node.scale.x + (next.scale - node.scale.x) * Math.min(1, 0.28 * ticker.deltaTime);
    node.scale.set(nextScale);
    node.rotation += (0 - node.rotation) * Math.min(1, 0.22 * ticker.deltaTime);
  }, []);

  useTick(onTick);

  const drawGem = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      graphics.setFillStyle({ color: colors.glow, alpha: tile.power >= 5 ? 0.34 : 0.13 });
      graphics.roundRect(-gemSize / 2 - 1, -gemSize / 2 - 1, gemSize + 2, gemSize + 2, radius);
      graphics.fill();
      graphics.setFillStyle({ color: 0x43235f, alpha: 0.3 });
      graphics.roundRect(-gemSize / 2 + 2, -gemSize / 2 + 4, gemSize, gemSize, radius);
      graphics.fill();
      graphics.setFillStyle({ color: colors.base, alpha: 1 });
      graphics.roundRect(-gemSize / 2, -gemSize / 2, gemSize, gemSize, radius);
      graphics.fill();
      graphics.setFillStyle({ color: colors.shine, alpha: 0.52 });
      graphics.roundRect(-gemSize * 0.39, -gemSize * 0.39, gemSize * 0.78, gemSize * 0.28, radius * 0.78);
      graphics.fill();
      graphics.setFillStyle({ color: 0xffffff, alpha: 0.2 });
      graphics.ellipse(-gemSize * 0.16, -gemSize * 0.23, gemSize * 0.24, gemSize * 0.09);
      graphics.fill();
      graphics.setStrokeStyle({ width: Math.max(1.6, layout.tileSize * 0.035), color: colors.rim, alpha: 0.68 });
      graphics.roundRect(-gemSize / 2, -gemSize / 2, gemSize, gemSize, radius);
      graphics.stroke();
      drawPieceIcon(graphics, tile.emoji, iconSize);
    },
    [colors.base, colors.glow, colors.rim, colors.shine, gemSize, iconSize, layout.tileSize, radius, tile.emoji, tile.power]
  );

  return (
    <pixiContainer ref={ref}>
      <pixiGraphics draw={drawGem} />
    </pixiContainer>
  );
}

function BoardBackdrop({ size, layout }: { size: number; layout: BoardLayout }) {
  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      graphics.setFillStyle({ color: 0x44335e, alpha: 0.96 });
      graphics.roundRect(0, 0, size, size, layout.tileSize * 0.22);
      graphics.fill();
      graphics.setStrokeStyle({ width: 3, color: 0xffffff, alpha: 0.34 });
      graphics.roundRect(2, 2, size - 4, size - 4, layout.tileSize * 0.22);
      graphics.stroke();

      for (let row = 0; row < layout.boardSize; row += 1) {
        for (let col = 0; col < layout.boardSize; col += 1) {
          const x = layout.inset + col * (layout.tileSize + layout.gap);
          const y = layout.inset + row * (layout.tileSize + layout.gap);
          graphics.setFillStyle({ color: (row + col) % 2 === 0 ? 0x554171 : 0x493662, alpha: 0.62 });
          graphics.roundRect(x, y, layout.tileSize, layout.tileSize, layout.tileSize * 0.18);
          graphics.fill();
        }
      }
    },
    [layout, size]
  );

  return <pixiGraphics draw={draw} />;
}

function PixiEffectSprite({ effect, layout }: { effect: EmojiRushEffect; layout: BoardLayout }) {
  const ref = useRef<Container | null>(null);
  const origin = useMemo(() => cellCenter(layout, effect.row, effect.col), [effect.col, effect.row, layout]);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    node.x = origin.x;
    node.y = origin.y;
    node.alpha = 1;
    node.scale.set(0.55);
  }, [origin.x, origin.y]);

  const onTick = useCallback((ticker: Ticker) => {
    const node = ref.current;
    if (!node) {
      return;
    }
    const age = Math.min(1, (Date.now() - effect.createdAt) / 760);
    node.y = origin.y - age * layout.tileSize * (effect.type === "pop" ? 0.18 : 0.72);
    node.alpha = 1 - age;
    node.scale.set(0.75 + age * (effect.type === "refresh" ? 1.15 : 0.65) * Math.max(1, effect.power * 0.2));
    node.rotation += 0.018 * ticker.deltaTime;
  }, [effect.createdAt, effect.power, effect.type, layout.tileSize, origin.y]);

  useTick(onTick);

  const drawBurst = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      graphics.setFillStyle({ color: effect.type === "refresh" ? 0x8dfbff : 0xffffff, alpha: 0.34 });
      graphics.circle(0, 0, layout.tileSize * (0.18 + effect.power * 0.04));
      graphics.fill();
      graphics.setStrokeStyle({ width: 2, color: effect.power >= 4 ? 0xfff18a : 0xff7acc, alpha: 0.82 });
      graphics.circle(0, 0, layout.tileSize * (0.26 + effect.power * 0.035));
      graphics.stroke();
    },
    [effect.power, effect.type, layout.tileSize]
  );

  return (
    <pixiContainer ref={ref}>
      <pixiGraphics draw={drawBurst} />
      <pixiText
        anchor={0.5}
        text={effect.label}
        style={{
          fill: effect.power >= 4 ? "#fff4a8" : "#ffffff",
          fontFamily: "Sora, Arial, sans-serif",
          fontSize: Math.max(12, layout.tileSize * 0.22),
          fontWeight: "900",
          stroke: { color: "#8b1742", width: 4 }
        }}
      />
    </pixiContainer>
  );
}

function BoardStage({ width, tiles, effects, boardSize }: { width: number; tiles: EmojiTile[]; effects: EmojiRushEffect[]; boardSize: number }) {
  const layout = useMemo(() => getBoardLayout(width, boardSize), [boardSize, width]);
  const stageRef = useRef<Container | null>(null);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) {
      return;
    }
    node.alpha = 0.86;
    node.scale.set(0.97);
  }, [boardSize]);

  const onTick = useCallback((ticker: Ticker) => {
    const node = stageRef.current;
    if (!node) {
      return;
    }
    const speed = Math.min(1, 0.16 * ticker.deltaTime);
    node.alpha += (1 - node.alpha) * speed;
    const nextScale = node.scale.x + (1 - node.scale.x) * speed;
    node.scale.set(nextScale);
    node.x = (width - width * nextScale) / 2;
    node.y = (width - width * nextScale) / 2;
  }, [width]);

  useTick(onTick);

  return (
    <pixiContainer ref={stageRef}>
      <BoardBackdrop size={width} layout={layout} />
      {tiles.map((tile) => (
        <TileGem key={tile.id} tile={tile} layout={layout} />
      ))}
      {effects.map((effect) => (
        <PixiEffectSprite key={effect.id} effect={effect} layout={layout} />
      ))}
    </pixiContainer>
  );
}

export function PixiBoard() {
  const board = useEmojiRushStore((state) => state.board);
  const round = useEmojiRushStore((state) => state.round);
  const phase = useEmojiRushStore((state) => state.phase);
  const isResolving = useEmojiRushStore((state) => state.isResolving);
  const effects = useEmojiRushStore((state) => state.effects);
  const trySwap = useEmojiRushStore((state) => state.trySwap);
  const repairRoundBoard = useEmojiRushStore((state) => state.repairRoundBoard);
  const config = getRoundConfig(round);
  const { ref, size } = useBoardPixels();
  const layout = useMemo(() => getBoardLayout(size, config.boardSize), [config.boardSize, size]);
  const startCell = useRef<BoardPoint | null>(null);
  const disabled = phase !== "playing" || isResolving;

  useEffect(() => {
    repairRoundBoard();
  }, [repairRoundBoard, round]);

  const bind = useDrag(
    ({ first, last, xy: [x, y], movement: [mx, my], event }) => {
      event.preventDefault();
      const node = ref.current;
      if (!node || disabled) {
        return;
      }

      if (first) {
        startCell.current = cellFromClientPoint(node, x, y, layout);
      }

      if (!last || !startCell.current) {
        return;
      }

      const threshold = Math.max(10, layout.tileSize / 3.4);
      if (Math.max(Math.abs(mx), Math.abs(my)) < threshold) {
        startCell.current = null;
        return;
      }

      const from = startCell.current;
      const to =
        Math.abs(mx) > Math.abs(my)
          ? { row: from.row, col: Math.max(0, Math.min(config.boardSize - 1, from.col + (mx > 0 ? 1 : -1))) }
          : { row: Math.max(0, Math.min(config.boardSize - 1, from.row + (my > 0 ? 1 : -1))), col: from.col };

      startCell.current = null;
      void trySwap(from, to);
    },
    {
      pointer: { capture: true, touch: true },
      eventOptions: { passive: false }
    }
  );

  return (
    <div
      ref={ref}
      {...bind()}
      className="relative isolate aspect-square overflow-hidden rounded-[1.35rem] border-[3px] border-white/45 bg-[#44335e] shadow-[0_20px_50px_rgba(85,17,58,0.38),inset_0_0_0_4px_rgba(255,255,255,0.12)] [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full"
      style={{
        width: "min(94vw, 62svh, 620px)",
        height: "min(94vw, 62svh, 620px)",
        touchAction: "none",
        contain: "layout paint size"
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-10 rounded-[1.15rem] bg-[radial-gradient(circle_at_30%_12%,rgba(255,255,255,0.2),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_44%)]" />
      {size > 0 ? (
        <Application
          key={`${size}-${config.boardSize}`}
          width={size}
          height={size}
          antialias
          autoDensity
          backgroundAlpha={0}
          resolution={typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2)}
          preference="webgl"
        >
          <BoardStage width={size} tiles={board} effects={effects} boardSize={config.boardSize} />
        </Application>
      ) : null}
    </div>
  );
}
