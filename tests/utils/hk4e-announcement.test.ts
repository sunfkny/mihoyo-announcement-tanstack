import type { QueryFunctionContext } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { getHk4eAnnouncement } from "#/utils/hk4e-announcement.functions";
import { hk4eAnnouncementQueryOptions } from "#/utils/hk4e-announcement.query";

const { service } = vi.hoisted(() => ({ service: vi.fn() }));
vi.mock("#/server/services/hk4e", () => ({ getHk4eInfo: service }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({ handler: (fn: unknown) => fn }) }));
describe("hk4e announcement requests", () => {
  const data = { gacha_info: [], progress: {} };
  it("calls the matching service on the server", async () => {
    service.mockResolvedValue(data);
    expect(await getHk4eAnnouncement()).toBe(data);
    const query = hk4eAnnouncementQueryOptions();
    expect(query.queryKey).toEqual(["announcement", "hk4e"]);
    expect(query.staleTime).toBe(60000);
    expect(await (query.queryFn as (ctx: QueryFunctionContext) => unknown)({} as QueryFunctionContext)).toBe(data);
    expect(service).toHaveBeenCalledTimes(2);
  });
  it("forwards the abort signal and reports browser HTTP failures", async () => {
    vi.stubGlobal("window", {});
    const fetch = vi.fn().mockResolvedValueOnce(Response.json(data)).mockResolvedValueOnce(new Response(null, { status: 503, statusText: "Unavailable" }));
    vi.stubGlobal("fetch", fetch);
    const signal = new AbortController().signal;
    const run = hk4eAnnouncementQueryOptions().queryFn as (ctx: QueryFunctionContext) => Promise<unknown>;
    expect(await run({ signal } as QueryFunctionContext)).toEqual(data);
    expect(fetch).toHaveBeenCalledWith("/api/announcement/hk4e", { signal });
    await expect(run({ signal } as QueryFunctionContext)).rejects.toThrow("获取失败: 503 Unavailable");
  });
});
