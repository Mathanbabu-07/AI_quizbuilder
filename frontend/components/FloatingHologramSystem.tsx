"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import {
  Cpu,
  Hexagon,
  CircleDot,
  Orbit,
  Network,
  Users,
  Timer,
  Box,
  Target,
  Radio,
  Trophy,
  Waypoints,
  Scan,
  Layers,
  Shield,
  Gem,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePointerParallax } from "@/hooks/usePointerParallax";

/* ─── types ─── */

type HologramGlyph = {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>;
  x: string;
  y: string;
  size: number;
  color: string;
  glowColor: string;
  delay: number;
  duration: number;
  rotateRange: number;
  floatRange: number;
  depth: number;
};

type OrbitRingDef = {
  x: string;
  y: string;
  size: number;
  borderColor: string;
  delay: number;
  duration: number;
  depth: number;
};

type PulseRingDef = {
  x: string;
  y: string;
  color: string;
  delay: number;
  duration: number;
  depth: number;
};

type DataFlowLineDef = {
  x: string;
  y: string;
  width: number;
  angle: number;
  color: string;
  delay: number;
  duration: number;
  depth: number;
};

/* ─── static data ─── */

const glyphs: HologramGlyph[] = [
  // ── top-left cluster
  { Icon: Cpu, x: "3%", y: "8%", size: 36, color: "rgba(103,232,249,0.38)", glowColor: "rgba(103,232,249,0.55)", delay: 0, duration: 9.2, rotateRange: 8, floatRange: 14, depth: 0.7 },
  { Icon: Orbit, x: "8%", y: "24%", size: 30, color: "rgba(168,85,247,0.32)", glowColor: "rgba(168,85,247,0.48)", delay: 1.2, duration: 11.4, rotateRange: 12, floatRange: 10, depth: 0.4 },
  { Icon: Network, x: "5%", y: "40%", size: 26, color: "rgba(45,212,191,0.3)", glowColor: "rgba(45,212,191,0.45)", delay: 2.4, duration: 10.1, rotateRange: 6, floatRange: 12, depth: 0.55 },
  // ── top-right cluster
  { Icon: Hexagon, x: "92%", y: "6%", size: 38, color: "rgba(192,132,252,0.35)", glowColor: "rgba(192,132,252,0.5)", delay: 0.6, duration: 10.8, rotateRange: 15, floatRange: 16, depth: 0.65 },
  { Icon: Target, x: "88%", y: "22%", size: 26, color: "rgba(103,232,249,0.3)", glowColor: "rgba(103,232,249,0.45)", delay: 1.8, duration: 12.2, rotateRange: 5, floatRange: 8, depth: 0.35 },
  { Icon: Shield, x: "93%", y: "36%", size: 28, color: "rgba(251,191,36,0.28)", glowColor: "rgba(251,191,36,0.42)", delay: 3.0, duration: 11.6, rotateRange: 10, floatRange: 11, depth: 0.5 },
  // ── bottom-left cluster
  { Icon: Users, x: "4%", y: "70%", size: 32, color: "rgba(56,189,248,0.34)", glowColor: "rgba(56,189,248,0.5)", delay: 0.8, duration: 10.5, rotateRange: 7, floatRange: 13, depth: 0.6 },
  { Icon: Timer, x: "9%", y: "85%", size: 26, color: "rgba(103,232,249,0.28)", glowColor: "rgba(103,232,249,0.42)", delay: 2.0, duration: 9.8, rotateRange: 9, floatRange: 10, depth: 0.45 },
  { Icon: Gem, x: "6%", y: "56%", size: 24, color: "rgba(240,171,252,0.26)", glowColor: "rgba(240,171,252,0.4)", delay: 3.2, duration: 12.0, rotateRange: 11, floatRange: 9, depth: 0.3 },
  // ── bottom-right cluster
  { Icon: Trophy, x: "90%", y: "76%", size: 34, color: "rgba(251,191,36,0.36)", glowColor: "rgba(251,191,36,0.52)", delay: 0.4, duration: 11.2, rotateRange: 6, floatRange: 15, depth: 0.7 },
  { Icon: Box, x: "86%", y: "60%", size: 28, color: "rgba(103,232,249,0.3)", glowColor: "rgba(103,232,249,0.45)", delay: 1.6, duration: 10.3, rotateRange: 14, floatRange: 12, depth: 0.5 },
  { Icon: Radio, x: "92%", y: "88%", size: 24, color: "rgba(168,85,247,0.28)", glowColor: "rgba(168,85,247,0.42)", delay: 2.6, duration: 9.6, rotateRange: 8, floatRange: 10, depth: 0.4 },
  // ── scattered edges
  { Icon: Scan, x: "28%", y: "3%", size: 26, color: "rgba(45,212,191,0.26)", glowColor: "rgba(45,212,191,0.4)", delay: 1.0, duration: 11.8, rotateRange: 10, floatRange: 11, depth: 0.35 },
  { Icon: Layers, x: "72%", y: "4%", size: 28, color: "rgba(240,171,252,0.28)", glowColor: "rgba(240,171,252,0.42)", delay: 2.2, duration: 10.6, rotateRange: 7, floatRange: 13, depth: 0.55 },
  { Icon: Waypoints, x: "25%", y: "92%", size: 28, color: "rgba(103,232,249,0.26)", glowColor: "rgba(103,232,249,0.4)", delay: 1.4, duration: 12.4, rotateRange: 9, floatRange: 10, depth: 0.4 },
  { Icon: CircleDot, x: "75%", y: "92%", size: 26, color: "rgba(192,132,252,0.28)", glowColor: "rgba(192,132,252,0.42)", delay: 2.8, duration: 11.0, rotateRange: 12, floatRange: 12, depth: 0.5 },
];

