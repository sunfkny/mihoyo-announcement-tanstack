import { createFileRoute } from "@tanstack/react-router";
import { announcementCacheControl, getAnnouncementInfo } from "#/utils/announcements.server";

export const Route = createFileRoute("/api/announcement/bh3")({
  server: {
    handlers: {
      GET: async () => {
        const data = await getAnnouncementInfo("bh3");
        return Response.json(data, {
          headers: {
            "CDN-Cache-Control": announcementCacheControl,
          },
        });
      },
    },
  },
});
