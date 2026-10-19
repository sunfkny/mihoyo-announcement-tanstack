import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBh3OcrResponse, parseAnnouncementIds } from "#/server/services/bh3/ocr";
import { createAnnouncement, createContentResponse, createListResponse } from "../../../fixtures/bh3";

const mocks = vi.hoisted(() => ({ list: vi.fn(), content: vi.fn(), range: vi.fn() }));
vi.mock("#/server/services/bh3/index", () => ({ getAnnList: mocks.list, getAnnContent: mocks.content }));
vi.mock("#/server/services/bh3/time-range", () => ({ getBh3TimeRange: mocks.range }));

beforeEach(() => {
  mocks.list.mockResolvedValue(createListResponse());
  mocks.content.mockResolvedValue(createContentResponse());
  mocks.range.mockResolvedValue({ start: "2026-10-01 12:00", end: "2026-10-20 14:59" });
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("ocr announcement IDs", () => {
  it.each(["", "0", "-1", "1.2", "a", "1,", "9007199254740992", "1,2,3,4,5,6,7,8,9"])("rejects %s", (input) => {
    expect(parseAnnouncementIds(input)).toBeNull();
  });
  it("normalizes positive IDs", () => {
    expect(parseAnnouncementIds("3,01,3,2")).toEqual([1, 2, 3]);
  });
});

describe("ocr endpoint", () => {
  const request = (query = "?ann_id=1") => getBh3OcrResponse(new Request(`https://example.com/api/announcement/bh3/ocr${query}`));

  it.each(["", "?ann_id=bad"])("returns 400 for invalid parameters %s", async (query) => {
    const response = await request(query);
    expect(response.status).toBe(400);
    expect(response.headers.get("CDN-Cache-Control")).toBe("no-store");
    expect(mocks.content).not.toHaveBeenCalled();
  });

  it("redirects to a canonical cache key", async () => {
    const response = await request("?ann_id=2,1,2&other=value");
    expect(response.status).toBe(308);
    expect(response.headers.get("Location")).toBe("/api/announcement/bh3/ocr?ann_id=1%2C2");
  });

  it("returns 404 for missing or unrelated announcements", async () => {
    const content = createContentResponse();
    content.data.list.push(createAnnouncement("普通内容", "补给", 3));
    mocks.content.mockResolvedValue(content);
    const response = await request("?ann_id=2%2C3%2C4");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Announcement not found", ann_ids: [2, 3, 4] });
    expect(mocks.range).not.toHaveBeenCalled();
  });

  it("caches complete absolute times and uses list reference dates", async () => {
    const list = createListResponse();
    list.data.list[0].list[0].ann_id = 1;
    mocks.list.mockResolvedValue(list);
    const response = await request();
    expect(response.status).toBe(200);
    expect(response.headers.get("CDN-Cache-Control")).toContain("max-age=86400");
    expect(await response.json()).toEqual({ gacha_info: [{ ann_id: 1, start_time: "2026-10-01 12:00:00", end_time: "2026-10-20 14:59:00", start_time_humanize: null, end_time_humanize: null }] });
    expect(mocks.range).toHaveBeenCalledWith(expect.stringContaining("补给信息"), "2026-10-01 12:00:00", true);
  });

  it("caches version starts while keeping descriptive annotations", async () => {
    mocks.range.mockResolvedValue({ start: "3.3版本更新后", end: "2026-10-20 14:59" });
    const response = await request();
    expect(response.headers.get("CDN-Cache-Control")).toContain("max-age=86400");
    expect((await response.json()).gacha_info[0]).toMatchObject({ start_time: null, start_time_humanize: "3.3版本更新后" });
  });

  it.each([null, { start: "2026-10-01 12:00", end: "待定" }, { start: "", end: "2026-10-20 14:59" }])("does not cache incomplete OCR results %j", async (range) => {
    mocks.range.mockResolvedValue(range);
    const response = await request();
    expect(response.status).toBe(200);
    expect(response.headers.get("CDN-Cache-Control")).toBe("no-store");
  });

  it("returns 502 without caching upstream failures", async () => {
    mocks.list.mockRejectedValue(new Error("offline"));
    const response = await request();
    expect(response.status).toBe(502);
    expect(response.headers.get("CDN-Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ error: "Announcement OCR unavailable" });
  });
});
