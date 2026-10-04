import { createFileRoute } from "@tanstack/react-router";
import { announcementCacheControl, getAnnouncementInfo } from "#/utils/announcements.server";

export const Route = createFileRoute("/api/announcement/hk4e")({
  server: {
    handlers: {
      GET: async () => {
        const data = await getAnnouncementInfo("hk4e");
        return Response.json(data, {
          headers: {
            "CDN-Cache-Control": announcementCacheControl,
          },
        });
      },
    },
  },
});