const orbitRings: OrbitRingDef[] = [
  { x: "1%", y: "10%", size: 120, borderColor: "rgba(103,232,249,0.16)", delay: 0, duration: 24, depth: 0.2 },
  { x: "88%", y: "8%", size: 100, borderColor: "rgba(192,132,252,0.14)", delay: 2, duration: 28, depth: 0.15 },
  { x: "2%", y: "72%", size: 90, borderColor: "rgba(45,212,191,0.12)", delay: 1, duration: 22, depth: 0.25 },
  { x: "86%", y: "68%", size: 110, borderColor: "rgba(251,191,36,0.12)", delay: 3, duration: 26, depth: 0.18 },
];

const pulseRings: PulseRingDef[] = [
  { x: "6%", y: "30%", color: "rgba(103,232,249,0.22)", delay: 0, duration: 4.5, depth: 0.3 },
  { x: "93%", y: "48%", color: "rgba(192,132,252,0.18)", delay: 1.5, duration: 5.0, depth: 0.25 },
  { x: "7%", y: "66%", color: "rgba(45,212,191,0.16)", delay: 3, duration: 4.8, depth: 0.35 },
  { x: "90%", y: "85%", color: "rgba(251,191,36,0.15)", delay: 2, duration: 5.5, depth: 0.2 },
];

const dataFlowLines: DataFlowLineDef[] = [
  { x: "1%", y: "45%", width: 140, angle: 15, color: "rgba(103,232,249,0.12)", delay: 0, duration: 6, depth: 0.15 },
  { x: "90%", y: "55%", width: 120, angle: -20, color: "rgba(192,132,252,0.1)", delay: 2, duration: 7, depth: 0.12 },
  { x: "3%", y: "50%", width: 100, angle: 35, color: "rgba(45,212,191,0.09)", delay: 4, duration: 5.5, depth: 0.1 },
  { x: "93%", y: "30%", width: 110, angle: -10, color: "rgba(240,171,252,0.08)", delay: 1, duration: 6.5, depth: 0.18 },
];

/* ─── sub-components (each owns its hooks) ─── */

