import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementError } from "#/components/announcement-error";
import { AnnouncementPage } from "#/components/announcement-page";
import { announcementQueryOptions } from "#/utils/announcements.query";

export const Route = createFileRoute("/announcement/bh3")({
  staticData: { game: "bh3" },
  loader: ({ context }) => context.queryClient.query({ ...announcementQueryOptions("bh3"), staleTime: "static" }),
  head: () => ({
    meta: [{ title: "崩坏3卡池 - Mihoyo Announcement" }],
    links: [
      {
        rel: "preload",
        href: "https://webstatic.mihoyo.com/bh3/upload/announcement/font/zh-cn.ttf",
        as: "font",
        type: "font/ttf",
        crossOrigin: "anonymous",
      },
    ],
  }),
  errorComponent: AnnouncementError,
  component: AnnouncementRoute,
});

function AnnouncementRoute() {
  const data = Route.useLoaderData();
  return <AnnouncementPage game="bh3" data={data} />;
}
