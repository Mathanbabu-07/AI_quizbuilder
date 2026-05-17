"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type ArcSegment = {
  radius: number;
  start: number;
  end: number;
  width: number;
  opacity: number;
  stroke: string;
};

type OrbitalParticle = {
  radius: number;
  angle: number;
  size: number;
  color: string;
  opacity: number;
  duration: number;
  delay: number;
  mobile?: boolean;
};

const outerArcSegments: ArcSegment[] = [
  { radius: 386, start: 318, end: 350, width: 7, opacity: 0.88, stroke: "url(#orbitCyan)" },
  { radius: 386, start: 13, end: 48, width: 5, opacity: 0.72, stroke: "url(#orbitBlue)" },
  { radius: 386, start: 76, end: 112, width: 6, opacity: 0.82, stroke: "url(#orbitViolet)" },
  { radius: 386, start: 139, end: 176, width: 4, opacity: 0.64, stroke: "url(#orbitCyan)" },
  { radius: 386, start: 203, end: 238, width: 7, opacity: 0.9, stroke: "url(#orbitBlue)" },
  { radius: 386, start: 258, end: 292, width: 5, opacity: 0.68, stroke: "url(#orbitViolet)" }
];

const secondaryArcSegments: ArcSegment[] = Array.from({ length: 28 }, (_, index) => {
  const start = index * 12.86 + (index % 2 === 0 ? 1.8 : 4.2);
  const length = index % 5 === 0 ? 8.2 : index % 3 === 0 ? 5.6 : 3.7;

  return {
    radius: index % 2 === 0 ? 305 : 326,
    start,
    end: start + length,
    width: index % 4 === 0 ? 8 : 5,
    opacity: index % 4 === 0 ? 0.78 : 0.48,
    stroke: index % 3 === 0 ? "url(#orbitViolet)" : index % 3 === 1 ? "url(#orbitCyan)" : "url(#orbitBlue)"
  };
});

const innerDigitalSegments: ArcSegment[] = Array.from({ length: 40 }, (_, index) => {
  const start = index * 9 + (index % 2 ? 1.4 : 0);
  return {
    radius: index % 3 === 0 ? 198 : 218,
    start,
    end: start + (index % 6 === 0 ? 5.6 : 2.9),
    width: index % 5 === 0 ? 7 : 3.5,
    opacity: index % 5 === 0 ? 0.78 : 0.44,
    stroke: index % 4 === 0 ? "url(#orbitViolet)" : "url(#orbitCyan)"
  };
});

const tickMarks = Array.from({ length: 72 }, (_, index) => ({
  angle: index * 5,
  length: index % 6 === 0 ? 22 : index % 3 === 0 ? 14 : 8,
  opacity: index % 6 === 0 ? 0.58 : 0.3
}));

const coreTickMarks = Array.from({ length: 48 }, (_, index) => ({
  angle: index * 7.5,
  length: index % 4 === 0 ? 13 : 7,
  opacity: index % 4 === 0 ? 0.62 : 0.36
}));

const orbitalParticles: OrbitalParticle[] = [
  { radius: 392, angle: 18, size: 3.5, color: "#c7f9ff", opacity: 0.9, duration: 3.8, delay: 0 },
  { radius: 364, angle: 126, size: 2.8, color: "#8bbcff", opacity: 0.78, duration: 4.4, delay: 1.1 },
  { radius: 332, angle: 214, size: 3.2, color: "#a78bfa", opacity: 0.8, duration: 4.1, delay: 0.7 },
  { radius: 286, angle: 297, size: 2.4, color: "#22d3ee", opacity: 0.72, duration: 3.6, delay: 1.2 },
  { radius: 246, angle: 64, size: 2.6, color: "#60a5fa", opacity: 0.7, duration: 4.8, delay: 0.4 },
  { radius: 210, angle: 178, size: 2.2, color: "#f0abfc", opacity: 0.66, duration: 3.9, delay: 2.2 },
  { radius: 404, angle: 248, size: 2.2, color: "#67e8f9", opacity: 0.7, duration: 4.6, delay: 1.1, mobile: false },
  { radius: 302, angle: 334, size: 2, color: "#c084fc", opacity: 0.64, duration: 4.2, delay: 2.6, mobile: false }
];

const fieldParticles = Array.from({ length: 34 }, (_, index) => {
  const angle = index * 37.4;
  const radius = 190 + ((index * 47) % 250);
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;

  return {
    x,
    y,
    size: index % 7 === 0 ? 2.4 : 1.35,
    opacity: index % 5 === 0 ? 0.74 : 0.42,
    delay: (index % 9) * 0.28,
    mobile: index < 20
  };
});

function polarToCartesian(radius: number, angle: number) {
  const angleInRadians = ((angle - 90) * Math.PI) / 180;

  return {
    x: radius * Math.cos(angleInRadians),
    y: radius * Math.sin(angleInRadians)
  };
}

