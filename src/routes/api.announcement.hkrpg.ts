import { createFileRoute } from "@tanstack/react-router";
import { announcementCacheControl, getAnnouncementInfo } from "#/utils/announcements.server";

export const Route = createFileRoute("/api/announcement/hkrpg")({
  server: {
    handlers: {
      GET: async () => {
        const data = await getAnnouncementInfo("hkrpg");
        return Response.json(data, {
          headers: {
            "CDN-Cache-Control": announcementCacheControl,
          },
        });
      },
    },
  },
});
