"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Application, extend, useTick } from "@pixi/react";
import { useDrag } from "@use-gesture/react";
import { Container, Graphics, Text, type Ticker } from "pixi.js";
import { getRoundConfig } from "@/app/games/emoji-rush/game/config";
import type { BoardPoint, EmojiTile } from "@/app/games/emoji-rush/game/board";
import { useEmojiRushStore, type EmojiRushEffect } from "@/app/games/emoji-rush/store/emojiRushStore";

extend({ Container, Graphics, Text });

const TILE_COLORS: Record<string, { base: number; shine: number; rim: number }> = {
  "🍓": { base: 0xff3155, shine: 0xff8ba1, rim: 0xffffff },
  "🍋": { base: 0xffc928, shine: 0xfff2a6, rim: 0xffffff },
  "🍇": { base: 0xb34cff, shine: 0xf0a4ff, rim: 0xffffff },
  "🍬": { base: 0x36d957, shine: 0xa8ffbc, rim: 0xffffff },
  "💎": { base: 0x289bff, shine: 0xa4e5ff, rim: 0xffffff },
  "🌟": { base: 0xff8f22, shine: 0xffdf91, rim: 0xffffff },
  "🍒": { base: 0xff4747, shine: 0xff9a7f, rim: 0xffffff },
  "🧁": { base: 0xff71c6, shine: 0xffd1ef, rim: 0xffffff }
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

function cellFromClientPoint(node: HTMLDivElement, x: number, y: number, boardSize: number): BoardPoint | null {
  const rect = node.getBoundingClientRect();
  const localX = x - rect.left;
  const localY = y - rect.top;
  if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) {
    return null;
  }

  const tileSize = rect.width / boardSize;
  return {
    row: Math.max(0, Math.min(boardSize - 1, Math.floor(localY / tileSize))),
    col: Math.max(0, Math.min(boardSize - 1, Math.floor(localX / tileSize)))
  };
}

function TileGem({ tile, tileSize }: { tile: EmojiTile; tileSize: number }) {
  const ref = useRef<Container | null>(null);
  const target = useRef({
    x: (tile.col + 0.5) * tileSize,
    y: (tile.row + 0.5) * tileSize,
    scale: tile.status === "matched" ? 0.28 : tile.status === "new" ? 1.16 : 1,
    alpha: tile.status === "matched" ? 0.08 : 1
  });
  const colors = TILE_COLORS[tile.emoji] ?? TILE_COLORS["🍓"];
  const radius = tileSize * 0.2;
  const gemSize = tileSize * 0.82;
  const fontSize = Math.max(20, tileSize * 0.47);

  useEffect(() => {
    target.current = {
      x: (tile.col + 0.5) * tileSize,
      y: (tile.row + 0.5) * tileSize,
      scale: tile.status === "matched" ? 0.28 : tile.status === "new" ? 1.16 : 1,
      alpha: tile.status === "matched" ? 0.08 : 1
    };
  }, [tile.col, tile.row, tile.status, tileSize]);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    node.x = target.current.x;
    node.y = target.current.y;
    node.scale.set(tile.status === "new" ? 0.85 : 1);
    node.alpha = 1;
  }, [tile.id, tile.status]);

  const onTick = useCallback((ticker: Ticker) => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const speed = Math.min(1, 0.22 * ticker.deltaTime);
    const next = target.current;
    node.x += (next.x - node.x) * speed;
    node.y += (next.y - node.y) * speed;
    node.alpha += (next.alpha - node.alpha) * Math.min(1, 0.28 * ticker.deltaTime);
    const nextScale = node.scale.x + (next.scale - node.scale.x) * Math.min(1, 0.24 * ticker.deltaTime);
    node.scale.set(nextScale);
    node.rotation = Math.sin(performance.now() / 260 + tile.row + tile.col) * 0.015;
  }, [tile.col, tile.row]);

  useTick(onTick);

  const drawGem = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      graphics.setFillStyle({ color: 0x43235f, alpha: 0.3 });
      graphics.roundRect(-gemSize / 2 + 3, -gemSize / 2 + 5, gemSize, gemSize, radius);
      graphics.fill();
      graphics.setFillStyle({ color: colors.base, alpha: 0.96 });
      graphics.roundRect(-gemSize / 2, -gemSize / 2, gemSize, gemSize, radius);
      graphics.fill();
      graphics.setFillStyle({ color: colors.shine, alpha: 0.66 });
      graphics.ellipse(-gemSize * 0.18, -gemSize * 0.22, gemSize * 0.23, gemSize * 0.12);
      graphics.fill();
      graphics.setStrokeStyle({ width: Math.max(1.5, tileSize * 0.035), color: colors.rim, alpha: 0.46 });
      graphics.roundRect(-gemSize / 2, -gemSize / 2, gemSize, gemSize, radius);
      graphics.stroke();
    },
    [colors.base, colors.rim, colors.shine, gemSize, radius, tileSize]
  );

  return (
    <pixiContainer ref={ref}>
      <pixiGraphics draw={drawGem} />
      <pixiText
        anchor={0.5}
        text={tile.emoji}
        style={{
          align: "center",
          fill: "#ffffff",
          fontFamily: "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
          fontSize,
          fontWeight: "700",
          stroke: { color: "#5c1639", width: Math.max(1, tileSize * 0.02) }
        }}
      />
    </pixiContainer>
  );
}

