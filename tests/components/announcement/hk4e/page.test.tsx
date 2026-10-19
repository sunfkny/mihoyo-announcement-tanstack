// @vitest-environment happy-dom
import type { AnnouncementItem, AnnouncementResponse } from "#/types/announcement";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hk4eAnnouncementCard } from "#/components/announcement/hk4e/card";
import { Hk4eAnnouncementPage } from "#/components/announcement/hk4e/page";
import { getHk4eInfo } from "#/server/services/hk4e";
import { createAnnouncement, createAnnouncementApi, createContentResponse } from "../../../fixtures/hk4e";

const { fetchAnnouncement } = vi.hoisted(() => ({ fetchAnnouncement: vi.fn() }));
vi.mock("ofetch", () => ({ ofetch: { create: () => fetchAnnouncement } }));
function page(data: AnnouncementResponse) {
  return <Hk4eAnnouncementPage data={data} />;
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-19T04:00:00Z"));
});
describe("hk4e announcement page", () => {
  async function loadPage() {
    fetchAnnouncement.mockImplementation(createAnnouncementApi());
    const data = await getHk4eInfo();
    await act(async () => {
      render(page(data));
    });
    await screen.findByText(/结束时间:/);
    return screen.getByRole("button", { name: `查看公告：角色活动祈愿` });
  }
  it("renders parsed titles, times, images and version progress", async () => {
    const card = await loadPage();
    expect(within(card).getByText("角色活动祈愿")).toBeVisible();
    expect(within(card).getByText(/开始时间:/)).toBeVisible();
    expect(within(card).getByText(/2026-10-01 12:00:00/)).toBeVisible();
    expect(within(card).getByText(/2026-10-20 14:59:00/)).toBeVisible();
    const images = within(card).getAllByRole("img");
    expect(images[0]).toHaveAttribute("fetchpriority", "high");
    expect(new URL(images[0].getAttribute("src") ?? "").searchParams.get("x-oss-process")).toBe("image/format,webp");
    expect(screen.getByRole("progressbar", { name: "当前版本进度" })).toHaveAttribute("aria-valuenow", String(18 / 31 * 100));
    expect(screen.queryByText("维护通知")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("公告详细说明")).not.toBeInTheDocument();
  });
  it("opens details on click, restores focus on close and reopens", async () => {
    const user = userEvent.setup();
    const card = await loadPage();
    await user.click(card);
    const dialog = await screen.findByRole("dialog", { name: "角色活动祈愿" });
    expect(within(dialog).getByText("公告详细说明")).toBeVisible();
    expect(within(dialog).getByText("公告详细说明").style.fontSize).toBe("1rem");
    await user.click(within(dialog).getByRole("button", { name: "关闭" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(card).toHaveFocus();
    await user.click(card);
    expect(await screen.findByRole("dialog", { name: "角色活动祈愿" })).toBeVisible();
  });
  it("opens with Enter or Space and closes with Escape", async () => {
    const user = userEvent.setup();
    const card = await loadPage();
    card.focus();
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("dialog")).toBeVisible();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(card).toHaveFocus();
    await user.keyboard(" ");
    expect(await screen.findByRole("dialog")).toBeVisible();
  });
  it("opens the selected announcement and prioritizes only the first card image", async () => {
    const response = createContentResponse();
    const announcements = response.data.list;
    const title = "武器活动祈愿";
    announcements.push(createAnnouncement(announcements[1].content.replace("公告详细说明", "另一条公告的详情"), title, 3));
    fetchAnnouncement.mockImplementation(createAnnouncementApi(response));
    const data = await getHk4eInfo();
    await act(async () => {
      render(page(data));
    });
    const cards = screen.getAllByRole("button");
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getAllByRole("img")[0]).toHaveAttribute("fetchpriority", "high");
    expect(within(cards[1]).getAllByRole("img")[0]).toHaveAttribute("fetchpriority", "auto");
    await userEvent.setup().click(screen.getByRole("button", { name: `查看公告：${title}` }));
    const dialog = await screen.findByRole("dialog", { name: title });
    expect(within(dialog).getByText("另一条公告的详情")).toBeVisible();
    expect(within(dialog).queryByText("公告详细说明")).not.toBeInTheDocument();
  });
  it("keeps the dialog closed when text is selected", async () => {
    const card = await loadPage();
    const selection = document.getSelection();
    if (!selection) {
      throw new Error("Selection is unavailable");
    }
    vi.spyOn(selection, "isCollapsed", "get").mockReturnValue(false);
    vi.spyOn(document, "getSelection").mockReturnValue(selection);
    await userEvent.setup().click(card);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("ignores unrelated keyboard events and clicks without a selection object", async () => {
    const card = await loadPage();
    fireEvent.keyDown(card, { key: "ArrowDown" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    vi.spyOn(document, "getSelection").mockReturnValue(null);
    fireEvent.click(card);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("renders an empty page without announcements or version progress", async () => {
    await act(async () => {
      render(page({ gacha_info: [], progress: { start_time: null, end_time: null, end_time_humanize: null, percent: null } }));
    });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});

it("renders a card with default image priority", () => {
  const source = createContentResponse().data.list[1];
  const item: AnnouncementItem = { ann_id: source.ann_id, title: source.title, image: source.banner, content: source.content, start_time: null, end_time: null, start_time_humanize: null, end_time_humanize: null };
  render(<Hk4eAnnouncementCard item={item} />);
  for (const image of screen.getAllByRole("img")) {
    expect(image).toHaveAttribute("fetchpriority", "auto");
  }
});
