import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAnnouncementImageText } from "#/server/lib/announcement-ocr";

const mocks = vi.hoisted(() => ({ createWorker: vi.fn(), imageSize: vi.fn() }));
vi.mock("tesseract.js", () => ({ createWorker: mocks.createWorker }));
vi.mock("image-size", () => ({ imageSize: mocks.imageSize }));
const url = "https://sdk-webstatic.mihoyo.com/upload/ann/image.png";
const recognize = vi.fn();
const terminate = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(new Uint8Array([1, 2, 3]))));
  mocks.imageSize.mockReturnValue({ width: 101, height: 200 });
  mocks.createWorker.mockResolvedValue({ recognize, terminate });
  recognize.mockResolvedValue({ data: { text: "补给时间", confidence: 90 } });
  terminate.mockResolvedValue(undefined);
});

describe("announcement OCR worker", () => {
  it("downloads the image, recognizes its left side and terminates the worker", async () => {
    expect(await getAnnouncementImageText(url)).toBe("补给时间");
    expect(fetch).toHaveBeenCalledWith(url, { signal: expect.any(AbortSignal), redirect: "error" });
    expect(recognize).toHaveBeenCalledWith(expect.any(Uint8Array), { rectangle: { top: 0, left: 0, width: 36, height: 200 } });
    expect(terminate).toHaveBeenCalledOnce();
    const options = mocks.createWorker.mock.calls[0][2];
    expect(options.cacheMethod).toBe("none");
    expect(options.langPath).toContain("4.0.0_best_int");
    expect(options.errorHandler()).toBeUndefined();
  });

  it("discards low confidence text", async () => {
    recognize.mockResolvedValue({ data: { text: "uncertain", confidence: 69 } });
    expect(await getAnnouncementImageText(url)).toBeNull();
    expect(terminate).toHaveBeenCalledOnce();
  });

  it.each(["http://sdk-webstatic.mihoyo.com/a.png", "https://example.com/a.png"])("rejects unsupported image URLs %s", async (input) => {
    expect(await getAnnouncementImageText(input)).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([new Response(null, { status: 503 }), new Response(null, { status: 200 })])("handles missing bodies and HTTP errors", async (response) => {
    vi.mocked(fetch).mockResolvedValue(response);
    expect(await getAnnouncementImageText(url)).toBeNull();
    expect(mocks.createWorker).not.toHaveBeenCalled();
  });

  it("cancels downloads exceeding the byte limit", async () => {
    const cancel = vi.fn();
    const read = vi.fn().mockResolvedValue({ done: false, value: new Uint8Array(10 * 1024 * 1024 + 1) });
    vi.mocked(fetch).mockResolvedValue({ ok: true, body: { getReader: () => ({ read, cancel }) } } as unknown as Response);
    expect(await getAnnouncementImageText(url)).toBeNull();
    expect(cancel).toHaveBeenCalledOnce();
    expect(mocks.createWorker).not.toHaveBeenCalled();
  });

  it("rejects oversized dimensions", async () => {
    mocks.imageSize.mockReturnValue({ width: 4000, height: 4000 });
    expect(await getAnnouncementImageText(url)).toBeNull();
    expect(mocks.createWorker).not.toHaveBeenCalled();
  });

  it("terminates the worker when recognition fails", async () => {
    recognize.mockRejectedValue(new Error("recognition failed"));
    expect(await getAnnouncementImageText(url)).toBeNull();
    expect(terminate).toHaveBeenCalledOnce();
  });

  it("times out a running recognition and terminates the worker", async () => {
    recognize.mockImplementation(() => new Promise(() => {}));
    const result = getAnnouncementImageText(url);
    await vi.advanceTimersByTimeAsync(20_001);
    expect(await result).toBeNull();
    expect(terminate).toHaveBeenCalledOnce();
  });

  it("terminates workers that initialize after the timeout", async () => {
    let complete!: (worker: { recognize: typeof recognize; terminate: typeof terminate }) => void;
    mocks.createWorker.mockImplementation(() => new Promise((resolve) => {
      complete = resolve;
    }));
    const result = getAnnouncementImageText(url);
    await vi.advanceTimersByTimeAsync(20_001);
    expect(await result).toBeNull();
    expect(terminate).not.toHaveBeenCalled();
    complete({ recognize, terminate });
    await vi.advanceTimersByTimeAsync(0);
    expect(terminate).toHaveBeenCalledOnce();
    expect(recognize).not.toHaveBeenCalled();
  });
});
