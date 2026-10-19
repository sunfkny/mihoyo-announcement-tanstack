// @vitest-environment happy-dom
import type { AnnouncementItem, AnnouncementResponse } from "#/types/announcement";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NapAnnouncementCard } from "#/components/announcement/nap/card";
import { NapAnnouncementPage } from "#/components/announcement/nap/page";
import { getNapInfo } from "#/server/services/nap";
import { createAnnouncement, createAnnouncementApi, createContentResponse } from "../../../fixtures/nap";

const { fetchAnnouncement } = vi.hoisted(() => ({ fetchAnnouncement: vi.fn() }));
vi.mock("ofetch", () => ({ ofetch: { create: () => fetchAnnouncement } }));
function page(data: AnnouncementResponse) {
  return <NapAnnouncementPage data={data} />;
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-19T04:00:00Z"));
});
describe("nap announcement page", () => {
  async function loadPage() {
    fetchAnnouncement.mockImplementation(createAnnouncementApi());
    const data = await getNapInfo();
    await act(async () => {
      render(page(data));
    });
    await screen.findByText(/结束时间:/);
    return screen.getByRole("button", { name: `查看公告：3.3版本限时频段（上期）` });
  }
  it("renders parsed titles, times, images and version progress", async () => {
    const card = await loadPage();
    expect(within(card).getByText("3.3版本限时频段（上期）")).toBeVisible();
    expect(within(card).getByText(/开始时间:/)).toBeVisible();
    expect(within(card).getByText(/3\.3版本更新后/)).toBeVisible();
    expect(within(card).getByText(/2026-10-20 14:59:00/)).toBeVisible();
    const images = within(card).getAllByRole("img");
    expect(images[0]).toHaveAttribute("fetchpriority", "high");
    expect(new URL(images[0].getAttribute("src") ?? "").searchParams.get("x-oss-process")).toBe("image/format,webp");
    expect(screen.getByRole("progressbar", { name: "当前版本进度" })).toHaveAttribute("aria-valuenow", String(18 / 31 * 100));
    expect(screen.queryByText("维护通知")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("公告详细说明")).not.toBeInTheDocument();
    expect(images).toHaveLength(1);
    expect(images[0].getAttribute("src")).toContain("detail.png");
  });
  it("opens details on click, restores focus on close and reopens", async () => {
    const user = userEvent.setup();
    const card = await loadPage();
    await user.click(card);
    const dialog = await screen.findByRole("dialog", { name: "3.3版本限时频段（上期）" });
    expect(within(dialog).getByText("公告详细说明")).toBeVisible();
    expect(within(dialog).getByText("公告详细说明").style.fontSize).toBe("1rem");
    await user.click(within(dialog).getByRole("button", { name: "关闭" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(card).toHaveFocus();
    await user.click(card);
    expect(await screen.findByRole("dialog", { name: "3.3版本限时频段（上期）" })).toBeVisible();
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
    const announcements = response.data.pic_list;
    const title = "另一限时频段";
    announcements.push(createAnnouncement(announcements[1].content.replace("公告详细说明", "另一条公告的详情"), title, 3));
    fetchAnnouncement.mockImplementation(createAnnouncementApi(response));
    const data = await getNapInfo();
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
  const source = createContentResponse().data.pic_list[1];
  const item: AnnouncementItem = { ann_id: source.ann_id, title: source.title, image: source.banner, content: source.content, start_time: null, end_time: null, start_time_humanize: null, end_time_humanize: null, images: ["https://example.com/first.png", "https://example.com/second.png"] };
  render(<NapAnnouncementCard item={item} />);
  for (const image of screen.getAllByRole("img")) {
    expect(image).toHaveAttribute("fetchpriority", "auto");
  }
});
it("handles announcements without images", () => {
  render(<NapAnnouncementCard item={{ ann_id: 1, title: "无图片公告", image: "", content: "", start_time: null, end_time: null, start_time_humanize: null, end_time_humanize: null }} />);
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});

it("prioritizes only the first image within a card", () => {
  render(<NapAnnouncementCard priority item={{ ann_id: 1, title: "限时频段", image: "", images: ["https://example.com/first.png", "https://example.com/second.png"], content: "", start_time: null, end_time: null, start_time_humanize: null, end_time_humanize: null }} />);
  const images = screen.getAllByRole("img");
  expect(images[0]).toHaveAttribute("fetchpriority", "high");
  expect(images[1]).toHaveAttribute("fetchpriority", "auto");
});
