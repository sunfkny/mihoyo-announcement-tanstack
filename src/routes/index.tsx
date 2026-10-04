import { createFileRoute } from "@tanstack/react-router";
import { NavBar } from "#/components/navigation/nav-bar";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
  return (
    <main className="flex h-dvh items-center justify-center">
      <NavBar />
    </main>
  );
}
