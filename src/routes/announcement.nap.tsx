import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementError } from "#/components/announcement-error";
import { AnnouncementPage } from "#/components/announcement-page";
import { announcementQueryOptions } from "#/utils/announcements.query";

export const Route = createFileRoute("/announcement/nap")({
  staticData: { game: "nap" },
  loader: ({ context }) => context.queryClient.query({ ...announcementQueryOptions("nap"), staleTime: "static" }),
  head: () => ({
    meta: [{ title: "绝区零卡池 - Mihoyo Announcement" }],
    links: [
      {
        rel: "preload",
        href: "https://sdk.mihoyo.com/nap/announcement/fonts/zh-cn-light.e490414b.ttf",
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
  return <AnnouncementPage game="nap" data={data} />;
}
