import { notFound } from "next/navigation";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { GameArenaPlaceholder } from "@/components/GameArenaPlaceholder";
import { gameModes, getGameMode } from "@/lib/gameModes";

type GamePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return gameModes.filter((game) => game.slug !== "hand-cricket").map((game) => ({ slug: game.slug }));
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;
  const game = getGameMode(slug);

  if (!game) {
    notFound();
  }

  return (
    <main className="relative min-h-svh overflow-x-hidden bg-[var(--color-void)] text-white">
      <AnimatedBackground />
      <GameArenaPlaceholder game={game} />
    </main>
  );
}
