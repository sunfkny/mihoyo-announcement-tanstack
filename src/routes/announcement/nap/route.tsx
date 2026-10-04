import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementError } from "#/components/announcement/error";
import { NapAnnouncementPage } from "#/components/announcement/nap/page";
import { napAnnouncementQueryOptions } from "#/utils/nap-announcement.query";

export const Route = createFileRoute("/announcement/nap")({
  staticData: { game: "nap" },
  loader: ({ context }) => context.queryClient.query({ ...napAnnouncementQueryOptions(), staleTime: "static" }),
  head: () => ({
    meta: [{ title: "绝区零卡池 - Mihoyo Announcement" }],
    links: [
      {
        rel: "preload",
        href: "https://sdk.mihoyo.com/nap/announcement/fonts/zh-cn.b7325fbd.otf",
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
  return <NapAnnouncementPage data={data} />;
}
