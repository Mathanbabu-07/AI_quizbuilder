type FloatingGlowProps = {
  className?: string;
};

export function FloatingGlow({ className = "" }: FloatingGlowProps) {
  return (
    <div
      className={`pointer-events-none absolute hidden rounded-full blur-3xl sm:block ${className}`}
      aria-hidden="true"
    />
  );
}
