import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchBh3Ocr } from "#/utils/bh3-ocr";

const mocks = vi.hoisted(() => ({ server: true }));
vi.mock("@tanstack/react-start", () => ({
  createIsomorphicFn: () => ({ server: (server: () => string) => ({ client: (client: () => string) => () => mocks.server ? server() : client() }) }),
}));
vi.mock("@tanstack/react-start/server", () => ({ getRequestUrl: () => new URL("https://ann.example.com/announcement/bh3") }));
beforeEach(() => {
  mocks.server = true;
});
describe("ocr requests", () => {
  it("sorts and deduplicates IDs, batches eight at a time and merges results", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(Response.json({ gacha_info: [{ ann_id: 1 }] })).mockResolvedValueOnce(Response.json({ gacha_info: [{ ann_id: 9 }] }));
    vi.stubGlobal("fetch", fetch);
    const signal = new AbortController().signal;
    expect(await fetchBh3Ocr([9, 1, 2, 8, 7, 6, 5, 4, 3, 1], signal)).toEqual({ gacha_info: [{ ann_id: 1 }, { ann_id: 9 }] });
    expect(fetch.mock.calls).toEqual([
      ["https://ann.example.com/api/announcement/bh3/ocr?ann_id=1%2C2%2C3%2C4%2C5%2C6%2C7%2C8", { signal }],
      ["https://ann.example.com/api/announcement/bh3/ocr?ann_id=9", { signal }],
    ]);
  });

  it("uses a relative browser URL and reports HTTP errors", async () => {
    mocks.server = false;
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 502 }));
    vi.stubGlobal("fetch", fetch);
    await expect(fetchBh3Ocr([1])).rejects.toThrow("图片时间识别失败: 502");
    expect(fetch).toHaveBeenCalledWith("/api/announcement/bh3/ocr?ann_id=1", { signal: undefined });
  });

  it("does not request OCR for an empty list", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(await fetchBh3Ocr([])).toEqual({ gacha_info: [] });
    expect(fetch).not.toHaveBeenCalled();
  });
});
