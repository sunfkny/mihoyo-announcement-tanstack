import type { QueryFunctionContext } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { getHkrpgAnnouncement } from "#/utils/hkrpg-announcement.functions";
import { hkrpgAnnouncementQueryOptions } from "#/utils/hkrpg-announcement.query";

const { service } = vi.hoisted(() => ({ service: vi.fn() }));
vi.mock("#/server/services/hkrpg", () => ({ getHkrpgInfo: service }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({ handler: (fn: unknown) => fn }) }));
describe("hkrpg announcement requests", () => {
  const data = { gacha_info: [], progress: {} };
  it("calls the matching service on the server", async () => {
    service.mockResolvedValue(data);
    expect(await getHkrpgAnnouncement()).toBe(data);
    const query = hkrpgAnnouncementQueryOptions();
    expect(query.queryKey).toEqual(["announcement", "hkrpg"]);
    expect(query.staleTime).toBe(60000);
    expect(await (query.queryFn as (ctx: QueryFunctionContext) => unknown)({} as QueryFunctionContext)).toBe(data);
    expect(service).toHaveBeenCalledTimes(2);
  });
  it("forwards the abort signal and reports browser HTTP failures", async () => {
    vi.stubGlobal("window", {});
    const fetch = vi.fn().mockResolvedValueOnce(Response.json(data)).mockResolvedValueOnce(new Response(null, { status: 503, statusText: "Unavailable" }));
    vi.stubGlobal("fetch", fetch);
    const signal = new AbortController().signal;
    const run = hkrpgAnnouncementQueryOptions().queryFn as (ctx: QueryFunctionContext) => Promise<unknown>;
    expect(await run({ signal } as QueryFunctionContext)).toEqual(data);
    expect(fetch).toHaveBeenCalledWith("/api/announcement/hkrpg", { signal });
    await expect(run({ signal } as QueryFunctionContext)).rejects.toThrow("获取失败: 503 Unavailable");
  });
});
