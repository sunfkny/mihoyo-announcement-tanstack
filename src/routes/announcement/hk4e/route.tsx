import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementError } from "#/components/announcement/error";
import { Hk4eAnnouncementPage } from "#/components/announcement/hk4e/page";
import { hk4eAnnouncementQueryOptions } from "#/utils/hk4e-announcement.query";

export const Route = createFileRoute("/announcement/hk4e")({
  staticData: { game: "hk4e" },
  loader: ({ context }) => context.queryClient.query({ ...hk4eAnnouncementQueryOptions(), staleTime: "static" }),
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
  return <Hk4eAnnouncementPage data={data} />;
}
