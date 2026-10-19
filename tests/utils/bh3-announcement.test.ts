import type { QueryFunctionContext } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { getBh3Announcement } from "#/utils/bh3-announcement.functions";
import { bh3AnnouncementQueryOptions } from "#/utils/bh3-announcement.query";

const { service } = vi.hoisted(() => ({ service: vi.fn() }));
vi.mock("#/server/services/bh3", () => ({ getBh3Info: service }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({ handler: (fn: unknown) => fn }) }));
describe("bh3 announcement requests", () => {
  const data = { gacha_info: [], progress: {} };
  it("calls the matching service on the server", async () => {
    service.mockResolvedValue(data);
    expect(await getBh3Announcement()).toBe(data);
    const query = bh3AnnouncementQueryOptions();
    expect(query.queryKey).toEqual(["announcement", "bh3"]);
    expect(query.staleTime).toBe(60000);
    expect(await (query.queryFn as (ctx: QueryFunctionContext) => unknown)({} as QueryFunctionContext)).toBe(data);
    expect(service).toHaveBeenCalledTimes(2);
  });
  it("forwards the abort signal and reports browser HTTP failures", async () => {
    vi.stubGlobal("window", {});
    const fetch = vi.fn().mockResolvedValueOnce(Response.json(data)).mockResolvedValueOnce(new Response(null, { status: 503, statusText: "Unavailable" }));
    vi.stubGlobal("fetch", fetch);
    const signal = new AbortController().signal;
    const run = bh3AnnouncementQueryOptions().queryFn as (ctx: QueryFunctionContext) => Promise<unknown>;
    expect(await run({ signal } as QueryFunctionContext)).toEqual(data);
    expect(fetch).toHaveBeenCalledWith("/api/announcement/bh3", { signal });
    await expect(run({ signal } as QueryFunctionContext)).rejects.toThrow("获取失败: 503 Unavailable");
  });
});
