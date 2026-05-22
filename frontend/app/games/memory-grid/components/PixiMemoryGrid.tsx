"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { Application, extend, useTick } from "@pixi/react";
import { Container, Graphics, Text, type Ticker } from "pixi.js";
import type { MemoryGridCard } from "@/app/games/memory-grid/game/board";
import { cardAtPoint, type MemoryGridPoint } from "@/app/games/memory-grid/game/board";
import { getMemoryRoundConfig } from "@/app/games/memory-grid/game/config";
import { useMemoryGridStore, type MemoryGridEffect, type MemoryGridPhase } from "@/app/games/memory-grid/store/memoryGridStore";

extend({ Container, Graphics, Text });

type StageSize = {
  width: number;
  height: number;
};

type GridLayout = {
  rows: number;
  cols: number;
  inset: number;
  gap: number;
  cardWidth: number;
  cardHeight: number;
  boardWidth: number;
  boardHeight: number;
  offsetX: number;
  offsetY: number;
};

function useStageSize() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<StageSize>({ width: 360, height: 360 });

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(1, Math.floor(entry.contentRect.width));
      const height = Math.max(1, Math.floor(entry.contentRect.height));
      setSize({ width, height });
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

function getGridLayout(width: number, height: number, rows: number, cols: number): GridLayout {
  const inset = Math.max(5, Math.round(Math.min(width, height) * 0.024));
  const gap = Math.max(3, Math.round(Math.min(width, height) * 0.011));
  const cardWidth = Math.floor((width - inset * 2 - gap * (cols - 1)) / cols);
  const cardHeight = Math.floor((height - inset * 2 - gap * (rows - 1)) / rows);
  const cardSize = Math.max(1, Math.min(cardWidth, cardHeight));
  const boardWidth = cardSize * cols + gap * (cols - 1);
  const boardHeight = cardSize * rows + gap * (rows - 1);

  return {
    rows,
    cols,
    inset,
    gap,
    cardWidth: cardSize,
    cardHeight: cardSize,
    boardWidth,
    boardHeight,
    offsetX: Math.round((width - boardWidth) / 2),
    offsetY: Math.round((height - boardHeight) / 2)
  };
}

function cardCenter(layout: GridLayout, row: number, col: number) {
  return {
    x: layout.offsetX + col * (layout.cardWidth + layout.gap) + layout.cardWidth / 2,
    y: layout.offsetY + row * (layout.cardHeight + layout.gap) + layout.cardHeight / 2
  };
}

function pointFromClient(node: HTMLDivElement, clientX: number, clientY: number, layout: GridLayout): MemoryGridPoint | null {
  const rect = node.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const scaleX = rect.width / (layout.offsetX * 2 + layout.boardWidth);
  const scaleY = rect.height / (layout.offsetY * 2 + layout.boardHeight);
  const boardLeft = layout.offsetX * scaleX;
  const boardTop = layout.offsetY * scaleY;
  const boardWidth = layout.boardWidth * scaleX;
  const boardHeight = layout.boardHeight * scaleY;

  if (localX < boardLeft || localY < boardTop || localX > boardLeft + boardWidth || localY > boardTop + boardHeight) {
    return null;
  }

  const strideX = (layout.cardWidth + layout.gap) * scaleX;
  const strideY = (layout.cardHeight + layout.gap) * scaleY;
  return {
    row: Math.max(0, Math.min(layout.rows - 1, Math.floor((localY - boardTop) / strideY))),
    col: Math.max(0, Math.min(layout.cols - 1, Math.floor((localX - boardLeft) / strideX)))
  };
}

function shouldShowFace(phase: MemoryGridPhase, card: MemoryGridCard) {
  return phase === "memorize" || phase === "round-complete" || phase === "victory" || card.status === "matched";
}

