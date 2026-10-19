// @vitest-environment happy-dom
import type { ComponentType, ReactNode } from "react";
import type { AnnouncementItem, AnnouncementOcrResponse, AnnouncementResponse } from "#/types/announcement";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route as PageRoute } from "#/routes/announcement/bh3/route";
import { Route as OcrApi } from "#/routes/api/announcement/bh3/ocr";
import { Route as ApiRoute } from "#/routes/api/announcement/bh3/route";

const mocks = vi.hoisted(() => ({ loaderData: {} as Record<string, unknown>, service: vi.fn(), ocr: vi.fn(), ocrResponse: vi.fn() }));
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const original = await importOriginal<typeof import("@tanstack/react-router")>();
  return { ...original, createFileRoute: (path: string) => (options: unknown) => ({ options, useLoaderData: () => mocks.loaderData[path] }) };
});
vi.mock("#/server/services/bh3", () => ({ getBh3Info: mocks.service }));
vi.mock("#/utils/bh3-announcement.functions", () => ({ getBh3Announcement: mocks.service }));
vi.mock("#/server/services/bh3/ocr", () => ({ getBh3OcrResponse: mocks.ocrResponse }));
vi.mock("#/utils/bh3-ocr", () => ({ fetchBh3Ocr: mocks.ocr }));

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
const item = (id: number, fields: Partial<AnnouncementItem> = {}): AnnouncementItem => ({ ann_id: id, title: "补给", image: "https://example.com/a.png", content: "<p>内容</p>", start_time: null, end_time: null, start_time_humanize: null, end_time_humanize: null, ...fields });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-19T04:00:00Z"));
});
describe("bh3 deferred OCR route", () => {
  async function load(items: AnnouncementItem[], extracted: AnnouncementOcrResponse = { gacha_info: [] }) {
    mocks.ocr.mockResolvedValue(extracted);
    const ctx = context({ ...emptyData, gacha_info: items });
    const result = await route(PageRoute).loader(ctx) as { data: AnnouncementResponse; times: Promise<{ items: AnnouncementItem[]; failed: boolean }>; missingTimeIds: number[] };
    return { ctx, result, resolved: await result.times };
  }

  it("skips OCR for complete times and renders the loader data", async () => {
    const entries = [item(1, { start_time: "2026-10-01 12:00", end_time: "2026-10-20 14:59" }), item(2, { start_time_humanize: "更新后", end_time_humanize: "长期开放" })];
    const { result, resolved } = await load(entries);
    expect(result.missingTimeIds).toEqual([]);
    expect(resolved).toEqual({ items: entries, failed: false });
    expect(mocks.ocr).not.toHaveBeenCalled();
    expect(route(PageRoute).head().links[0].href).toContain("bh3");
    expect(route(PageRoute).head().meta[0].title).toContain("崩坏3");
    mocks.loaderData["/announcement/bh3"] = result;
    const Component = route(PageRoute).component;
    await act(async () => {
      render(<Component />);
    });
    expect(screen.getAllByRole("button")).toHaveLength(2);
    const Loading = route(PageRoute).pendingComponent;
    render(<Loading />);
    expect(screen.getByRole("status")).toBeVisible();
  });

  it("merges OCR times, computes annotations and preserves unmatched announcements", async () => {
    const entries = [item(1), item(2, { start_time: "2026-10-01 12:00" }), item(3)];
    const extracted = { gacha_info: [
      { ann_id: 1, start_time: "2026-10-01 12:00:00", end_time: "2026-10-20 14:59:00", start_time_humanize: null, end_time_humanize: null },
      { ann_id: 2, start_time: null, end_time: null, start_time_humanize: "更新后", end_time_humanize: "长期开放" },
    ] };
    const { ctx, result, resolved } = await load(entries, extracted);
    expect(result.missingTimeIds).toEqual([1, 2, 3]);
    expect(mocks.ocr).toHaveBeenCalledWith([1, 2, 3], ctx.abortController.signal);
    expect(resolved.items[0]).toMatchObject({ start_time_humanize: "18天0小时0分钟前", end_time_humanize: "1天2小时59分钟后" });
    expect(resolved.items[1]).toMatchObject({ start_time: entries[1].start_time, start_time_humanize: "更新后", end_time_humanize: "长期开放" });
    expect(resolved.items[2]).toBe(entries[2]);
  });

  it("preserves annotations when OCR returns null fields", async () => {
    const entry = item(1, { start_time_humanize: "原始说明" });
    const { resolved } = await load([entry], { gacha_info: [{ ann_id: 1, start_time: null, end_time: null, start_time_humanize: null, end_time_humanize: null }] });
    expect(resolved.items).toEqual([entry]);
  });

  it("returns original items with a failed flag after OCR rejection", async () => {
    mocks.ocr.mockRejectedValue(new Error("offline"));
    const data = { ...emptyData, gacha_info: [item(1)] };
    const result = await route(PageRoute).loader(context(data)) as { times: Promise<unknown> };
    expect(await result.times).toEqual({ items: data.gacha_info, failed: true });
  });
});
it("forwards OCR requests to the OCR service", async () => {
  const request = new Request("https://example.com/api/announcement/bh3/ocr?ann_id=1");
  const response = Response.json({ gacha_info: [] });
  mocks.ocrResponse.mockResolvedValue(response);
  expect(await route(OcrApi).server.handlers.GET({ request })).toBe(response);
  expect(mocks.ocrResponse).toHaveBeenCalledWith(request);
});
describe("bh3 API route", () => {
  it("returns service data with CDN cache headers", async () => {
    mocks.service.mockResolvedValue(emptyData);
    const response = await route(ApiRoute).server.handlers.GET({ request: new Request("https://example.com") });
    expect(await response.json()).toEqual(emptyData);
    expect(response.headers.get("CDN-Cache-Control")).toBe("public, max-age=60, stale-while-revalidate=600");
  });
});
