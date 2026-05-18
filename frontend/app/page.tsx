import { AnimatedBackground } from "@/components/AnimatedBackground";
import { FloatingHologramSystem } from "@/components/FloatingHologramSystem";
import { HeroSection } from "@/components/HeroSection";

export default function Home() {
  return (
    <main className="relative min-h-svh overflow-x-hidden bg-[var(--color-void)] text-white">
      <AnimatedBackground />
      <FloatingHologramSystem />
      <HeroSection />
    </main>
  );
}
