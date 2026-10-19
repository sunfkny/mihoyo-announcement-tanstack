import { beforeEach, describe, expect, it, vi } from "vitest";
import { getNapInfo } from "#/server/services/nap";
import { createAnnouncementApi, createContentResponse, createListResponse } from "../../../fixtures/nap";

const { fetchAnnouncement } = vi.hoisted(() => ({ fetchAnnouncement: vi.fn() }));
vi.mock("ofetch", () => ({ ofetch: { create: () => fetchAnnouncement } }));
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-19T04:00:00Z"));
});
describe("nap version selection boundaries", () => {
  it.each(["2026-09-01T00:00:00Z", "2026-12-01T00:00:00Z"])("omits progress outside the version at %s", async (now) => {
    vi.setSystemTime(new Date(now));
    fetchAnnouncement.mockImplementation(createAnnouncementApi());
    expect((await getNapInfo()).progress.percent).toBeNull();
  });
  it("ignores unrelated version entries", async () => {
    const list = createListResponse();
    Object.assign(list.data.list[0].list[0], { title: "维护通知", subtitle: "维护通知", tag_label: "其他" });
    fetchAnnouncement.mockImplementation(createAnnouncementApi(createContentResponse(), list));
    expect((await getNapInfo()).progress.start_time).toBeNull();
  });
  it("uses the alternate version announcement title", async () => {
    const list = createListResponse();
    Object.assign(list.data.list[0].list[0], {
      title: "已知问题及游戏优化说明",
      subtitle: "维护通知",
    });
    fetchAnnouncement.mockImplementation(createAnnouncementApi(createContentResponse(), list));
    expect((await getNapInfo()).progress.start_time).toBe("2026-10-01 12:00:00");
  });
});
describe("nap announcement parsing", () => {
  it("validates API data, excludes unrelated announcements and parses progress and times", async () => {
    fetchAnnouncement.mockImplementation(createAnnouncementApi());
    const data = await getNapInfo();
    expect(data.gacha_info).toHaveLength(1);
    expect(data.gacha_info[0]).toMatchObject({
      ann_id: 1,
      start_time: null,
      start_time_humanize: "3.3版本更新后",
      end_time: "2026-10-20 14:59:00",
      end_time_humanize: "1天2小时59分钟后",
    });
    expect(data.progress).toMatchObject({ start_time: "2026-10-01 12:00:00", end_time: "2026-11-01 12:00:00" });
    expect(data.progress.percent).toBeCloseTo(18 / 31);
    expect(fetchAnnouncement).toHaveBeenCalledTimes(2);
  });
  it("returns null times when version information or time ranges are missing", async () => {
    const list = createListResponse();
    list.data.list = [];
    const content = createContentResponse("<h2>补给信息</h2><p>公告尚未公布时间</p>");
    fetchAnnouncement.mockImplementation(createAnnouncementApi(content, list));
    const data = await getNapInfo();
    expect(data.progress).toEqual({ start_time: null, end_time: null, end_time_humanize: null, percent: null });
    expect(data.gacha_info[0]).toMatchObject({ start_time: null, end_time: null, start_time_humanize: null, end_time_humanize: null });
  });
  it("rejects upstream API errors", async () => {
    fetchAnnouncement.mockResolvedValue({ retcode: -1, message: "upstream failure" });
    await expect(getNapInfo()).rejects.toThrow("upstream failure");
  });
  it("rejects upstream data with missing fields", async () => {
    fetchAnnouncement.mockResolvedValue({ retcode: 0, message: "OK", data: {} });
    await expect(getNapInfo()).rejects.toThrow();
  });
});
describe("nap descriptive time ranges", () => {
  it("preserves unparseable end descriptions and trims nested span text", async () => {
    const separator = "~";
    const content = `<p><span> 公告 </span></p><table><tbody><tr><td rowspan="2">更新后 ${separator} 另行通知</td></tr></tbody></table>`;
    fetchAnnouncement.mockImplementation(createAnnouncementApi(createContentResponse(content)));
    expect((await getNapInfo()).gacha_info[0]).toMatchObject({ start_time: null, start_time_humanize: "更新后", end_time: null, end_time_humanize: "另行通知" });
  });
});
describe("nap table time ranges", () => {
  it("skips unrelated and expired cells and selects the first active range", async () => {
    const separator = "~";
    const content = `<table><tbody><tr>
      <td rowspan="2">无关内容</td>
      <td rowspan="2">2026/09/01 12:00 ${separator} 2026/09/20 14:59</td>
      <td rowspan="2">2026/10/01 12:00 ${separator} 2026/10/20 14:59</td>
      <td rowspan="2">2026/10/21 12:00 ${separator} 2026/11/11 14:59</td>
      </tr></tbody></table>`;
    fetchAnnouncement.mockImplementation(createAnnouncementApi(createContentResponse(content)));
    const data = await getNapInfo();
    expect(data.gacha_info[0]).toMatchObject({ start_time: "2026-10-01 12:00:00", end_time: "2026-10-20 14:59:00" });
  });
});
describe("nap paragraph time ranges", () => {
  it.each([
    { name: "an explicit date", start: "2026-09-30 12:00（服务器时间）", time: "2026-09-30 12:00:00", annotation: "19天0小时0分钟前" },
    { name: "a version update", start: "3.3版本更新后", time: null, annotation: "3.3版本更新后" },
  ])("extracts $name without including the announcement prefix", async ({ start, time, annotation }) => {
    const content = `<p><span>本期代理人与音擎调频活动时间为：</span><span>${start} ~ 2026-10-20 14:59（服务器时间），包含如下内容：</span></p> &#x20;`;
    fetchAnnouncement.mockImplementation(createAnnouncementApi(createContentResponse(content)));
    const data = await getNapInfo();
    expect(data.gacha_info[0]).toMatchObject({ start_time: time, start_time_humanize: annotation, end_time: "2026-10-20 14:59:00" });
  });
  it("excludes signal search reward announcements", async () => {
    fetchAnnouncement.mockImplementation(createAnnouncementApi(createContentResponse("<p>调频回馈</p>", "调频回馈活动")));
    expect((await getNapInfo()).gacha_info).toEqual([]);
  });
});
