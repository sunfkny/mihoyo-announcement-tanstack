// @vitest-environment happy-dom
import type { ComponentType, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getRouter } from "#/router";
import { Route as Root } from "#/routes/__root";
import { Route as Layout } from "#/routes/announcement/route";
import { Route as Home } from "#/routes/index";
import { games } from "#/utils/games";

const mocks = vi.hoisted(() => ({
  matches: [] as { staticData: { game?: string } }[],
  loaderData: {} as Record<string, unknown>,
  createRouter: vi.fn(),
  integrate: vi.fn(),
}));
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const original = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...original,
    createFileRoute: (path: string) => (options: unknown) => ({ options, useLoaderData: () => mocks.loaderData[path] }),
    createRootRouteWithContext: () => (options: unknown) => ({ options }),
    createRouter: mocks.createRouter,
    useMatches: ({ select }: { select: (matches: typeof mocks.matches) => unknown }) => select(mocks.matches),
    Link: ({ to, children, ...props }: { "to": string; "children": ReactNode; "aria-label"?: string }) => <a href={to} aria-label={props["aria-label"]}>{children}</a>,
    Outlet: () => <p>路由内容</p>,
    HeadContent: () => <meta name="test-head" content="head" />,
    Scripts: () => <script src="/entry.js" />,
  };
});
vi.mock("@tanstack/react-router-ssr-query", () => ({ setupRouterSsrQueryIntegration: mocks.integrate }));
vi.mock("#/routeTree.gen", () => ({ routeTree: { id: "root" } }));

type LoaderContext = { context: { queryClient: { query: ReturnType<typeof vi.fn> } }; abortController: AbortController };
type TestRoute = { options: {
  loader: (context: LoaderContext) => Promise<unknown>;
  head: () => { meta: { title?: string; name?: string; content?: string }[]; links: { rel: string; href: string }[] };
  component: ComponentType;
  pendingComponent: ComponentType;
  errorComponent: ComponentType<{ error: unknown }>;
  notFoundComponent: ComponentType;
  shellComponent: ComponentType<{ children: ReactNode }>;
  server: { handlers: { GET: (ctx: { request: Request }) => Promise<Response> } };
}; };
const route = (value: unknown) => (value as TestRoute).options;

beforeEach(() => {
  mocks.matches = [];
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-19T04:00:00Z"));
});
describe("router configuration", () => {
  it("creates independent query clients with SSR integration", () => {
    const router = { id: "router" };
    mocks.createRouter.mockReturnValue(router);
    expect(getRouter()).toBe(router);
    const config = mocks.createRouter.mock.calls[0][0];
    expect(config).toMatchObject({ routeTree: { id: "root" }, scrollRestoration: true, defaultPreload: "intent", defaultPreloadStaleTime: 0, defaultViewTransition: true });
    expect(config.context.queryClient.getDefaultOptions().queries).toEqual({ retry: 1, staleTime: 60_000 });
    expect(mocks.integrate).toHaveBeenCalledWith({ router, queryClient: config.context.queryClient });
    getRouter();
    expect(mocks.createRouter.mock.calls[1][0].context.queryClient).not.toBe(config.context.queryClient);
  });

  it("supplies document metadata, assets, shell and not-found content", () => {
    const root = route(Root);
    const head = root.head();
    expect(head.meta).toContainEqual({ title: "Mihoyo Announcement" });
    expect(head.meta).toContainEqual({ name: "description", content: games.map(game => `${game.name}卡池`).join(",") });
    expect(head.links.filter(link => link.rel === "preconnect")).toHaveLength(4);
    const Shell = root.shellComponent;
    const html = renderToStaticMarkup(<Shell><p>页面</p></Shell>);
    expect(html).toContain("lang=\"zh-CN\"");
    expect(html).toContain("test-head");
    expect(html).toContain("/entry.js");
    expect(html).toContain("页面");
    const NotFound = root.notFoundComponent;
    render(<NotFound />);
    expect(screen.getByText("404 Not Found")).toBeVisible();
  });

  it("renders home navigation with all game links", () => {
    const Component = route(Home).component;
    render(<Component />);
    for (const game of games) {
      expect(screen.getByRole("link", { name: game.name })).toHaveAttribute("href", game.path);
    }
    expect(screen.getAllByRole("img")[0]).toHaveAttribute("fetchpriority", "high");
  });

  it.each([undefined, "bh3"])("renders the announcement layout with game=%s", (game) => {
    mocks.matches = [{ staticData: {} }, { staticData: { game } }];
    const Component = route(Layout).component;
    render(<Component />);
    expect(screen.getByText("路由内容")).toBeVisible();
    expect(screen.getAllByRole("link", { name: "首页" })).toHaveLength(2);
    expect(screen.getAllByRole("img", { name: "崩坏3" })).toHaveLength(game ? 2 : 1);
  });
});