function CardFace({ card, width, height }: { card: MemoryGridCard; width: number; height: number }) {
  const radius = width * 0.18;
  const iconSize = Math.max(22, width * 0.48);

  const draw = useCallback(
    (graphics: Graphics) => {
      const colors = card.asset.palette;
      graphics.clear();
      graphics.setFillStyle({ color: colors.glow, alpha: 0.28 });
      graphics.roundRect(-width / 2 - 2, -height / 2 - 2, width + 4, height + 4, radius + 2);
      graphics.fill();
      graphics.setFillStyle({ color: colors.deep, alpha: 0.96 });
      graphics.roundRect(-width / 2, -height / 2, width, height, radius);
      graphics.fill();
      graphics.setFillStyle({ color: colors.base, alpha: 0.96 });
      graphics.roundRect(-width / 2 + 3, -height / 2 + 3, width - 6, height - 6, radius * 0.88);
      graphics.fill();
      graphics.setFillStyle({ color: colors.shine, alpha: 0.72 });
      graphics.roundRect(-width * 0.38, -height * 0.4, width * 0.76, height * 0.23, radius * 0.7);
      graphics.fill();
      graphics.setFillStyle({ color: 0xffffff, alpha: 0.2 });
      graphics.circle(-width * 0.21, -height * 0.19, width * 0.12);
      graphics.fill();
      graphics.setFillStyle({ color: 0x111827, alpha: 0.16 });
      graphics.roundRect(-width * 0.35, height * 0.23, width * 0.7, height * 0.12, height * 0.06);
      graphics.fill();
      graphics.setStrokeStyle({ width: Math.max(1.4, width * 0.035), color: 0xffffff, alpha: 0.68 });
      graphics.roundRect(-width / 2 + 1, -height / 2 + 1, width - 2, height - 2, radius);
      graphics.stroke();
    },
    [card.asset.palette, height, radius, width]
  );

  return (
    <pixiContainer>
      <pixiGraphics draw={draw} />
      <pixiText
        anchor={0.5}
        text={card.asset.emoji}
        y={-height * 0.03}
        style={{
          fill: "#ffffff",
          fontFamily: "Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif",
          fontSize: iconSize,
          fontWeight: "900",
          stroke: { color: "#101827", width: Math.max(2, width * 0.04) },
          dropShadow: {
            color: "#0f172a",
            alpha: 0.28,
            blur: 4,
            distance: 2
          }
        }}
      />
    </pixiContainer>
  );
}

function CardBack({ width, height }: { width: number; height: number }) {
  const radius = width * 0.18;
  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      graphics.setFillStyle({ color: 0x0d1324, alpha: 0.98 });
      graphics.roundRect(-width / 2, -height / 2, width, height, radius);
      graphics.fill();
      graphics.setFillStyle({ color: 0x1f2a44, alpha: 0.92 });
      graphics.roundRect(-width / 2 + 3, -height / 2 + 3, width - 6, height - 6, radius * 0.82);
      graphics.fill();
      graphics.setStrokeStyle({ width: Math.max(1.4, width * 0.035), color: 0x99f6e4, alpha: 0.5 });
      graphics.roundRect(-width / 2 + 1, -height / 2 + 1, width - 2, height - 2, radius);
      graphics.stroke();

      for (let line = 0; line < 4; line += 1) {
        const y = -height * 0.32 + line * height * 0.2;
        graphics.setStrokeStyle({ width: 1.2, color: line % 2 === 0 ? 0x67e8f9 : 0xc4b5fd, alpha: 0.2 });
        graphics.moveTo(-width * 0.34, y);
        graphics.bezierCurveTo(-width * 0.12, y - height * 0.08, width * 0.14, y + height * 0.08, width * 0.35, y);
        graphics.stroke();
      }

      graphics.setFillStyle({ color: 0xffffff, alpha: 0.08 });
      graphics.circle(-width * 0.22, -height * 0.26, width * 0.1);
      graphics.fill();
    },
    [height, radius, width]
  );

  return (
    <pixiContainer>
      <pixiGraphics draw={draw} />
      <pixiText
        anchor={0.5}
        text="?"
        y={-height * 0.02}
        style={{
          fill: "#d9fffb",
          fontFamily: "Sora, Arial, sans-serif",
          fontSize: Math.max(20, width * 0.42),
          fontWeight: "900",
          stroke: { color: "#0f172a", width: Math.max(2, width * 0.05) }
        }}
      />
    </pixiContainer>
  );
}

