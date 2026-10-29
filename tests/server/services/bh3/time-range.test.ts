import { describe, expect, it, vi } from "vitest";
import { getAnnouncementImageText } from "#/server/lib/announcement-ocr";
import { getBh3TimeRange, parseOcrTimeRange } from "#/server/services/bh3/time-range";

vi.mock("#/server/lib/announcement-ocr", () => ({ getAnnouncementImageText: vi.fn() }));
const recognize = vi.mocked(getAnnouncementImageText);

describe("ocr date parsing", () => {
  it.each(["1999-10-01", "10月1日"])("rejects reference years outside the supported range: %s", (reference) => {
    expect(parseOcrTimeRange("补给时间 10月1日12:00~10月20日14:59", reference)).toBeNull();
  });

  it.each([
    "补给时间 13月1日12:00~13月20日14:59",
    "补给时间 10月32日12:00~11月20日14:59",
    "补给时间 10月1日25:00~10月20日14:59",
    "补给时间 10月1日12:60~10月20日14:59",
    "补给时间 10月1日12:00~10月32日14:59",
  ])("rejects invalid calendar and clock fields: %s", (text) => {
    expect(parseOcrTimeRange(text, "2026-10-01")).toBeNull();
  });
  it("normalizes fullwidth characters and infers the year from the announcement date", () => {
    expect(parseOcrTimeRange("补给时间：１０月１日１２：００（服务器时间）～１０月２０日１４：５９", "2026-10-01")).toEqual({
      start: "2026-10-01 12:00:00",
      end: "2026-10-20 14:59:00",
    });
  });

  it("assigns the following year to an end date across the year boundary", () => {
    expect(parseOcrTimeRange("补给时间 12月30日12:00~1月20日12:00", "2026-12-29")).toEqual({
      start: "2026-12-30 12:00:00",
      end: "2027-01-20 12:00:00",
    });
  });

  it("preserves the version update description when no start time is specified", () => {
    expect(parseOcrTimeRange("补给时间 3.3版本更新后~10月20日14:59", "2026-10-01")).toEqual({
      start: "3.3版本更新后",
      end: "2026-10-20 14:59:00",
    });
  });

  it.each([
    { name: "a missing supply label", text: "10月1日12:00~10月20日14:59" },
    { name: "an invalid day", text: "补给时间 2月30日12:00~3月1日12:00" },
    { name: "a reversed range", text: "补给时间 10月20日12:00~10月1日12:00" },
    { name: "a range longer than 90 days", text: "补给时间 1月1日12:00~6月1日12:00" },
    { name: "a missing end date", text: "补给时间 10月1日12:00" },
    { name: "ambiguous date matches", text: "补给时间 10月1日12:00 10月2日12:00 10月3日12:00 10月4日12:00" },
  ])("rejects $name", ({ text }) => {
    expect(parseOcrTimeRange(text, "2026-10-01")).toBeNull();
  });
});

