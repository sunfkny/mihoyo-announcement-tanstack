import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementError } from "#/components/announcement-error";
import { AnnouncementPage } from "#/components/announcement-page";
import { announcementQueryOptions } from "#/utils/announcements.query";

export const Route = createFileRoute("/announcement/hk4e")({
  staticData: { game: "hk4e" },
  loader: ({ context }) => context.queryClient.query({ ...announcementQueryOptions("hk4e"), staleTime: "static" }),
  head: () => ({
    meta: [{ title: "原神卡池 - Mihoyo Announcement" }],
    links: [
      {
        rel: "preload",
        href: "https://webstatic.mihoyo.com/common/clgm-static/ys/fonts/zh-cn.ttf",
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
  return <AnnouncementPage game="hk4e" data={data} />;
}
