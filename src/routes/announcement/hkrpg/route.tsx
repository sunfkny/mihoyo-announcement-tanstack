import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementError } from "#/components/announcement/error";
import { HkrpgAnnouncementPage } from "#/components/announcement/hkrpg/page";
import { hkrpgAnnouncementQueryOptions } from "#/utils/hkrpg-announcement.query";

export const Route = createFileRoute("/announcement/hkrpg")({
  staticData: { game: "hkrpg" },
  loader: ({ context }) => context.queryClient.query({ ...hkrpgAnnouncementQueryOptions(), staleTime: "static" }),
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
  return <HkrpgAnnouncementPage data={data} />;
}
