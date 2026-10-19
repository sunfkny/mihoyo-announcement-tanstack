import type { QueryFunctionContext } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { getNapAnnouncement } from "#/utils/nap-announcement.functions";
import { napAnnouncementQueryOptions } from "#/utils/nap-announcement.query";

const { service } = vi.hoisted(() => ({ service: vi.fn() }));
vi.mock("#/server/services/nap", () => ({ getNapInfo: service }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({ handler: (fn: unknown) => fn }) }));
describe("nap announcement requests", () => {
  const data = { gacha_info: [], progress: {} };
  it("calls the matching service on the server", async () => {
    service.mockResolvedValue(data);
    expect(await getNapAnnouncement()).toBe(data);
    const query = napAnnouncementQueryOptions();
    expect(query.queryKey).toEqual(["announcement", "nap"]);
    expect(query.staleTime).toBe(60000);
    expect(await (query.queryFn as (ctx: QueryFunctionContext) => unknown)({} as QueryFunctionContext)).toBe(data);
    expect(service).toHaveBeenCalledTimes(2);
  });
  it("forwards the abort signal and reports browser HTTP failures", async () => {
    vi.stubGlobal("window", {});
    const fetch = vi.fn().mockResolvedValueOnce(Response.json(data)).mockResolvedValueOnce(new Response(null, { status: 503, statusText: "Unavailable" }));
    vi.stubGlobal("fetch", fetch);
    const signal = new AbortController().signal;
    const run = napAnnouncementQueryOptions().queryFn as (ctx: QueryFunctionContext) => Promise<unknown>;
    expect(await run({ signal } as QueryFunctionContext)).toEqual(data);
    expect(fetch).toHaveBeenCalledWith("/api/announcement/nap", { signal });
    await expect(run({ signal } as QueryFunctionContext)).rejects.toThrow("获取失败: 503 Unavailable");
  });
});