function BoardBackdrop({ size, tileSize, boardSize }: { size: number; tileSize: number; boardSize: number }) {
  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      graphics.setFillStyle({ color: 0x44335e, alpha: 0.92 });
      graphics.roundRect(0, 0, size, size, tileSize * 0.18);
      graphics.fill();
      graphics.setStrokeStyle({ width: 3, color: 0xffffff, alpha: 0.34 });
      graphics.roundRect(2, 2, size - 4, size - 4, tileSize * 0.18);
      graphics.stroke();

      for (let row = 0; row < boardSize; row += 1) {
        for (let col = 0; col < boardSize; col += 1) {
          graphics.setFillStyle({ color: (row + col) % 2 === 0 ? 0x554171 : 0x493662, alpha: 0.56 });
          graphics.roundRect(col * tileSize + 2, row * tileSize + 2, tileSize - 4, tileSize - 4, tileSize * 0.12);
          graphics.fill();
        }
      }
    },
    [boardSize, size, tileSize]
  );

  return <pixiGraphics draw={draw} />;
}

function PixiEffectSprite({ effect, tileSize }: { effect: EmojiRushEffect; tileSize: number }) {
  const ref = useRef<Container | null>(null);
  const origin = useMemo(
    () => ({
      x: (effect.col + 0.5) * tileSize,
      y: (effect.row + 0.5) * tileSize
    }),
    [effect.col, effect.row, tileSize]
  );

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
    const age = Math.min(1, (Date.now() - effect.createdAt) / 780);
    node.y = origin.y - age * tileSize * (effect.type === "pop" ? 0.18 : 0.72);
    node.alpha = 1 - age;
    node.scale.set(0.75 + age * (effect.type === "refresh" ? 1.15 : 0.65) * Math.max(1, effect.power * 0.2));
    node.rotation += 0.018 * ticker.deltaTime;
  }, [effect.createdAt, effect.power, effect.type, origin.y, tileSize]);

  useTick(onTick);

  const drawBurst = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      graphics.setFillStyle({ color: effect.type === "refresh" ? 0x8dfbff : 0xffffff, alpha: 0.34 });
      graphics.circle(0, 0, tileSize * (0.18 + effect.power * 0.04));
      graphics.fill();
      graphics.setStrokeStyle({ width: 2, color: effect.power >= 4 ? 0xfff18a : 0xff7acc, alpha: 0.82 });
      graphics.circle(0, 0, tileSize * (0.26 + effect.power * 0.035));
      graphics.stroke();
    },
    [effect.power, effect.type, tileSize]
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
          fontSize: Math.max(12, tileSize * 0.22),
          fontWeight: "900",
          stroke: { color: "#8b1742", width: 4 }
        }}
      />
    </pixiContainer>
  );
}

function BoardStage({ width, tiles, effects, boardSize }: { width: number; tiles: EmojiTile[]; effects: EmojiRushEffect[]; boardSize: number }) {
  const tileSize = width / boardSize;

  return (
    <>
      <BoardBackdrop size={width} tileSize={tileSize} boardSize={boardSize} />
      {tiles.map((tile) => (
        <TileGem key={tile.id} tile={tile} tileSize={tileSize} />
      ))}
      {effects.map((effect) => (
        <PixiEffectSprite key={effect.id} effect={effect} tileSize={tileSize} />
      ))}
    </>
  );
}

export function PixiBoard() {
  const board = useEmojiRushStore((state) => state.board);
  const round = useEmojiRushStore((state) => state.round);
  const phase = useEmojiRushStore((state) => state.phase);
  const isResolving = useEmojiRushStore((state) => state.isResolving);
  const effects = useEmojiRushStore((state) => state.effects);
  const trySwap = useEmojiRushStore((state) => state.trySwap);
  const config = getRoundConfig(round);
  const { ref, size } = useBoardPixels();
  const startCell = useRef<BoardPoint | null>(null);
  const disabled = phase !== "playing" || isResolving;

  const bind = useDrag(
    ({ first, last, xy: [x, y], movement: [mx, my], event }) => {
      event.preventDefault();
      const node = ref.current;
      if (!node || disabled) {
        return;
      }

      if (first) {
        startCell.current = cellFromClientPoint(node, x, y, config.boardSize);
      }

      if (!last || !startCell.current) {
        return;
      }

      const threshold = Math.max(12, size / config.boardSize / 3.2);
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
      pointer: { capture: true },
      eventOptions: { passive: false }
    }
  );

  return (
    <div
      ref={ref}
      {...bind()}
      className="relative isolate aspect-square overflow-hidden rounded-[1.35rem] border-[3px] border-white/45 bg-[#44335e] shadow-[0_20px_50px_rgba(85,17,58,0.38),inset_0_0_0_4px_rgba(255,255,255,0.12)]"
      style={{
        width: "min(94vw, 66svh, 620px)",
        height: "min(94vw, 66svh, 620px)",
        touchAction: "none"
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-10 rounded-[1.15rem] bg-[radial-gradient(circle_at_30%_12%,rgba(255,255,255,0.2),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_44%)]" />
      {size > 0 ? (
        <Application
          width={size}
          height={size}
          antialias
          autoDensity
          backgroundAlpha={0}
          resolution={typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2)}
        >
          <BoardStage width={size} tiles={board} effects={effects} boardSize={config.boardSize} />
        </Application>
      ) : null}
    </div>
  );
}
