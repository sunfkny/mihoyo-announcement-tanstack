// @vitest-environment happy-dom
import type { ComponentType, ReactNode } from "react";
import type { AnnouncementResponse } from "#/types/announcement";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route as PageRoute } from "#/routes/announcement/hkrpg/route";
import { Route as ApiRoute } from "#/routes/api/announcement/hkrpg/route";

const mocks = vi.hoisted(() => ({ loaderData: {} as Record<string, unknown>, service: vi.fn() }));
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const original = await importOriginal<typeof import("@tanstack/react-router")>();
  return { ...original, createFileRoute: (path: string) => (options: unknown) => ({ options, useLoaderData: () => mocks.loaderData[path] }) };
});
vi.mock("#/server/services/hkrpg", () => ({ getHkrpgInfo: mocks.service }));
vi.mock("#/utils/hkrpg-announcement.functions", () => ({ getHkrpgAnnouncement: mocks.service }));

const emptyData: AnnouncementResponse = { gacha_info: [], progress: { start_time: null, end_time: null, end_time_humanize: null, percent: null } };
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
const context = (data: AnnouncementResponse): LoaderContext => ({ context: { queryClient: { query: vi.fn().mockResolvedValue(data) } }, abortController: new AbortController() });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-19T04:00:00Z"));
});
describe("hkrpg page route", () => {
  it("loads the announcement query, emits a font preload and renders data", async () => {
    const options = route(PageRoute);
    const ctx = context(emptyData);
    expect(await options.loader(ctx)).toBe(emptyData);
    expect(ctx.context.queryClient.query).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["announcement", "hkrpg"], staleTime: "static" }));
    expect(options.head().meta[0].title).toContain("崩坏：星穹铁道");
    expect(options.head().links[0]).toMatchObject({ rel: "preload", as: "font", crossOrigin: "anonymous" });
    mocks.loaderData["/announcement/hkrpg"] = emptyData;
    const Component = options.component;
    const { container } = render(<Component />);
    expect(container.querySelector(".announcement-card")).toBeNull();
    const Loading = options.pendingComponent;
    render(<Loading />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    const Error = options.errorComponent;
    render(<Error error="upstream offline" />);
    expect(screen.getByText("获取失败")).toBeVisible();
    expect(screen.getByText("upstream offline")).toBeVisible();
  });
});
describe("hkrpg API route", () => {
  it("returns service data with CDN cache headers", async () => {
    mocks.service.mockResolvedValue(emptyData);
    const response = await route(ApiRoute).server.handlers.GET({ request: new Request("https://example.com") });
    expect(await response.json()).toEqual(emptyData);
    expect(response.headers.get("CDN-Cache-Control")).toBe("public, max-age=60, stale-while-revalidate=600");
  });
});