function HologramGlyphElement({
  glyph,
  parallax,
  motionEnabled,
}: {
  glyph: HologramGlyph;
  parallax: { x: MotionValue<number>; y: MotionValue<number> };
  motionEnabled: boolean;
}) {
  const px = useTransform(parallax.x, (v) => v * glyph.depth);
  const py = useTransform(parallax.y, (v) => v * glyph.depth);
  const { Icon } = glyph;

  return (
    <motion.div
      className="absolute will-change-transform"
      style={{
        left: glyph.x,
        top: glyph.y,
        x: motionEnabled ? px : 0,
        y: motionEnabled ? py : 0,
      }}
      animate={
        motionEnabled
          ? {
              y: [0, -glyph.floatRange, 0],
              rotate: [
                -glyph.rotateRange / 2,
                glyph.rotateRange / 2,
                -glyph.rotateRange / 2,
              ],
              opacity: [0.45, 0.9, 0.45],
            }
          : false
      }
      transition={{
        duration: glyph.duration,
        delay: glyph.delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* glow backdrop */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${glyph.glowColor} 0%, transparent 70%)`,
          transform: "translate3d(0,0,0) scale(3.2)",
          opacity: 0.6,
        }}
      />
      <Icon
        className="relative"
        style={{
          width: glyph.size,
          height: glyph.size,
          color: glyph.color,
          filter: `drop-shadow(0 0 14px ${glyph.glowColor})`,
        }}
        strokeWidth={1.2}
      />
    </motion.div>
  );
}

function OrbitRingElement({
  ring,
  parallax,
  motionEnabled,
}: {
  ring: OrbitRingDef;
  parallax: { x: MotionValue<number>; y: MotionValue<number> };
  motionEnabled: boolean;
}) {
  const px = useTransform(parallax.x, (v) => v * ring.depth * 0.6);
  const py = useTransform(parallax.y, (v) => v * ring.depth * 0.6);

  return (
    <motion.div
      className="absolute rounded-full will-change-transform"
      style={{
        left: ring.x,
        top: ring.y,
        width: ring.size,
        height: ring.size,
        border: `1px solid ${ring.borderColor}`,
        x: motionEnabled ? px : 0,
        y: motionEnabled ? py : 0,
      }}
      animate={
        motionEnabled
          ? { rotate: [0, 360], opacity: [0.4, 0.8, 0.4] }
          : false
      }
      transition={{
        rotate: {
          duration: ring.duration,
          repeat: Infinity,
          ease: "linear",
        },
        opacity: {
          duration: ring.duration / 2,
          delay: ring.delay,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
    />
  );
}

function PulseRingElement({
  pulse,
  parallax,
  motionEnabled,
}: {
  pulse: PulseRingDef;
  parallax: { x: MotionValue<number>; y: MotionValue<number> };
  motionEnabled: boolean;
}) {
  const px = useTransform(parallax.x, (v) => v * pulse.depth * 0.5);
  const py = useTransform(parallax.y, (v) => v * pulse.depth * 0.5);

  return (
    <motion.div
      className="absolute will-change-transform"
      style={{
        left: pulse.x,
        top: pulse.y,
        x: motionEnabled ? px : 0,
        y: motionEnabled ? py : 0,
      }}
    >
      <motion.div
        className="rounded-full"
        style={{
          width: 8,
          height: 8,
          backgroundColor: pulse.color,
          boxShadow: `0 0 18px ${pulse.color}`,
        }}
        animate={
          motionEnabled
            ? { scale: [1, 3.5, 1], opacity: [0.7, 0, 0.7] }
            : false
        }
        transition={{
          duration: pulse.duration,
          delay: pulse.delay,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />
    </motion.div>
  );
}

function DataFlowElement({
  line,
  parallax,
  motionEnabled,
}: {
  line: DataFlowLineDef;
  parallax: { x: MotionValue<number>; y: MotionValue<number> };
  motionEnabled: boolean;
}) {
  const px = useTransform(parallax.x, (v) => v * line.depth * 0.4);
  const py = useTransform(parallax.y, (v) => v * line.depth * 0.4);

  return (
    <motion.div
      className="absolute will-change-transform"
      style={{
        left: line.x,
        top: line.y,
        width: line.width,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${line.color}, transparent)`,
        rotate: line.angle,
        x: motionEnabled ? px : 0,
        y: motionEnabled ? py : 0,
      }}
      animate={
        motionEnabled
          ? { opacity: [0, 0.6, 0], scaleX: [0.3, 1, 0.3] }
          : false
      }
      transition={{
        duration: line.duration,
        delay: line.delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

function HudCorner({
  position,
}: {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  const reduceMotion = useReducedMotion();
  const motionEnabled = !reduceMotion;

  const positionStyles: React.CSSProperties = {
    position: "absolute",
    width: 56,
    height: 56,
  };

  const borderColor = "rgba(103,232,249,0.22)";

  switch (position) {
    case "top-left":
      positionStyles.top = 20;
      positionStyles.left = 20;
      positionStyles.borderTop = `1px solid ${borderColor}`;
      positionStyles.borderLeft = `1px solid ${borderColor}`;
      break;
    case "top-right":
      positionStyles.top = 20;
      positionStyles.right = 20;
      positionStyles.borderTop = `1px solid ${borderColor}`;
      positionStyles.borderRight = `1px solid ${borderColor}`;
      break;
    case "bottom-left":
      positionStyles.bottom = 20;
      positionStyles.left = 20;
      positionStyles.borderBottom = `1px solid ${borderColor}`;
      positionStyles.borderLeft = `1px solid ${borderColor}`;
      break;
    case "bottom-right":
      positionStyles.bottom = 20;
      positionStyles.right = 20;
      positionStyles.borderBottom = `1px solid ${borderColor}`;
      positionStyles.borderRight = `1px solid ${borderColor}`;
      break;
  }

  return (
    <motion.div
      className="hidden will-change-transform sm:block"
      style={positionStyles}
      animate={motionEnabled ? { opacity: [0.3, 0.7, 0.3] } : false}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/* ─── main component ─── */

export function FloatingHologramSystem() {
  const reduceMotion = useReducedMotion();
  const motionEnabled = !reduceMotion;
  const parallax = usePointerParallax(18);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const visibleGlyphs = useMemo(
    () => (isMobile ? glyphs.filter((_, i) => i % 3 === 0) : glyphs),
    [isMobile]
  );
  const visibleOrbits = useMemo(
    () => (isMobile ? orbitRings.slice(0, 2) : orbitRings),
    [isMobile]
  );
  const visiblePulses = useMemo(
    () => (isMobile ? pulseRings.slice(0, 2) : pulseRings),
    [isMobile]
  );
  const visibleFlows = useMemo(
    () => (isMobile ? dataFlowLines.slice(0, 1) : dataFlowLines),
    [isMobile]
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
      style={{ zIndex: 5 }}
    >
      {/* orbit rings */}
      {visibleOrbits.map((ring, i) => (
        <OrbitRingElement
          key={`orbit-${i}`}
          ring={ring}
          parallax={parallax}
          motionEnabled={motionEnabled}
        />
      ))}

      {/* pulse rings */}
      {visiblePulses.map((pulse, i) => (
        <PulseRingElement
          key={`pulse-${i}`}
          pulse={pulse}
          parallax={parallax}
          motionEnabled={motionEnabled}
        />
      ))}

      {/* data flow lines */}
      {visibleFlows.map((line, i) => (
        <DataFlowElement
          key={`flow-${i}`}
          line={line}
          parallax={parallax}
          motionEnabled={motionEnabled}
        />
      ))}

      {/* holographic glyphs */}
      {visibleGlyphs.map((glyph, i) => (
        <HologramGlyphElement
          key={`glyph-${i}`}
          glyph={glyph}
          parallax={parallax}
          motionEnabled={motionEnabled}
        />
      ))}

      {/* HUD corner brackets */}
      <HudCorner position="top-left" />
      <HudCorner position="top-right" />
      <HudCorner position="bottom-left" />
      <HudCorner position="bottom-right" />

      {/* scanning line — desktop only */}
      {motionEnabled && !isMobile && (
        <motion.div
          className="absolute left-0 right-0 will-change-transform"
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, transparent 5%, rgba(103,232,249,0.12) 20%, rgba(103,232,249,0.22) 50%, rgba(103,232,249,0.12) 80%, transparent 95%)",
          }}
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}
    </div>
  );
}
