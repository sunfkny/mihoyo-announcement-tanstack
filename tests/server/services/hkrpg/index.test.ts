import { beforeEach, describe, expect, it, vi } from "vitest";
import { getHkrpgInfo } from "#/server/services/hkrpg";
import { createAnnouncementApi, createContentResponse, createListResponse } from "../../../fixtures/hkrpg";

const { fetchAnnouncement } = vi.hoisted(() => ({ fetchAnnouncement: vi.fn() }));
vi.mock("ofetch", () => ({ ofetch: { create: () => fetchAnnouncement } }));
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-19T04:00:00Z"));
});
describe("hkrpg version selection boundaries", () => {
  it.each(["2026-09-01T00:00:00Z", "2026-12-01T00:00:00Z"])("omits progress outside the version at %s", async (now) => {
    vi.setSystemTime(new Date(now));
    fetchAnnouncement.mockImplementation(createAnnouncementApi());
    expect((await getHkrpgInfo()).progress.percent).toBeNull();
  });
  it("ignores unrelated version entries", async () => {
    const list = createListResponse();
    Object.assign(list.data.list[0].list[0], { title: "维护通知", subtitle: "维护通知", tag_label: "其他" });
    fetchAnnouncement.mockImplementation(createAnnouncementApi(createContentResponse(), list));
    expect((await getHkrpgInfo()).progress.start_time).toBeNull();
  });
  it("uses the alternate version announcement title", async () => {
    const list = createListResponse();
    Object.assign(list.data.list[0].list[0], {
      title: "维护通知",
      subtitle: "维护通知",
    });
    fetchAnnouncement.mockImplementation(createAnnouncementApi(createContentResponse(), list));
    expect((await getHkrpgInfo()).progress.start_time).toBe("2026-10-01 12:00:00");
  });
});
describe("hkrpg announcement parsing", () => {
  it("validates API data, excludes unrelated announcements and parses progress and times", async () => {
    fetchAnnouncement.mockImplementation(createAnnouncementApi());
    const data = await getHkrpgInfo();
    expect(data.gacha_info).toHaveLength(1);
    expect(data.gacha_info[0]).toMatchObject({
      ann_id: 1,
      start_time: "2026-10-01 12:00:00",
      start_time_humanize: "18天0小时0分钟前",
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
    const data = await getHkrpgInfo();
    expect(data.progress).toEqual({ start_time: null, end_time: null, end_time_humanize: null, percent: null });
    expect(data.gacha_info[0]).toMatchObject({ start_time: null, end_time: null, start_time_humanize: null, end_time_humanize: null });
  });
  it("rejects upstream API errors", async () => {
    fetchAnnouncement.mockResolvedValue({ retcode: -1, message: "upstream failure" });
    await expect(getHkrpgInfo()).rejects.toThrow("upstream failure");
  });
  it("rejects upstream data with missing fields", async () => {
    fetchAnnouncement.mockResolvedValue({ retcode: 0, message: "OK", data: {} });
    await expect(getHkrpgInfo()).rejects.toThrow();
  });
});
describe("hkrpg descriptive time ranges", () => {
  it("preserves unparseable end descriptions and trims nested span text", async () => {
    const separator = "-";
    const content = `<p><span> 公告 </span></p><table><tbody><tr><td rowspan="2">更新后 ${separator} 另行通知</td></tr></tbody></table>`;
    fetchAnnouncement.mockImplementation(createAnnouncementApi(createContentResponse(content)));
    expect((await getHkrpgInfo()).gacha_info[0]).toMatchObject({ start_time: null, start_time_humanize: "更新后 ", end_time: null, end_time_humanize: " 另行通知" });
  });
});
describe("hkrpg table time ranges", () => {
  it("skips unrelated and expired cells and selects the first active range", async () => {
    const separator = "-";
    const content = `<table><tbody><tr>
      <td rowspan="2">无关内容</td>
      <td rowspan="2">2026/09/01 12:00 ${separator} 2026/09/20 14:59</td>
      <td rowspan="2">2026/10/01 12:00 ${separator} 2026/10/20 14:59</td>
      <td rowspan="2">2026/10/21 12:00 ${separator} 2026/11/11 14:59</td>
      </tr></tbody></table>`;
    fetchAnnouncement.mockImplementation(createAnnouncementApi(createContentResponse(content)));
    const data = await getHkrpgInfo();
    expect(data.gacha_info[0]).toMatchObject({ start_time: "2026-10-01 12:00:00", end_time: "2026-10-20 14:59:00" });
  });
});
it("keeps hkrpg collaboration announcements without a parseable permanent date", async () => {
  fetchAnnouncement.mockImplementation(createAnnouncementApi(createContentResponse("<p>长期开放</p>", "联动跃迁")));
  expect((await getHkrpgInfo()).gacha_info[0].end_time_humanize).toBeNull();
});

it("preserves the permanent availability description for hkrpg collaboration warps", async () => {
  const content = createContentResponse("<p>2026/07/24 12:00 起长期开放</p>", "联动跃迁说明");
  fetchAnnouncement.mockImplementation(createAnnouncementApi(content));
  expect((await getHkrpgInfo()).gacha_info[0]).toMatchObject({
    start_time: "2026-07-24 12:00:00",
    end_time: null,
    end_time_humanize: "长期开放",
  });
});
