import { createFileRoute } from "@tanstack/react-router";
import { announcementCacheControl, getAnnouncementInfo } from "#/utils/announcements.server";

export const Route = createFileRoute("/api/announcement/nap")({
  server: {
    handlers: {
      GET: async () => {
        const data = await getAnnouncementInfo("nap");
        return Response.json(data, {
          headers: {
            "CDN-Cache-Control": announcementCacheControl,
          },
        });
      },
    },
  },
});