function MemoryCardSprite({ card, layout, phase }: { card: MemoryGridCard; layout: GridLayout; phase: MemoryGridPhase }) {
  const ref = useRef<Container | null>(null);
  const frontRef = useRef<Container | null>(null);
  const backRef = useRef<Container | null>(null);
  const target = useMemo(() => cardCenter(layout, card.row, card.col), [card.col, card.row, layout]);
  const flip = useRef(shouldShowFace(phase, card) ? 1 : 0);
  const bornAt = useRef(Date.now());

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    node.x = target.x;
    node.y = target.y;
    node.alpha = 0;
    node.scale.set(0.86);
    bornAt.current = Date.now() + card.row * 38 + card.col * 24;
  }, [card.col, card.id, card.row, target.x, target.y]);

  const onTick = useCallback(
    (ticker: Ticker) => {
      const node = ref.current;
      const front = frontRef.current;
      const back = backRef.current;
      if (!node || !front || !back) {
        return;
      }

      const desiredFlip = shouldShowFace(phase, card) ? 1 : 0;
      flip.current += (desiredFlip - flip.current) * Math.min(1, 0.22 * ticker.deltaTime);
      const squeeze = Math.max(0.08, Math.abs(flip.current * 2 - 1));
      const faceVisible = flip.current > 0.5;
      const age = Date.now() - bornAt.current;
      const introAlpha = Math.max(0, Math.min(1, age / 260));
      const introScale = 0.86 + introAlpha * 0.14;
      const matchedLift = card.status === "matched" ? 1.035 : 1;
      const wrongOffset = card.status === "wrong" ? Math.sin(Date.now() / 22) * layout.cardWidth * 0.055 : 0;

      node.x += (target.x + wrongOffset - node.x) * Math.min(1, 0.24 * ticker.deltaTime);
      node.y += (target.y - node.y) * Math.min(1, 0.24 * ticker.deltaTime);
      node.alpha += (introAlpha - node.alpha) * Math.min(1, 0.28 * ticker.deltaTime);
      node.scale.x = squeeze * introScale * matchedLift;
      node.scale.y += (introScale * matchedLift - node.scale.y) * Math.min(1, 0.24 * ticker.deltaTime);
      front.alpha = faceVisible ? 1 : 0;
      back.alpha = faceVisible ? 0 : 1;
      node.rotation += (0 - node.rotation) * Math.min(1, 0.2 * ticker.deltaTime);
    },
    [card, layout.cardWidth, phase, target.x, target.y]
  );

  useTick(onTick);

  return (
    <pixiContainer ref={ref}>
      <pixiContainer ref={frontRef}>
        <CardFace card={card} width={layout.cardWidth} height={layout.cardHeight} />
      </pixiContainer>
      <pixiContainer ref={backRef}>
        <CardBack width={layout.cardWidth} height={layout.cardHeight} />
      </pixiContainer>
    </pixiContainer>
  );
}

function BoardBackdrop({ width, height, layout }: { width: number; height: number; layout: GridLayout }) {
  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      graphics.setFillStyle({ color: 0x07111f, alpha: 0.5 });
      graphics.roundRect(0, 0, width, height, Math.max(16, layout.cardWidth * 0.18));
      graphics.fill();
      graphics.setStrokeStyle({ width: 2, color: 0xd9fffb, alpha: 0.3 });
      graphics.roundRect(2, 2, width - 4, height - 4, Math.max(14, layout.cardWidth * 0.18));
      graphics.stroke();
      graphics.setFillStyle({ color: 0xffffff, alpha: 0.05 });
      graphics.roundRect(layout.offsetX - 6, layout.offsetY - 6, layout.boardWidth + 12, layout.boardHeight + 12, layout.cardWidth * 0.2);
      graphics.fill();
    },
    [height, layout, width]
  );

  return <pixiGraphics draw={draw} />;
}

