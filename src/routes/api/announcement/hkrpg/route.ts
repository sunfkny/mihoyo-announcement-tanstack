import { createFileRoute } from "@tanstack/react-router";
import { getHkrpgInfo } from "#/server/services/hkrpg";
import { announcementCacheControl } from "#/utils/announcements.server";

export const Route = createFileRoute("/api/announcement/hkrpg")({
  server: {
    handlers: {
      GET: async () => {
        const data = await getHkrpgInfo();
        return Response.json(data, {
          headers: {
            "CDN-Cache-Control": announcementCacheControl,
          },
        });
      },
    },
  },
});
