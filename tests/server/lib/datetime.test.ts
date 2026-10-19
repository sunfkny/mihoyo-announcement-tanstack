import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatChineseISOLocaleString, getTime, getTimeHumanize, parseLocalDate, parseTimeHumanize } from "#/server/lib/datetime";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-19T04:00:00Z"));
});

describe("local announcement dates", () => {
  it.each([
    ["2026/10/19 12:34:56", "2026-10-19T04:34:56.000Z"],
    [" 2026-10-19   12:34 ", "2026-10-19T04:34:00.000Z"],
    ["2026年10月19日", "2026-10-18T16:00:00.000Z"],
    ["10月20日12", "2026-10-20T04:00:00.000Z"],
    ["1月1日", "2026-12-31T16:00:00.000Z"],
    ["2026-10-19", "2026-10-18T16:00:00.000Z"],
  ])("parses %s", (input, expected) => {
    expect(parseLocalDate(input).toISOString()).toBe(expected);
  });

  it("supports an explicit timezone and rejects malformed input", () => {
    expect(parseLocalDate("2026-10-19 12:00", 0).toISOString()).toBe("2026-10-19T12:00:00.000Z");
    expect(() => parseLocalDate("")).toThrow("Invalid date string");
    expect(() => parseLocalDate(null as unknown as string)).toThrow("Invalid date string");
    expect(() => parseLocalDate("unknown")).toThrow("Invalid date string");
    vi.spyOn(Date, "UTC").mockReturnValueOnce(Number.NaN);
    expect(() => parseLocalDate("2026-10-19")).toThrow("Invalid date:");
  });

  it("formats dates and relative durations, preserving descriptions without a date", () => {
    expect(formatChineseISOLocaleString(new Date())).toBe("2026-10-19 12:00:00");
    expect(getTime()).toEqual(new Date());
    expect(getTime("2026-10-19 12:00")).toEqual(new Date());
    expect(getTimeHumanize(null)).toBeNull();
    expect(getTimeHumanize("2026-10-20 14:59")).toBe("1天2小时59分钟后");
    expect(getTimeHumanize(new Date("2026-10-18T03:59:00Z"))).toBe("1天0小时1分钟前");
    expect(parseTimeHumanize(null)).toEqual({ time: null, time_humanize: null });
    expect(parseTimeHumanize("更新后")).toEqual({ time: null, time_humanize: "更新后" });
    expect(parseTimeHumanize("2026-10-19 12:00")).toEqual({ time: "2026-10-19 12:00:00", time_humanize: "0天0小时0分钟前" });
  });
});
