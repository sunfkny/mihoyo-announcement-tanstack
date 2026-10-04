import type { ReactNode } from "react";
import type { Game } from "#/utils/games";
import { Link, useMatches } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "#/lib/utils";
import { getGame } from "#/utils/games";
import { gameIconProcess } from "#/utils/image-processing";
import { NavBar } from "./nav-bar";

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    game?: Game;
  }
}

export function AnnouncementLayout({ children }: { children: ReactNode }) {
  const gameKey = useMatches({ select: matches => matches.find(match => match.staticData.game)?.staticData.game });
  const game = getGame(gameKey ?? "");

  return (
    <div className={cn("relative flex flex-col sm:flex-row", game && `use-${game.key}-font`)}>
      <div className="sticky top-0 hidden h-dvh flex-col items-center shadow sm:flex">
        <NavBar vertical />
      </div>

      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-white/50 p-4 shadow backdrop-blur dark:bg-gray-800/50 sm:hidden">
        <Link
          to="/"
          aria-label="首页"
          className="flex size-8 items-center justify-center p-0"
        >
          <ArrowLeft className="size-6" />
        </Link>
        {game && (
          <div className="flex items-center justify-center gap-2">
            <img
              src={gameIconProcess(game.icon)}
              alt={game.name}
              title={game.name}
              width={32}
              height={32}
              className="rounded-icon"
              style={{ viewTransitionName: `games-icon-${game.key}` }}
            />
            {game.name}
          </div>
        )}
        <div className="size-8" />
      </header>

      <main className="mx-auto w-full max-w-[768px] p-4 lg:p-0">
        {children}
      </main>
      <div className="sm:w-[108px]" />
    </div>
  );
}