function EffectBurst({ effect, cards, layout }: { effect: MemoryGridEffect; cards: MemoryGridCard[]; layout: GridLayout }) {
  const ref = useRef<Container | null>(null);
  const card = effect.cardId ? cards.find((item) => item.id === effect.cardId) : null;
  const origin = card
    ? cardCenter(layout, card.row, card.col)
    : { x: layout.offsetX + layout.boardWidth / 2, y: layout.offsetY + layout.boardHeight / 2 };

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    node.x = origin.x;
    node.y = origin.y;
    node.alpha = 1;
    node.scale.set(0.42);
  }, [origin.x, origin.y]);

  const onTick = useCallback(
    (ticker: Ticker) => {
      const node = ref.current;
      if (!node) {
        return;
      }
      const age = Math.min(1, (Date.now() - effect.createdAt) / 820);
      node.alpha = 1 - age;
      node.y = origin.y - age * layout.cardHeight * (effect.type === "correct" ? 0.52 : 0.18);
      const scale = 0.5 + age * (effect.type === "correct" || effect.type === "round" ? 1.5 : 0.95);
      node.scale.set(scale);
      node.rotation += 0.018 * ticker.deltaTime;
    },
    [effect.createdAt, effect.type, layout.cardHeight, origin.y]
  );

  useTick(onTick);

  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      const isWrong = effect.type === "wrong" || effect.type === "timeout";
      graphics.setFillStyle({ color: isWrong ? 0xff2d55 : 0x99f6e4, alpha: isWrong ? 0.22 : 0.32 });
      graphics.circle(0, 0, layout.cardWidth * 0.42);
      graphics.fill();
      graphics.setStrokeStyle({ width: 2, color: isWrong ? 0xff8aa0 : 0xffffff, alpha: 0.8 });
      graphics.circle(0, 0, layout.cardWidth * 0.52);
      graphics.stroke();
      if (!isWrong) {
        for (let index = 0; index < 8; index += 1) {
          const angle = (Math.PI * 2 * index) / 8;
          graphics.setFillStyle({ color: index % 2 === 0 ? 0xfef08a : 0x67e8f9, alpha: 0.92 });
          graphics.circle(Math.cos(angle) * layout.cardWidth * 0.48, Math.sin(angle) * layout.cardWidth * 0.48, layout.cardWidth * 0.035);
          graphics.fill();
        }
      }
    },
    [effect.type, layout.cardWidth]
  );

  return <pixiContainer ref={ref}><pixiGraphics draw={draw} /></pixiContainer>;
}

function BoardStage({
  size,
  cards,
  effects,
  phase,
  rows,
  cols
}: {
  size: StageSize;
  cards: MemoryGridCard[];
  effects: MemoryGridEffect[];
  phase: MemoryGridPhase;
  rows: number;
  cols: number;
}) {
  const layout = useMemo(() => getGridLayout(size.width, size.height, rows, cols), [cols, rows, size.height, size.width]);

  return (
    <pixiContainer>
      <BoardBackdrop width={size.width} height={size.height} layout={layout} />
      {cards.map((card) => (
        <MemoryCardSprite key={card.id} card={card} layout={layout} phase={phase} />
      ))}
      {effects.map((effect) => (
        <EffectBurst key={effect.id} effect={effect} cards={cards} layout={layout} />
      ))}
    </pixiContainer>
  );
}

export function PixiMemoryGrid() {
  const cards = useMemoryGridStore((state) => state.cards);
  const round = useMemoryGridStore((state) => state.round);
  const phase = useMemoryGridStore((state) => state.phase);
  const effects = useMemoryGridStore((state) => state.effects);
  const selectCard = useMemoryGridStore((state) => state.selectCard);
  const config = getMemoryRoundConfig(round);
  const { ref, size } = useStageSize();
  const layout = useMemo(() => getGridLayout(size.width, size.height, config.rows, config.cols), [
    config.cols,
    config.rows,
    size.height,
    size.width
  ]);
  const boardWidth = `min(94vw, ${(54 * config.cols) / config.rows}svh, 780px)`;

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const node = ref.current;
      if (!node || phase !== "find") {
        return;
      }

      const point = pointFromClient(node, event.clientX, event.clientY, layout);
      if (!point) {
        return;
      }

      const card = cardAtPoint(cards, point);
      if (card) {
        selectCard(card.id);
      }
    },
    [cards, layout, phase, ref, selectCard]
  );

  return (
    <div
      ref={ref}
      onPointerDown={handlePointerDown}
      className="relative isolate overflow-hidden rounded-xl border border-white/28 bg-slate-950/30 shadow-[0_20px_60px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-[2px] [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full"
      style={{
        width: boardWidth,
        aspectRatio: `${config.cols} / ${config.rows}`,
        maxWidth: "94vw",
        maxHeight: "54svh",
        minWidth: "min(88vw, 300px)",
        minHeight: "210px",
        touchAction: "none",
        contain: "layout paint size"
      }}
      aria-label="Memory Grid board"
    >
      <div className="pointer-events-none absolute inset-0 z-10 rounded-xl bg-[radial-gradient(circle_at_34%_8%,rgba(255,255,255,0.18),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.07),transparent_48%)]" />
      {size.width > 0 && size.height > 0 ? (
        <Application
          key={`${size.width}-${size.height}-${config.rows}-${config.cols}`}
          width={size.width}
          height={size.height}
          antialias
          autoDensity
          backgroundAlpha={0}
          resolution={typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2)}
          preference="webgl"
        >
          <BoardStage size={size} cards={cards} effects={effects} phase={phase} rows={config.rows} cols={config.cols} />
        </Application>
      ) : null}
    </div>
  );
}