describe("announcement text and OCR fallback", () => {
  const firstImage = "https://sdk-webstatic.mihoyo.com/upload/ann/2026/10/01/first.png";
  const secondImage = "https://sdk-webstatic.mihoyo.com/upload/ann/2026/10/01/second.png";

  it.each(["h1", "h2", "h3", "h4", "h5", "h6"])("recognizes images under a %s supply heading and stops at the next section", async (heading) => {
    recognize.mockResolvedValueOnce("补给时间 10月23日12:00~11月6日12:00");
    const content = `<${heading}>补给信息</${heading}><p><img src="${firstImage}"></p><${heading}>补给规则</${heading}><p><img src="${secondImage}"></p>`;
    expect(await getBh3TimeRange(content, "2026-10-20", true)).toEqual({
      start: "2026-10-23 12:00:00",
      end: "2026-11-06 12:00:00",
    });
    expect(recognize).toHaveBeenCalledExactlyOnceWith(firstImage);
  });

  it("stops scanning at the next section heading when recognition fails", async () => {
    recognize.mockResolvedValueOnce(null);
    const content = `<h2>补给信息</h2><p><img src="${firstImage}"></p><h2>补给规则</h2><p><img src="${secondImage}"></p>`;
    expect(await getBh3TimeRange(content, "2026-10-01", true)).toBeNull();
    expect(recognize).toHaveBeenCalledExactlyOnceWith(firstImage);
  });

  it("skips images without a reference date", async () => {
    expect(await getBh3TimeRange("<h2>补给信息</h2><p><img src=\"https://example.com/a.png\"></p>", undefined, true)).toBeNull();
    expect(recognize).not.toHaveBeenCalled();
  });

  it("continues after OCR text with no valid time range", async () => {
    recognize.mockResolvedValueOnce("无关内容").mockResolvedValueOnce("补给时间 10月1日12:00~10月20日14:59");
    expect(await getBh3TimeRange(`<h2>补给信息</h2><p><img src="${firstImage}"><img src="${secondImage}"></p>`, undefined, true)).toMatchObject({ end: "2026-10-20 14:59:00" });
    expect(recognize).toHaveBeenCalledTimes(2);
  });

  it("returns null if recognition throws", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    recognize.mockRejectedValueOnce(new Error("worker failed"));
    expect(await getBh3TimeRange(`<h2>补给信息</h2><p><img src="${firstImage}"></p>`, undefined, true)).toBeNull();
  });

  it("skips OCR when the announcement text already contains a time range", async () => {
    const range = await getBh3TimeRange(`<p>补给时间：10月1日12:00~10月20日14:59</p><h2>补给信息</h2><p><img src="${firstImage}"></p>`, "2026-10-01", true);
    expect(range).toEqual({ start: "10月1日12:00", end: "10月20日14:59" });
    expect(recognize).not.toHaveBeenCalled();
  });

  it("skips image recognition when OCR is disabled", async () => {
    expect(await getBh3TimeRange(`<h2>补给信息</h2><p><img src="${firstImage}"></p>`)).toBeNull();
    expect(recognize).not.toHaveBeenCalled();
  });

  it("stops after the first successful image and falls back to its upload date", async () => {
    recognize.mockResolvedValue("补给时间 10月1日12:00~10月20日14:59");
    const range = await getBh3TimeRange(`<h3>补给信息</h3><p><img src="${firstImage}"><img src="${secondImage}"></p>`, undefined, true);
    expect(range).toEqual({ start: "2026-10-01 12:00:00", end: "2026-10-20 14:59:00" });
    expect(recognize).toHaveBeenCalledExactlyOnceWith(firstImage);
  });

  it("tries the second image after failure and ignores images outside the section", async () => {
    recognize.mockResolvedValueOnce(null).mockResolvedValueOnce("补给时间 10月1日12:00~10月20日14:59");
    const range = await getBh3TimeRange(`<p><img src="https://example.com/unrelated.png"></p><h2>补给信息</h2><p><img src="${firstImage}"></p><p><img src="${secondImage}"></p><h2>补给规则</h2><p><img src="https://example.com/rules.png"></p>`, "2026-10-01", true);
    expect(range?.end).toBe("2026-10-20 14:59:00");
    expect(recognize.mock.calls).toEqual([[firstImage], [secondImage]]);
  });

  it("attempts at most two images and returns null when both fail", async () => {
    recognize.mockResolvedValue(null);
    const range = await getBh3TimeRange(`<h2>补给信息</h2><p><img src="${firstImage}"><img src="${secondImage}"><img src="https://example.com/third.png"></p>`, "2026-10-01", true);
    expect(range).toBeNull();
    expect(recognize.mock.calls).toEqual([[firstImage], [secondImage]]);
  });

  it("skips unrelated images when the supply section is missing", async () => {
    expect(await getBh3TimeRange(`<p><img src="${firstImage}"></p>`, "2026-10-01", true)).toBeNull();
    expect(recognize).not.toHaveBeenCalled();
  });
});
