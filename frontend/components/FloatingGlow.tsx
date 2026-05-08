type FloatingGlowProps = {
  className?: string;
};

export function FloatingGlow({ className = "" }: FloatingGlowProps) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
      aria-hidden="true"
    />
  );
}
