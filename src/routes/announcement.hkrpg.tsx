import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementError } from "#/components/announcement-error";
import { AnnouncementPage } from "#/components/announcement-page";
import { announcementQueryOptions } from "#/utils/announcements.query";

export const Route = createFileRoute("/announcement/hkrpg")({
  staticData: { game: "hkrpg" },
  loader: ({ context }) => context.queryClient.query({ ...announcementQueryOptions("hkrpg"), staleTime: "static" }),
  head: () => ({
    meta: [{ title: "崩坏：星穹铁道卡池 - Mihoyo Announcement" }],
    links: [
      {
        rel: "preload",
        href: "https://webstatic.mihoyo.com/common/clgm-static/sr/fonts/zh-cn.ttf",
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
  return <AnnouncementPage game="hkrpg" data={data} />;
}
