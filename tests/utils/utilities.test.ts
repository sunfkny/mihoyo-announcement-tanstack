import { describe, expect, it } from "vitest";
import { cn } from "#/lib/utils";
import { resetFontSize, resolveTime, resolveTimeAndResetFontSize } from "#/utils/announcement-html";
import { appendAnnotation } from "#/utils/format-annotation";
import { gameKeys, games, getGame, getGameName, isGame } from "#/utils/games";
import { gameIconProcess, ossProcess, ossProcessWebp } from "#/utils/image-processing";

describe("announcement presentation utilities", () => {
  it("decodes time tags and scales small fonts without changing other markup", () => {
    const html = "<p style=\"font-size: 0.5rem\">&lt;t class=\"t_lc\"&gt;时间&lt;/t&gt;</p>";
    expect(resolveTime(html)).toContain("<span>时间</span>");
    expect(resetFontSize(html)).toContain("font-size:1rem");
    expect(resolveTimeAndResetFontSize(html)).toBe("<p style=\"font-size:1rem\"><span>时间</span></p>");
    expect(resolveTime("plain")).toBe("plain");
  });

  it("formats optional annotations with defaults and custom delimiters", () => {
    expect(appendAnnotation("时间", "备注")).toBe("时间 (备注)");
    expect(appendAnnotation("时间", "备注", { prefix: "[", suffix: "]", separator: "" })).toBe("时间[备注]");
    for (const main of ["", null, undefined]) {
      expect(appendAnnotation(main, 42)).toBe(42);
    }
    expect(cn("p-2", false, "p-4")).toBe("p-4");
  });

  it("resolves every supported game and rejects unknown keys", () => {
    expect(games.map(game => game.key)).toEqual(gameKeys);
    for (const game of games) {
      expect(isGame(game.key)).toBe(true);
      expect(getGameName(game.key)).toBe(game.name);
      expect(getGame(game.key)).toEqual({ key: game.key, name: game.name, icon: game.icon });
      expect(game.path).toBe(`/announcement/${game.key}`);
    }
    expect(isGame("unknown")).toBe(false);
    expect(getGame("unknown")).toBeNull();
  });

  it("encodes OSS transformations while preserving existing query parameters", () => {
    const src = "https://example.com/a.png?token=test";
    const result = new URL(ossProcess(src, [{ action: "resize", params: { w: 100, h: undefined } }, { action: "quality", params: { q: 80 } }]));
    expect(result.searchParams.get("token")).toBe("test");
    expect(result.searchParams.get("x-oss-process")).toBe("image/resize,w_100,image/quality,q_80");
    expect(new URL(ossProcessWebp(src)).searchParams.get("x-oss-process")).toBe("image/format,webp");
    expect(new URL(gameIconProcess(src)).searchParams.get("x-oss-process")).toBe("image/resize,w_256,h_256,image/format,webp");
    expect(new URL(ossProcess(src, [])).searchParams.get("x-oss-process")).toBe("");
  });
});
