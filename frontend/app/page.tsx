import { AnimatedBackground } from "@/components/AnimatedBackground";
import { HeroSection } from "@/components/HeroSection";

export default function Home() {
  return (
    <main className="relative min-h-svh overflow-x-hidden bg-[var(--color-void)] text-white">
      <AnimatedBackground />
      <HeroSection />
    </main>
  );
}