function describeArc(radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(radius, endAngle);
  const end = polarToCartesian(radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return `M ${start.x.toFixed(3)} ${start.y.toFixed(3)} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`;
}

function NeonArc({ segment }: { segment: ArcSegment }) {
  return (
    <path
      d={describeArc(segment.radius, segment.start, segment.end)}
      fill="none"
      stroke={segment.stroke}
      strokeLinecap="round"
      strokeWidth={segment.width}
      opacity={segment.opacity}
      filter="url(#orbitGlow)"
    />
  );
}

function RotatingLayer({
  children,
  duration,
  direction = 1,
  opacity = 1
}: {
  children: ReactNode;
  duration: number;
  direction?: 1 | -1;
  opacity?: number;
}) {
  const reduceMotion = useReducedMotion();
  const endRotation = direction * 360;

  return (
    <motion.g
      style={{
        opacity,
        willChange: "transform"
      }}
      initial={{ transform: "rotate(0 0 0)" }}
      animate={reduceMotion ? { transform: "rotate(0 0 0)" } : { transform: `rotate(${endRotation} 0 0)` }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
    >
      {children}
    </motion.g>
  );
}

export function LandingOrbitBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden [contain:layout_paint_style]"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(14,165,233,0.12),transparent_28%),radial-gradient(circle_at_50%_54%,rgba(124,58,237,0.1),transparent_34%)]" />
      <div className="absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 sm:h-[690px] sm:w-[690px] md:h-[760px] md:w-[760px] lg:h-[820px] lg:w-[820px] xl:h-[880px] xl:w-[880px]">
        <div className="h-full w-full transform-gpu opacity-95 mix-blend-screen will-change-transform">
        <svg
          className="h-full w-full overflow-visible"
          viewBox="-460 -460 920 920"
        >
          <defs>
            <radialGradient id="coreRadial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#dffbff" stopOpacity="0.92" />
              <stop offset="22%" stopColor="#22d3ee" stopOpacity="0.74" />
              <stop offset="58%" stopColor="#2563eb" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="orbitCyan" x1="-360" y1="0" x2="360" y2="0">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="45%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#a5f3fc" />
            </linearGradient>
            <linearGradient id="orbitBlue" x1="0" y1="-360" x2="0" y2="360">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            <linearGradient id="orbitViolet" x1="-320" y1="-320" x2="320" y2="320">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="52%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <filter id="orbitGlow" x="-58%" y="-58%" width="216%" height="216%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="0 0 0 0 0.18 0 0 0 0 0.72 0 0 0 0 1 0 0 0 0.68 0"
                result="glow"
              />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="softCoreGlow" x="-92%" y="-92%" width="284%" height="284%">
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g opacity="0.22">
            {Array.from({ length: 13 }, (_, index) => {
              const position = -390 + index * 65;
              return (
                <g key={`grid-${position}`}>
                  <line x1={position} y1="-420" x2={position} y2="420" stroke="#38bdf8" strokeWidth="0.8" />
                  <line x1="-420" y1={position} x2="420" y2={position} stroke="#60a5fa" strokeWidth="0.8" />
                </g>
              );
            })}
          </g>

          <g opacity="0.18">
            <path d="M-370 -118 H-250 L-218 -86 H-108" fill="none" stroke="#67e8f9" strokeWidth="1.6" />
            <path d="M370 124 H248 L216 92 H110" fill="none" stroke="#a78bfa" strokeWidth="1.6" />
            <path d="M-332 188 H-240 L-212 158 H-150" fill="none" stroke="#38bdf8" strokeWidth="1.4" />
            <path d="M332 -190 H238 L210 -160 H148" fill="none" stroke="#c084fc" strokeWidth="1.4" />
          </g>

          <motion.g
            animate={reduceMotion ? false : { opacity: [0.46, 0.68, 0.46] }}
            transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformBox: "view-box", transformOrigin: "center", willChange: "opacity" }}
          >
            <circle r="268" fill="none" stroke="#22d3ee" strokeWidth="4" opacity="0.42" filter="url(#orbitGlow)" />
            <circle r="172" fill="none" stroke="#60a5fa" strokeWidth="2" opacity="0.34" filter="url(#orbitGlow)" />
            <circle r="118" fill="url(#coreRadial)" opacity="0.24" filter="url(#softCoreGlow)" />
          </motion.g>

          <RotatingLayer duration={54} direction={1}>
            <circle r="410" fill="none" stroke="#38bdf8" strokeWidth="1.4" opacity="0.34" />
            <circle r="386" fill="none" stroke="#2563eb" strokeWidth="1.1" opacity="0.28" strokeDasharray="3 18" />
            {outerArcSegments.map((segment) => (
              <NeonArc key={`${segment.radius}-${segment.start}`} segment={segment} />
            ))}
          </RotatingLayer>

          <RotatingLayer duration={32} direction={-1} opacity={0.96}>
            <circle r="350" fill="none" stroke="#60a5fa" strokeWidth="2" opacity="0.28" strokeDasharray="38 22" />
            <circle r="326" fill="none" stroke="#a78bfa" strokeWidth="1.25" opacity="0.2" />
            {secondaryArcSegments.map((segment) => (
              <NeonArc key={`${segment.radius}-${segment.start}`} segment={segment} />
            ))}
          </RotatingLayer>

          <RotatingLayer duration={21} direction={1} opacity={0.86}>
            <circle r="282" fill="none" stroke="#22d3ee" strokeWidth="1.2" opacity="0.26" strokeDasharray="2 12" />
            <circle r="248" fill="none" stroke="#2563eb" strokeWidth="16" opacity="0.1" strokeDasharray="28 16" />
            {innerDigitalSegments.map((segment) => (
              <NeonArc key={`${segment.radius}-${segment.start}`} segment={segment} />
            ))}
          </RotatingLayer>

          <RotatingLayer duration={13.5} direction={-1} opacity={0.82}>
            <circle r="154" fill="none" stroke="#22d3ee" strokeWidth="5" opacity="0.56" strokeDasharray="9 8" filter="url(#orbitGlow)" />
            <circle r="134" fill="none" stroke="#a78bfa" strokeWidth="1.4" opacity="0.42" />
            {tickMarks.map((tick) => {
              const inner = polarToCartesian(146, tick.angle);
              const outer = polarToCartesian(146 + tick.length, tick.angle);

              return (
                <line
                  key={`tick-${tick.angle}`}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke={tick.angle % 30 === 0 ? "#a5f3fc" : "#38bdf8"}
                  strokeWidth={tick.angle % 30 === 0 ? 2 : 1}
                  opacity={tick.opacity}
                />
              );
            })}
          </RotatingLayer>

          {orbitalParticles.map((particle, index) => {
            const position = polarToCartesian(particle.radius, particle.angle);

            return (
              <motion.circle
                key={`orbital-particle-${index}`}
                className={particle.mobile === false ? "hidden sm:block" : undefined}
                cx={position.x}
                cy={position.y}
                r={particle.size}
                fill={particle.color}
                opacity={particle.opacity}
                filter="url(#orbitGlow)"
                animate={reduceMotion ? false : { opacity: [particle.opacity * 0.45, particle.opacity, particle.opacity * 0.5] }}
                transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity, ease: "easeInOut" }}
              />
            );
          })}

          {fieldParticles.map((particle, index) => (
            <motion.circle
              key={`field-particle-${index}`}
              className={particle.mobile ? undefined : "hidden sm:block"}
              cx={particle.x}
              cy={particle.y}
              r={particle.size}
              fill={index % 4 === 0 ? "#a78bfa" : "#67e8f9"}
              opacity={particle.opacity}
              filter="url(#orbitGlow)"
              animate={reduceMotion ? false : { opacity: [particle.opacity * 0.3, particle.opacity, particle.opacity * 0.35] }}
              transition={{ duration: 3.4 + (index % 8) * 0.4, delay: particle.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}

          <RotatingLayer duration={8} direction={1} opacity={0.82}>
            <circle r="102" fill="none" stroke="#38bdf8" strokeWidth="1.25" opacity="0.52" strokeDasharray="3 9" />
            <circle r="86" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.34" />
            {coreTickMarks.map((tick) => {
              const inner = polarToCartesian(76, tick.angle);
              const outer = polarToCartesian(76 + tick.length, tick.angle);

              return (
                <line
                  key={`core-tick-${tick.angle}`}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke={tick.angle % 30 === 0 ? "#f0abfc" : "#67e8f9"}
                  strokeWidth={tick.angle % 30 === 0 ? 1.7 : 0.9}
                  opacity={tick.opacity}
                />
              );
            })}
          </RotatingLayer>

          <motion.g
            animate={reduceMotion ? false : { opacity: [0.78, 1, 0.78] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformBox: "view-box", transformOrigin: "center", willChange: "opacity" }}
          >
            <circle r="88" fill="url(#coreRadial)" opacity="0.58" filter="url(#softCoreGlow)" />
            <circle r="58" fill="#020617" opacity="0.9" />
            <circle r="55" fill="none" stroke="#22d3ee" strokeWidth="2" opacity="0.65" filter="url(#orbitGlow)" />
            <circle r="34" fill="url(#coreRadial)" opacity="0.84" filter="url(#softCoreGlow)" />
          </motion.g>
        </svg>
        </div>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_47%,transparent_0%,transparent_31%,rgba(2,6,23,0.2)_52%,rgba(2,6,23,0.7)_100%)]" />
    </div>
  );
}
